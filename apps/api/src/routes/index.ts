import { Router } from 'express'
import { healthRoutes } from './health.routes.js'

export const apiRoutes = Router()

apiRoutes.use('/health', healthRoutes)

// Mounted in later phases:
// apiRoutes.use('/auth', authRoutes)
// apiRoutes.use('/users', userRoutes)
// apiRoutes.use('/posts', postRoutes)
// apiRoutes.use('/categories', categoryRoutes)
// apiRoutes.use('/tags', tagRoutes)
// apiRoutes.use('/comments', commentRoutes)
// apiRoutes.use('/media', mediaRoutes)
// apiRoutes.use('/analytics', analyticsRoutes)
