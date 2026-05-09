import express from 'express'
import { driver } from './db.js'
import { createIndexes } from './services/memgraphLoader.js'
import uploadRouter from './routes/upload.js'

const app  = express()
const PORT = 3001

app.use(express.json())
app.use('/api', uploadRouter)

async function start() {
  const session = driver.session()
  try {
    await createIndexes(session)
    console.log('[server] Memgraph indexes ready')
  } finally {
    await session.close()
  }

  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`)
  })
}

start().catch(e => {
  console.error('[server] startup failed:', e.message)
  process.exit(1)
})
