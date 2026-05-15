import { BACKENDS, spawnServer, waitForReady, runPhase1, runPhase2, sleep } from './runner.js'
import { writeReport } from './report.js'
import type { Phase1Metrics, Phase2Metrics } from './types.js'

const DURATION = parseInt(process.env.DURATION ?? '30', 10)
const CONNECTIONS = parseInt(process.env.CONNECTIONS ?? '50', 10)

async function runBackend(name: string, port: number): Promise<{ phase1: Phase1Metrics; phase2: Phase2Metrics }> {
  const proc = spawnServer(name, port, parseFloat(process.env.SCALE ?? '3'))
  try {
    await waitForReady(port, proc)
    console.log(`  [${name}] ready — running phase 1...`)
    const phase1 = await runPhase1(name, port)
    console.log(`  [${name}] phase 1 done — running phase 2 (${DURATION}s, ${CONNECTIONS} connections)...`)
    const phase2 = await runPhase2(name, port, { duration: DURATION, connections: CONNECTIONS })
    console.log(`  [${name}] done.\n`)
    return { phase1, phase2 }
  } finally {
    proc.kill()
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
