import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { app } from '../app.js'
import { pool } from '../database/pool.js'

const ADMIN = { email: 'admin@educms.local', password: 'Password123!' }
const SUBSCRIBER = { email: 'subscriber@educms.local', password: 'Password123!' }

async function loginAs(credentials: { email: string; password: string }): Promise<string> {
  const res = await request(app).post('/api/auth/login').send(credentials)
  expect(res.status).toBe(200)
  return res.body.data.token
}

afterAll(() => pool.end())

describe('GET /api/analytics/dashboard', () => {
  it('returns stats, recent posts, pending comments, and activity for staff', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const { stats, recentPosts, pendingComments, recentActivity } = res.body.data
    expect(stats.publishedPosts).toBeGreaterThan(0)
    expect(stats.draftPosts).toBeGreaterThan(0)
    expect(stats.pendingComments).toBeGreaterThan(0)
    expect(stats.activeUsers).toBeGreaterThan(0)
    expect(recentPosts.length).toBeGreaterThan(0)
    expect(recentPosts[0]).toHaveProperty('title')
    expect(recentPosts[0]).toHaveProperty('author')
    expect(pendingComments[0]).toHaveProperty('excerpt')
    expect(pendingComments[0]).toHaveProperty('postTitle')
    expect(Array.isArray(recentActivity)).toBe(true)
  })

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/analytics/dashboard')
    expect(res.status).toBe(401)
  })

  it('rejects subscribers with 403', async () => {
    const token = await loginAs(SUBSCRIBER)
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })
})
