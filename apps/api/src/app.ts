import express from 'express'
import type { ApiError, ApiSuccess } from '@educms/shared'
import { env } from './config/env.js'
import { checkDatabaseConnection } from './database/pool.js'

export const app = express()

app.use(express.json())

app.get('/api/health', (_req, res) => {
  const body: ApiSuccess<{
    status: string
    environment: string
    uptime: number
    timestamp: string
  }> = {
    success: true,
    message: 'API is healthy',
    data: {
      status: 'ok',
      environment: env.nodeEnv,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  }
  res.json(body)
})

app.get('/api/health/db', async (_req, res) => {
  const connected = await checkDatabaseConnection()
  if (!connected) {
    const body: ApiError = {
      success: false,
      message: 'Database is not reachable',
      errors: [],
    }
    res.status(503).json(body)
    return
  }
  const body: ApiSuccess<{ database: string }> = {
    success: true,
    message: 'Database is healthy',
    data: { database: 'connected' },
  }
  res.json(body)
})

app.use((_req, res) => {
  const body: ApiError = {
    success: false,
    message: 'Resource not found',
    errors: [],
  }
  res.status(404).json(body)
})
