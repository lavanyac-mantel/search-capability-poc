import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { Phase1Metrics, Phase2Metrics } from './types.js'

function cell(value: number | string, width: number): string {
  const s = typeof value === 'number' ? value.toFixed(1) : value
  return s.toString().padStart(width)
}

export function formatTable(phase1: Phase1Metrics[], phase2: Phase2Metrics[]): string {
  const backends = phase1.map(r => r.backend)
  const colW = 13
  const labelW = 28

  const divider = (join: string) =>
    '─'.repeat(labelW + 2) + join + backends.map(() => '─'.repeat(colW + 2)).join(join)

  const row = (label: string, values: (number | string)[]) =>
    ' ' + label.padEnd(labelW) + ' │' + values.map(v => ' ' + cell(v, colW)).join(' │')

  const p1 = new Map(phase1.map(r => [r.backend, r]))
  const p2 = new Map(phase2.map(r => [r.backend, r]))

  const lines = [
    divider('┬'),
    ' ' + 'Metric'.padEnd(labelW) + ' │' + backends.map(b => ' ' + b.padStart(colW)).join(' │'),
    divider('┼'),
    row('Index build time (ms)', backends.map(b => p1.get(b)!.indexBuildTimeMs)),
    row('Heap memory (MB)', backends.map(b => p1.get(b)!.heapMemoryMb)),
    row('RSS memory (MB)', backends.map(b => p1.get(b)!.rssMemoryMb)),
    row('CPU — index load (ms)', backends.map(b => p1.get(b)!.cpuIndexLoadMs)),
    row('CPU — warmup (ms)', backends.map(b => p1.get(b)!.cpuWarmupMs)),
    row('Cold start latency (ms)', backends.map(b => p1.get(b)!.coldStartLatencyMs)),
    row('Baseline latency (ms)', backends.map(b => p1.get(b)!.baselineLatencyMs)),
    row('Relevance hit rate (%)', backends.map(b => p1.get(b)!.relevanceHitRate)),
    row('GC events — load', backends.map(b => p1.get(b)!.gcDuringLoad.events)),
    ' ' + '─'.repeat(labelW) + ' │' + backends.map(() => '─'.repeat(colW + 2)).join('│'),
    row('p50 latency (ms)', backends.map(b => p2.get(b)!.p50Ms)),
    row('p97.5 latency (ms)', backends.map(b => p2.get(b)!.p97_5Ms)),
    row('p99 latency (ms)', backends.map(b => p2.get(b)!.p99Ms)),
    row('Throughput (req/s)', backends.map(b => p2.get(b)!.throughputRps)),
    row('Error rate (%)', backends.map(b => p2.get(b)!.errorRatePct)),
    row('CPU under load (ms)', backends.map(b => p2.get(b)!.cpuUnderLoadMs)),
    row('GC events — under load', backends.map(b => p2.get(b)!.gcUnderLoad.events)),
    divider('┴'),
  ]

  return lines.join('\n')
}

export function writeReport(phase1: Phase1Metrics[], phase2: Phase2Metrics[]): void {
  mkdirSync('results', { recursive: true })
  const table = formatTable(phase1, phase2)
  console.log('\n=== Results ===\n')
  console.log(table)
  writeFileSync(join('results', 'report.json'), JSON.stringify({ phase1, phase2, generatedAt: new Date().toISOString() }, null, 2))
  console.log('\nFull report written to results/report.json')
}
