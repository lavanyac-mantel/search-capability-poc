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
