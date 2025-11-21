import { Hono } from 'hono'
import type { Env } from '../[[path]]'

export const externalRoutes = new Hono<{ Bindings: Env }>()

// API密钥验证中间件
const apiAuthMiddleware = async (c: any, next: () => Promise<void>) => {
  const apiKey = c.req.header('X-API-Key')
  if (apiKey !== c.env.API_SECRET_KEY) {
    return c.json({ error: '未授权', code: 'UNAUTHORIZED' }, 401)
  }
  await next()
}

// 记录API日志
const logApiCall = async (db: D1Database, endpoint: string, method: string, params: any, statusCode: number, response: any, ip: string) => {
  try {
    await db.prepare(
      'INSERT INTO api_logs (endpoint, method, params, status_code, response, ip) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(endpoint, method, JSON.stringify(params), statusCode, JSON.stringify(response), ip).run()
  } catch (e) {
    console.error('Failed to log API call:', e)
  }
}

externalRoutes.use('/*', apiAuthMiddleware)

// 接口1：获取邮箱（使用原子操作避免竞争）
externalRoutes.post('/emails/fetch', async (c) => {
  const body = await c.req.json()
  const { platform, isUsed = false, count = 1 } = body
  const ip = c.req.header('CF-Connecting-IP') || 'unknown'

  try {
    // 使用 CTE + UPDATE RETURNING 实现原子操作
    let query = `
      WITH selected AS (
        SELECT id FROM emails WHERE 1=1
    `
    const params: any[] = []

    // 过滤是否使用过
    if (!isUsed) {
      query += ' AND is_used = 0'
    }

    // 过滤平台
    if (platform) {
      query += ' AND (supported_platforms = \'[]\' OR supported_platforms LIKE ?)'
      params.push(`%"${platform}"%`)
      // 确保该邮箱还没在这个平台使用过
      query += ' AND used_platforms NOT LIKE ?'
      params.push(`%"${platform}"%`)
    }

    query += `
        ORDER BY RANDOM()
        LIMIT ?
      )
      UPDATE emails
      SET is_used = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (SELECT id FROM selected)
      RETURNING *
    `
    params.push(Math.min(count, 100)) // 限制最多100条

    const result = await c.env.DB.prepare(query).bind(...params).all()

    if (!result.results || result.results.length === 0) {
      const response = { status: 'error', message: '没有可用的邮箱', data: [] }
      await logApiCall(c.env.DB, '/emails/fetch', 'POST', body, 200, response, ip)
      return c.json(response)
    }

    // 返回数据时不包含敏感字段
    const emails = result.results.map((e: any) => ({
      email: e.email,
      password: e.password,
      remark: e.remark,
      supportedPlatforms: JSON.parse(e.supported_platforms || '[]'),
      usedPlatforms: JSON.parse(e.used_platforms || '[]'),
    }))

    const response = { status: 'success', data: emails }
    await logApiCall(c.env.DB, '/emails/fetch', 'POST', body, 200, response, ip)
    return c.json(response)
  } catch (error) {
    console.error('Error fetching emails:', error)
    const response = { status: 'error', message: '获取邮箱失败', data: [] }
    await logApiCall(c.env.DB, '/emails/fetch', 'POST', body, 500, response, ip)
    return c.json(response, 500)
  }
})

// 接口2：设置邮箱状态
externalRoutes.post('/emails/status', async (c) => {
  const body = await c.req.json()
  const { email, isUsed, usedPlatforms } = body
  const ip = c.req.header('CF-Connecting-IP') || 'unknown'

  if (!email) {
    const response = { error: '缺少邮箱参数', code: 'MISSING_EMAIL' }
    await logApiCall(c.env.DB, '/emails/status', 'POST', body, 400, response, ip)
    return c.json(response, 400)
  }

  // 获取现有邮箱
  const existing = await c.env.DB.prepare('SELECT * FROM emails WHERE email = ?').bind(email).first()
  if (!existing) {
    const response = { status: 'error', message: '邮箱不存在' }
    await logApiCall(c.env.DB, '/emails/status', 'POST', body, 200, response, ip)
    return c.json(response)
  }

  // 处理使用平台
  let newUsedPlatforms = JSON.parse(existing.used_platforms as string || '[]')
  if (usedPlatforms) {
    const platformsToAdd = Array.isArray(usedPlatforms) ? usedPlatforms : [usedPlatforms]
    newUsedPlatforms = [...new Set([...newUsedPlatforms, ...platformsToAdd])]
  }

  // 更新状态
  const newIsUsed = isUsed !== undefined ? (isUsed ? 1 : 0) : (newUsedPlatforms.length > 0 ? 1 : existing.is_used)

  await c.env.DB.prepare(
    'UPDATE emails SET is_used = ?, used_platforms = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?'
  ).bind(newIsUsed, JSON.stringify(newUsedPlatforms), email).run()

  const response = { status: 'success', message: '状态更新成功' }
  await logApiCall(c.env.DB, '/emails/status', 'POST', body, 200, response, ip)
  return c.json(response)
})

// 接口3：删除邮箱
externalRoutes.post('/emails/delete', async (c) => {
  const body = await c.req.json()
  const { email } = body
  const ip = c.req.header('CF-Connecting-IP') || 'unknown'

  if (!email) {
    const response = { error: '缺少邮箱参数', code: 'MISSING_EMAIL' }
    await logApiCall(c.env.DB, '/emails/delete', 'POST', body, 400, response, ip)
    return c.json(response, 400)
  }

  const result = await c.env.DB.prepare('DELETE FROM emails WHERE email = ?').bind(email).run()

  if (result.meta.changes === 0) {
    const response = { status: 'error', message: '邮箱不存在' }
    await logApiCall(c.env.DB, '/emails/delete', 'POST', body, 200, response, ip)
    return c.json(response)
  }

  const response = { status: 'success', message: '删除成功' }
  await logApiCall(c.env.DB, '/emails/delete', 'POST', body, 200, response, ip)
  return c.json(response)
})
