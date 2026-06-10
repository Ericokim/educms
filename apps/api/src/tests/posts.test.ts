import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../app.js'
import { pool } from '../database/pool.js'

// Runs against the local development database (migrated + seeded).
const ADMIN = { email: 'admin@educms.local', password: 'Password123!' }
const EDITOR = { email: 'editor@educms.local', password: 'Password123!' }
const AUTHOR = { email: 'author@educms.local', password: 'Password123!' }
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

let createdId: number

describe('posts CRUD and workflow', () => {
  beforeAll(async () => {
    const token = await loginAs(AUTHOR)
    const res = await request(app)
      .post('/api/posts')
      .set(auth(token))
      .send({
        title: 'Vitest Created Post',
        content: '<p>Original content</p>',
        excerpt: 'Test excerpt',
        tagIds: [],
      })
    expect(res.status).toBe(201)
    createdId = res.body.data.id
  })

  it('creates a draft with a generated slug and an initial version', async () => {
    const token = await loginAs(AUTHOR)
    const res = await request(app).get(`/api/posts/${createdId}`).set(auth(token))

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('draft')
    expect(res.body.data.slug).toMatch(/^vitest-created-post/)

    const versions = await request(app)
      .get(`/api/posts/${createdId}/versions`)
      .set(auth(token))
    expect(versions.body.data).toHaveLength(1)
    expect(versions.body.data[0].versionNumber).toBe(1)
  })

  it('lists posts with pagination and search', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .get('/api/posts?search=Vitest&limit=5')
      .set(auth(token))

    expect(res.status).toBe(200)
    expect(res.body.data.items.length).toBeGreaterThan(0)
    expect(res.body.data.items[0].title).toContain('Vitest')
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 5 })
  })

  it('restricts authors to their own posts in the list', async () => {
    const token = await loginAs(AUTHOR)
    const res = await request(app).get('/api/posts?limit=50').set(auth(token))

    expect(res.status).toBe(200)
    const authors = new Set(res.body.data.items.map((p: { author: string }) => p.author))
    expect(authors).toEqual(new Set(['author']))
  })

  it('blocks an author from reading someone else’s post', async () => {
    const adminToken = await loginAs(ADMIN)
    const list = await request(app).get('/api/posts?limit=50').set(auth(adminToken))
    const foreign = list.body.data.items.find((p: { author: string }) => p.author !== 'author')

    const token = await loginAs(AUTHOR)
    const res = await request(app).get(`/api/posts/${foreign.id}`).set(auth(token))
    expect(res.status).toBe(403)
  })

  it('updates content and records a new version', async () => {
    const token = await loginAs(AUTHOR)
    const res = await request(app)
      .patch(`/api/posts/${createdId}`)
      .set(auth(token))
      .send({
        title: 'Vitest Created Post (edited)',
        content: '<p>Edited content</p>',
        excerpt: 'Test excerpt',
        tagIds: [],
      })

    expect(res.status).toBe(200)
    expect(res.body.data.title).toContain('(edited)')

    const versions = await request(app)
      .get(`/api/posts/${createdId}/versions`)
      .set(auth(token))
    expect(versions.body.data).toHaveLength(2)
  })

  it('forbids authors from publishing', async () => {
    const token = await loginAs(AUTHOR)
    const res = await request(app)
      .patch(`/api/posts/${createdId}/publish`)
      .set(auth(token))
    expect(res.status).toBe(403)
  })

  it('lets an editor publish and sets published_at', async () => {
    const token = await loginAs(EDITOR)
    const res = await request(app)
      .patch(`/api/posts/${createdId}/publish`)
      .set(auth(token))

    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('published')
    expect(res.body.data.publishedAt).not.toBeNull()
  })

  it('serves the published post by slug', async () => {
    const token = await loginAs(SUBSCRIBER)
    const detail = await request(app)
      .get(`/api/posts/${createdId}`)
      .set(auth(await loginAs(ADMIN)))
    const res = await request(app)
      .get(`/api/posts/slug/${detail.body.data.slug}`)
      .set(auth(token))

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(createdId)
  })

  it('rolls back to an earlier version', async () => {
    const token = await loginAs(EDITOR)
    const versions = await request(app)
      .get(`/api/posts/${createdId}/versions`)
      .set(auth(token))
    const first = versions.body.data.find(
      (v: { versionNumber: number }) => v.versionNumber === 1
    )

    const res = await request(app)
      .post(`/api/posts/${createdId}/rollback/${first.id}`)
      .set(auth(token))

    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('Vitest Created Post')
    expect(res.body.data.content).toBe('<p>Original content</p>')

    const after = await request(app)
      .get(`/api/posts/${createdId}/versions`)
      .set(auth(token))
    expect(after.body.data).toHaveLength(3)
  })

  it('rejects a duplicate explicit slug with 409', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .post('/api/posts')
      .set(auth(token))
      .send({
        title: 'Another Post Entirely',
        slug: 'fall-semester-enrollment-opens-august-1',
        content: '<p>x</p>',
        tagIds: [],
      })
    expect(res.status).toBe(409)
  })

  it('rejects invalid payloads with field errors', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .post('/api/posts')
      .set(auth(token))
      .send({ title: 'ab', content: '', tagIds: [] })

    expect(res.status).toBe(422)
    const fields = res.body.errors.map((e: { field: string }) => e.field)
    expect(fields).toContain('title')
    expect(fields).toContain('content')
  })

  it('forbids subscribers from listing posts', async () => {
    const token = await loginAs(SUBSCRIBER)
    const res = await request(app).get('/api/posts').set(auth(token))
    expect(res.status).toBe(403)
  })

  it('forbids editors from deleting and lets admins delete', async () => {
    const editorToken = await loginAs(EDITOR)
    const denied = await request(app)
      .delete(`/api/posts/${createdId}`)
      .set(auth(editorToken))
    expect(denied.status).toBe(403)

    const adminToken = await loginAs(ADMIN)
    const res = await request(app).delete(`/api/posts/${createdId}`).set(auth(adminToken))
    expect(res.status).toBe(200)

    const gone = await request(app).get(`/api/posts/${createdId}`).set(auth(adminToken))
    expect(gone.status).toBe(404)
  })
})

describe('taxonomy lists', () => {
  it('returns categories and tags for staff', async () => {
    const token = await loginAs(AUTHOR)
    const categories = await request(app).get('/api/categories').set(auth(token))
    const tags = await request(app).get('/api/tags').set(auth(token))

    expect(categories.status).toBe(200)
    expect(categories.body.data.length).toBeGreaterThan(0)
    expect(tags.status).toBe(200)
    expect(tags.body.data.length).toBeGreaterThan(0)
  })
})
