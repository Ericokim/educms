import type { Role, User } from '@educms/shared'
import { query } from '../database/pool.js'

export interface UserRow {
  id: number
  username: string
  email: string
  password_hash: string
  first_name: string | null
  last_name: string | null
  role: Role
  is_active: boolean
  created_at: Date
}

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
  }
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await query<UserRow>('SELECT * FROM users WHERE email = $1', [email])
  return result.rows[0] ?? null
}

export async function findUserById(id: number): Promise<UserRow | null> {
  const result = await query<UserRow>('SELECT * FROM users WHERE id = $1', [id])
  return result.rows[0] ?? null
}
