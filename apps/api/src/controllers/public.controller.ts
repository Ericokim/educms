import type { RequestHandler } from 'express'
import type {
  ListPublicPostsQuery,
  PublicCommentValues,
  PublicSearchQuery,
  User,
} from '@educms/shared'
import * as publicService from '../services/public.service.js'
import { sendSuccess } from '../utils/responses.js'

export const listPosts: RequestHandler = async (req, res) => {
  const query = req.validatedQuery as ListPublicPostsQuery
  sendSuccess(res, 'Articles', await publicService.listPosts(query))
}

export const getBySlug: RequestHandler = async (req, res) => {
  const { slug } = req.validatedParams as { slug: string }
  sendSuccess(res, 'Article', await publicService.getPostBySlug(slug))
}

export const listCategories: RequestHandler = async (_req, res) => {
  sendSuccess(res, 'Categories', await publicService.listCategories())
}

export const search: RequestHandler = async (req, res) => {
  const { q, page, limit } = req.validatedQuery as PublicSearchQuery
  const data = await publicService.listPosts({
    page,
    limit,
    search: q,
    sort: 'latest',
  })
  sendSuccess(res, 'Search results', data)
}

export const listComments: RequestHandler = async (req, res) => {
  const { slug } = req.validatedParams as { slug: string }
  sendSuccess(res, 'Comments', await publicService.listComments(slug))
}

export const submitComment: RequestHandler = async (req, res) => {
  const { slug } = req.validatedParams as { slug: string }
  await publicService.submitComment(
    req.user as User,
    slug,
    req.body as PublicCommentValues
  )
  sendSuccess(res, 'Comment submitted for review', null, 201)
}

export const recordView: RequestHandler = async (req, res) => {
  const { slug } = req.validatedParams as { slug: string }
  await publicService.recordView(slug)
  sendSuccess(res, 'View recorded', null)
}
