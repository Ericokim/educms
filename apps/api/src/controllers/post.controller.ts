import type { RequestHandler } from 'express'
import type { ListPostsQuery, PostFormValues, User } from '@educms/shared'
import * as postService from '../services/post.service.js'
import { sendSuccess } from '../utils/responses.js'

function currentUser(req: Parameters<RequestHandler>[0]): User {
  // authMiddleware always runs before these handlers.
  return req.user as User
}

export const list: RequestHandler = async (req, res) => {
  const query = req.validatedQuery as ListPostsQuery
  const data = await postService.listPosts(currentUser(req), query)
  sendSuccess(res, 'Posts', data)
}

export const getById: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  const data = await postService.getPost(currentUser(req), id)
  sendSuccess(res, 'Post', data)
}

export const getBySlug: RequestHandler = async (req, res) => {
  const { slug } = req.validatedParams as { slug: string }
  const data = await postService.getPublishedPostBySlug(slug)
  sendSuccess(res, 'Post', data)
}

export const create: RequestHandler = async (req, res) => {
  const data = await postService.createPost(currentUser(req), req.body as PostFormValues)
  sendSuccess(res, 'Post created', data, 201)
}

export const update: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  const data = await postService.updatePost(currentUser(req), id, req.body as PostFormValues)
  sendSuccess(res, 'Post updated', data)
}

export const publish: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  const data = await postService.publishPost(currentUser(req), id)
  sendSuccess(res, 'Post published', data)
}

export const archive: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  const data = await postService.archivePost(currentUser(req), id)
  sendSuccess(res, 'Post archived', data)
}

export const remove: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  await postService.deletePost(currentUser(req), id)
  sendSuccess(res, 'Post deleted', null)
}

export const versions: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  const data = await postService.listPostVersions(currentUser(req), id)
  sendSuccess(res, 'Post versions', data)
}

export const rollback: RequestHandler = async (req, res) => {
  const { id, versionId } = req.validatedParams as { id: number; versionId: number }
  const data = await postService.rollbackPost(currentUser(req), id, versionId)
  sendSuccess(res, 'Post rolled back', data)
}
