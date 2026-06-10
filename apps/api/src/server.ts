import { app } from './app.js'
import { env } from './config/env.js'
import { checkDatabaseConnection } from './database/pool.js'

app.listen(env.port, async () => {
  console.log(`EduCMS API listening on http://localhost:${env.port} (${env.nodeEnv})`)
  const dbConnected = await checkDatabaseConnection()
  if (dbConnected) {
    console.log('Database connection established')
  } else {
    console.error('WARNING: database is not reachable - check DATABASE_URL in .env')
  }
})
