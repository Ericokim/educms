import type { RequestHandler } from 'express'
import * as analyticsService from '../services/analytics.service.js'
import { sendSuccess } from '../utils/responses.js'

export const dashboard: RequestHandler = async (_req, res) => {
  const data = await analyticsService.getDashboard()
  sendSuccess(res, 'Dashboard data', data)
}

export const posts: RequestHandler = async (_req, res) => {
  const data = await analyticsService.getPostAnalytics()
  sendSuccess(res, 'Post analytics', data)
}

export const users: RequestHandler = async (_req, res) => {
  const data = await analyticsService.getUserAnalytics()
  sendSuccess(res, 'User analytics', data)
}
