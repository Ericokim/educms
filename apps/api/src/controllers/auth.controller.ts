import type { RequestHandler } from 'express'
import * as authService from '../services/auth.service.js'
import { sendSuccess } from '../utils/responses.js'

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body as { email: string; password: string }
  const data = await authService.login(email, password)
  sendSuccess(res, 'Logged in successfully', data)
}

export const me: RequestHandler = (req, res) => {
  sendSuccess(res, 'Authenticated user', { user: req.user })
}

export const logout: RequestHandler = (_req, res) => {
  // JWTs are stateless; the client discards the token. The endpoint exists
  // so the frontend has a consistent call and future token revocation has
  // a place to live.
  sendSuccess(res, 'Logged out successfully', null)
}
