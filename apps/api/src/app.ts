import compression from 'compression'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { apiRateLimiter } from './middleware/rateLimiter.js'
import { requestLogger } from './middleware/requestLogger.js'
import { uploadDir } from './middleware/upload.js'
import { apiRoutes } from './routes/index.js'

export const app = express()

app.use(requestLogger)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: env.frontendUrl, credentials: true }))
app.use(compression())
app.use(express.json({ limit: '1mb' }))

app.use('/api', apiRateLimiter, apiRoutes)
// Uploaded files; the frontend on another origin embeds these images.
app.use('/uploads', express.static(uploadDir, { maxAge: '7d', index: false }))

app.use(notFoundHandler)
app.use(errorHandler)
