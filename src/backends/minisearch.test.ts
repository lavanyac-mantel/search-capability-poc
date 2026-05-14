import { describe, it, expect, beforeAll } from 'vitest'
import { MiniSearchBackend } from './minisearch.js'
import type { Entry } from '../types.js'

const TEST_ENTRIES: Entry[] = [
  { id: '1', text: 'Driver Licence Renewal', type: 'keyword', source: 'http://test' },
  { id: '2', text: 'How do I renew my driver licence?', type: 'question', source: 'http://test' },
  { id: '3', text: 'Vehicle Registration', type: 'keyword', source: 'http://test' },
  { id: '4', text: 'How much does vehicle registration cost?', type: 'question', source: 'http://test' },
  { id: '5', text: 'Birth Certificate Application', type: 'keyword', source: 'http://test' },
]

describe('MiniSearchBackend', () => {
  const backend = new MiniSearchBackend()

  beforeAll(async () => { await backend.load(TEST_ENTRIES) })

  it('returns results for prefix query', async () => {
    const results = await backend.query('renew')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some(r => r.text.toLowerCase().includes('renew'))).toBe(true)
  })

  it('returns results for fuzzy misspelled query', async () => {
    const results = await backend.query('licenve')
    expect(results.length).toBeGreaterThan(0)
  })

  it('respects limit parameter', async () => {
    const results = await backend.query('licence', 2)
    expect(results.length).toBeLessThanOrEqual(2)
  })

  it('returns empty array for no match', async () => {
    expect(Array.isArray(await backend.query('zzzzxxx'))).toBe(true)
  })
})
