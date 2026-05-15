# Search Capability POC

Benchmarks four Node.js search backends — **MiniSearch**, **FlexSearch**, **Orama**, and **SQLite FTS5** — across realistic government-service query patterns.

## Setup

```bash
npm install
npm run seed        # generates data/entries.json (~60k base entries)
```

## Running the tests

### Realistic load test (scenarios)

Runs 8 predefined scenarios across increasing data and traffic scales. Each scenario runs two phase 2 passes per backend (no-debounce and debounced). Results are written to `results/results_realistic.md`.

```bash
npm run load-test
```

**Environment variables:**

| Variable | Default | Description |
|---|---|---|
| `DURATION` | `60` | Seconds per phase 2 run |
| `START_RUN` | `1` | Skip scenarios before this run number (useful for resuming) |
| `SKIP_BACKENDS` | `` | Comma-separated backend names to exclude, e.g. `orama,flexsearch` |

```bash
# Resume from run 4, skip orama
START_RUN=4 SKIP_BACKENDS=orama npm run load-test

# Shorter runs for quick iteration
DURATION=10 npm run load-test
```

### Simple evaluation (max throughput)

Runs all backends at full concurrency without a rate cap. Useful for raw throughput comparison.

```bash
npm run evaluate
```

**Environment variables:**

| Variable | Default | Description |
|---|---|---|
| `SCALE` | `3` | Multiplier on base entry count (~60k × SCALE) |
| `DURATION` | `30` | Seconds per phase 2 run |
| `CONNECTIONS` | `50` | Concurrent HTTP connections |

```bash
SCALE=5 CONNECTIONS=100 DURATION=60 npm run evaluate
```

### Other commands

```bash
npm test          # run unit tests
npm run typecheck # TypeScript type check
```

---

## Metrics reference

### Phase 1 — Index load

| Metric | Description |
|---|---|
| **Index build time (ms)** | Wall-clock time to build and load the search index at server startup, measured server-side. |
| **Heap memory (MB)** | V8 JS heap used after index load (`process.memoryUsage().heapUsed`). Reflects memory held directly by the index data structures. |
| **RSS memory (MB)** | Total physical RAM held by the process — heap + native code + shared libraries. Always larger than heap. |
| **CPU — index load (ms)** | Cumulative CPU time (user + system) consumed while building the index, measured server-side via `process.cpuUsage()` snapshots around the build step. |
| **CPU — warmup (ms)** | CPU time consumed while firing all 50 test queries once sequentially after startup. Captures JIT compilation and cache warming costs. |
| **Cold start latency (ms)** | Wall-clock time for the very first query after the server is ready. Typically slower due to cold JIT and cache state. |
| **Baseline latency (ms)** | Average wall-clock time across all 50 test queries fired sequentially once the engine is warm. Represents single-user, uncontested latency. |
| **Relevance hit rate (%)** | For each of 12 curated query/expected-result pairs, checks whether any of the top 5 results contains the expected substring (case-insensitive). Hit rate = percentage of pairs that passed. Measures search quality, not speed. |
| **GC events — load** | Number of garbage collection events that occurred during index build, tracked via Node's `perf_hooks` GC observer. |

### Phase 2 — Under load

| Metric | Description |
|---|---|
| **p50 latency (ms)** | Median request latency across all requests during the run, as reported by autocannon. |
| **p97.5 latency (ms)** | 97.5th percentile latency — only 2.5% of requests were slower than this. |
| **p99 latency (ms)** | 99th percentile latency — worst 1% of requests. |
| **Throughput (req/s)** | Average requests completed per second over the run (`result.requests.average` from autocannon). For sub-1 rps scenarios, autocannon fires a fixed request count as fast as possible, so this reflects burst speed rather than the intended rate. |
| **Error rate (%)** | `errors / total requests × 100`. Counts non-2xx responses and connection errors as reported by autocannon. |
| **CPU under load (ms)** | Total CPU time (user + system) consumed by the server process during the phase 2 run — delta between `process.cpuUsage()` snapshots taken before and after autocannon runs. |
| **GC events — under load** | Delta in GC event count between the start and end of the phase 2 run. High GC under load can cause latency spikes. |

### CPU time (user vs system)

CPU metrics use Node's `process.cpuUsage()`, which returns cumulative time since process start:

- **userMs** — time the process spent executing JavaScript (user-space code)
- **systemMs** — time the OS kernel spent on behalf of the process (I/O, syscalls)

All metrics report `userMs + systemMs` as total CPU consumed.

---

## Load test scenarios

The 8 predefined scenarios in `load-test-scenarios.ts` simulate realistic government-services search traffic scaled from a baseline of one user keystroke every ~2 seconds:

| Run | Label | Data | No-debounce rps | Debounced rps |
|-----|-------|------|----------------|---------------|
| 1 | Realistic baseline | 60k | 0.44 | 0.22 |
| 2 | Traffic ×2 | 60k | 0.88 | 0.44 |
| 3 | Traffic ×5 | 60k | 2.2 | 1.1 |
| 4 | Traffic ×15 | 60k | 6.6 | 3.3 |
| 5 | Data ×2, Traffic ×2 | 120k | 0.88 | 0.44 |
| 6 | Data ×3, Traffic ×5 | 180k | 2.2 | 1.1 |
| 7 | Data ×3, Traffic ×15 | 180k | 6.6 | 3.3 |
| 8 | Data ×5, Traffic ×45 | 300k | 20 | 10 |

Runs with rps < 1 fire a fixed number of requests (`round(rate × duration)`) rather than a timed run, as autocannon does not accept sub-1 rates.
