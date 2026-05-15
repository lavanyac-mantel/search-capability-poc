import { setTimeout as sleep } from 'timers/promises'
import { BACKENDS, spawnServer, waitForReady, runPhase1, runPhase2 } from './runner.js'
import type { BackendConfig } from './runner.js'
import { writeRealisticReport } from './report.js'
import type { Scenario, ScenarioResult } from './types.js'

const DURATION = parseInt(process.env.DURATION ?? '60', 10)
const CONNECTIONS = 10
const START_RUN = parseInt(process.env.START_RUN ?? '1', 10)
const SKIP_BACKENDS = (process.env.SKIP_BACKENDS ?? '').split(',').map(s => s.trim()).filter(Boolean)

interface ScenarioConfig extends Scenario {
  skipBackends?: string[]
}

const SCENARIOS: ScenarioConfig[] = [
  { run: 1, label: 'Realistic baseline',    dataScale: 1, trafficScale: 1,  totalEntries: '60k',  rpsNoDebounce: 0.44, rpsDebounced: 0.22 },
  { run: 2, label: 'Traffic ×2',            dataScale: 1, trafficScale: 2,  totalEntries: '60k',  rpsNoDebounce: 0.88, rpsDebounced: 0.44 },
  { run: 3, label: 'Traffic ×5',            dataScale: 1, trafficScale: 5,  totalEntries: '60k',  rpsNoDebounce: 2.2,  rpsDebounced: 1.1  },
  { run: 4, label: 'Traffic ×15',           dataScale: 1, trafficScale: 15, totalEntries: '60k',  rpsNoDebounce: 6.6,  rpsDebounced: 3.3  },
  { run: 5, label: 'Data ×2, Traffic ×2',   dataScale: 2, trafficScale: 2,  totalEntries: '120k', rpsNoDebounce: 0.88, rpsDebounced: 0.44 },
  { run: 6, label: 'Data ×3, Traffic ×5',   dataScale: 3, trafficScale: 5,  totalEntries: '180k', rpsNoDebounce: 2.2,  rpsDebounced: 1.1  },
  { run: 7, label: 'Data ×3, Traffic ×15',  dataScale: 3, trafficScale: 15, totalEntries: '180k', rpsNoDebounce: 6.6,  rpsDebounced: 3.3  },
  { run: 8, label: 'Data ×5, Traffic ×45',  dataScale: 5, trafficScale: 45, totalEntries: '300k', rpsNoDebounce: 20,   rpsDebounced: 10,  skipBackends: ['orama'] },
]

async function runScenario(scenario: ScenarioConfig): Promise<ScenarioResult> {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Run ${scenario.run}: ${scenario.label}`)
  console.log(`  Data: ${scenario.totalEntries} entries (SCALE ×${scenario.dataScale})`)
  console.log(`  Traffic: ×${scenario.trafficScale} | ${scenario.rpsNoDebounce} rps (no debounce) / ${scenario.rpsDebounced} rps (debounced)`)
  console.log('='.repeat(60))

  const backends: ScenarioResult['backends'] = []
  const excluded = [...SKIP_BACKENDS, ...(scenario.skipBackends ?? [])]
  const activeBackends: BackendConfig[] = BACKENDS.filter(b => !excluded.includes(b.name))

  for (const { name, port } of activeBackends) {
    console.log(`\n  [${name}] starting server (SCALE=${scenario.dataScale})...`)
    const proc = spawnServer(name, port, scenario.dataScale)
    try {
      await waitForReady(port, proc)
      console.log(`  [${name}] ready — running phase 1...`)
      const phase1 = await runPhase1(name, port)

      console.log(`  [${name}] phase 2 — no debounce @ ${scenario.rpsNoDebounce} rps (${DURATION}s)...`)
      const phase2NoDebounce = await runPhase2(name, port, {
        duration: DURATION,
        connections: CONNECTIONS,
        overallRate: scenario.rpsNoDebounce,
      })

      console.log(`  [${name}] phase 2 — debounced @ ${scenario.rpsDebounced} rps (${DURATION}s)...`)
      const phase2Debounced = await runPhase2(name, port, {
        duration: DURATION,
        connections: CONNECTIONS,
        overallRate: scenario.rpsDebounced,
      })

      backends.push({ phase1, phase2NoDebounce, phase2Debounced })
      console.log(`  [${name}] done.`)
    } finally {
      proc.kill()
      await sleep(500)
    }
  }

  return { scenario, backends }
}

async function main(): Promise<void> {
  console.log(`Realistic load test — ${SCENARIOS.length} scenarios, DURATION=${DURATION}s per phase 2 run`)
  console.log(`Backends: ${BACKENDS.map(b => b.name).join(', ')}\n`)

  const results: ScenarioResult[] = []
  for (const scenario of SCENARIOS) {
    if (scenario.run < START_RUN) continue
    results.push(await runScenario(scenario))
  }

  writeRealisticReport(results)
}

main().catch(err => { console.error(err); process.exit(1) })
