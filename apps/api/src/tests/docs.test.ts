import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { app } from '../app.js'
import { pool } from '../database/pool.js'

afterAll(() => pool.end())

describe('API documentation', () => {
  it('serves a valid OpenAPI document', async () => {
    const res = await request(app).get('/api/openapi.json')

    expect(res.status).toBe(200)
    expect(res.body.openapi).toBe('3.1.0')
    expect(res.body.info.title).toBe('EduCMS API')
    expect(res.body.components.securitySchemes.bearerAuth.scheme).toBe('bearer')
    expect(Object.keys(res.body.paths).length).toBeGreaterThanOrEqual(30)
  })

  it('documents only real routes (spot checks)', async () => {
    const res = await request(app).get('/api/openapi.json')
    const paths = res.body.paths

    // Protected routes carry bearer security + role notes.
    expect(paths['/users'].get.security).toEqual([{ bearerAuth: [] }])
    expect(paths['/users'].get.description).toContain('admin')
    expect(paths['/posts/{id}/publish'].patch.description).toContain('editor')

    // Public routes carry no security requirement.
    expect(paths['/public/posts'].get.security).toBeUndefined()
    expect(paths['/health'].get.security).toBeUndefined()

    // No invented endpoints.
    expect(paths['/auth/register']).toBeUndefined()
  })

  it('renders the Scalar docs page', async () => {
    const res = await request(app).get('/api/docs')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/html')
    expect(res.text.toLowerCase()).toContain('scalar')
  })

  it('contains no real secrets or tokens', async () => {
    const res = await request(app).get('/api/openapi.json')
    const raw = JSON.stringify(res.body)

    expect(raw).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/) // real JWTs
    expect(raw).not.toContain('password_hash')
    expect(raw).not.toContain(process.env.JWT_SECRET ?? 'dev-secret-do-not-use-in-production')
  })
})
