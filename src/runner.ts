import { spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import { setTimeout as sleep } from 'timers/promises'
import { performance } from 'perf_hooks'
import autocannon from 'autocannon'
import axios from 'axios'
import { QUERIES, RELEVANCE_PAIRS } from './queries.js'
import type { Phase1Metrics, Phase2Metrics } from './types.js'

export interface BackendConfig {
  name: string
  port: number
}

export const BACKENDS: BackendConfig[] = [
  { name: 'minisearch', port: 3001 },
  { name: 'flexsearch', port: 3002 },
  { name: 'orama',      port: 3003 },
  { name: 'sqlite',     port: 3004 },
]

export interface Phase2Options {
  duration: number
  connections: number
  overallRate?: number
}

interface StatsResponse {
  indexBuildTimeMs: number
  heapMemoryMb: number
  rssMemoryMb: number
  cpuIndexLoad: { userMs: number; systemMs: number }
  gc: { events: number; totalPauseMs: number }
}

interface CpuResponse { userMs: number; systemMs: number }

export function spawnServer(name: string, port: number, scale: number): ChildProcess {
  const proc = spawn('node', ['--expose-gc', '--require', 'tsx/cjs', 'src/server.ts'], {
    env: { ...process.env, BACKEND: name, PORT: String(port), SCALE: String(scale) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  proc.stdout?.on('data', (d: Buffer) => process.stdout.write(`[${name}] ${d}`))
  proc.stderr?.on('data', (d: Buffer) => process.stderr.write(`[${name}] ${d}`))
  return proc
}

export async function waitForReady(port: number, proc: ChildProcess, retries = 30): Promise<void> {
  let exited = false
  let exitCode: number | null = null
  proc.once('exit', (code) => { exited = true; exitCode = code })
  for (let i = 0; i < retries; i++) {
    if (exited) throw new Error(`Server on port ${port} exited before becoming ready (code ${exitCode})`)
    try {
      await axios.get(`http://localhost:${port}/stats`, { timeout: 1000 })
      return
    } catch {
      await sleep(500)
    }
  }
  throw new Error(`Server on port ${port} did not become ready after ${retries} retries`)
}

export async function runPhase1(name: string, port: number): Promise<Phase1Metrics> {
  const base = `http://localhost:${port}`

  const t0 = performance.now()
  await axios.get(`${base}/suggestions?q=${encodeURIComponent(QUERIES[0])}`)
  const coldStartLatencyMs = performance.now() - t0

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

export async function runPhase2(name: string, port: number, opts: Phase2Options): Promise<Phase2Metrics> {
  const base = `http://localhost:${port}`
  const cpuBefore = (await axios.get<CpuResponse>(`${base}/cpu`)).data
  const gcBefore = (await axios.get<StatsResponse>(`${base}/stats`)).data.gc

  const requests = QUERIES.map(q => ({
    method: 'GET' as const,
    path: `/suggestions?q=${encodeURIComponent(q)}`,
  }))

  const isSubOneRate = opts.overallRate !== undefined && opts.overallRate < 1

  let cannonOpts: autocannon.Options
  if (isSubOneRate) {
    // autocannon rejects overallRate < 1; fire a fixed amount of requests instead
    cannonOpts = {
      url: base,
      amount: Math.max(10, Math.round(opts.overallRate! * opts.duration)),
      connections: 1,
      requests,
    }
  } else {
    cannonOpts = {
      url: base,
      duration: opts.duration,
      connections: opts.connections,
      requests,
      ...(opts.overallRate !== undefined ? { overallRate: opts.overallRate } : {}),
    }
  }
  const result = await autocannon(cannonOpts)

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

export { sleep }
