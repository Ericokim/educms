import { Router } from 'express'
import { analyticsRoutes } from './analytics.routes.js'
import { authRoutes } from './auth.routes.js'
import { commentRoutes } from './comment.routes.js'
import { healthRoutes } from './health.routes.js'
import { mediaRoutes } from './media.routes.js'
import { postRoutes } from './post.routes.js'
import { categoryRoutes, tagRoutes } from './taxonomy.routes.js'

export const apiRoutes = Router()

apiRoutes.use('/health', healthRoutes)
apiRoutes.use('/auth', authRoutes)
apiRoutes.use('/analytics', analyticsRoutes)
apiRoutes.use('/posts', postRoutes)
apiRoutes.use('/categories', categoryRoutes)
apiRoutes.use('/tags', tagRoutes)
apiRoutes.use('/comments', commentRoutes)
apiRoutes.use('/media', mediaRoutes)

// Mounted in later phases:
// apiRoutes.use('/users', userRoutes)
// apiRoutes.use('/analytics', analyticsRoutes)
