import MiniSearch from 'minisearch'
import type { Entry, SearchBackend } from '../types.js'

export class MiniSearchBackend implements SearchBackend {
  private index: MiniSearch<Entry> | null = null

  async load(entries: Entry[]): Promise<void> {
    this.index = new MiniSearch<Entry>({
      fields: ['text'],
      storeFields: ['id', 'text', 'type', 'source'],
      searchOptions: { prefix: true, fuzzy: 0.2 },
    })
    this.index.addAll(entries)
  }

  async query(q: string, limit = 10): Promise<Entry[]> {
    if (!this.index || !q.trim()) return []
    const results = this.index.search(q, { prefix: true, fuzzy: 0.2 })
    return results.slice(0, limit) as unknown as Entry[]
  }
}
