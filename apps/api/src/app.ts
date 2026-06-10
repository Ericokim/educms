import compression from 'compression'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { apiRateLimiter } from './middleware/rateLimiter.js'
import { requestLogger } from './middleware/requestLogger.js'
import { apiRoutes } from './routes/index.js'

export const app = express()

app.use(requestLogger)
app.use(helmet())
app.use(cors({ origin: env.frontendUrl, credentials: true }))
app.use(compression())
app.use(express.json({ limit: '1mb' }))

app.use('/api', apiRateLimiter, apiRoutes)

app.use(notFoundHandler)
app.use(errorHandler)
