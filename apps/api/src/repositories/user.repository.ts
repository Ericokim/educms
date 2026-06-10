import type { ListUsersQuery, Paginated, Role, User } from '@educms/shared'
import { pool, query } from '../database/pool.js'

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

export async function listUsers(filters: ListUsersQuery): Promise<Paginated<User>> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (filters.role) {
    params.push(filters.role)
    conditions.push(`role = $${params.length}`)
  }
  if (filters.search) {
    const escaped = filters.search.replace(/[\\%_]/g, (ch) => `\\${ch}`)
    params.push(`%${escaped}%`)
    conditions.push(
      `(username ILIKE $${params.length} OR email ILIKE $${params.length})`
    )
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (filters.page - 1) * filters.limit
  params.push(filters.limit, offset)

  const [result, countResult] = await Promise.all([
    pool.query<UserRow>(
      `SELECT * FROM users ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    ),
    pool.query<{ total: string }>(
      `SELECT count(*) AS total FROM users ${where}`,
      params.slice(0, params.length - 2)
    ),
  ])
  const total = Number(countResult.rows[0].total)

  return {
    items: result.rows.map(toUser),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  }
}

export async function userConflict(
  username: string,
  email: string,
  excludeId?: number
): Promise<'username' | 'email' | null> {
  const result = await query<{ username: string; email: string }>(
    `SELECT username, email FROM users
     WHERE (lower(username) = lower($1) OR lower(email) = lower($2))
       AND ($3::int IS NULL OR id <> $3)`,
    [username, email, excludeId ?? null]
  )
  if (result.rows.length === 0) return null
  return result.rows.some((row) => row.username.toLowerCase() === username.toLowerCase())
    ? 'username'
    : 'email'
}

export interface UserInsertData {
  username: string
  email: string
  passwordHash: string
  firstName: string | null
  lastName: string | null
  role: Role
}

export async function insertUser(data: UserInsertData): Promise<number> {
  const result = await query<{ id: number }>(
    `INSERT INTO users (username, email, password_hash, first_name, last_name, role)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [data.username, data.email, data.passwordHash, data.firstName, data.lastName, data.role]
  )
  return result.rows[0].id
}

export interface UserUpdateData {
  username: string
  email: string
  firstName: string | null
  lastName: string | null
  passwordHash?: string
}

export async function updateUserRow(id: number, data: UserUpdateData): Promise<void> {
  if (data.passwordHash) {
    await query(
      `UPDATE users SET username = $2, email = $3, first_name = $4, last_name = $5,
         password_hash = $6, updated_at = now()
       WHERE id = $1`,
      [id, data.username, data.email, data.firstName, data.lastName, data.passwordHash]
    )
    return
  }
  await query(
    `UPDATE users SET username = $2, email = $3, first_name = $4, last_name = $5,
       updated_at = now()
     WHERE id = $1`,
    [id, data.username, data.email, data.firstName, data.lastName]
  )
}

export async function countActiveAdmins(): Promise<number> {
  const result = await query<{ total: number }>(
    "SELECT count(*)::int AS total FROM users WHERE role = 'admin' AND is_active"
  )
  return result.rows[0].total
}

export async function setUserRole(id: number, role: Role): Promise<void> {
  await query('UPDATE users SET role = $2, updated_at = now() WHERE id = $1', [id, role])
}

export async function setUserActive(id: number, isActive: boolean): Promise<void> {
  await query('UPDATE users SET is_active = $2, updated_at = now() WHERE id = $1', [
    id,
    isActive,
  ])
}
