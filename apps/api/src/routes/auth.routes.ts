import { Router } from 'express'
import { login, logout, me } from '../controllers/auth.controller.js'
import { authMiddleware } from '../middleware/auth.js'
import { loginRateLimiter } from '../middleware/rateLimiter.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { loginSchema } from '../validators/auth.validator.js'

export const authRoutes = Router()

authRoutes.post('/login', loginRateLimiter, validateRequest({ body: loginSchema }), login)
authRoutes.get('/me', authMiddleware, me)
authRoutes.post('/logout', authMiddleware, logout)
