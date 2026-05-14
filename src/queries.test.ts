import { describe, it, expect } from 'vitest'
import { QUERIES, RELEVANCE_PAIRS } from './queries.js'

describe('queries', () => {
  it('has exactly 50 queries', () => {
    expect(QUERIES).toHaveLength(50)
  })

  it('each query is a non-empty string', () => {
    for (const q of QUERIES) {
      expect(typeof q).toBe('string')
      expect(q.trim().length).toBeGreaterThan(0)
    }
  })

  it('has at least 10 relevance pairs', () => {
    expect(RELEVANCE_PAIRS.length).toBeGreaterThanOrEqual(10)
  })

  it('each relevance pair has a query and expectedSubstring', () => {
    for (const pair of RELEVANCE_PAIRS) {
      expect(typeof pair.query).toBe('string')
      expect(typeof pair.expectedSubstring).toBe('string')
    }
  })
})
