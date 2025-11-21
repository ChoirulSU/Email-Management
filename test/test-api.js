// API 测试脚本 (Node.js 版本)
// 使用方法: node test-api.js

const BASE_URL = 'https://mail-manager.pages.dev'
const API_KEY = 'your-api-key-here' // 替换为你的 API_SECRET_KEY

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
}

async function testAPI(name, method, endpoint, data = null, expectedStatus = 200, apiKey = API_KEY) {
  console.log(`${colors.yellow}${name}${colors.reset}`)

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      }
    }

    if (data) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    const result = await response.json()

    console.log(`HTTP 状态码: ${response.status}`)
    console.log(`响应:`, JSON.stringify(result, null, 2))

    if (response.status === expectedStatus) {
      console.log(`${colors.green}✓ 测试通过${colors.reset}`)
      return { success: true, data: result }
    } else {
      console.log(`${colors.red}✗ 测试失败 (期望 ${expectedStatus}, 实际 ${response.status})${colors.reset}`)
      return { success: false, data: result }
    }
  } catch (error) {
    console.log(`${colors.red}✗ 测试异常: ${error.message}${colors.reset}`)
    return { success: false, error }
  } finally {
    console.log('')
  }
}

async function runTests() {
  console.log('==================================')
  console.log('邮箱管理系统 API 测试脚本')
  console.log('==================================')
  console.log('')

  let testEmail = null

  // 测试 1: 获取 1 个邮箱
  const test1 = await testAPI(
    '测试 1: 获取 1 个邮箱',
    'POST',
    '/api/v1/emails/fetch',
    { count: 1 }
  )

  if (test1.success && test1.data.data && test1.data.data.length > 0) {
    testEmail = test1.data.data[0].email
    console.log(`提取到的邮箱: ${testEmail}\n`)
  }

  // 测试 2: 获取指定平台的邮箱
  await testAPI(
    '测试 2: 获取 Google 平台的邮箱',
    'POST',
    '/api/v1/emails/fetch',
    { platform: 'google', count: 2 }
  )

  // 测试 3: 设置邮箱状态
  if (testEmail) {
    await testAPI(
      '测试 3: 设置邮箱状态',
      'POST',
      '/api/v1/emails/status',
      {
        email: testEmail,
        isUsed: true,
        usedPlatforms: ['google']
      }
    )
  }

  // 测试 4: 批量获取邮箱
  const test4 = await testAPI(
    '测试 4: 批量获取 5 个邮箱',
    'POST',
    '/api/v1/emails/fetch',
    { count: 5, isUsed: false }
  )

  if (test4.success && test4.data.data) {
    console.log(`获取到 ${test4.data.data.length} 个邮箱\n`)
  }

  // 测试 5: 错误的 API Key
  await testAPI(
    '测试 5: 使用错误的 API Key (应该返回 401)',
    'POST',
    '/api/v1/emails/fetch',
    { count: 1 },
    401,
    'wrong-api-key'
  )

  // 测试 6: 缺少必填参数
  await testAPI(
    '测试 6: 设置状态但缺少邮箱参数 (应该返回错误)',
    'POST',
    '/api/v1/emails/status',
    { isUsed: true },
    200
  )

  // 测试 7: 删除邮箱 (谨慎使用)
  // await testAPI(
  //   '测试 7: 删除邮箱',
  //   'POST',
  //   '/api/v1/emails/delete',
  //   { email: testEmail }
  // )

  // 测试 8: 获取包含已使用的邮箱
  await testAPI(
    '测试 8: 获取包含已使用的邮箱',
    'POST',
    '/api/v1/emails/fetch',
    { count: 3, isUsed: true }
  )

  // 测试 9: 获取不存在的平台
  await testAPI(
    '测试 9: 获取不存在的平台',
    'POST',
    '/api/v1/emails/fetch',
    { platform: 'nonexistent', count: 1 }
  )

  console.log('==================================')
  console.log('测试完成')
  console.log('==================================')
}

// 运行测试
runTests().catch(console.error)
