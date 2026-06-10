import morgan from 'morgan'
import { env } from '../config/env.js'

export const requestLogger = morgan(env.nodeEnv === 'development' ? 'dev' : 'combined', {
  skip: () => env.nodeEnv === 'test',
})
