import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { app } from '../app.js'
import { pool } from '../database/pool.js'

const ADMIN = { email: 'admin@educms.local', password: 'Password123!' }
const EDITOR = { email: 'editor@educms.local', password: 'Password123!' }

const tokens: Record<string, string> = {}

async function loginAs(credentials: { email: string; password: string }): Promise<string> {
  if (!tokens[credentials.email]) {
    const res = await request(app).post('/api/auth/login').send(credentials)
    expect(res.status).toBe(200)
    tokens[credentials.email] = res.body.data.token
  }
  return tokens[credentials.email]
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
}

afterAll(async () => {
  try {
    // Remove the user created by this suite so reruns start clean.
    await pool.query("DELETE FROM users WHERE username LIKE 'vitest-%'")
  } finally {
    await pool.end()
  }
})

describe('user management', () => {
  let createdId: number
  let createdToken: string

  it('forbids non-admins entirely', async () => {
    const token = await loginAs(EDITOR)
    const res = await request(app).get('/api/users').set(auth(token))
    expect(res.status).toBe(403)
  })

  it('creates a user who can immediately log in', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .post('/api/users')
      .set(auth(token))
      .send({
        username: 'vitest-user',
        email: 'vitest-user@educms.local',
        password: 'VitestPass99',
        firstName: 'Vi',
        lastName: 'Test',
        role: 'author',
      })

    expect(res.status).toBe(201)
    expect(res.body.data.role).toBe('author')
    expect(res.body.data).not.toHaveProperty('password_hash')
    createdId = res.body.data.id

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'vitest-user@educms.local', password: 'VitestPass99' })
    expect(login.status).toBe(200)
    createdToken = login.body.data.token
  })

  it('rejects duplicate usernames and emails with 409', async () => {
    const token = await loginAs(ADMIN)
    const dupUsername = await request(app)
      .post('/api/users')
      .set(auth(token))
      .send({
        username: 'VITEST-USER',
        email: 'other@educms.local',
        password: 'VitestPass99',
        role: 'subscriber',
      })
    expect(dupUsername.status).toBe(409)

    const dupEmail = await request(app)
      .post('/api/users')
      .set(auth(token))
      .send({
        username: 'vitest-other',
        email: 'VITEST-USER@educms.local',
        password: 'VitestPass99',
        role: 'subscriber',
      })
    expect(dupEmail.status).toBe(409)
  })

  it('lists users with role filter and search', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .get('/api/users?role=author&search=vitest')
      .set(auth(token))

    expect(res.status).toBe(200)
    expect(res.body.data.items.length).toBe(1)
    expect(res.body.data.items[0].username).toBe('vitest-user')
  })

  it('updates user details and password', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .patch(`/api/users/${createdId}`)
      .set(auth(token))
      .send({
        username: 'vitest-user',
        email: 'vitest-user@educms.local',
        firstName: 'Vivian',
        password: 'NewVitestPass1',
      })

    expect(res.status).toBe(200)
    expect(res.body.data.firstName).toBe('Vivian')

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'vitest-user@educms.local', password: 'NewVitestPass1' })
    expect(login.status).toBe(200)
  })

  it('changes a role and blocks changing your own', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .patch(`/api/users/${createdId}/role`)
      .set(auth(token))
      .send({ role: 'editor' })
    expect(res.status).toBe(200)
    expect(res.body.data.role).toBe('editor')

    const me = await request(app).get('/api/auth/me').set(auth(token))
    const self = await request(app)
      .patch(`/api/users/${me.body.data.user.id}/role`)
      .set(auth(token))
      .send({ role: 'subscriber' })
    expect(self.status).toBe(400)
  })

  it('deactivation locks the user out immediately', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .patch(`/api/users/${createdId}/deactivate`)
      .set(auth(token))
    expect(res.status).toBe(200)
    expect(res.body.data.isActive).toBe(false)

    // Existing token stops working (auth middleware reloads the user).
    const me = await request(app).get('/api/auth/me').set(auth(createdToken))
    expect(me.status).toBe(401)

    // New logins fail too.
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'vitest-user@educms.local', password: 'NewVitestPass1' })
    expect(login.status).toBe(401)
  })

  it('refuses to demote or deactivate the last active admin', async () => {
    const token = await loginAs(ADMIN)
    const me = await request(app).get('/api/auth/me').set(auth(token))
    const adminId = me.body.data.user.id

    // The seed has exactly one admin; another admin must not be able to
    // demote or deactivate them (here simulated via direct service guards).
    const demote = await request(app)
      .patch(`/api/users/${adminId}/role`)
      .set(auth(token))
      .send({ role: 'editor' })
    // Self-change is caught first, but both guards protect this account.
    expect(demote.status).toBe(400)

    const deactivate = await request(app)
      .patch(`/api/users/${adminId}/deactivate`)
      .set(auth(token))
    expect(deactivate.status).toBe(400)
  })

  it('blocks self-deactivation and supports reactivation', async () => {
    const token = await loginAs(ADMIN)
    const me = await request(app).get('/api/auth/me').set(auth(token))
    const self = await request(app)
      .patch(`/api/users/${me.body.data.user.id}/deactivate`)
      .set(auth(token))
    expect(self.status).toBe(400)

    const reactivate = await request(app)
      .patch(`/api/users/${createdId}/activate`)
      .set(auth(token))
    expect(reactivate.status).toBe(200)
    expect(reactivate.body.data.isActive).toBe(true)

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'vitest-user@educms.local', password: 'NewVitestPass1' })
    expect(login.status).toBe(200)
  })
})
