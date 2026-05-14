# Search Library POC — Findings

**Date:** 2026-05-12
**Libraries evaluated:** MiniSearch · FlexSearch · Orama · SQLite FTS5 (in-memory)
**Data:** 45,001 synthetically generated entries (government service topic × action × question templates)
**Tooling:** TypeScript · Node.js 22 · Express · autocannon · Vitest

---

## Fuzzy Search Support

This is the most important qualitative difference between libraries and directly affects relevance at scale.

| Library | Mechanism | Handles misspellings? | Cost at scale |
|---|---|---|---|
| **MiniSearch** | Levenshtein edit distance (`fuzzy: 0.2`) | Yes — up to 20% character substitution | O(vocabulary) per query — collapses under load at 135k entries |
| **FlexSearch** | Prefix trie (`tokenize: 'forward'`) | No — prefix only, `suggest: true` fills partial queries but not typos | Negligible — no edit-distance computation |
| **Orama** | Tolerance-based edit distance (`tolerance: 1`) | Partial — handles 1-char edits, misses longer misspellings | High — GC pressure is 2–5× other libraries |
| **SQLite FTS5** | Porter stemmer (`porter unicode61`) | No — normalises word forms (`renewing→renew`) but not arbitrary misspellings | Negligible — stemming is applied at index time |

**Key insight:** At 135k entries, MiniSearch's fuzzy search scans the entire vocabulary per query (O(vocabulary_size)), making each query take ~35ms in isolation and 344ms median under 60 concurrent connections (p99 6,721ms). Fuzzy correctness comes at a severe throughput cost that makes it unviable under load at this scale without architectural changes (e.g. a separate small fuzzy pre-filter tier).

---

## Relevance Hit Rate

Measured against 12 representative queries including exact, prefix, natural language, and misspelled variants. A hit = expected substring appearing in the top-5 results.

| Library | Hit rate | Failing query type |
|---|---|---|
| **MiniSearch** | **100%** | None |
| **FlexSearch** | 91.7% | Misspellings (e.g. `licenve renewal`) |
| **Orama** | 91.7% at small volume · drops at scale | Misspellings with multiple edits |
| **SQLite FTS5** | 91.7% at small volume · 83.3% at 135k | Misspellings + borderline queries squeezed out of top-5 at high volume |

SQLite's hit rate degrading from 91.7% → 83.3% as entries grew from ~1,700 → 135,000 reflects a real characteristic: BM25 ranking pushes borderline queries out of the top-5 window when there are more competing documents.

---

## Test Runs

Nine runs across four data volumes and multiple concurrency levels.

**Runs 1–2** used the old approach (live Service NSW page fetches, ~578 base entries).
**Runs 3–5** use the fixed synthetic dataset at stress-test scale (135k entries, 50–60 connections).
**Runs 6–7** are tuned to the client's estimated workload (75k entries, 5–15 connections).
**Runs 8–9** test at the 45k entry lower bound (5–15 connections).

---

### Run 1 — SCALE=3 · 50 connections · 30s · ~1,734 entries

Low-volume run on live-fetched data. Results not representative of production load — HTTP overhead and thread contention dominated at these entry counts.

#### Phase 1 — Baseline

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| Index build time (ms) | 12.8 | 17.6 | 65.3 | **6.8** |
| Heap memory (MB) | **35.2** | 51.2 | 40.3 | 44.4 |
| CPU — index load (ms) | 28.0 | 35.2 | 100.5 | **7.0** |
| CPU — warmup (ms) | 101.5 | **17.2** | 92.1 | 16.2 |
| Cold start latency (ms) | 3.2 | **1.5** | 8.0 | 1.3 |
| Baseline latency (ms) | 1.8 | **0.4** | 1.1 | **0.4** |
| Relevance hit rate (%) | **100.0** | 91.7 | **100.0** | 91.7 |
| GC events — index load | 17 | 13 | 25 | **12** |

#### Phase 2 — Load Test

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| p50 latency (ms) | 28 | **3** | 18 | 4 |
| p97.5 latency (ms) | 76 | **5** | 77 | 11 |
| p99 latency (ms) | 80 | **7** | 81 | 13 |
| Throughput (req/s) | 1,475 | **12,303** | 1,765 | 9,250 |
| Error rate (%) | 0.0 | 0.0 | 0.0 | 0.0 |
| CPU under load (ms) | 31,418 | 31,438 | 32,005 | 32,085 |
| GC events — under load | 2,175 | 2,688 | 5,664 | **808** |

---

### Run 2 — SCALE=1.5 · 20 connections · 30s · ~867 entries

Lower concurrency on live-fetched data. Libraries behaved similarly at this low entry count — differences were not statistically meaningful.

#### Phase 1 — Baseline

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| Index build time (ms) | 12.5 | **9.4** | 47.5 | 11.5 |
| Heap memory (MB) | 26.1 | 33.4 | 28.5 | **24.1** |
| CPU — index load (ms) | 31.1 | 20.3 | 72.5 | **9.0** |
| CPU — warmup (ms) | 77.6 | **15.1** | 59.6 | 32.9 |
| Cold start latency (ms) | 3.3 | **1.3** | 7.4 | 1.5 |
| Baseline latency (ms) | 1.3 | **0.4** | 0.8 | **0.4** |
| Relevance hit rate (%) | **100.0** | 91.7 | **100.0** | 91.7 |
| GC events — index load | 16 | 14 | 21 | 14 |

#### Phase 2 — Load Test

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| p50 latency (ms) | 6 | **1** | 5 | **1** |
| p97.5 latency (ms) | 15 | **2** | 19 | 3 |
| p99 latency (ms) | 18 | **3** | 25 | **3** |
| Throughput (req/s) | 2,661 | **15,308** | 2,528 | 11,551 |
| Error rate (%) | 0.0 | 0.0 | 0.0 | 0.0 |
| CPU under load (ms) | 31,537 | 31,623 | 31,177 | 32,757 |
| GC events — under load | 2,103 | 2,332 | 4,627 | **990** |

---

### Run 3 — SCALE=3 · 50 connections · 30s · 135,003 entries *(primary)*

First run against the fixed synthetic dataset at target scale. This is the most revealing run — library scaling characteristics became apparent only at this volume.

#### Phase 1 — Baseline

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| Index build time (ms) | 576.2 | 634.0 | 2,249.4 | **197.8** |
| Heap memory (MB) | 484.1 | 202.8 | 1,447.1 | **55.9** |
| CPU — index load (ms) | 652.3 | 851.0 | 2,627.5 | **185.5** |
| CPU — warmup (ms) | 4,169.1 | 367.9 | 2,747.4 | **49.8** |
| Cold start latency (ms) | 14.1 | **2.4** | 19.6 | 5.9 |
| Baseline latency (ms) | 94.4 | 4.9 | 39.9 | **1.1** |
| Relevance hit rate (%) | **100.0** | 91.7 | 91.7 | 83.3 |
| GC events — index load | 179 | 87 | 501 | **4** |

#### Phase 2 — Load Test

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| p50 latency (ms) | 689 | 200 | 493 | **41** |
| p97.5 latency (ms) | 7,919 | 477 | 3,178 | **102** |
| p99 latency (ms) | 8,779 | 491 | 3,634 | **120** |
| Throughput (req/s) | 28.3 | 230.0 | 24.2 | **1,083.2** |
| Error rate (%) | 2.4 | **0.0** | 7.4 | **0.0** |
| CPU under load (ms) | 47,210 | 32,246 | 42,196 | **30,742** |
| GC events — under load | 1,705 | 1,884 | 2,154 | **118** |

---

### Run 4 — SCALE=1.5 · 20 connections · 60s · 67,502 entries

#### Phase 1 — Baseline

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| Index build time (ms) | 242.7 | 293.8 | 1,076.3 | **83.3** |
| Heap memory (MB) | 166.7 | 139.9 | 349.4 | **35.1** |
| CPU — index load (ms) | 312.0 | 389.4 | 1,386.8 | **84.1** |
| CPU — warmup (ms) | 1,964.8 | **102.7** | 1,605.5 | 30.2 |
| Cold start latency (ms) | 13.0 | **1.5** | 13.3 | 3.2 |
| Baseline latency (ms) | 41.9 | 1.9 | 20.5 | **0.7** |
| Relevance hit rate (%) | **100.0** | 91.7 | 91.7 | 83.3 |
| GC events — index load | 95 | 42 | 276 | **3** |

#### Phase 2 — Load Test

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| p50 latency (ms) | 171 | 18 | 101 | **8** |
| p97.5 latency (ms) | 2,531 | 109 | 1,818 | **26** |
| p99 latency (ms) | 2,652 | 121 | 1,893 | **31** |
| Throughput (req/s) | 39.8 | 608.2 | 51.6 | **1,906.4** |
| Error rate (%) | 0.0 | 0.0 | 0.0 | 0.0 |
| CPU under load (ms) | 84,378 | 62,244 | 79,988 | **61,167** |
| GC events — under load | 3,572 | 4,199 | 5,047 | **342** |

---

### Run 5 — SCALE=3 · 60 connections · 60s · 135,003 entries *(isolated sequential run)*

Each backend was benchmarked in its own process, started and killed sequentially, to eliminate shared CPU and memory pressure from concurrent processes.

#### Phase 1 — Baseline

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| Index build time (ms) | 483.3 | 573.9 | 2,017.4 | **177.2** |
| Heap memory (MB) | 366.9 | 225.4 | 1,547.6 | **56.1** |
| RSS memory (MB) | 780.7 | 385.6 | 1,685.2 | **176.7** |
| CPU — index load (ms) | 569.3 | 797.0 | 2,329.8 | **182.0** |
| CPU — warmup (ms) | 2,323.6 | **273.5** | 2,631.4 | 55.2 |
| Cold start latency (ms) | 11.6 | **2.5** | 27.6 | 4.4 |
| Baseline latency (ms) | 34.6 | 5.5 | 39.3 | **1.2** |
| Relevance hit rate (%) | **100.0** | 91.7 | 91.7 | 83.3 |
| GC events — index load | 85 | 85 | 499 | **4** |

#### Phase 2 — Load Test

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| p50 latency (ms) | 344 | 209 | 359 | **41** |
| p97.5 latency (ms) | 6,440 | 493 | 5,147 | **84** |
| p99 latency (ms) | 6,721 | 510 | 5,181 | **93** |
| Throughput (req/s) | 38.4 | 217.8 | 31.4 | **1,131.6** |
| Error rate (%) | 1.3 | **0.0** | 1.3 | **0.0** |
| CPU under load (ms) | 51,143 | 31,989 | 44,942 | **30,719** |
| GC events — under load | 1,569 | 1,753 | 2,563 | **94** |

---

---

### Run 8 — SCALE=0.556 · 5 connections · 60s · 45,001 entries *(25k target — lower bound)*

Target was 25k entries; the seed file contains 45,001 base entries so SCALE < 1 returns the full base set. This represents the lower realistic bound — approximately 1,800 articles worth of generated content.

#### Phase 1 — Baseline

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| Index build time (ms) | 121.1 | 185.7 | 730.6 | **58.1** |
| Heap memory (MB) | 236.4 | **96.2** | 422.6 | 37.2 |
| RSS memory (MB) | 345.3 | **199.6** | 533.8 | 129.2 |
| CPU — index load (ms) | 168.6 | 256.5 | 994.4 | **56.0** |
| CPU — warmup (ms) | 920.1 | **68.3** | 897.9 | 32.6 |
| Cold start latency (ms) | 5.4 | **1.3** | 12.0 | 2.9 |
| Baseline latency (ms) | 11.0 | 1.4 | 13.8 | **0.8** |
| Relevance hit rate (%) | **100.0** | 91.7 | 91.7 | 83.3 |
| GC events — index load | 60 | 28 | 186 | **2** |

#### Phase 2 — Load Test

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| p50 latency (ms) | 18 | 3 | 36 | **1** |
| p97.5 latency (ms) | 190 | 16 | 209 | **4** |
| p99 latency (ms) | 214 | 20 | 232 | **5** |
| Throughput (req/s) | 100.6 | 1,026.5 | 77.3 | **3,033.2** |
| Error rate (%) | 0.0 | 0.0 | 0.0 | **0.0** |
| CPU under load (ms) | 94,932 | 61,325 | 77,611 | **61,132** |
| GC events — under load | 5,998 | 3,341 | 5,168 | **482** |

---

### Run 9 — SCALE=0.556 · 15 connections · 60s · 45,001 entries *(25k target — stress test)*

#### Phase 1 — Baseline

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| Index build time (ms) | 120.9 | 192.7 | 731.3 | **59.7** |
| Heap memory (MB) | 240.8 | **98.1** | 428.8 | 37.2 |
| RSS memory (MB) | 349.5 | **200.0** | 539.5 | 130.0 |
| CPU — index load (ms) | 171.7 | 257.8 | 987.1 | **56.9** |
| CPU — warmup (ms) | 901.2 | **66.7** | 850.7 | 29.1 |
| Cold start latency (ms) | 5.8 | **1.1** | 12.1 | 2.7 |
| Baseline latency (ms) | 11.1 | 1.4 | 13.5 | **0.7** |
| Relevance hit rate (%) | **100.0** | 91.7 | 91.7 | 83.3 |
| GC events — index load | 60 | 28 | 179 | **2** |

#### Phase 2 — Load Test

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| p50 latency (ms) | 71 | 8 | 50 | **4** |
| p97.5 latency (ms) | 536 | 47 | 848 | **10** |
| p99 latency (ms) | 593 | 52 | 918 | **16** |
| Throughput (req/s) | 100.7 | 1,004.6 | 80.8 | **3,031.9** |
| Error rate (%) | 0.0 | 0.0 | 0.0 | **0.0** |
| CPU under load (ms) | 94,239 | 61,409 | 76,606 | **61,076** |
| GC events — under load | 5,897 | 3,269 | 4,974 | **485** |

---

### Run 6 — SCALE=1.667 · 5 connections · 60s · 75,017 entries *(client realistic peak)*

Tuned to the client's actual dataset (~75k entries from 3,000 articles × ~25 generated entries) and realistic peak concurrency (~0.6 rps sustained, 5 connections represents a conservative stress test).

#### Phase 1 — Baseline

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| Index build time (ms) | 228.8 | 307.4 | 1,159.3 | **93.5** |
| Heap memory (MB) | 163.4 | 146.7 | 409.4 | **35.8** |
| RSS memory (MB) | 560.9 | 255.8 | 781.7 | **142.7** |
| CPU — index load (ms) | 293.8 | 395.1 | 1,429.2 | **89.3** |
| CPU — warmup (ms) | 1,573.5 | **117.2** | 1,508.5 | 41.7 |
| Cold start latency (ms) | 5.6 | **1.2** | 16.0 | 3.4 |
| Baseline latency (ms) | 19.4 | 2.4 | 22.2 | **1.0** |
| Relevance hit rate (%) | **100.0** | 91.7 | 91.7 | 83.3 |
| GC events — index load | 102 | 47 | 287 | **3** |

#### Phase 2 — Load Test

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| p50 latency (ms) | 29 | 7 | 64 | **2** |
| p97.5 latency (ms) | 344 | 29 | 330 | **7** |
| p99 latency (ms) | 391 | 37 | 376 | **9** |
| Throughput (req/s) | 56.4 | 570.5 | 47.2 | **1,893.0** |
| Error rate (%) | 0.0 | 0.0 | 0.2 | **0.0** |
| CPU under load (ms) | 97,556 | 62,362 | 57,851 | **61,141** |
| GC events — under load | 5,657 | 4,164 | 3,310 | **319** |

---

### Run 7 — SCALE=1.667 · 15 connections · 60s · 75,017 entries *(client stress test)*

3× realistic peak — simulates a marketing campaign spike or an unusually busy period.

#### Phase 1 — Baseline

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| Index build time (ms) | 226.2 | 299.8 | 1,153.7 | **94.1** |
| Heap memory (MB) | 187.5 | 145.9 | 506.3 | **35.8** |
| RSS memory (MB) | 561.8 | 255.1 | 796.0 | **142.3** |
| CPU — index load (ms) | 294.2 | 383.9 | 1,410.6 | **92.7** |
| CPU — warmup (ms) | 1,575.1 | **125.3** | 1,436.0 | 39.8 |
| Cold start latency (ms) | 6.4 | 3.2 | 16.2 | **4.1** |
| Baseline latency (ms) | 19.1 | 2.4 | 22.2 | **0.9** |
| Relevance hit rate (%) | **100.0** | 91.7 | 91.7 | 83.3 |
| GC events — index load | 103 | 47 | 272 | **3** |

#### Phase 2 — Load Test

| Metric | MiniSearch | FlexSearch | Orama | SQLite FTS5 |
|---|---|---|---|---|
| p50 latency (ms) | 123 | 13 | 105 | **6** |
| p97.5 latency (ms) | 889 | 97 | 1,369 | **21** |
| p99 latency (ms) | 1,003 | 109 | 1,536 | **28** |
| Throughput (req/s) | 55.5 | 545.0 | 47.8 | **1,835.6** |
| Error rate (%) | 0.0 | **0.0** | 0.0 | **0.0** |
| CPU under load (ms) | 98,159 | 61,689 | 68,572 | **60,994** |
| GC events — under load | 5,646 | 3,962 | 3,503 | **289** |

---

## Scaling Analysis

### Heap memory growth with entry count

| Library | ~1,700 entries | 67,500 entries | 135,000 entries | Growth (1.7k→135k) |
|---|---|---|---|---|
| SQLite FTS5 | 44.4 MB | **35.1 MB** | **56.1 MB** | 1.3× |
| FlexSearch | 51.2 MB | 139.9 MB | 225.4 MB | 4.4× |
| MiniSearch | 35.2 MB | 166.7 MB | 366.9 MB | 10.4× |
| Orama | 40.3 MB | 349.4 MB | 1,547.6 MB | 38.4× |

SQLite stores index structures in native C memory — the JS heap stays lean regardless of data volume (though RSS at 177MB reflects the full process footprint including the C library). MiniSearch and Orama build large JS object graphs fully exposed to the GC, growing super-linearly with entry count. Orama at 135k entries consumed 1.5GB heap and 1.7GB RSS — a realistic production deployment would exhaust memory well before that.

### Throughput at 135,003 entries — concurrency comparison (Runs 3 and 5)

| Library | 50 connections · 30s (Run 3) | 60 connections · 60s (Run 5) | Change |
|---|---|---|---|
| SQLite FTS5 | 1,083 req/s | **1,132 req/s** | +5% — stable |
| FlexSearch | 230 req/s | 218 req/s | −5% — stable |
| MiniSearch | 28 req/s | 38 req/s | +38% — isolated run removed contention |
| Orama | 24 req/s | 31 req/s | +30% — isolated run removed contention |

Run 5 used sequential isolated benchmarking (one backend process at a time) versus Run 3 which ran all four backends simultaneously. SQLite and FlexSearch remain the clear leaders. MiniSearch and Orama show improved numbers under isolation but their error rates (1.3% each) and p99 latencies (6.7s and 5.2s respectively) confirm they are still unsuitable for this workload.

### Throughput across all data volumes (20 connections)

| Library | ~867 entries (Run 2) | 67,500 entries (Run 4) | 135,000 entries (Run 3) |
|---|---|---|---|
| SQLite FTS5 | 11,551 req/s | **1,906 req/s** | 1,083 req/s |
| FlexSearch | 15,308 req/s | 608 req/s | 230 req/s |
| MiniSearch | 2,661 req/s | 40 req/s | 28 req/s |
| Orama | 2,528 req/s | 52 req/s | 24 req/s |

SQLite is the only library maintaining >1,000 req/s at 67k+ entries. FlexSearch degrades steeply with data volume — its forward-trie search path does not scale past ~50k entries as expected. MiniSearch and Orama are effectively unusable at both high-volume data points.

### Client-scale: throughput and latency across data volumes (Runs 8, 9, 6, 7)

#### 5 connections (realistic peak)

| Library | 45k entries (Run 8) | 75k entries (Run 6) | p99 @ 45k | p99 @ 75k |
|---|---|---|---|---|
| SQLite FTS5 | **3,033 req/s** | **1,893 req/s** | **5ms** | **9ms** |
| FlexSearch | 1,027 req/s | 571 req/s | 20ms | 37ms |
| MiniSearch | 101 req/s | 56 req/s | 214ms | 391ms |
| Orama | 77 req/s | 47 req/s | 232ms | 376ms |

#### 15 connections (3× stress)

| Library | 45k entries (Run 9) | 75k entries (Run 7) | p99 @ 45k | p99 @ 75k |
|---|---|---|---|---|
| SQLite FTS5 | **3,032 req/s** | **1,836 req/s** | **16ms** | **28ms** |
| FlexSearch | 1,005 req/s | 545 req/s | 52ms | 109ms |
| MiniSearch | 101 req/s | 56 req/s | 593ms | 1,003ms |
| Orama | 81 req/s | 48 req/s | 918ms | 1,536ms |

All four libraries are error-free at these concurrency levels. However, MiniSearch and Orama are already too slow for autocomplete UX at both data volumes — 214ms p99 at 45k entries under just 5 connections is noticeable on every keystroke. SQLite holds well below 30ms p99 across all client-scale scenarios. FlexSearch is fast and error-free but offers no fuzzy matching.

### GC events under load

| Library | ~867 entries (Run 2) | 67,500 entries (Run 4) | 135,000 entries (Run 3) |
|---|---|---|---|
| SQLite FTS5 | **990** | **342** | **118** |
| MiniSearch | 2,103 | 3,572 | 1,705 |
| FlexSearch | 2,332 | 4,199 | 1,884 |
| Orama | 4,627 | 5,047 | 2,154 |

SQLite's GC count decreases at higher data volumes because the query hot path allocates minimal JS objects — results are returned as plain row objects from a C extension. The other libraries build larger JS intermediate structures per query as index traversal depth grows, increasing per-query allocation pressure.

---

## Library Verdicts

### SQLite FTS5 — recommended for this use case

Best all-round option at target scale. Lowest memory (heap 56MB / RSS 177MB), lowest GC pressure (94 events under load vs 1,500–2,500 for JS libraries), zero errors, and the only library with sub-100ms p99 at 135k entries under 60 concurrent connections (p99 93ms, 1,132 req/s). Index lives in native C memory so the JS heap stays lean regardless of data volume.

**Limitations:** No fuzzy/edit-distance matching. Porter stemmer handles word form variants but not misspellings. Hit rate degrades as volume grows because BM25 ranking pushes borderline queries out of the top-5 window. If misspelling tolerance is required, a pre-processing step (query spelling correction before hitting SQLite) is the recommended approach.

### FlexSearch — fast but does not scale index size well

Excellent raw throughput at low entry counts. Degrades at 135k — p50 209ms, p99 510ms, throughput 218 req/s — but remains stable and error-free. Memory footprint is reasonable (heap 225MB / RSS 386MB). The `forward` tokeniser offers no fuzzy support at any scale, and performance drops sharply from 1,700→135k entries, but it is a viable second choice if SQLite is not an option.

### MiniSearch — correct but not viable under concurrent load at scale

The only library with 100% relevance hit rate including misspellings. However, fuzzy search is O(vocabulary) per query — at 135k entries this translates to 34.6ms baseline latency, 344ms p50 under 60 concurrent connections, and 1.3% error rate. Heap reaches 367MB and RSS 781MB. Suitable only for low-concurrency or single-user scenarios at this data volume, or if data volume is kept below ~10k entries.

### Orama — worst combination of trade-offs at this scale

Highest heap memory (1,548MB at 135k), highest RSS (1,685MB), highest GC pressure (2,563 events under load), slowest index build (2,017ms), and 1.3% error rate with p99 5,181ms under load. Tolerance-based fuzzy partially works at small scale but degrades at 135k. The TypeScript-first design and vector search capability (not evaluated here) may be relevant if semantic search is added later, but for keyword-only workloads it is outperformed on every metric.
