// API 响应类型定义

// 平台类型
export interface Platform {
  id: number
  key: string
  name: string
  created_at: string
}

// 邮箱类型
export interface Email {
  id: number
  email: string
  password: string
  remark: string | null
  is_used: number
  supported_platforms: string // JSON 字符串
  used_platforms: string // JSON 字符串
  created_at: string
  updated_at: string
}

// 邮箱（带解析后的平台数组）
export interface EmailWithPlatforms extends Omit<Email, 'supported_platforms' | 'used_platforms'> {
  supportedPlatforms: string[]
  usedPlatforms: string[]
}

// API 日志类型
export interface ApiLog {
  id: number
  endpoint: string
  method: string
  params: string // JSON 字符串
  status_code: number
  response: string // JSON 字符串
  ip: string
  created_at: string
}

// 统计数据类型
export interface Statistics {
  total: number
  used: number
  unused: number
  platforms: PlatformStats[]
}

export interface PlatformStats {
  name: string
  total: number
  used: number
  unused: number
}

// API 调用频率数据
export interface ApiFrequency {
  date: string
  count: number
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// 通用 API 响应类型
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error'
  message?: string
  data?: T
}

// 认证检查响应
export interface AuthCheckResponse {
  authenticated: boolean
}

// 批量导入请求
export interface BulkImportRequest {
  emails: string
  delimiter: string
  supportedPlatforms: string[]
  usedPlatforms: string[]
}

// 批量导入响应
export interface BulkImportResponse {
  success: number
  failed: number
  errors: string[]
}

// 批量操作请求
export interface BulkOperationRequest {
  emails: string[]
  operation: 'setPlatforms' | 'delete'
  supportedPlatforms?: string[]
  usedPlatforms?: string[]
}

// 批量操作响应
export interface BulkOperationResponse {
  success: number
  failed: number
  message: string
}

// 外部 API：获取邮箱请求
export interface FetchEmailsRequest {
  platform?: string
  isUsed?: boolean
  count?: number
}

// 外部 API：获取邮箱响应
export interface FetchEmailsResponse {
  status: 'success' | 'error'
  message?: string
  data: EmailData[]
}

export interface EmailData {
  email: string
  password: string
  remark: string | null
  supportedPlatforms: string[]
  usedPlatforms: string[]
}

// 外部 API：设置邮箱状态请求
export interface SetEmailStatusRequest {
  email: string
  isUsed?: boolean
  usedPlatforms?: string | string[]
}

// 外部 API：删除邮箱请求
export interface DeleteEmailRequest {
  email: string
}

// 仪表板数据类型
export interface DashboardData {
  stats: Statistics
  apiFrequency: ApiFrequency[]
  recentLogs: ApiLog[]
}
