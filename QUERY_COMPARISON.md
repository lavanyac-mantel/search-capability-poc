# Search Library — Manual Query Comparison

**Date:** 2026-05-14
**Backends tested:** MiniSearch (3001) · FlexSearch (3002) · Orama (3003) · SQLite FTS5 (3004)
**Data volume:** 135,003 entries (SCALE=3)

Legend: ✅ returned results · ❌ no results · ⚠️ partial / degraded results

---

## Custom query — `renw driv`

Partial prefix with typo across both words.

| MiniSearch | FlexSearch | Orama | SQLite |
|---|---|---|---|
| ✅ | ✅ | ✅ | ❌ |

SQLite requires tokens to be valid prefix matches on stored stems. `renw` and `driv` are not prefixes of any indexed stem so nothing matches. The other three recover via fuzzy edit distance (MiniSearch, Orama) or prefix token fallback via `suggest:true` (FlexSearch).

---

## 4. Single character typo

### 4.1 — `renew+driver+licenve`

One character substituted in the last word.

| MiniSearch | FlexSearch | Orama | SQLite |
|---|---|---|---|
| ✅ | ✅ | ✅ | ❌ |

SQLite's stored stem for "licence" is `licenc`. The query term `licenve` stems to something that does not share a prefix with `licenc`, so no match. MiniSearch matches via 1-edit Levenshtein (within `fuzzy:0.2` budget for a 7-char word). FlexSearch recovers via `suggest:true` — drops `licenve`, matches on `renew` + `driver`. Orama matches via tolerance-based edit distance.

### 4.2 — `apply+for+vehicle+registraton`

One letter missing from the last word.

| MiniSearch | FlexSearch | Orama | SQLite |
|---|---|---|---|
| ✅ | ✅ | ❌ | ❌ |

Both Orama and SQLite returned nothing. SQLite fails because `registraton` is not a valid prefix of the stem for "registration". Orama's tolerance-based matching (tolerance: 1) also could not recover here — likely the edit distance between `registraton` and the indexed stem exceeds its threshold.

---

## 5. Multi-character typo

### 5.1 — `apply+for+birth+certificat`

Truncated word — last two characters missing.

| MiniSearch | FlexSearch | Orama | SQLite |
|---|---|---|---|
| ✅ | ✅ | ✅ | ❌ |

SQLite returned nothing. `certificat` is not a prefix of the Porter stem for "certificate". The other libraries recover — MiniSearch via fuzzy, FlexSearch via `suggest:true` fallback on the valid words, Orama via edit-distance tolerance.

### 5.2 — `renew+drvier+licence`

Transposed characters in the middle word.

| MiniSearch | FlexSearch | Orama | SQLite |
|---|---|---|---|
| ✅ | ✅ | ❌ | ❌ |

Both Orama and SQLite returned nothing. `drvier` is not a prefix of the stem for "driver" in either engine, and Orama's tolerance threshold was not enough to recover a transposition.

---

## 6. Suggest fallback — `renew+driver+licenve`

Testing whether engines fall back to valid words when one word is unrecognised.

| MiniSearch | FlexSearch | Orama | SQLite |
|---|---|---|---|
| ✅ | ✅ | ✅ | ❌ |

SQLite has no fallback mechanism — a failed MATCH returns nothing. FlexSearch's `suggest:true` explicitly drops unrecognised words and matches on the remainder. MiniSearch and Orama recover the typo directly via edit distance.

---

## 7. Natural language — `how+do+I+renew+my+driver+licence`

| MiniSearch | FlexSearch | Orama | SQLite |
|---|---|---|---|
| ✅ multiple results | ✅ multiple results | ⚠️ one result | ⚠️ one result |

Orama and SQLite both returned only: `"How do I check the status of my renew driver licence?"` — missing other closely related results that MiniSearch and FlexSearch surfaced (e.g. `"How do I check the status of my apply for driver licence?"`).

SQLite's BM25 ranking is heavily influenced by stop words. Common words like `how`, `do`, `I`, `my` are low-IDF tokens that add noise to ranking at this data volume. With 135k entries the BM25 scorer is penalising these high-frequency terms and the top-ranked result becomes a near-literal match rather than a semantically relevant one. MiniSearch and FlexSearch are less sensitive to this at the query level.

---

## 8. Single keyword (broad) — `licence`

All four libraries returned the same results in the same order.

---

## Summary

| Scenario | MiniSearch | FlexSearch | Orama | SQLite |
|---|---|---|---|---|
| Exact match | ✅ | ✅ | ✅ | ✅ |
| Prefix partial word | ✅ | ✅ | ✅ | ✅ |
| Word form variants (stemming) | ❌ | ❌ | ❌ | ✅ |
| Single char typo | ✅ | ✅ (suggest) | ✅ | ❌ |
| Missing letter | ✅ | ✅ (suggest) | ❌ | ❌ |
| Transposed characters | ✅ | ✅ (suggest) | ❌ | ❌ |
| Truncated word | ✅ | ✅ (suggest) | ✅ | ❌ |
| Natural language | ✅ | ✅ | ⚠️ | ⚠️ |
| Single broad keyword | ✅ | ✅ | ✅ | ✅ |

**Key takeaway:** SQLite FTS5 wins on throughput and memory at scale but has zero tolerance for misspellings or typos — any character-level error that breaks the stem prefix match returns nothing. MiniSearch handles every typo scenario correctly but is unviable under concurrent load at 135k entries. FlexSearch recovers from typos indirectly via `suggest:true` (drops the bad word, matches on the rest) rather than correcting the typo itself. Orama sits in between but failed more typo cases than expected.
