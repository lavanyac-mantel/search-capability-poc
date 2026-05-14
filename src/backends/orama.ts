import { create, insertMultiple, search } from '@orama/orama'
import type { Orama, TypedDocument } from '@orama/orama'
import type { Entry, SearchBackend } from '../types.js'

const schema = {
  id: 'string',
  text: 'string',
  type: 'string',
  source: 'string',
} as const

type OramaEntry = TypedDocument<Orama<typeof schema>>

export class OramaBackend implements SearchBackend {
  private db: Orama<typeof schema> | null = null

  async load(entries: Entry[]): Promise<void> {
    this.db = await create({ schema })
    await insertMultiple(this.db, entries as unknown as OramaEntry[])
  }

  async query(q: string, limit = 10): Promise<Entry[]> {
    if (!this.db || !q.trim()) return []
    const results = await search(this.db, { term: q, limit, tolerance: 1 })
    return results.hits.map(h => h.document as unknown as Entry)
  }
}
