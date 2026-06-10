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

describe('detailed analytics', () => {
  it('returns post analytics with top content, categories, months, and comments', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .get('/api/analytics/posts')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const { topPosts, byCategory, postsPerMonth, commentsByStatus } = res.body.data
    expect(topPosts.length).toBeGreaterThan(0)
    expect(topPosts[0].viewCount).toBeGreaterThanOrEqual(
      topPosts[topPosts.length - 1].viewCount
    )
    expect(byCategory.length).toBeGreaterThan(0)
    expect(byCategory[0]).toHaveProperty('totalViews')
    expect(Array.isArray(postsPerMonth)).toBe(true)
    expect(commentsByStatus.length).toBeGreaterThan(0)
  })

  it('returns user analytics with roles and author performance', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .get('/api/analytics/users')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const { byRole, authorPerformance } = res.body.data
    expect(byRole.length).toBeGreaterThan(0)
    expect(authorPerformance.length).toBeGreaterThan(0)
    expect(authorPerformance[0]).toHaveProperty('publishedCount')
  })

  it('forbids authors from the detailed analytics endpoints', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'author@educms.local', password: 'Password123!' })
    const token = login.body.data.token

    const posts = await request(app)
      .get('/api/analytics/posts')
      .set('Authorization', `Bearer ${token}`)
    expect(posts.status).toBe(403)
    const users = await request(app)
      .get('/api/analytics/users')
      .set('Authorization', `Bearer ${token}`)
    expect(users.status).toBe(403)
  })
})
