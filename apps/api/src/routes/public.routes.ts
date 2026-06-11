import { Router } from 'express'
import { z } from 'zod'
import {
  listPublicPostsQuerySchema,
  publicCommentSchema,
  publicSearchQuerySchema,
} from '@educms/shared'
import * as publicController from '../controllers/public.controller.js'
import { authMiddleware } from '../middleware/auth.js'
import { commentRateLimiter } from '../middleware/rateLimiter.js'
import { validateRequest } from '../middleware/validateRequest.js'

const slugParamsSchema = z.object({ slug: z.string().min(1).max(280) })

// Everything here is publicly readable and serves PUBLISHED content only.
// The single write actions: commenting requires a signed-in account (lands
// as pending), and view counting is anonymous but only touches published rows.
export const publicRoutes = Router()

publicRoutes.get(
  '/posts',
  validateRequest({ query: listPublicPostsQuerySchema }),
  publicController.listPosts
)
publicRoutes.get(
  '/posts/:slug',
  validateRequest({ params: slugParamsSchema }),
  publicController.getBySlug
)
publicRoutes.get('/categories', publicController.listCategories)
publicRoutes.get(
  '/categories/:slug/posts',
  validateRequest({
    params: slugParamsSchema,
    query: listPublicPostsQuerySchema,
  }),
  (req, _res, next) => {
    const { slug } = req.validatedParams as { slug: string }
    ;(req.validatedQuery as { categorySlug?: string }).categorySlug = slug
    next()
  },
  publicController.listPosts
)
publicRoutes.get(
  '/tags/:slug/posts',
  validateRequest({
    params: slugParamsSchema,
    query: listPublicPostsQuerySchema,
  }),
  (req, _res, next) => {
    const { slug } = req.validatedParams as { slug: string }
    ;(req.validatedQuery as { tagSlug?: string }).tagSlug = slug
    next()
  },
  publicController.listPosts
)
publicRoutes.get(
  '/search',
  validateRequest({ query: publicSearchQuerySchema }),
  publicController.search
)
publicRoutes.get(
  '/posts/:slug/comments',
  validateRequest({ params: slugParamsSchema }),
  publicController.listComments
)
publicRoutes.post(
  '/posts/:slug/comments',
  authMiddleware,
  commentRateLimiter,
  validateRequest({ params: slugParamsSchema, body: publicCommentSchema }),
  publicController.submitComment
)
publicRoutes.post(
  '/posts/:slug/view',
  validateRequest({ params: slugParamsSchema }),
  publicController.recordView
)
