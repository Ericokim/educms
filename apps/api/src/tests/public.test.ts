import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../app.js'
import { pool } from '../database/pool.js'

const ADMIN = { email: 'admin@educms.local', password: 'Password123!' }
const SUBSCRIBER = { email: 'subscriber@educms.local', password: 'Password123!' }

async function loginAs(credentials: { email: string; password: string }): Promise<string> {
  const res = await request(app).post('/api/auth/login').send(credentials)
  expect(res.status).toBe(200)
  return res.body.data.token
}

let publishedSlug: string
let draftSlug: string

beforeAll(async () => {
  const published = await pool.query(
    "SELECT slug FROM posts WHERE status = 'published' ORDER BY view_count DESC LIMIT 1"
  )
  publishedSlug = published.rows[0].slug
  const draft = await pool.query("SELECT slug FROM posts WHERE status = 'draft' LIMIT 1")
  draftSlug = draft.rows[0].slug
})

afterAll(() => pool.end())

describe('public posts', () => {
  it('lists only published posts without any auth', async () => {
    const res = await request(app).get('/api/public/posts?limit=24')

    expect(res.status).toBe(200)
    expect(res.body.data.items.length).toBeGreaterThan(0)
    const fields = Object.keys(res.body.data.items[0])
    expect(fields).not.toContain('status')
    expect(fields).not.toContain('authorId')
    expect(res.body.data.items[0]).toHaveProperty('readingMinutes')

    // Every listed slug must belong to a published post.
    const slugs = res.body.data.items.map((p: { slug: string }) => p.slug)
    const check = await pool.query(
      "SELECT count(*)::int AS bad FROM posts WHERE slug = ANY($1) AND status <> 'published'",
      [slugs]
    )
    expect(check.rows[0].bad).toBe(0)
  })

  it('serves a published article by slug with related posts', async () => {
    const res = await request(app).get(`/api/public/posts/${publishedSlug}`)

    expect(res.status).toBe(200)
    expect(res.body.data.slug).toBe(publishedSlug)
    expect(res.body.data).toHaveProperty('content')
    expect(res.body.data).not.toHaveProperty('authorId')
    expect(Array.isArray(res.body.data.related)).toBe(true)
    expect(
      res.body.data.related.every((p: { slug: string }) => p.slug !== publishedSlug)
    ).toBe(true)
  })

  it('hides drafts from the public detail endpoint', async () => {
    const res = await request(app).get(`/api/public/posts/${draftSlug}`)
    expect(res.status).toBe(404)
  })

  it('hides archived posts publicly', async () => {
    const archived = await pool.query(
      "SELECT slug FROM posts WHERE status = 'archived' LIMIT 1"
    )
    if (archived.rows.length === 0) return
    const res = await request(app).get(`/api/public/posts/${archived.rows[0].slug}`)
    expect(res.status).toBe(404)
  })

  it('filters by category and tag slug', async () => {
    const byCategory = await request(app).get(
      '/api/public/categories/tutorials/posts?limit=24'
    )
    expect(byCategory.status).toBe(200)
    expect(
      byCategory.body.data.items.every(
        (p: { categorySlug: string }) => p.categorySlug === 'tutorials'
      )
    ).toBe(true)

    const byTag = await request(app).get('/api/public/tags/programming/posts?limit=24')
    expect(byTag.status).toBe(200)
    expect(
      byTag.body.data.items.every((p: { tags: { slug: string }[] }) =>
        p.tags.some((t) => t.slug === 'programming')
      )
    ).toBe(true)
  })

  it('searches published content only', async () => {
    const res = await request(app).get('/api/public/search?q=python')
    expect(res.status).toBe(200)
    expect(res.body.data.items.length).toBeGreaterThan(0)

    const draftSearch = await request(app).get('/api/public/search?q=Midterm')
    const slugs = draftSearch.body.data.items.map((p: { slug: string }) => p.slug)
    expect(slugs).not.toContain(draftSlug)
  })

  it('lists categories with published counts', async () => {
    const res = await request(app).get('/api/public/categories')
    expect(res.status).toBe(200)
    const tutorials = res.body.data.find((c: { slug: string }) => c.slug === 'tutorials')
    expect(tutorials.postCount).toBeGreaterThan(0)
  })
})

describe('public comments and views', () => {
  it('returns approved comments only', async () => {
    const res = await request(app).get(`/api/public/posts/${publishedSlug}/comments`)
    expect(res.status).toBe(200)
    for (const comment of res.body.data) {
      expect(Object.keys(comment)).toEqual(['id', 'author', 'content', 'createdAt'])
    }

    const approved = await pool.query(
      `SELECT count(*)::int AS total FROM comments c
       JOIN posts p ON p.id = c.post_id
       WHERE p.slug = $1 AND c.status = 'approved'`,
      [publishedSlug]
    )
    expect(res.body.data.length).toBe(approved.rows[0].total)
  })

  it('requires login to comment and lands the comment as pending', async () => {
    const anonymous = await request(app)
      .post(`/api/public/posts/${publishedSlug}/comments`)
      .send({ content: 'Anonymous comment attempt' })
    expect(anonymous.status).toBe(401)

    const token = await loginAs(SUBSCRIBER)
    const res = await request(app)
      .post(`/api/public/posts/${publishedSlug}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'A public vitest comment.' })
    expect(res.status).toBe(201)

    const status = await pool.query(
      `SELECT status FROM comments WHERE content = 'A public vitest comment.'
       ORDER BY id DESC LIMIT 1`
    )
    expect(status.rows[0].status).toBe('pending')

    const visible = await request(app).get(`/api/public/posts/${publishedSlug}/comments`)
    expect(
      visible.body.data.some(
        (c: { content: string }) => c.content === 'A public vitest comment.'
      )
    ).toBe(false)
  })

  it('increments view count for published posts only', async () => {
    const before = await pool.query('SELECT view_count FROM posts WHERE slug = $1', [
      publishedSlug,
    ])
    const res = await request(app).post(`/api/public/posts/${publishedSlug}/view`)
    expect(res.status).toBe(200)
    const after = await pool.query('SELECT view_count FROM posts WHERE slug = $1', [
      publishedSlug,
    ])
    expect(after.rows[0].view_count).toBe(before.rows[0].view_count + 1)

    const draftView = await request(app).post(`/api/public/posts/${draftSlug}/view`)
    expect(draftView.status).toBe(404)
  })

  it('admin preview data stays on the authenticated API', async () => {
    const adminToken = await loginAs(ADMIN)
    const drafts = await request(app)
      .get('/api/posts?status=draft&limit=1')
      .set('Authorization', `Bearer ${adminToken}`)
    const draft = drafts.body.data.items[0]

    const preview = await request(app)
      .get(`/api/posts/${draft.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(preview.status).toBe(200)
    expect(preview.body.data.status).toBe('draft')
  })
})
