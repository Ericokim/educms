import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { forbidden, notFound } from '../utils/httpError.js'
import { sendSuccess } from '../utils/responses.js'

function buildTestApp() {
  const app = express()
  app.use(express.json())

  app.post(
    '/items',
    validateRequest({
      body: z.object({ name: z.string().min(2), count: z.coerce.number().int().min(0) }),
    }),
    (req, res) => sendSuccess(res, 'Created', req.body, 201)
  )

  app.get('/missing', () => {
    throw notFound('Item not found')
  })

  app.get('/secret', () => {
    throw forbidden()
  })

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}

describe('validateRequest', () => {
  it('passes valid bodies through with transforms applied', async () => {
    const res = await request(buildTestApp()).post('/items').send({ name: 'Math', count: '3' })

    expect(res.status).toBe(201)
    expect(res.body).toEqual({
      success: true,
      message: 'Created',
      data: { name: 'Math', count: 3 },
    })
  })

  it('returns 422 with field errors for invalid bodies', async () => {
    const res = await request(buildTestApp()).post('/items').send({ name: 'M', count: -1 })

    expect(res.status).toBe(422)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Validation failed')
    const fields = res.body.errors.map((e: { field: string }) => e.field)
    expect(fields).toContain('name')
    expect(fields).toContain('count')
  })
})

describe('errorHandler', () => {
  it('maps HttpError to its status with the standard envelope', async () => {
    const res = await request(buildTestApp()).get('/missing')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ success: false, message: 'Item not found', errors: [] })
  })

  it('maps forbidden() to 403', async () => {
    const res = await request(buildTestApp()).get('/secret')

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 for malformed JSON bodies', async () => {
    const res = await request(buildTestApp())
      .post('/items')
      .set('Content-Type', 'application/json')
      .send('{"name": "Ma"')

    expect(res.status).toBe(400)
    expect(res.body).toEqual({
      success: false,
      message: 'Invalid JSON in request body',
      errors: [],
    })
  })

  it('returns the standard 404 envelope for unknown routes', async () => {
    const res = await request(buildTestApp()).get('/nope')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ success: false, message: 'Resource not found', errors: [] })
  })
})
