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

import { formatMarkdownTable, writeRealisticReport } from './report.js'
import type { ScenarioResult } from './types.js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const makeScenarioResult = (): ScenarioResult => ({
  scenario: {
    run: 1,
    label: 'Realistic baseline',
    dataScale: 1,
    trafficScale: 1,
    totalEntries: '60k',
    rpsNoDebounce: 0.44,
    rpsDebounced: 0.22,
  },
  backends: [{
    phase1: p1,
    phase2NoDebounce: p2,
    phase2Debounced: { ...p2, p50Ms: 3, throughputRps: 0.2 },
  }],
})

describe('formatMarkdownTable', () => {
  it('produces pipe-separated rows with header and divider', () => {
    const out = formatMarkdownTable(['Metric', 'minisearch'], [['p50 (ms)', '4.0']])
    expect(out).toContain('| Metric')
    expect(out).toContain('| minisearch')
    expect(out).toContain('---')
    expect(out).toContain('p50 (ms)')
    expect(out).toContain('4.0')
  })

  it('pads rows with fewer cells than headers', () => {
    const out = formatMarkdownTable(['A', 'B', 'C'], [['x']])
    expect(out).toContain('| x ')
    // Should have 3 pipe separators in data row (one per column)
    const dataRow = out.split('\n')[2]
    expect((dataRow.match(/\|/g) ?? []).length).toBe(4) // 4 pipes for 3 columns
  })
})

describe('writeRealisticReport', () => {
  it('writes results/results_realistic.md containing all scenario headers', () => {
    writeRealisticReport([makeScenarioResult()])
    const outPath = join(process.cwd(), 'results', 'results_realistic.md')
    expect(existsSync(outPath)).toBe(true)
    const content = readFileSync(outPath, 'utf8')
    expect(content).toContain('## Run 1')
    expect(content).toContain('60k')
    expect(content).toContain('Phase 1')
    expect(content).toContain('No debounce')
    expect(content).toContain('Debounced')
    expect(content).toContain('minisearch')
  })
})
