import type { RequestHandler } from 'express'
import type { CreateCommentValues, ListCommentsQuery, User } from '@educms/shared'
import * as commentService from '../services/comment.service.js'
import { sendSuccess } from '../utils/responses.js'

export const list: RequestHandler = async (req, res) => {
  const query = req.validatedQuery as ListCommentsQuery
  const data = await commentService.listComments(query)
  sendSuccess(res, 'Comments', data)
}

export const create: RequestHandler = async (req, res) => {
  const data = await commentService.createComment(
    req.user as User,
    req.body as CreateCommentValues
  )
  sendSuccess(res, 'Comment submitted for review', data, 201)
}

export const approve: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  const data = await commentService.moderateComment(req.user as User, id, 'approve')
  sendSuccess(res, 'Comment approved', data)
}

export const spam: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  const data = await commentService.moderateComment(req.user as User, id, 'spam')
  sendSuccess(res, 'Comment marked as spam', data)
}

export const trash: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  const data = await commentService.moderateComment(req.user as User, id, 'trash')
  sendSuccess(res, 'Comment moved to trash', data)
}
