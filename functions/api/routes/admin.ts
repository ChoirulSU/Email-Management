import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Env } from '../[[path]]'

export const adminRoutes = new Hono<{ Bindings: Env }>()

// 验证管理员登录状态
const authMiddleware = async (c: any, next: () => Promise<void>) => {
  const token = getCookie(c, 'admin_token')
  if (token !== c.env.ADMIN_SECRET_KEY) {
    return c.json({ error: '未授权' }, 401)
  }
  await next()
}

// 登录
adminRoutes.post('/login', async (c) => {
  const { password } = await c.req.json()
  if (password === c.env.ADMIN_SECRET_KEY) {
    setCookie(c, 'admin_token', password, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 60 * 60 * 24 * 7, // 7天
    })
    return c.json({ success: true })
  }
  return c.json({ error: '密码错误' }, 401)
})

// 登出
adminRoutes.post('/logout', (c) => {
  deleteCookie(c, 'admin_token')
  return c.json({ success: true })
})

// 检查登录状态
adminRoutes.get('/check', async (c) => {
  const token = getCookie(c, 'admin_token')
  if (token === c.env.ADMIN_SECRET_KEY) {
    return c.json({ authenticated: true })
  }
  return c.json({ authenticated: false })
})

// 以下路由需要认证
adminRoutes.use('/*', authMiddleware)

// 获取统计数据
adminRoutes.get('/stats', async (c) => {
  const db = c.env.DB

  const [totalEmails, usedEmails, unusedEmails, platforms, recentLogs] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM emails').first(),
    db.prepare('SELECT COUNT(*) as count FROM emails WHERE is_used = 1').first(),
    db.prepare('SELECT COUNT(*) as count FROM emails WHERE is_used = 0').first(),
    db.prepare('SELECT * FROM platforms').all(),
    db.prepare('SELECT * FROM api_logs ORDER BY created_at DESC LIMIT 50').all(),
  ])

  // 获取每个平台的使用统计
  const platformStats = []
  for (const platform of platforms.results || []) {
    const used = await db.prepare(
      `SELECT COUNT(*) as count FROM emails WHERE used_platforms LIKE ?`
    ).bind(`%"${platform.key}"%`).first()

    const supported = await db.prepare(
      `SELECT COUNT(*) as count FROM emails WHERE supported_platforms = '[]' OR supported_platforms LIKE ?`
    ).bind(`%"${platform.key}"%`).first()

    platformStats.push({
      key: platform.key,
      name: platform.name,
      usedCount: used?.count || 0,
      supportedCount: supported?.count || 0,
    })
  }

  // 获取API调用频率（最近7天每天的调用次数）
  const apiFrequency = await db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM api_logs
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all()

  return c.json({
    totalEmails: totalEmails?.count || 0,
    usedEmails: usedEmails?.count || 0,
    unusedEmails: unusedEmails?.count || 0,
    platformStats,
    recentLogs: recentLogs.results || [],
    apiFrequency: apiFrequency.results || [],
  })
})

// 平台管理 - 获取所有平台
adminRoutes.get('/platforms', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM platforms ORDER BY created_at DESC').all()
  return c.json(result.results || [])
})

// 平台管理 - 添加平台
adminRoutes.post('/platforms', async (c) => {
  const { key, name } = await c.req.json()
  if (!key || !name) {
    return c.json({ error: '缺少必要参数' }, 400)
  }

  try {
    await c.env.DB.prepare('INSERT INTO platforms (key, name) VALUES (?, ?)').bind(key, name).run()
    return c.json({ success: true })
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return c.json({ error: '平台key已存在' }, 400)
    }
    return c.json({ error: '添加失败' }, 500)
  }
})

// 平台管理 - 更新平台
adminRoutes.put('/platforms/:id', async (c) => {
  const id = c.req.param('id')
  const { key, name } = await c.req.json()

  try {
    await c.env.DB.prepare('UPDATE platforms SET key = ?, name = ? WHERE id = ?').bind(key, name, id).run()
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: '更新失败' }, 500)
  }
})

// 平台管理 - 删除平台
adminRoutes.delete('/platforms/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM platforms WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// 邮箱管理 - 获取邮箱列表
adminRoutes.get('/emails', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const pageSize = parseInt(c.req.query('pageSize') || '20')
  const search = c.req.query('search') || ''
  const isUsed = c.req.query('isUsed')
  const platform = c.req.query('platform')

  let whereClause = '1=1'
  const params: any[] = []

  if (search) {
    whereClause += ' AND email LIKE ?'
    params.push(`%${search}%`)
  }

  if (isUsed !== undefined && isUsed !== '') {
    whereClause += ' AND is_used = ?'
    params.push(parseInt(isUsed))
  }

  if (platform) {
    whereClause += ' AND (supported_platforms = \'[]\' OR supported_platforms LIKE ?)'
    params.push(`%"${platform}"%`)
  }

  const offset = (page - 1) * pageSize

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM emails WHERE ${whereClause}`
  ).bind(...params).first()

  const result = await c.env.DB.prepare(
    `SELECT * FROM emails WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, pageSize, offset).all()

  return c.json({
    data: result.results || [],
    total: countResult?.count || 0,
    page,
    pageSize,
  })
})

// 邮箱管理 - 导出（支持筛选）
adminRoutes.get('/emails/export', async (c) => {
  const search = c.req.query('search') || ''
  const isUsed = c.req.query('isUsed')
  const platform = c.req.query('platform') || ''

  let whereClause = '1=1'
  const params: any[] = []

  if (search) {
    whereClause += ' AND email LIKE ?'
    params.push(`%${search}%`)
  }

  if (isUsed !== undefined && isUsed !== '') {
    whereClause += ' AND is_used = ?'
    params.push(parseInt(isUsed))
  }

  if (platform) {
    whereClause += ' AND (supported_platforms = \'[]\' OR supported_platforms LIKE ?)'
    params.push(`%"${platform}"%`)
  }

  const result = await c.env.DB.prepare(
    `SELECT * FROM emails WHERE ${whereClause} ORDER BY created_at DESC`
  ).bind(...params).all()

  // 生成 CSV 格式
  const emails = result.results || []
  const csvLines = ['邮箱,密码,备注,是否已使用,支持平台,已使用平台,创建时间']

  for (const email of emails) {
    const supportedPlatforms = JSON.parse(email.supported_platforms || '[]')
    const usedPlatforms = JSON.parse(email.used_platforms || '[]')

    csvLines.push([
      email.email,
      email.password,
      (email.remark || '').replace(/,/g, '；'), // 替换逗号避免CSV混乱
      email.is_used ? '已使用' : '未使用',
      supportedPlatforms.length === 0 ? '全部' : supportedPlatforms.join(';'),
      usedPlatforms.join(';'),
      email.created_at
    ].join(','))
  }

  const csvContent = csvLines.join('\n')

  // 添加 BOM 以支持 Excel 正确识别 UTF-8
  const bom = '\uFEFF'

  return new Response(bom + csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="emails-${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
})

// 邮箱管理 - 批量导入
adminRoutes.post('/emails/import', async (c) => {
  const { content, separator, supportedPlatforms, usedPlatforms } = await c.req.json()

  if (!content) {
    return c.json({ error: '内容不能为空' }, 400)
  }

  const lines = content.split('\n').filter((line: string) => line.trim())
  const sep = separator || '|'

  let successCount = 0
  let failCount = 0
  const errors: string[] = []

  for (const line of lines) {
    const parts = line.trim().split(sep)
    if (parts.length < 2) {
      failCount++
      errors.push(`格式错误: ${line}`)
      continue
    }

    const email = parts[0].trim()
    const password = parts[1].trim()
    const remark = parts.slice(2).join(sep).trim() || null

    try {
      await c.env.DB.prepare(
        `INSERT INTO emails (email, password, remark, supported_platforms, used_platforms) VALUES (?, ?, ?, ?, ?)`
      ).bind(
        email,
        password,
        remark,
        JSON.stringify(supportedPlatforms || []),
        JSON.stringify(usedPlatforms || [])
      ).run()
      successCount++
    } catch (e: any) {
      failCount++
      if (e.message?.includes('UNIQUE')) {
        errors.push(`邮箱已存在: ${email}`)
      } else {
        errors.push(`导入失败: ${email}`)
      }
    }
  }

  return c.json({ successCount, failCount, errors })
})

// 邮箱管理 - 批量操作
adminRoutes.post('/emails/batch', async (c) => {
  const { emails, action, supportedPlatforms, usedPlatforms } = await c.req.json()

  if (!emails || !action) {
    return c.json({ error: '缺少必要参数' }, 400)
  }

  const emailList = emails.split('\n').map((e: string) => e.trim()).filter((e: string) => e)

  if (action === 'delete') {
    for (const email of emailList) {
      await c.env.DB.prepare('DELETE FROM emails WHERE email = ?').bind(email).run()
    }
    return c.json({ success: true, count: emailList.length })
  }

  if (action === 'setPlatforms') {
    // 检查平台交集情况
    const conflicts: Record<number, string[]> = {}

    for (const email of emailList) {
      const existing = await c.env.DB.prepare('SELECT supported_platforms FROM emails WHERE email = ?').bind(email).first()
      if (existing) {
        const currentPlatforms = JSON.parse(existing.supported_platforms as string || '[]')
        const platformCount = new Set([...currentPlatforms, ...(supportedPlatforms || [])]).size
        if (!conflicts[platformCount]) {
          conflicts[platformCount] = []
        }
        conflicts[platformCount].push(email)
      }
    }

    // 如果有不同数量的平台，返回冲突信息
    const conflictKeys = Object.keys(conflicts)
    if (conflictKeys.length > 1) {
      return c.json({
        hasConflicts: true,
        conflicts,
        message: '检测到平台数量不一致的情况'
      })
    }

    // 执行更新
    for (const email of emailList) {
      const existing = await c.env.DB.prepare('SELECT * FROM emails WHERE email = ?').bind(email).first()
      if (existing) {
        const newSupported = supportedPlatforms ? JSON.stringify(supportedPlatforms) : existing.supported_platforms
        const currentUsed = JSON.parse(existing.used_platforms as string || '[]')
        const newUsed = usedPlatforms ? JSON.stringify([...new Set([...currentUsed, ...usedPlatforms])]) : existing.used_platforms

        await c.env.DB.prepare(
          'UPDATE emails SET supported_platforms = ?, used_platforms = ?, is_used = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?'
        ).bind(newSupported, newUsed, usedPlatforms && usedPlatforms.length > 0 ? 1 : existing.is_used, email).run()
      }
    }

    return c.json({ success: true, count: emailList.length })
  }

  return c.json({ error: '未知操作' }, 400)
})

// 获取API日志
adminRoutes.get('/logs', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const pageSize = parseInt(c.req.query('pageSize') || '50')
  const offset = (page - 1) * pageSize

  const [countResult, result] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as count FROM api_logs').first(),
    c.env.DB.prepare('SELECT * FROM api_logs ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(pageSize, offset).all()
  ])

  return c.json({
    data: result.results || [],
    total: countResult?.count || 0,
    page,
    pageSize,
  })
})
