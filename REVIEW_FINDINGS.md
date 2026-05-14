# Review Findings To Address

This page captures the current review findings for the search capability POC so another agent can address them in a focused pass.

## Context

- Project: in-memory search framework POC with load testing.
- Libraries evaluated: MiniSearch, FlexSearch, Orama, SQLite FTS5.
- Main benchmark entrypoint: `npm run evaluate`.
- Current validation commands:
  - `npm test`
  - `npx tsc --noEmit`

## Findings

### 1. TypeScript Does Not Compile

- Priority: P1
- File: `src/backends/minisearch.ts`
- Line: 18

`npm test` passes, but `npx tsc --noEmit` fails. MiniSearch passes `limit` to a type that does not accept it, and Orama has an incompatible `insertMultiple` cast.

This should be fixed before trusting the implementation as a TypeScript project. Add `tsc --noEmit` to the normal validation flow after fixing the errors.

Relevant files:

- `src/backends/minisearch.ts`
- `src/backends/orama.ts`
- `package.json`

Expected outcome:

- `npm test` passes.
- `npx tsc --noEmit` passes.
- TypeScript validation is documented or added to scripts/CI.

### 2. p95 Metric Is Actually p97.5

- Priority: P1
- File: `src/coordinator.ts`
- Line: 111

The result field is named `p95Ms`, and the report labels it as p95, but the harness reads `result.latency.p97_5`.

Every p95 value in `RESULTS.md` is therefore mislabeled. Either use autocannon's real p95 field if available, or rename the metric/report to p97.5.

Relevant files:

- `src/coordinator.ts`
- `src/types.ts`
- `src/report.ts`
- `src/report.test.ts`
- `RESULTS.md`

Expected outcome:

- The metric name and reported percentile match.
- Generated `results/report.json` uses the corrected field.
- `RESULTS.md` is updated so historical numbers are not misleading.

### 3. Memory Comparison Excludes Native SQLite Memory

- Priority: P2
- File: `src/server.ts`
- Line: 67

`heapMemoryMb` uses only `process.memoryUsage().heapUsed`. That is fine for JS-heavy libraries, but SQLite stores meaningful memory outside the JS heap, so the report's SQLite memory advantage is overstated unless RSS/external/native memory is reported too.

Relevant files:

- `src/server.ts`
- `src/types.ts`
- `src/report.ts`
- `src/report.test.ts`
- `RESULTS.md`

Expected outcome:

- Memory metrics include at least RSS in addition to heap used.
- Reports clearly distinguish JS heap from total process memory.
- SQLite memory conclusions are revised to reflect native memory.

### 4. Build/Load Metrics Are Measured With All Backends Running

- Priority: P2
- File: `src/coordinator.ts`
- Line: 126

The coordinator starts every backend at once and keeps all of them resident while measuring. That means index build timings happen under shared CPU and memory pressure, and load-test latency can be affected by the other idle-but-memory-heavy processes.

For cleaner comparisons, benchmark one backend per process lifecycle, then tear it down before the next backend.

Relevant files:

- `src/coordinator.ts`
- `src/server.ts`
- `RESULTS.md`

Expected outcome:

- The coordinator starts one backend, waits for readiness, captures phase 1, runs phase 2, records results, then stops that backend before moving to the next one.
- Child process failures are surfaced clearly instead of waiting only for readiness timeout.
- Fresh benchmark results are regenerated after the harness change.

## Suggested Follow-Up Order

1. Fix TypeScript compile errors and add a validation script.
2. Correct the percentile metric naming/collection.
3. Add RSS/total process memory reporting.
4. Refactor the coordinator to benchmark one backend at a time.
5. Rerun `npm test`, `npx tsc --noEmit`, and `npm run evaluate`.
6. Update `RESULTS.md` from the fresh benchmark output.
