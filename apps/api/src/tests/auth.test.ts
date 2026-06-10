import express from 'express'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { ROLES } from '@educms/shared'
import { app } from '../app.js'
import { env } from '../config/env.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { pool } from '../database/pool.js'
import { sendSuccess } from '../utils/responses.js'

// These tests run against the local development database and expect the
// seed data from `npm run seed` (see docs/database.md).
const ADMIN = { email: 'admin@educms.local', password: 'Password123!' }
const SUBSCRIBER = { email: 'subscriber@educms.local', password: 'Password123!' }

async function loginAs(credentials: { email: string; password: string }): Promise<string> {
  const res = await request(app).post('/api/auth/login').send(credentials)
  expect(res.status).toBe(200)
  return res.body.data.token
}

afterAll(() => pool.end())

describe('POST /api/auth/login', () => {
  it('returns a token and the user for valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send(ADMIN)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeTypeOf('string')
    expect(res.body.data.user.email).toBe(ADMIN.email)
    expect(res.body.data.user.role).toBe(ROLES.ADMIN)
    expect(res.body.data.user).not.toHaveProperty('password_hash')
    expect(res.body.data.user).not.toHaveProperty('passwordHash')
  })

  it('rejects a wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN.email, password: 'wrong-password' })

    expect(res.status).toBe(401)
    expect(res.body).toEqual({
      success: false,
      message: 'Invalid email or password',
      errors: [],
    })
  })

  it('rejects an unknown email with 401 and the same message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@educms.local', password: 'Password123!' })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid email or password')
  })

  it('rejects an invalid payload with 422 field errors', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' })

    expect(res.status).toBe(422)
    const fields = res.body.errors.map((e: { field: string }) => e.field)
    expect(fields).toContain('email')
    expect(fields).toContain('password')
  })
})

describe('GET /api/auth/me', () => {
  it('returns the current user with a valid token', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.user.email).toBe(ADMIN.email)
  })

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/auth/me')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('rejects a tampered token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-token')

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid token')
  })

  it('rejects an expired token', async () => {
    const expired = jwt.sign({ sub: 1, role: 'admin' }, env.jwtSecret, { expiresIn: '-1s' })
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`)

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Token has expired')
  })
})

describe('requireRole', () => {
  function buildRoleApp() {
    const roleApp = express()
    roleApp.get('/admin-only', authMiddleware, requireRole(ROLES.ADMIN), (req, res) =>
      sendSuccess(res, 'Welcome admin', { user: req.user?.username })
    )
    roleApp.use(errorHandler)
    return roleApp
  }

  it('allows users with a permitted role', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(buildRoleApp())
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
  })

  it('rejects users with a forbidden role with 403', async () => {
    const token = await loginAs(SUBSCRIBER)
    const res = await request(buildRoleApp())
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })
})
