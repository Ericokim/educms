import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { AuthData, User } from '@educms/shared'
import { env } from '../config/env.js'
import { logActivity } from '../repositories/activityLog.repository.js'
import { findUserByEmail, findUserById, toUser } from '../repositories/user.repository.js'
import { unauthorized } from '../utils/httpError.js'

export interface TokenPayload {
  sub: number
  role: string
}

export function signToken(user: User): string {
  const payload: TokenPayload = { sub: user.id, role: user.role }
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpire,
  } as jwt.SignOptions)
}

// Compared against when the email is unknown so both paths cost one bcrypt
// compare, preventing email enumeration via response timing.
const DUMMY_HASH = '$2b$10$YcpkQQ/MHG4Y2fkVASCfP.j5lHUvQ9/CWGofyZygjPqjghpuytNp6'

export async function login(email: string, password: string): Promise<AuthData> {
  const row = await findUserByEmail(email)

  const passwordMatches = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH)
  if (!row || !row.is_active || !passwordMatches) {
    throw unauthorized('Invalid email or password')
  }

  const user = toUser(row)
  try {
    await logActivity(user.id, 'auth.login')
  } catch (error) {
    // The audit trail must never block a valid login.
    console.error('Failed to write auth.login activity:', error)
  }
  return { token: signToken(user), user }
}

export async function getAuthenticatedUser(userId: number): Promise<User> {
  const row = await findUserById(userId)
  if (!row || !row.is_active) {
    throw unauthorized('Account is no longer active')
  }
  return toUser(row)
}
