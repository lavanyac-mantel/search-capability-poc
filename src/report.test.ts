import { describe, it, expect } from 'vitest'
import { formatTable } from './report.js'
import type { Phase1Metrics, Phase2Metrics } from './types.js'

const p1: Phase1Metrics = {
  backend: 'minisearch',
  indexBuildTimeMs: 1200,
  heapMemoryMb: 45.2,
  rssMemoryMb: 112.4,
  cpuIndexLoadMs: 980,
  cpuWarmupMs: 120,
  coldStartLatencyMs: 12.5,
  baselineLatencyMs: 3.2,
  relevanceHitRate: 91.7,
  gcDuringLoad: { events: 2, totalPauseMs: 14.3 },
}

const p2: Phase2Metrics = {
  backend: 'minisearch',
  p50Ms: 4,
  p97_5Ms: 11,
  p99Ms: 18,
  throughputRps: 4200,
  errorRatePct: 0,
  cpuUnderLoadMs: 28000,
  gcUnderLoad: { events: 45, totalPauseMs: 320 },
}

describe('formatTable', () => {
  it('returns a non-empty string', () => {
    const table = formatTable([p1], [p2])
    expect(typeof table).toBe('string')
    expect(table.length).toBeGreaterThan(0)
  })

  it('includes all metric names', () => {
    const table = formatTable([p1], [p2])
    expect(table).toContain('Index build time')
    expect(table).toContain('Heap memory')
    expect(table).toContain('p50')
    expect(table).toContain('p99')
    expect(table).toContain('Throughput')
    expect(table).toContain('Relevance hit rate')
  })

  it('includes backend name', () => {
    expect(formatTable([p1], [p2])).toContain('minisearch')
  })
})
