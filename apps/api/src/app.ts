import express from 'express'
import type { ApiError, ApiSuccess } from '@educms/shared'
import { env } from './config/env.js'

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

app.use((_req, res) => {
  const body: ApiError = {
    success: false,
    message: 'Resource not found',
    errors: [],
  }
  res.status(404).json(body)
})
