import { spawn } from 'child_process'
import { setTimeout as sleep } from 'timers/promises'
import { performance } from 'perf_hooks'
import autocannon from 'autocannon'
import axios from 'axios'
import { QUERIES, RELEVANCE_PAIRS } from './queries.js'
import { writeReport } from './report.js'
import type { Phase1Metrics, Phase2Metrics } from './types.js'

const BACKENDS = [
  { name: 'minisearch', port: 3001 },
  { name: 'flexsearch', port: 3002 },
  { name: 'orama', port: 3003 },
  { name: 'sqlite', port: 3004 },
] as const

const DURATION = parseInt(process.env.DURATION ?? '30', 10)
const CONNECTIONS = parseInt(process.env.CONNECTIONS ?? '50', 10)

function spawnServer(name: string, port: number) {
  const proc = spawn('node', ['--expose-gc', '--require', 'tsx/cjs', 'src/server.ts'], {
    env: { ...process.env, BACKEND: name, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  proc.stdout?.on('data', (d: Buffer) => process.stdout.write(`[${name}] ${d}`))
  proc.stderr?.on('data', (d: Buffer) => process.stderr.write(`[${name}] ${d}`))
  return proc
}

async function waitForReady(port: number, proc: ReturnType<typeof spawnServer>, retries = 30): Promise<void> {
  // Race readiness polling against the process exiting unexpectedly
  let exited = false
  let exitCode: number | null = null
  proc.once('exit', (code) => { exited = true; exitCode = code })

  for (let i = 0; i < retries; i++) {
    if (exited) {
      throw new Error(`Server on port ${port} exited before becoming ready (code ${exitCode})`)
    }
    try {
      await axios.get(`http://localhost:${port}/stats`, { timeout: 1000 })
      return
    } catch {
      await sleep(500)
    }
  }
  throw new Error(`Server on port ${port} did not become ready after ${retries} retries`)
}

interface StatsResponse {
  indexBuildTimeMs: number
  heapMemoryMb: number
  rssMemoryMb: number
  cpuIndexLoad: { userMs: number; systemMs: number }
  gc: { events: number; totalPauseMs: number }
}

interface CpuResponse { userMs: number; systemMs: number }

async function runPhase1(name: string, port: number): Promise<Phase1Metrics> {
  const base = `http://localhost:${port}`

  // Cold start — first query before any warmup
  const t0 = performance.now()
  await axios.get(`${base}/suggestions?q=${encodeURIComponent(QUERIES[0])}`)
  const coldStartLatencyMs = performance.now() - t0

  // Warmup: run all queries, measure average latency
  const cpuBefore = (await axios.get<CpuResponse>(`${base}/cpu`)).data
  const times: number[] = []
  for (const q of QUERIES) {
    const t = performance.now()
    await axios.get(`${base}/suggestions?q=${encodeURIComponent(q)}`)
    times.push(performance.now() - t)
  }
  const baselineLatencyMs = times.reduce((a, b) => a + b, 0) / times.length
  const cpuAfter = (await axios.get<CpuResponse>(`${base}/cpu`)).data
  const cpuWarmupMs = (cpuAfter.userMs + cpuAfter.systemMs) - (cpuBefore.userMs + cpuBefore.systemMs)

  const stats = (await axios.get<StatsResponse>(`${base}/stats`)).data

  // Relevance hit rate
  let hits = 0
  for (const { query, expectedSubstring } of RELEVANCE_PAIRS) {
    const res = await axios.get<Array<{ text: string }>>(`${base}/suggestions?q=${encodeURIComponent(query)}&limit=5`)
    if (res.data.some(r => r.text.toLowerCase().includes(expectedSubstring.toLowerCase()))) hits++
  }

  return {
    backend: name,
    indexBuildTimeMs: stats.indexBuildTimeMs,
    heapMemoryMb: stats.heapMemoryMb,
    rssMemoryMb: stats.rssMemoryMb,
    cpuIndexLoadMs: stats.cpuIndexLoad.userMs + stats.cpuIndexLoad.systemMs,
    cpuWarmupMs,
    coldStartLatencyMs,
    baselineLatencyMs,
    relevanceHitRate: (hits / RELEVANCE_PAIRS.length) * 100,
    gcDuringLoad: stats.gc,
  }
}

async function runPhase2(name: string, port: number): Promise<Phase2Metrics> {
  const base = `http://localhost:${port}`
  const cpuBefore = (await axios.get<CpuResponse>(`${base}/cpu`)).data
  const gcBefore = (await axios.get<StatsResponse>(`${base}/stats`)).data.gc

  const requests = QUERIES.map(q => ({
    method: 'GET' as const,
    path: `/suggestions?q=${encodeURIComponent(q)}`,
  }))

  const result = await autocannon({ url: base, duration: DURATION, connections: CONNECTIONS, requests })

  const cpuAfter = (await axios.get<CpuResponse>(`${base}/cpu`)).data
  const gcAfter = (await axios.get<StatsResponse>(`${base}/stats`)).data.gc

  return {
    backend: name,
    p50Ms: result.latency.p50,
    p97_5Ms: result.latency.p97_5,
    p99Ms: result.latency.p99,
    throughputRps: result.requests.average,
    errorRatePct: result.requests.total > 0 ? (result.errors / result.requests.total) * 100 : 0,
    cpuUnderLoadMs: (cpuAfter.userMs + cpuAfter.systemMs) - (cpuBefore.userMs + cpuBefore.systemMs),
    gcUnderLoad: {
      events: gcAfter.events - gcBefore.events,
      totalPauseMs: gcAfter.totalPauseMs - gcBefore.totalPauseMs,
    },
  }
}

async function runBackend(name: string, port: number): Promise<{ phase1: Phase1Metrics; phase2: Phase2Metrics }> {
  const proc = spawnServer(name, port)
  try {
    await waitForReady(port, proc)
    console.log(`  [${name}] ready — running phase 1...`)
    const phase1 = await runPhase1(name, port)
    console.log(`  [${name}] phase 1 done — running phase 2 (${DURATION}s, ${CONNECTIONS} connections)...`)
    const phase2 = await runPhase2(name, port)
    console.log(`  [${name}] done.\n`)
    return { phase1, phase2 }
  } finally {
    proc.kill()
    // Brief pause to allow the port to be released before the next backend starts
    await sleep(500)
  }
}

async function main(): Promise<void> {
  console.log(`Search library POC — SCALE=${process.env.SCALE ?? '3'}, CONNECTIONS=${CONNECTIONS}, DURATION=${DURATION}s\n`)

  const phase1Results: Phase1Metrics[] = []
  const phase2Results: Phase2Metrics[] = []

  for (const { name, port } of BACKENDS) {
    console.log(`=== ${name} ===`)
    const { phase1, phase2 } = await runBackend(name, port)
    phase1Results.push(phase1)
    phase2Results.push(phase2)
  }

  writeReport(phase1Results, phase2Results)
}

main().catch(err => { console.error(err); process.exit(1) })
