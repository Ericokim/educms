import type { RequestHandler } from 'express'
import type { CategoryFormValues, TagFormValues, User } from '@educms/shared'
import { listCategories, listTags } from '../repositories/taxonomy.repository.js'
import * as taxonomyService from '../services/taxonomy.service.js'
import { sendSuccess } from '../utils/responses.js'

export const getCategories: RequestHandler = async (_req, res) => {
  sendSuccess(res, 'Categories', await listCategories())
}

export const createCategory: RequestHandler = async (req, res) => {
  const data = await taxonomyService.createCategory(
    req.user as User,
    req.body as CategoryFormValues
  )
  sendSuccess(res, 'Category created', data, 201)
}

export const updateCategory: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  await taxonomyService.updateCategory(req.user as User, id, req.body as CategoryFormValues)
  sendSuccess(res, 'Category updated', null)
}

export const deleteCategory: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  await taxonomyService.deleteCategory(req.user as User, id)
  sendSuccess(res, 'Category deleted', null)
}

export const getTags: RequestHandler = async (_req, res) => {
  sendSuccess(res, 'Tags', await listTags())
}

export const createTag: RequestHandler = async (req, res) => {
  const data = await taxonomyService.createTag(req.user as User, req.body as TagFormValues)
  sendSuccess(res, 'Tag created', data, 201)
}

export const updateTag: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  await taxonomyService.updateTag(req.user as User, id, req.body as TagFormValues)
  sendSuccess(res, 'Tag updated', null)
}

export const deleteTag: RequestHandler = async (req, res) => {
  const { id } = req.validatedParams as { id: number }
  await taxonomyService.deleteTag(req.user as User, id)
  sendSuccess(res, 'Tag deleted', null)
}
