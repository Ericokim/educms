import 'dotenv/config'

const nodeEnv = process.env.NODE_ENV || 'development'

if (nodeEnv === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production')
}

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '1d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl:
    process.env.DATABASE_URL || 'postgresql://educms:educms@localhost:5432/educms',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
}

export const isProduction = env.nodeEnv === 'production'
