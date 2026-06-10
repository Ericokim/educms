import type { Role } from '../constants/roles.js'

export interface User {
  id: number
  username: string
  email: string
  firstName: string | null
  lastName: string | null
  role: Role
  isActive: boolean
  createdAt: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthData {
  token: string
  user: User
}
