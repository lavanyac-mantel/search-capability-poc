import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { Phase1Metrics, Phase2Metrics, ScenarioResult } from './types.js'

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

export function formatMarkdownTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] ?? '').length))
  )
  const pad = (s: string, w: number) => s.padEnd(w)
  const divider = colWidths.map(w => '-'.repeat(w + 2)).join('|')
  const headerRow = '| ' + headers.map((h, i) => pad(h, colWidths[i])).join(' | ') + ' |'
  const dividerRow = '|' + divider + '|'
  const dataRows = rows.map(row => {
    const cells = Array.from({ length: headers.length }, (_, i) => row[i] ?? '')
    return '| ' + cells.map((cell, i) => pad(cell, colWidths[i])).join(' | ') + ' |'
  })
  return [headerRow, dividerRow, ...dataRows].join('\n')
}

export function writeRealisticReport(results: ScenarioResult[]): void {
  mkdirSync('results', { recursive: true })

  const lines: string[] = [
    '# Realistic Load Test Results',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '---',
    '',
  ]

  for (const { scenario, backends } of results) {
    const backendNames = backends.map(b => b.phase1.backend)

    lines.push(`## Run ${scenario.run} — ${scenario.label}`)
    lines.push('')
    lines.push(
      `**Data:** ${scenario.totalEntries} entries (SCALE ×${scenario.dataScale}) | ` +
      `**Traffic:** ×${scenario.trafficScale} | ` +
      `**Target RPS:** ${scenario.rpsNoDebounce} (no debounce) / ${scenario.rpsDebounced} (debounced)`
    )
    lines.push('')

    lines.push('### Phase 1 — Index load')
    lines.push('')
    lines.push(formatMarkdownTable(
      ['Metric', ...backendNames],
      [
        ['Index build time (ms)', ...backends.map(b => b.phase1.indexBuildTimeMs.toFixed(1))],
        ['Heap memory (MB)',       ...backends.map(b => b.phase1.heapMemoryMb.toFixed(1))],
        ['RSS memory (MB)',        ...backends.map(b => b.phase1.rssMemoryMb.toFixed(1))],
        ['CPU — index load (ms)', ...backends.map(b => b.phase1.cpuIndexLoadMs.toFixed(1))],
        ['CPU — warmup (ms)',     ...backends.map(b => b.phase1.cpuWarmupMs.toFixed(1))],
        ['Cold start latency (ms)', ...backends.map(b => b.phase1.coldStartLatencyMs.toFixed(1))],
        ['Baseline latency (ms)', ...backends.map(b => b.phase1.baselineLatencyMs.toFixed(1))],
        ['Relevance hit rate (%)', ...backends.map(b => b.phase1.relevanceHitRate.toFixed(1))],
        ['GC events — load',      ...backends.map(b => String(b.phase1.gcDuringLoad.events))],
      ]
    ))
    lines.push('')

    lines.push(`### Phase 2 — No debounce (${scenario.rpsNoDebounce} rps target)`)
    lines.push('')
    lines.push(formatMarkdownTable(
      ['Metric', ...backendNames],
      [
        ['p50 latency (ms)',       ...backends.map(b => b.phase2NoDebounce.p50Ms.toFixed(1))],
        ['p97.5 latency (ms)',     ...backends.map(b => b.phase2NoDebounce.p97_5Ms.toFixed(1))],
        ['p99 latency (ms)',       ...backends.map(b => b.phase2NoDebounce.p99Ms.toFixed(1))],
        ['Throughput (req/s)',     ...backends.map(b => b.phase2NoDebounce.throughputRps.toFixed(2))],
        ['Error rate (%)',         ...backends.map(b => b.phase2NoDebounce.errorRatePct.toFixed(2))],
        ['CPU under load (ms)',    ...backends.map(b => b.phase2NoDebounce.cpuUnderLoadMs.toFixed(1))],
        ['GC events — under load', ...backends.map(b => String(b.phase2NoDebounce.gcUnderLoad.events))],
      ]
    ))
    lines.push('')

    lines.push(`### Phase 2 — Debounced (${scenario.rpsDebounced} rps target)`)
    lines.push('')
    lines.push(formatMarkdownTable(
      ['Metric', ...backendNames],
      [
        ['p50 latency (ms)',       ...backends.map(b => b.phase2Debounced.p50Ms.toFixed(1))],
        ['p97.5 latency (ms)',     ...backends.map(b => b.phase2Debounced.p97_5Ms.toFixed(1))],
        ['p99 latency (ms)',       ...backends.map(b => b.phase2Debounced.p99Ms.toFixed(1))],
        ['Throughput (req/s)',     ...backends.map(b => b.phase2Debounced.throughputRps.toFixed(2))],
        ['Error rate (%)',         ...backends.map(b => b.phase2Debounced.errorRatePct.toFixed(2))],
        ['CPU under load (ms)',    ...backends.map(b => b.phase2Debounced.cpuUnderLoadMs.toFixed(1))],
        ['GC events — under load', ...backends.map(b => String(b.phase2Debounced.gcUnderLoad.events))],
      ]
    ))
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  writeFileSync(join('results', 'results_realistic.md'), lines.join('\n'))
  console.log('\nResults written to results/results_realistic.md')
}
