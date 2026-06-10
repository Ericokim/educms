import type { RequestHandler } from 'express'
import { env } from '../config/env.js'
import { checkDatabaseConnection } from '../database/pool.js'
import { sendError, sendSuccess } from '../utils/responses.js'

export const getHealth: RequestHandler = (_req, res) => {
  sendSuccess(res, 'API is healthy', {
    status: 'ok',
    environment: env.nodeEnv,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
}

export const getDbHealth: RequestHandler = async (_req, res) => {
  const connected = await checkDatabaseConnection()
  if (!connected) {
    sendError(res, 'Database is not reachable', 503)
    return
  }
  sendSuccess(res, 'Database is healthy', { database: 'connected' })
}
