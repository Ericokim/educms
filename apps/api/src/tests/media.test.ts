import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { app } from '../app.js'
import { pool } from '../database/pool.js'

const ADMIN = { email: 'admin@educms.local', password: 'Password123!' }
const AUTHOR = { email: 'author@educms.local', password: 'Password123!' }
const AUTHOR2 = { email: 'author2@educms.local', password: 'Password123!' }
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

// Minimal valid 1x1 PNG.
const PNG_BYTES = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c626001000000ffff03000006000557bfabd40000000049454e44ae426082',
  'hex'
)

afterAll(() => pool.end())

describe('media uploads', () => {
  let mediaId: number

  it('uploads a valid image and stores a safe random filename', async () => {
    const token = await loginAs(AUTHOR)
    const res = await request(app)
      .post('/api/media/upload')
      .set(auth(token))
      .attach('file', PNG_BYTES, { filename: '../evil name!?.png', contentType: 'image/png' })

    expect(res.status).toBe(201)
    mediaId = res.body.data.id
    expect(res.body.data.filename).toMatch(/^[0-9a-f-]{36}\.png$/)
    expect(res.body.data.url).toBe(`/uploads/${res.body.data.filename}`)
    expect(res.body.data.uploadedBy).toBe('author')
  })

  it('serves the uploaded file', async () => {
    const token = await loginAs(AUTHOR)
    const list = await request(app).get('/api/media?limit=1').set(auth(token))
    const item = list.body.data.items[0]

    const res = await request(app).get(item.url)
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('image/png')
  })

  it('rejects disallowed file types', async () => {
    const token = await loginAs(AUTHOR)
    const res = await request(app)
      .post('/api/media/upload')
      .set(auth(token))
      .attach('file', Buffer.from('#!/bin/sh\necho pwned'), {
        filename: 'script.sh',
        contentType: 'application/x-sh',
      })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects files over the size limit with 413', async () => {
    const token = await loginAs(AUTHOR)
    const big = Buffer.alloc(6 * 1024 * 1024, 1)
    const res = await request(app)
      .post('/api/media/upload')
      .set(auth(token))
      .attach('file', big, { filename: 'big.png', contentType: 'image/png' })

    expect(res.status).toBe(413)
  })

  it('forbids subscribers from uploading or listing', async () => {
    const token = await loginAs(SUBSCRIBER)
    const upload = await request(app)
      .post('/api/media/upload')
      .set(auth(token))
      .attach('file', PNG_BYTES, { filename: 'x.png', contentType: 'image/png' })
    expect(upload.status).toBe(403)

    const list = await request(app).get('/api/media').set(auth(token))
    expect(list.status).toBe(403)
  })

  it('updates alt text and caption', async () => {
    const token = await loginAs(AUTHOR)
    const res = await request(app)
      .patch(`/api/media/${mediaId}`)
      .set(auth(token))
      .send({ altText: 'A tiny test pixel', caption: 'Uploaded by vitest' })

    expect(res.status).toBe(200)
    expect(res.body.data.altText).toBe('A tiny test pixel')
  })

  it('blocks an author from editing someone else’s media', async () => {
    const token = await loginAs(AUTHOR2)
    const res = await request(app)
      .patch(`/api/media/${mediaId}`)
      .set(auth(token))
      .send({ altText: 'hijacked' })

    expect(res.status).toBe(403)
  })

  it('rejects a post referencing a non-existent featured image with 400', async () => {
    const token = await loginAs(ADMIN)
    const res = await request(app)
      .post('/api/posts')
      .set(auth(token))
      .send({
        title: 'Vitest Bad Image Post',
        content: '<p>x</p>',
        tagIds: [],
        featuredImageId: 999999,
      })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('A referenced resource does not exist')
  })

  it('uses an uploaded file as a featured image and clears it on delete', async () => {
    const adminToken = await loginAs(ADMIN)
    const post = await request(app)
      .post('/api/posts')
      .set(auth(adminToken))
      .send({
        title: 'Vitest Media Post',
        content: '<p>with image</p>',
        tagIds: [],
        featuredImageId: mediaId,
      })
    expect(post.status).toBe(201)
    expect(post.body.data.featuredImageId).toBe(mediaId)
    const postId = post.body.data.id

    const deleted = await request(app).delete(`/api/media/${mediaId}`).set(auth(adminToken))
    expect(deleted.status).toBe(200)

    const after = await request(app).get(`/api/posts/${postId}`).set(auth(adminToken))
    expect(after.body.data.featuredImageId).toBeNull()

    await request(app).delete(`/api/posts/${postId}`).set(auth(adminToken))
  })
})
