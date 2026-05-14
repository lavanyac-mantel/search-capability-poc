import FlexSearch from 'flexsearch'
import type { Entry, SearchBackend } from '../types.js'

export class FlexSearchBackend implements SearchBackend {
  private index: FlexSearch.Document<Entry, string[]> | null = null
  private store: Map<string, Entry> = new Map()

  async load(entries: Entry[]): Promise<void> {
    this.store = new Map(entries.map(e => [e.id, e]))
    this.index = new FlexSearch.Document<Entry, string[]>({
      tokenize: 'forward',
      document: { id: 'id', index: ['text'] },
    })
    for (const entry of entries) {
      this.index.add(entry)
    }
  }

  async query(q: string, limit = 10): Promise<Entry[]> {
    if (!this.index || !q.trim()) return []
    const results = this.index.search(q, { limit, suggest: true })
    const ids = new Set<string>()
    for (const field of results) {
      for (const id of field.result as string[]) {
        ids.add(id)
        if (ids.size >= limit) break
      }
    }
    return Array.from(ids)
      .map(id => this.store.get(id))
      .filter((e): e is Entry => e !== undefined)
  }
}
