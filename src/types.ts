export interface Entry {
  id: string
  text: string
  type: 'question' | 'keyword'
  source: string
}

export interface SearchBackend {
  load(entries: Entry[]): Promise<void>
  query(q: string, limit?: number): Promise<Entry[]>
}

export interface GcStats {
  events: number
  totalPauseMs: number
}

export interface Phase1Metrics {
  backend: string
  indexBuildTimeMs: number
  heapMemoryMb: number
  rssMemoryMb: number
  cpuIndexLoadMs: number
  cpuWarmupMs: number
  coldStartLatencyMs: number
  baselineLatencyMs: number
  relevanceHitRate: number
  gcDuringLoad: GcStats
}

export interface Phase2Metrics {
  backend: string
  p50Ms: number
  p97_5Ms: number
  p99Ms: number
  throughputRps: number
  errorRatePct: number
  cpuUnderLoadMs: number
  gcUnderLoad: GcStats
}

export interface Scenario {
  run: number
  label: string
  dataScale: number
  trafficScale: number
  totalEntries: string
  rpsNoDebounce: number
  rpsDebounced: number
}

export interface ScenarioBackendResult {
  phase1: Phase1Metrics
  phase2NoDebounce: Phase2Metrics
  phase2Debounced: Phase2Metrics
}

export interface ScenarioResult {
  scenario: Scenario
  backends: ScenarioBackendResult[]
}
