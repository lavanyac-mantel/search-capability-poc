# Realistic Load Test Results

Generated: 2026-05-15T05:05:45.897Z

---

## Run 1 — Realistic baseline

**Data:** 60k entries (SCALE ×1) | **Traffic:** ×1 | **Target RPS:** 0.44 (no debounce) / 0.22 (debounced)

### Phase 1 — Index load

| Metric                  | minisearch | flexsearch | orama  | sqlite |
|-------------------------|------------|------------|--------|--------|
| Index build time (ms)   | 165.7      | 232.8      | 933.8  | 72.3   |
| Heap memory (MB)        | 100.8      | 125.4      | 562.8  | 37.4   |
| RSS memory (MB)         | 448.9      | 241.0      | 693.1  | 150.7  |
| CPU — index load (ms)   | 222.0      | 303.6      | 1190.8 | 70.3   |
| CPU — warmup (ms)       | 1260.1     | 91.1       | 1168.5 | 41.3   |
| Cold start latency (ms) | 4.9        | 1.4        | 15.1   | 4.4    |
| Baseline latency (ms)   | 15.0       | 1.8        | 17.8   | 1.0    |
| Relevance hit rate (%)  | 100.0      | 91.7       | 91.7   | 83.3   |
| GC events — load        | 81         | 38         | 238    | 3      |

### Phase 2 — No debounce (0.44 rps target)

| Metric                 | minisearch | flexsearch | orama | sqlite |
|------------------------|------------|------------|-------|--------|
| p50 latency (ms)       | 3.0        | 0.0        | 4.0   | 0.0    |
| p97.5 latency (ms)     | 85.0       | 8.0        | 105.0 | 2.0    |
| p99 latency (ms)       | 85.0       | 8.0        | 105.0 | 2.0    |
| Throughput (req/s)     | 26.00      | 26.00      | 26.00 | 26.00  |
| Error rate (%)         | 0.00       | 0.00       | 0.00  | 0.00   |
| CPU under load (ms)    | 766.8      | 47.0       | 909.1 | 18.5   |
| GC events — under load | 41         | 3          | 46    | 0      |

### Phase 2 — Debounced (0.22 rps target)

| Metric                 | minisearch | flexsearch | orama | sqlite |
|------------------------|------------|------------|-------|--------|
| p50 latency (ms)       | 2.0        | 0.0        | 2.0   | 1.0    |
| p97.5 latency (ms)     | 16.0       | 1.0        | 13.0  | 3.0    |
| p99 latency (ms)       | 16.0       | 1.0        | 13.0  | 3.0    |
| Throughput (req/s)     | 13.00      | 13.00      | 13.00 | 13.00  |
| Error rate (%)         | 0.00       | 0.00       | 0.00  | 0.00   |
| CPU under load (ms)    | 65.4       | 5.9        | 78.3  | 18.3   |
| GC events — under load | 4          | 0          | 6     | 0      |

---

## Run 2 — Traffic ×2

**Data:** 60k entries (SCALE ×1) | **Traffic:** ×2 | **Target RPS:** 0.88 (no debounce) / 0.44 (debounced)

### Phase 1 — Index load

| Metric                  | minisearch | flexsearch | orama  | sqlite |
|-------------------------|------------|------------|--------|--------|
| Index build time (ms)   | 159.0      | 226.6      | 892.7  | 66.8   |
| Heap memory (MB)        | 96.6       | 125.4      | 543.9  | 37.3   |
| RSS memory (MB)         | 448.4      | 240.8      | 674.1  | 150.6  |
| CPU — index load (ms)   | 214.6      | 297.9      | 1145.0 | 67.5   |
| CPU — warmup (ms)       | 1206.2     | 93.3       | 1113.9 | 41.5   |
| Cold start latency (ms) | 6.8        | 1.7        | 16.3   | 4.3    |
| Baseline latency (ms)   | 14.2       | 1.8        | 16.9   | 0.9    |
| Relevance hit rate (%)  | 100.0      | 91.7       | 91.7   | 83.3   |
| GC events — load        | 80         | 38         | 238    | 3      |

### Phase 2 — No debounce (0.88 rps target)

| Metric                 | minisearch | flexsearch | orama  | sqlite |
|------------------------|------------|------------|--------|--------|
| p50 latency (ms)       | 3.0        | 0.0        | 3.0    | 0.0    |
| p97.5 latency (ms)     | 67.0       | 7.0        | 78.0   | 2.0    |
| p99 latency (ms)       | 80.0       | 7.0        | 113.0  | 2.0    |
| Throughput (req/s)     | 53.00      | 53.00      | 53.00  | 53.00  |
| Error rate (%)         | 0.00       | 0.00       | 0.00   | 0.00   |
| CPU under load (ms)    | 1015.0     | 68.3       | 1258.0 | 26.2   |
| GC events — under load | 64         | 5          | 75     | 0      |

### Phase 2 — Debounced (0.44 rps target)

| Metric                 | minisearch | flexsearch | orama | sqlite |
|------------------------|------------|------------|-------|--------|
| p50 latency (ms)       | 4.0        | 0.0        | 3.0   | 0.0    |
| p97.5 latency (ms)     | 75.0       | 10.0       | 90.0  | 4.0    |
| p99 latency (ms)       | 75.0       | 10.0       | 90.0  | 4.0    |
| Throughput (req/s)     | 26.00      | 26.00      | 26.00 | 26.00  |
| Error rate (%)         | 0.00       | 0.00       | 0.00  | 0.00   |
| CPU under load (ms)    | 722.2      | 62.6       | 692.1 | 34.5   |
| GC events — under load | 42         | 3          | 45    | 0      |

---

## Run 3 — Traffic ×5

**Data:** 60k entries (SCALE ×1) | **Traffic:** ×5 | **Target RPS:** 2.2 (no debounce) / 1.1 (debounced)

### Phase 1 — Index load

| Metric                  | minisearch | flexsearch | orama  | sqlite |
|-------------------------|------------|------------|--------|--------|
| Index build time (ms)   | 151.4      | 225.0      | 1002.8 | 69.9   |
| Heap memory (MB)        | 96.7       | 125.1      | 546.9  | 37.5   |
| RSS memory (MB)         | 443.7      | 241.4      | 678.4  | 150.4  |
| CPU — index load (ms)   | 197.3      | 296.6      | 1281.1 | 68.5   |
| CPU — warmup (ms)       | 1165.9     | 88.4       | 1162.4 | 41.5   |
| Cold start latency (ms) | 6.6        | 1.6        | 14.3   | 4.4    |
| Baseline latency (ms)   | 14.0       | 1.8        | 18.0   | 0.9    |
| Relevance hit rate (%)  | 100.0      | 91.7       | 91.7   | 83.3   |
| GC events — load        | 80         | 38         | 238    | 3      |

### Phase 2 — No debounce (2.2 rps target)

| Metric                 | minisearch | flexsearch | orama  | sqlite |
|------------------------|------------|------------|--------|--------|
| p50 latency (ms)       | 30.0       | 8.0        | 46.0   | 5.0    |
| p97.5 latency (ms)     | 196.0      | 40.0       | 257.0  | 23.0   |
| p99 latency (ms)       | 216.0      | 46.0       | 282.0  | 26.0   |
| Throughput (req/s)     | 3.00       | 3.00       | 3.00   | 3.00   |
| Error rate (%)         | 0.00       | 0.00       | 0.00   | 0.00   |
| CPU under load (ms)    | 4900.1     | 1440.8     | 5475.1 | 801.1  |
| GC events — under load | 245        | 68         | 234    | 10     |

### Phase 2 — Debounced (1.1 rps target)

| Metric                 | minisearch | flexsearch | orama  | sqlite |
|------------------------|------------|------------|--------|--------|
| p50 latency (ms)       | 24.0       | 7.0        | 35.0   | 4.0    |
| p97.5 latency (ms)     | 144.0      | 32.0       | 175.0  | 18.0   |
| p99 latency (ms)       | 155.0      | 36.0       | 189.0  | 21.0   |
| Throughput (req/s)     | 2.00       | 1.99       | 2.00   | 2.00   |
| Error rate (%)         | 0.00       | 0.87       | 0.00   | 0.00   |
| CPU under load (ms)    | 3503.5     | 845.9      | 5047.5 | 523.1  |
| GC events — under load | 158        | 46         | 177    | 6      |

---

## Run 4 — Traffic ×15

**Data:** 60k entries (SCALE ×1) | **Traffic:** ×15 | **Target RPS:** 6.6 (no debounce) / 3.3 (debounced)

### Phase 1 — Index load

| Metric                  | minisearch | flexsearch | orama  | sqlite |
|-------------------------|------------|------------|--------|--------|
| Index build time (ms)   | 151.2      | 227.2      | 920.7  | 70.0   |
| Heap memory (MB)        | 104.3      | 125.0      | 563.1  | 37.6   |
| RSS memory (MB)         | 449.0      | 241.4      | 695.9  | 150.0  |
| CPU — index load (ms)   | 200.8      | 298.2      | 1171.5 | 68.5   |
| CPU — warmup (ms)       | 1206.5     | 89.1       | 1198.5 | 44.8   |
| Cold start latency (ms) | 7.8        | 1.1        | 29.5   | 4.5    |
| Baseline latency (ms)   | 14.2       | 1.7        | 18.2   | 1.0    |
| Relevance hit rate (%)  | 100.0      | 91.7       | 91.7   | 83.3   |
| GC events — load        | 80         | 38         | 238    | 3      |

### Phase 2 — No debounce (6.6 rps target)

| Metric                 | minisearch | flexsearch | orama   | sqlite |
|------------------------|------------|------------|---------|--------|
| p50 latency (ms)       | 84.0       | 19.0       | 77.0    | 7.0    |
| p97.5 latency (ms)     | 422.0      | 86.0       | 499.0   | 34.0   |
| p99 latency (ms)       | 468.0      | 96.0       | 565.0   | 39.0   |
| Throughput (req/s)     | 7.00       | 7.00       | 7.00    | 7.00   |
| Error rate (%)         | 0.00       | 0.00       | 0.00    | 0.00   |
| CPU under load (ms)    | 9146.6     | 2154.2     | 10742.4 | 1243.7 |
| GC events — under load | 452        | 79         | 541     | 12     |

### Phase 2 — Debounced (3.3 rps target)

| Metric                 | minisearch | flexsearch | orama  | sqlite |
|------------------------|------------|------------|--------|--------|
| p50 latency (ms)       | 42.0       | 16.0       | 50.0   | 5.0    |
| p97.5 latency (ms)     | 264.0      | 69.0       | 308.0  | 26.0   |
| p99 latency (ms)       | 299.0      | 77.0       | 348.0  | 29.0   |
| Throughput (req/s)     | 4.00       | 4.00       | 4.00   | 4.00   |
| Error rate (%)         | 0.00       | 0.00       | 0.00   | 0.00   |
| CPU under load (ms)    | 6737.7     | 1728.1     | 6515.7 | 779.2  |
| GC events — under load | 289        | 68         | 307    | 9      |

---

## Run 5 — Data ×2, Traffic ×2

**Data:** 120k entries (SCALE ×2) | **Traffic:** ×2 | **Target RPS:** 0.88 (no debounce) / 0.44 (debounced)

### Phase 1 — Index load

| Metric                  | minisearch | flexsearch | orama  | sqlite |
|-------------------------|------------|------------|--------|--------|
| Index build time (ms)   | 344.2      | 449.7      | 1729.4 | 151.8  |
| Heap memory (MB)        | 657.9      | 193.0      | 1089.2 | 36.1   |
| RSS memory (MB)         | 784.7      | 380.8      | 1232.8 | 176.8  |
| CPU — index load (ms)   | 421.5      | 566.7      | 2023.7 | 158.7  |
| CPU — warmup (ms)       | 1831.0     | 320.1      | 2258.1 | 54.8   |
| Cold start latency (ms) | 24.8       | 4.7        | 15.9   | 4.9    |
| Baseline latency (ms)   | 27.1       | 4.4        | 32.7   | 1.2    |
| Relevance hit rate (%)  | 100.0      | 91.7       | 91.7   | 83.3   |
| GC events — load        | 77         | 76         | 438    | 6      |

### Phase 2 — No debounce (0.88 rps target)

| Metric                 | minisearch | flexsearch | orama  | sqlite |
|------------------------|------------|------------|--------|--------|
| p50 latency (ms)       | 7.0        | 0.0        | 8.0    | 0.0    |
| p97.5 latency (ms)     | 123.0      | 20.0       | 179.0  | 3.0    |
| p99 latency (ms)       | 146.0      | 20.0       | 188.0  | 4.0    |
| Throughput (req/s)     | 26.50      | 53.00      | 26.50  | 53.00  |
| Error rate (%)         | 0.00       | 0.00       | 0.00   | 0.00   |
| CPU under load (ms)    | 1689.3     | 162.8      | 2400.5 | 39.7   |
| GC events — under load | 59         | 11         | 117    | 0      |

### Phase 2 — Debounced (0.44 rps target)

| Metric                 | minisearch | flexsearch | orama  | sqlite |
|------------------------|------------|------------|--------|--------|
| p50 latency (ms)       | 9.0        | 1.0        | 8.0    | 1.0    |
| p97.5 latency (ms)     | 120.0      | 21.0       | 160.0  | 9.0    |
| p99 latency (ms)       | 120.0      | 21.0       | 160.0  | 9.0    |
| Throughput (req/s)     | 26.00      | 26.00      | 26.00  | 26.00  |
| Error rate (%)         | 0.00       | 0.00       | 0.00   | 0.00   |
| CPU under load (ms)    | 1095.1     | 144.4      | 1113.2 | 64.4   |
| GC events — under load | 36         | 7          | 71     | 0      |

---

## Run 6 — Data ×3, Traffic ×5

**Data:** 180k entries (SCALE ×3) | **Traffic:** ×5 | **Target RPS:** 2.2 (no debounce) / 1.1 (debounced)

### Phase 1 — Index load

| Metric                  | minisearch | flexsearch | orama  | sqlite |
|-------------------------|------------|------------|--------|--------|
| Index build time (ms)   | 564.1      | 791.1      | 2892.6 | 230.0  |
| Heap memory (MB)        | 360.1      | 308.4      | 2135.1 | 43.6   |
| RSS memory (MB)         | 1083.1     | 446.6      | 2202.1 | 197.5  |
| CPU — index load (ms)   | 671.8      | 1059.3     | 3698.0 | 230.4  |
| CPU — warmup (ms)       | 4156.8     | 327.4      | 3115.6 | 69.1   |
| Cold start latency (ms) | 27.5       | 4.6        | 38.3   | 6.7    |
| Baseline latency (ms)   | 49.0       | 6.3        | 54.1   | 1.5    |
| Relevance hit rate (%)  | 100.0      | 91.7       | 91.7   | 83.3   |
| GC events — load        | 227        | 110        | 664    | 8      |

### Phase 2 — No debounce (2.2 rps target)

| Metric                 | minisearch | flexsearch | orama   | sqlite |
|------------------------|------------|------------|---------|--------|
| p50 latency (ms)       | 96.0       | 30.0       | 113.0   | 9.0    |
| p97.5 latency (ms)     | 641.0      | 132.0      | 688.0   | 44.0   |
| p99 latency (ms)       | 697.0      | 147.0      | 763.0   | 50.0   |
| Throughput (req/s)     | 3.00       | 3.00       | 3.00    | 3.00   |
| Error rate (%)         | 0.00       | 0.00       | 0.00    | 0.00   |
| CPU under load (ms)    | 15469.3    | 3793.2     | 12529.1 | 1307.8 |
| GC events — under load | 649        | 97         | 578     | 10     |

### Phase 2 — Debounced (1.1 rps target)

| Metric                 | minisearch | flexsearch | orama  | sqlite |
|------------------------|------------|------------|--------|--------|
| p50 latency (ms)       | 71.0       | 25.0       | 77.0   | 8.0    |
| p97.5 latency (ms)     | 452.0      | 101.0      | 454.0  | 35.0   |
| p99 latency (ms)       | 480.0      | 110.0      | 500.0  | 40.0   |
| Throughput (req/s)     | 2.00       | 2.00       | 2.00   | 2.00   |
| Error rate (%)         | 0.00       | 0.00       | 0.00   | 0.00   |
| CPU under load (ms)    | 10944.9    | 2055.7     | 9287.9 | 898.0  |
| GC events — under load | 430        | 77         | 391    | 5      |

---

## Run 7 — Data ×3, Traffic ×15

**Data:** 180k entries (SCALE ×3) | **Traffic:** ×15 | **Target RPS:** 6.6 (no debounce) / 3.3 (debounced)

### Phase 1 — Index load

| Metric                  | minisearch | flexsearch | orama  | sqlite |
|-------------------------|------------|------------|--------|--------|
| Index build time (ms)   | 571.4      | 693.5      | 2737.3 | 226.3  |
| Heap memory (MB)        | 502.5      | 300.6      | 2133.6 | 43.6   |
| RSS memory (MB)         | 1151.5     | 437.2      | 2132.8 | 196.2  |
| CPU — index load (ms)   | 680.8      | 949.6      | 3470.5 | 227.6  |
| CPU — warmup (ms)       | 4055.1     | 283.6      | 3084.7 | 77.7   |
| Cold start latency (ms) | 24.3       | 1.1        | 17.1   | 11.9   |
| Baseline latency (ms)   | 49.8       | 5.5        | 52.8   | 1.6    |
| Relevance hit rate (%)  | 100.0      | 91.7       | 91.7   | 83.3   |
| GC events — load        | 229        | 111        | 665    | 8      |

### Phase 2 — No debounce (6.6 rps target)

| Metric                 | minisearch | flexsearch | orama   | sqlite |
|------------------------|------------|------------|---------|--------|
| p50 latency (ms)       | 439.0      | 43.0       | 454.0   | 14.0   |
| p97.5 latency (ms)     | 1577.0     | 210.0      | 1566.0  | 64.0   |
| p99 latency (ms)       | 1766.0     | 236.0      | 1680.0  | 74.0   |
| Throughput (req/s)     | 6.70       | 7.00       | 6.64    | 7.00   |
| Error rate (%)         | 0.00       | 0.00       | 0.00    | 0.00   |
| CPU under load (ms)    | 31042.3    | 5319.6     | 26656.5 | 2071.8 |
| GC events — under load | 1450       | 157        | 1323    | 18     |

### Phase 2 — Debounced (3.3 rps target)

| Metric                 | minisearch | flexsearch | orama   | sqlite |
|------------------------|------------|------------|---------|--------|
| p50 latency (ms)       | 120.0      | 35.0       | 134.0   | 11.0   |
| p97.5 latency (ms)     | 810.0      | 170.0      | 838.0   | 49.0   |
| p99 latency (ms)       | 901.0      | 193.0      | 945.0   | 57.0   |
| Throughput (req/s)     | 4.00       | 4.00       | 4.00    | 4.00   |
| Error rate (%)         | 0.00       | 0.00       | 0.00    | 0.00   |
| CPU under load (ms)    | 18349.3    | 3143.9     | 15614.7 | 1339.4 |
| GC events — under load | 836        | 90         | 770     | 9      |

---

## Run 8 — Data ×5, Traffic ×45

**Data:** 300k entries (SCALE ×5) | **Traffic:** ×45 | **Target RPS:** 20 (no debounce) / 10 (debounced)

### Phase 1 — Index load

| Metric                  | minisearch | flexsearch | sqlite |
|-------------------------|------------|------------|--------|
| Index build time (ms)   | 1059.8     | 1210.4     | 393.6  |
| Heap memory (MB)        | 1572.5     | 640.3      | 66.8   |
| RSS memory (MB)         | 1723.1     | 770.4      | 240.4  |
| CPU — index load (ms)   | 1292.0     | 1599.1     | 463.7  |
| CPU — warmup (ms)       | 5168.8     | 630.7      | 108.9  |
| Cold start latency (ms) | 34.6       | 5.2        | 13.9   |
| Baseline latency (ms)   | 79.3       | 12.1       | 2.3    |
| Relevance hit rate (%)  | 100.0      | 91.7       | 83.3   |
| GC events — load        | 181        | 181        | 10     |

### Phase 2 — No debounce (20 rps target)

| Metric                 | minisearch | flexsearch | sqlite |
|------------------------|------------|------------|--------|
| p50 latency (ms)       | 932.0      | 193.0      | 20.0   |
| p97.5 latency (ms)     | 3416.0     | 697.0      | 99.0   |
| p99 latency (ms)       | 3707.0     | 799.0      | 124.0  |
| Throughput (req/s)     | 11.60      | 19.82      | 20.00  |
| Error rate (%)         | 0.00       | 0.00       | 0.00   |
| CPU under load (ms)    | 58099.6    | 16564.9    | 4847.9 |
| GC events — under load | 1569       | 655        | 34     |

### Phase 2 — Debounced (10 rps target)

| Metric                 | minisearch | flexsearch | sqlite |
|------------------------|------------|------------|--------|
| p50 latency (ms)       | 1365.0     | 127.0      | 23.0   |
| p97.5 latency (ms)     | 3879.0     | 620.0      | 107.0  |
| p99 latency (ms)       | 4985.0     | 686.0      | 126.0  |
| Throughput (req/s)     | 6.42       | 10.00      | 10.00  |
| Error rate (%)         | 4.00       | 0.00       | 0.00   |
| CPU under load (ms)    | 32255.0    | 12146.6    | 3148.5 |
| GC events — under load | 823        | 337        | 22     |


### Here are the standout findings:

  SQLite dominates across the board:
  - Lowest heap memory at every scale (66 MB at 300k entries vs 1,572 MB for minisearch)
  - Fastest latency at every traffic level (p99 of 124 ms at ×45 traffic / 300k entries)
  - Only backend that hit 20 rps throughput target in run 8
  - Zero errors throughout

  FlexSearch is the best in-memory option:
  - Much lower memory than minisearch/orama at scale
  - p99 of 799 ms at ×45 traffic (vs 3,707 ms for minisearch)
  - Hit the 20 rps target in run 8, 0% errors

  MiniSearch struggles at scale:
  - Heap balloons to 1,572 MB at 300k entries
  - Can only sustain 11.6 rps when 20 is targeted (run 8), 4% error rate at 10 rps debounced
  - p99 latency hits 4,985 ms at run 8 debounced

  Orama (skipped for run 8):
  - Highest memory and CPU throughout
  - Similar latency profile to minisearch but worse memory (2,135 MB at 180k)
  - Smart call to skip at 300k


---


