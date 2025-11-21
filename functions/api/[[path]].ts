import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'
import { adminRoutes } from './routes/admin'
import { externalRoutes } from './routes/external'

export interface Env {
  DB: D1Database
  ADMIN_SECRET_KEY: string
  API_SECRET_KEY: string
}

const app = new Hono<{ Bindings: Env }>().basePath('/api')

app.use('*', cors())

// 管理后台路由
app.route('/admin', adminRoutes)

// 外部API路由
app.route('/v1', externalRoutes)

// 健康检查
app.get('/health', (c) => c.json({ status: 'ok' }))

export const onRequest = handle(app)
