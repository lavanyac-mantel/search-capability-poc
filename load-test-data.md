## Background

Estimated production traffic is 115,000 searches/month, giving an average of 2.65 req/min (0.044 rps).
Each search session triggers multiple API calls depending on whether debounce is implemented:

- **No debounce:** 10 keystrokes × 2.65 req/min = 26.5 req/min → **0.44 rps**
- **Debounced:** 5 keystrokes × 2.65 req/min = 13.25 req/min → **0.22 rps**

Data load baseline: 3,000 pages × 20 entries/page = **60,000 entries**.

---

## Scenarios

| Run | Data SCALE | Total entries | Traffic scale | RPS (no debounce) | RPS (debounced) |
|-----|-----------|---------------|---------------|-------------------|-----------------|
| 1   | ×1        | 60k           | ×1            | 0.44              | 0.22            |
| 2   | ×1        | 60k           | ×2            | 0.88              | 0.44            |
| 3   | ×1        | 60k           | ×5            | 2.2               | 1.1             |
| 4   | ×1        | 60k           | ×15           | 6.6               | 3.3             |
| 5   | ×2        | 120k          | ×2            | 0.88              | 0.44            |
| 6   | ×3        | 180k          | ×5            | 2.2               | 1.1             |
| 7   | ×3        | 180k          | ×15           | 6.6               | 3.3             |
| 8   | ×5        | 300k          | ×45           | 20                | 10              |

Each run tests all 4 backends (minisearch, flexsearch, orama, sqlite) and both debounce variants.

---

## Architecture

### Data seeding

Re-seed with `SEED_COUNT=60000` to produce a 60k-entry base file (`data/entries.json`).
The existing `SCALE` env var on the server multiplies this at load time — no changes to `seed.ts` logic needed, just the target count.

### `src/load-test-scenarios.ts`

A standalone runner (replacing direct use of `coordinator.ts` for this task) that:

1. Accepts no arguments — all scenario config is inline.
2. Iterates the 8 scenarios in order.
3. For each scenario:
   - Sets `SCALE` for all 4 backend servers.
   - Runs the existing `runBackend` logic (phase 1 + phase 2) twice per backend — once at the no-debounce RPS rate, once at the debounced RPS rate — using autocannon's `rate` option to cap throughput.
4. Collects all results and writes `results/results_realistic.md`.

### Traffic control

Use autocannon `rate` (requests/second) rather than unrestricted connections. This models realistic user pacing instead of hammer mode. A small fixed connection pool (e.g. 10 connections) ensures enough parallelism to sustain the rate without saturating the server artificially.

### Metrics captured

**Phase 1** (index load, single-instance):
- Index build time (ms)
- Heap memory (MB)
- RSS memory (MB)
- CPU — index load (ms)
- CPU — warmup (ms)
- Cold start latency (ms)
- Baseline latency (ms)
- Relevance hit rate (%)
- GC events during load

**Phase 2** (under load):
- p50 / p97.5 / p99 latency (ms)
- Throughput (req/s actual)
- Error rate (%)
- CPU under load (ms)
- GC events under load

### Output: `results/results_realistic.md`

One section per scenario (8 total). Each section contains:
- Scenario header: run number, total entries, traffic scale, target RPS (both variants)
- A phase 1 table (one column per backend)
- A phase 2 table — one sub-section for no-debounce rate, one for debounced rate
