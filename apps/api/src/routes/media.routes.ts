import { Router } from 'express'
import { z } from 'zod'
import { STAFF_ROLES, listMediaQuerySchema, updateMediaSchema } from '@educms/shared'
import * as mediaController from '../controllers/media.controller.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { uploadRateLimiter } from '../middleware/rateLimiter.js'
import { uploadMiddleware } from '../middleware/upload.js'
import { validateRequest } from '../middleware/validateRequest.js'

const idParamsSchema = z.object({ id: z.coerce.number().int().positive() })

export const mediaRoutes = Router()
mediaRoutes.use(authMiddleware, requireRole(...STAFF_ROLES))

mediaRoutes.get('/', validateRequest({ query: listMediaQuerySchema }), mediaController.list)
mediaRoutes.post('/upload', uploadRateLimiter, uploadMiddleware, mediaController.upload)
mediaRoutes.patch(
  '/:id',
  validateRequest({ params: idParamsSchema, body: updateMediaSchema }),
  mediaController.update
)
mediaRoutes.delete(
  '/:id',
  validateRequest({ params: idParamsSchema }),
  mediaController.remove
)
