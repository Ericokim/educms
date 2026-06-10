import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from '../app.js'

describe('GET /api/health', () => {
  it('returns a healthy response in the standard format', async () => {
    const res = await request(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('API is healthy')
    expect(res.body.data.status).toBe('ok')
  })

  it('returns the standard error format for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(res.body.errors).toEqual([])
  })
})
