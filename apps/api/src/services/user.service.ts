import bcrypt from 'bcryptjs'
import type {
  CreateUserValues,
  ListUsersQuery,
  Paginated,
  UpdateRoleValues,
  UpdateUserValues,
  User,
} from '@educms/shared'
import { env } from '../config/env.js'
import { logActivity } from '../repositories/activityLog.repository.js'
import * as users from '../repositories/user.repository.js'
import { badRequest, conflict, notFound } from '../utils/httpError.js'

function conflictError(kind: 'username' | 'email'): never {
  throw conflict(
    kind === 'username'
      ? 'A user with this username already exists'
      : 'A user with this email already exists'
  )
}

async function getUserOr404(id: number): Promise<User> {
  const row = await users.findUserById(id)
  if (!row) throw notFound('User not found')
  return users.toUser(row)
}

export function listUsers(query: ListUsersQuery): Promise<Paginated<User>> {
  return users.listUsers(query)
}

export function getUser(id: number): Promise<User> {
  return getUserOr404(id)
}

export async function createUser(actor: User, values: CreateUserValues): Promise<User> {
  const existing = await users.userConflict(values.username, values.email)
  if (existing) conflictError(existing)

  const passwordHash = await bcrypt.hash(values.password, env.bcryptRounds)
  const id = await users.insertUser({
    username: values.username,
    email: values.email,
    passwordHash,
    firstName: values.firstName || null,
    lastName: values.lastName || null,
    role: values.role,
  })
  await logActivity(actor.id, 'user.created', 'user', id, {
    username: values.username,
    role: values.role,
  })
  return getUserOr404(id)
}

export async function updateUser(
  actor: User,
  id: number,
  values: UpdateUserValues
): Promise<User> {
  await getUserOr404(id)

  const existing = await users.userConflict(values.username, values.email, id)
  if (existing) conflictError(existing)

  await users.updateUserRow(id, {
    username: values.username,
    email: values.email,
    firstName: values.firstName || null,
    lastName: values.lastName || null,
    passwordHash: values.password ? await bcrypt.hash(values.password, env.bcryptRounds) : undefined,
  })
  await logActivity(actor.id, 'user.updated', 'user', id, { username: values.username })
  return getUserOr404(id)
}

async function assertNotLastActiveAdmin(target: User): Promise<void> {
  if (target.role !== 'admin' || !target.isActive) return
  if ((await users.countActiveAdmins()) <= 1) {
    throw badRequest('Cannot remove the last active administrator')
  }
}

export async function changeRole(
  actor: User,
  id: number,
  values: UpdateRoleValues
): Promise<User> {
  if (actor.id === id) {
    throw badRequest('You cannot change your own role')
  }
  const target = await getUserOr404(id)
  if (values.role !== 'admin') {
    await assertNotLastActiveAdmin(target)
  }

  await users.setUserRole(id, values.role)
  await logActivity(actor.id, 'user.role_changed', 'user', id, {
    username: target.username,
    from: target.role,
    to: values.role,
  })
  return getUserOr404(id)
}

export async function setActive(actor: User, id: number, isActive: boolean): Promise<User> {
  if (actor.id === id) {
    throw badRequest('You cannot deactivate your own account')
  }
  const target = await getUserOr404(id)
  if (!isActive) {
    await assertNotLastActiveAdmin(target)
  }

  await users.setUserActive(id, isActive)
  await logActivity(
    actor.id,
    isActive ? 'user.activated' : 'user.deactivated',
    'user',
    id,
    { username: target.username }
  )
  return getUserOr404(id)
}
