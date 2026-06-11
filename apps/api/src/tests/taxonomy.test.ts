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

afterAll(() => pool.end())

describe('categories CRUD', () => {
  let categoryId: number

  it('creates a category with a generated slug', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .post('/api/categories')
      .set(auth(token))
      .send({ name: 'Vitest Category', description: 'Created in tests' })

    expect(res.status).toBe(201)
    categoryId = res.body.data.id

    const list = await request(app).get('/api/categories').set(auth(token))
    const created = list.body.data.find((c: { id: number }) => c.id === categoryId)
    expect(created.slug).toBe('vitest-category')
    expect(created.postCount).toBe(0)
  })

  it('rejects a duplicate name with 409', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .post('/api/categories')
      .set(auth(token))
      .send({ name: 'vitest category' })

    expect(res.status).toBe(409)
  })

  it('forbids editors from creating categories', async () => {
    const token = await loginAs(EDITOR)
    const res = await request(app)
      .post('/api/categories')
      .set(auth(token))
      .send({ name: 'Editor Category' })

    expect(res.status).toBe(403)
  })

  it('updates a category', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .patch(`/api/categories/${categoryId}`)
      .set(auth(token))
      .send({ name: 'Vitest Category Renamed', description: '' })

    expect(res.status).toBe(200)

    const list = await request(app).get('/api/categories').set(auth(token))
    const updated = list.body.data.find((c: { id: number }) => c.id === categoryId)
    expect(updated.name).toBe('Vitest Category Renamed')
  })

  it('rejects invalid payloads with 422', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .post('/api/categories')
      .set(auth(token))
      .send({ name: 'x' })

    expect(res.status).toBe(422)
  })

  it('deletes a category and leaves posts uncategorized', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set(auth(token))

    expect(res.status).toBe(200)

    const list = await request(app).get('/api/categories').set(auth(token))
    expect(list.body.data.some((c: { id: number }) => c.id === categoryId)).toBe(false)
  })
})

describe('tags CRUD', () => {
  let tagId: number

  it('creates, updates, and deletes a tag', async () => {
    const token = await loginAs(ADMIN)

    const created = await request(app)
      .post('/api/tags')
      .set(auth(token))
      .send({ name: 'Vitest Tag' })
    expect(created.status).toBe(201)
    tagId = created.body.data.id

    const dup = await request(app)
      .post('/api/tags')
      .set(auth(token))
      .send({ name: 'VITEST TAG' })
    expect(dup.status).toBe(409)

    const updated = await request(app)
      .patch(`/api/tags/${tagId}`)
      .set(auth(token))
      .send({ name: 'Vitest Tag Renamed' })
    expect(updated.status).toBe(200)

    const deleted = await request(app).delete(`/api/tags/${tagId}`).set(auth(token))
    expect(deleted.status).toBe(200)
  })

  it('forbids editors from deleting tags', async () => {
    const adminToken = await loginAs(ADMIN)
    const list = await request(app).get('/api/tags').set(auth(adminToken))
    const someTag = list.body.data[0]

    const token = await loginAs(EDITOR)
    const res = await request(app).delete(`/api/tags/${someTag.id}`).set(auth(token))
    expect(res.status).toBe(403)
  })

  it('keeps posts when a tag is deleted (cascade removes only the link)', async () => {
    const token = await loginAs(ADMIN)

    const created = await request(app)
      .post('/api/tags')
      .set(auth(token))
      .send({ name: 'Vitest Cascade Tag' })
    const cascadeTagId = created.body.data.id

    // Own post: test files run in parallel workers against the same DB, so
    // borrowing "someone else's" post races with suites that delete theirs.
    const post = await request(app)
      .post('/api/posts')
      .set(auth(token))
      .send({
        title: 'Vitest Tag Cascade Post',
        content: '<p>cascade</p>',
        tagIds: [cascadeTagId],
      })
    expect(post.status).toBe(201)
    const postId = post.body.data.id

    await request(app).delete(`/api/tags/${cascadeTagId}`).set(auth(token))

    const after = await request(app).get(`/api/posts/${postId}`).set(auth(token))
    expect(after.status).toBe(200)
    expect(
      after.body.data.tags.some((t: { id: number }) => t.id === cascadeTagId)
    ).toBe(false)

    await request(app).delete(`/api/posts/${postId}`).set(auth(token))
  })
})
