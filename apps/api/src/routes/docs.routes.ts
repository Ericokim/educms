import { Router } from 'express'
import { apiReference } from '@scalar/express-api-reference'
import { isProduction } from '../config/env.js'
import { openApiDocument } from '../docs/openapi.js'

/**
 * Interactive API documentation (Scalar) and the raw OpenAPI document.
 * Disable by setting SCALAR_ENABLED=false.
 */
export const docsRoutes = Router()

export const scalarEnabled = process.env.SCALAR_ENABLED !== 'false'

// Scalar preselects the first server; lead with the one being browsed.
const servedDocument = isProduction
  ? { ...openApiDocument, servers: [...openApiDocument.servers].reverse() }
  : openApiDocument

if (scalarEnabled) {
  docsRoutes.get('/openapi.json', (_req, res) => {
    res.json(servedDocument)
  })

  docsRoutes.use(
    '/docs',
    // Scalar loads its UI from the jsdelivr CDN plus an inline bootstrap,
    // which the app-wide CSP (script-src 'self') would block. The docs page
    // serves only our own OpenAPI document, so dropping CSP here is safe;
    // every API endpoint keeps the full helmet policy.
    (_req, res, next) => {
      res.removeHeader('Content-Security-Policy')
      next()
    },
    apiReference({
      content: servedDocument,
      theme: 'default',
      layout: 'modern',
      authentication: {
        preferredSecurityScheme: 'bearerAuth',
      },
    })
  )
}
