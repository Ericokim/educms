import 'dotenv/config'

export const env = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl:
    process.env.DATABASE_URL || 'postgresql://educms:educms@localhost:5432/educms',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
}

export const isProduction = env.nodeEnv === 'production'
