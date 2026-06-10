import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { app } from '../app.js'
import { pool } from '../database/pool.js'

const ADMIN = { email: 'admin@educms.local', password: 'Password123!' }
const EDITOR = { email: 'editor@educms.local', password: 'Password123!' }
const SUBSCRIBER = { email: 'subscriber@educms.local', password: 'Password123!' }

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

afterAll(() => pool.end())

describe('comments', () => {
  let publishedPostId: number
  let draftPostId: number
  let commentId: number

  it('lets a subscriber comment on a published post (lands as pending)', async () => {
    const adminToken = await loginAs(ADMIN)
    const published = await request(app)
      .get('/api/posts?status=published&limit=1')
      .set(auth(adminToken))
    publishedPostId = published.body.data.items[0].id
    const drafts = await request(app)
      .get('/api/posts?status=draft&limit=1')
      .set(auth(adminToken))
    draftPostId = drafts.body.data.items[0].id

    const token = await loginAs(SUBSCRIBER)
    const res = await request(app)
      .post('/api/comments')
      .set(auth(token))
      .send({ postId: publishedPostId, content: 'A vitest comment for moderation.' })

    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('pending')
    expect(res.body.data.author).toBe('subscriber')
    commentId = res.body.data.id
  })

  it('rejects comments on non-published posts', async () => {
    const token = await loginAs(SUBSCRIBER)
    const res = await request(app)
      .post('/api/comments')
      .set(auth(token))
      .send({ postId: draftPostId, content: 'Should not be allowed.' })

    expect(res.status).toBe(400)
  })

  it('rejects invalid payloads with 422', async () => {
    const token = await loginAs(SUBSCRIBER)
    const res = await request(app)
      .post('/api/comments')
      .set(auth(token))
      .send({ postId: publishedPostId, content: 'x' })

    expect(res.status).toBe(422)
  })

  it('lists comments with a status filter for moderators', async () => {
    const token = await loginAs(EDITOR)
    const res = await request(app)
      .get('/api/comments?status=pending&limit=50')
      .set(auth(token))

    expect(res.status).toBe(200)
    expect(res.body.data.items.length).toBeGreaterThan(0)
    expect(
      res.body.data.items.every((c: { status: string }) => c.status === 'pending')
    ).toBe(true)
    expect(res.body.data.items[0]).toHaveProperty('postTitle')
  })

  it('forbids subscribers from listing and moderating', async () => {
    const token = await loginAs(SUBSCRIBER)
    const list = await request(app).get('/api/comments').set(auth(token))
    expect(list.status).toBe(403)

    const approve = await request(app)
      .patch(`/api/comments/${commentId}/approve`)
      .set(auth(token))
    expect(approve.status).toBe(403)
  })

  it('walks a comment through approve, spam, and trash', async () => {
    const token = await loginAs(EDITOR)

    const approved = await request(app)
      .patch(`/api/comments/${commentId}/approve`)
      .set(auth(token))
    expect(approved.status).toBe(200)
    expect(approved.body.data.status).toBe('approved')

    const spammed = await request(app)
      .patch(`/api/comments/${commentId}/spam`)
      .set(auth(token))
    expect(spammed.status).toBe(200)
    expect(spammed.body.data.status).toBe('spam')

    const trashed = await request(app)
      .patch(`/api/comments/${commentId}/trash`)
      .set(auth(token))
    expect(trashed.status).toBe(200)
    expect(trashed.body.data.status).toBe('trash')
  })

  it('returns 404 for moderating a missing comment', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app).patch('/api/comments/999999/approve').set(auth(token))
    expect(res.status).toBe(404)
  })
})
