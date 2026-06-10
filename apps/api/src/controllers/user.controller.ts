import type { RequestHandler } from 'express'
import type {
  CreateUserValues,
  ListUsersQuery,
  UpdateRoleValues,
  UpdateUserValues,
  User,
} from '@educms/shared'
import * as userService from '../services/user.service.js'
import { sendSuccess } from '../utils/responses.js'

export const list: RequestHandler = async (req, res) => {
  const query = req.validatedQuery as ListUsersQuery
  const data = await userService.listUsers(query)
  sendSuccess(res, 'Users', data)
}

export const getById: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  const data = await userService.getUser(id)
  sendSuccess(res, 'User', data)
}

export const create: RequestHandler = async (req, res) => {
  const data = await userService.createUser(req.user as User, req.body as CreateUserValues)
  sendSuccess(res, 'User created', data, 201)
}

export const update: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  const data = await userService.updateUser(
    req.user as User,
    id,
    req.body as UpdateUserValues
  )
  sendSuccess(res, 'User updated', data)
}

export const changeRole: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  const data = await userService.changeRole(
    req.user as User,
    id,
    req.body as UpdateRoleValues
  )
  sendSuccess(res, 'Role updated', data)
}

export const deactivate: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  const data = await userService.setActive(req.user as User, id, false)
  sendSuccess(res, 'User deactivated', data)
}

export const activate: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  const data = await userService.setActive(req.user as User, id, true)
  sendSuccess(res, 'User activated', data)
}
