import type { RequestHandler } from 'express'
import type { ListMediaQuery, UpdateMediaValues, User } from '@educms/shared'
import * as mediaService from '../services/media.service.js'
import { sendSuccess } from '../utils/responses.js'

export const list: RequestHandler = async (req, res) => {
  const query = req.validatedQuery as ListMediaQuery
  const data = await mediaService.listMedia(query)
  sendSuccess(res, 'Media', data)
}

export const upload: RequestHandler = async (req, res) => {
  const data = await mediaService.createMedia(req.user as User, req.file)
  sendSuccess(res, 'File uploaded', data, 201)
}

export const update: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  const data = await mediaService.updateMedia(
    req.user as User,
    id,
    req.body as UpdateMediaValues
  )
  sendSuccess(res, 'Media updated', data)
}

export const remove: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  await mediaService.deleteMedia(req.user as User, id)
  sendSuccess(res, 'Media deleted', null)
}
