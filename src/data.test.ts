import { describe, it, expect } from 'vitest'
import { parsePageEntries, scaleEntries, generateEntries } from './data.js'
import type { Entry } from './types.js'

describe('parsePageEntries', () => {
  it('extracts keyword and question entries from html', () => {
    const html = `
      <html><body>
        <h1>Driver Licence Renewal</h1>
        <h2>Required Documents</h2>
        <p>You need to bring your current licence and proof of address.</p>
        <h2>Fees</h2>
        <p>The renewal fee is $45.50 for a 5-year licence.</p>
      </body></html>
    `
    const entries = parsePageEntries(html, 'https://www.service.nsw.gov.au/driver-licence', 'Driver Licence Renewal')
    const keywords = entries.filter(e => e.type === 'keyword')
    const questions = entries.filter(e => e.type === 'question')

    expect(keywords.length).toBeGreaterThan(0)
    expect(questions.length).toBeGreaterThan(0)
    expect(keywords.some(e => e.text.toLowerCase().includes('driver licence'))).toBe(true)
    expect(entries.every(e => e.id.length > 0)).toBe(true)
    expect(entries.every(e => e.source === 'https://www.service.nsw.gov.au/driver-licence')).toBe(true)
  })
})

describe('scaleEntries', () => {
  it('scales entries to target count by repeating with unique ids', () => {
    const base: Entry[] = [
      { id: '1', text: 'test', type: 'keyword', source: 'http://example.com' },
    ]
    const scaled = scaleEntries(base, 3)
    expect(scaled.length).toBe(3)
    expect(new Set(scaled.map(e => e.id)).size).toBe(3)
  })

  it('returns base entries unchanged when scale is 1', () => {
    const base: Entry[] = [
      { id: '1', text: 'test', type: 'keyword', source: 'http://example.com' },
      { id: '2', text: 'test2', type: 'question', source: 'http://example.com' },
    ]
    expect(scaleEntries(base, 1)).toEqual(base)
  })

  it('handles fractional scale with unique ids', () => {
    const base: Entry[] = [
      { id: '1', text: 'a', type: 'keyword', source: 'http://example.com' },
      { id: '2', text: 'b', type: 'keyword', source: 'http://example.com' },
      { id: '3', text: 'c', type: 'keyword', source: 'http://example.com' },
      { id: '4', text: 'd', type: 'keyword', source: 'http://example.com' },
    ]
    const scaled = scaleEntries(base, 1.5)
    expect(scaled.length).toBe(6) // 4 base + 2 (50% of 4)
    expect(new Set(scaled.map(e => e.id)).size).toBe(6)
  })
})

describe('generateEntries', () => {
  it('produces one keyword and ten questions per topic/action pair', () => {
    const entries = generateEntries('driver licence', 'renew', 0)
    expect(entries.filter(e => e.type === 'keyword')).toHaveLength(1)
    expect(entries.filter(e => e.type === 'question')).toHaveLength(10)
  })

  it('produces unique ids across different indices', () => {
    const a = generateEntries('driver licence', 'renew', 0)
    const b = generateEntries('driver licence', 'renew', 1)
    const aIds = new Set(a.map(e => e.id))
    const bIds = new Set(b.map(e => e.id))
    for (const id of bIds) expect(aIds.has(id)).toBe(false)
  })

  it('keyword text is action + topic', () => {
    const entries = generateEntries('boat licence', 'apply for', 0)
    const kw = entries.find(e => e.type === 'keyword')!
    expect(kw.text.toLowerCase()).toContain('boat licence')
  })
})
