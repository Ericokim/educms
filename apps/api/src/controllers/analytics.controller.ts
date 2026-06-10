import type { RequestHandler } from 'express'
import * as analyticsService from '../services/analytics.service.js'
import { sendSuccess } from '../utils/responses.js'

export const dashboard: RequestHandler = async (_req, res) => {
  const data = await analyticsService.getDashboard()
  sendSuccess(res, 'Dashboard data', data)
}
