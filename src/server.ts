import express from 'express'
import { PerformanceObserver, performance } from 'perf_hooks'
import { loadEntries } from './data.js'
import { MiniSearchBackend } from './backends/minisearch.js'
import { FlexSearchBackend } from './backends/flexsearch.js'
import { OramaBackend } from './backends/orama.js'
import { SqliteBackend } from './backends/sqlite.js'
import type { SearchBackend } from './types.js'

const BACKEND = process.env.BACKEND as 'minisearch' | 'flexsearch' | 'orama' | 'sqlite'
const PORT = parseInt(process.env.PORT ?? '3000', 10)

let gcEvents = 0
let gcTotalPauseMs = 0
const obs = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    gcEvents++
    gcTotalPauseMs += entry.duration
  }
})
obs.observe({ entryTypes: ['gc'] })

const BACKENDS: Record<string, () => SearchBackend> = {
  minisearch: () => new MiniSearchBackend(),
  flexsearch: () => new FlexSearchBackend(),
  orama: () => new OramaBackend(),
  sqlite: () => new SqliteBackend(),
}

async function main(): Promise<void> {
  const factory = BACKENDS[BACKEND]
  if (!factory) {
    console.error(`Unknown BACKEND: ${BACKEND}. Use: ${Object.keys(BACKENDS).join(', ')}`)
    process.exit(1)
  }

  const backend = factory()
  const entries = await loadEntries()

  const cpuBefore = process.cpuUsage()
  const buildStart = performance.now()
  await backend.load(entries)
  const indexBuildTimeMs = performance.now() - buildStart
  const cpuAfterLoad = process.cpuUsage(cpuBefore)

  const app = express()

  app.get('/suggestions', async (req, res) => {
    const q = String(req.query['q'] ?? '')
    const limit = parseInt(String(req.query['limit'] ?? '10'), 10)
    res.json(await backend.query(q, limit))
  })

  app.get('/memory', (_req, res) => {
    const mem = process.memoryUsage()
    res.json({
      heapUsedMb: mem.heapUsed / 1024 / 1024,
      rssMb: mem.rss / 1024 / 1024,
    })
  })

  app.get('/cpu', (_req, res) => {
    const cpu = process.cpuUsage()
    res.json({ userMs: cpu.user / 1000, systemMs: cpu.system / 1000 })
  })

  app.get('/stats', (_req, res) => {
    res.json({
      backend: BACKEND,
      indexBuildTimeMs,
      heapMemoryMb: process.memoryUsage().heapUsed / 1024 / 1024,
      rssMemoryMb: process.memoryUsage().rss / 1024 / 1024,
      cpuIndexLoad: { userMs: cpuAfterLoad.user / 1000, systemMs: cpuAfterLoad.system / 1000 },
      gc: { events: gcEvents, totalPauseMs: gcTotalPauseMs },
      entryCount: entries.length,
    })
  })

  app.listen(PORT, () => {
    console.log(`[${BACKEND}] ready on port ${PORT} (${entries.length} entries, built in ${indexBuildTimeMs.toFixed(0)}ms)`)
  })
}

main().catch(err => { console.error(err); process.exit(1) })
