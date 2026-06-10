import { Router } from 'express'
import { z } from 'zod'
import {
  ROLES,
  createUserSchema,
  listUsersQuerySchema,
  updateRoleSchema,
  updateUserSchema,
} from '@educms/shared'
import * as userController from '../controllers/user.controller.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validateRequest.js'

const idParamsSchema = z.object({ id: z.coerce.number().int().positive() })

export const userRoutes = Router()
userRoutes.use(authMiddleware, requireRole(ROLES.ADMIN))

userRoutes.get('/', validateRequest({ query: listUsersQuerySchema }), userController.list)
userRoutes.get('/:id', validateRequest({ params: idParamsSchema }), userController.getById)
userRoutes.post('/', validateRequest({ body: createUserSchema }), userController.create)
userRoutes.patch(
  '/:id',
  validateRequest({ params: idParamsSchema, body: updateUserSchema }),
  userController.update
)
userRoutes.patch(
  '/:id/role',
  validateRequest({ params: idParamsSchema, body: updateRoleSchema }),
  userController.changeRole
)
userRoutes.patch(
  '/:id/deactivate',
  validateRequest({ params: idParamsSchema }),
  userController.deactivate
)
userRoutes.patch(
  '/:id/activate',
  validateRequest({ params: idParamsSchema }),
  userController.activate
)
