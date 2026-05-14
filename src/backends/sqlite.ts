import Database from 'better-sqlite3'
import type { Entry, SearchBackend } from '../types.js'

export class SqliteBackend implements SearchBackend {
  private db: Database.Database | null = null

  async load(entries: Entry[]): Promise<void> {
    this.db = new Database(':memory:')
    this.db.exec(`
      CREATE VIRTUAL TABLE entries USING fts5(
        id UNINDEXED,
        text,
        type UNINDEXED,
        source UNINDEXED,
        tokenize='porter unicode61'
      )
    `)
    const stmt = this.db.prepare('INSERT INTO entries VALUES (?, ?, ?, ?)')
    const insertMany = this.db.transaction((rows: Entry[]) => {
      for (const row of rows) stmt.run(row.id, row.text, row.type, row.source)
    })
    insertMany(entries)
  }

  async query(q: string, limit = 10): Promise<Entry[]> {
    if (!this.db || !q.trim()) return []
    const term = `${q.trim().replace(/"/g, '""')}*`
    try {
      return this.db
        .prepare('SELECT id, text, type, source FROM entries WHERE entries MATCH ? ORDER BY rank LIMIT ?')
        .all(term, limit) as Entry[]
    } catch {
      return []
    }
  }
}
