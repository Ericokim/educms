import { Router } from 'express'
import { getDbHealth, getHealth } from '../controllers/health.controller.js'

export const healthRoutes = Router()

healthRoutes.get('/', getHealth)
healthRoutes.get('/db', getDbHealth)
