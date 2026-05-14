import { readFileSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import * as cheerio from 'cheerio'
import type { Entry } from './types.js'

export { Entry }

const QUESTION_TEMPLATES = [
  (t: string) => `How do I ${t.toLowerCase()}?`,
  (t: string) => `What do I need for ${t.toLowerCase()}?`,
  (t: string) => `How long does ${t.toLowerCase()} take?`,
  (t: string) => `How much does ${t.toLowerCase()} cost?`,
  (t: string) => `Can I do ${t.toLowerCase()} online?`,
  (t: string) => `Where can I ${t.toLowerCase()}?`,
  (t: string) => `What documents do I need for ${t.toLowerCase()}?`,
  (t: string) => `Who is eligible for ${t.toLowerCase()}?`,
  (t: string) => `What are the requirements for ${t.toLowerCase()}?`,
  (t: string) => `How do I check the status of my ${t.toLowerCase()}?`,
]

export function stableId(namespace: string, suffix: string): string {
  return createHash('md5').update(`${namespace}::${suffix}`).digest('hex').slice(0, 12)
}

export function parsePageEntries(html: string, url: string, pageTitle: string): Entry[] {
  const $ = cheerio.load(html)
  const entries: Entry[] = []

  entries.push({ id: stableId(url, 'title'), text: pageTitle, type: 'keyword', source: url })

  $('h1, h2, h3').each((_, el) => {
    const heading = $(el).text().trim()
    if (!heading || heading.length < 3) return
    entries.push({ id: stableId(url, `h::${heading}`), text: heading, type: 'keyword', source: url })
  })

  for (const template of QUESTION_TEMPLATES) {
    const question = template(pageTitle)
    entries.push({ id: stableId(url, `q::${question}`), text: question, type: 'question', source: url })
  }

  $('h2, h3').each((_, el) => {
    const heading = $(el).text().trim()
    if (!heading || heading.length < 3) return
    entries.push({
      id: stableId(url, `qh1::${heading}`),
      text: `What is ${heading.toLowerCase()} for ${pageTitle.toLowerCase()}?`,
      type: 'question',
      source: url,
    })
    entries.push({
      id: stableId(url, `qh2::${heading}`),
      text: `How does ${heading.toLowerCase()} work for ${pageTitle.toLowerCase()}?`,
      type: 'question',
      source: url,
    })
  })

  return entries
}

export function generateEntries(topic: string, action: string, index: number): Entry[] {
  const title = `${action} ${topic}`
  const src = `synthetic://${index}`
  const entries: Entry[] = [
    { id: stableId(src, 'kw'), text: title, type: 'keyword', source: src },
  ]
  for (const template of QUESTION_TEMPLATES) {
    entries.push({ id: stableId(src, template(title)), text: template(title), type: 'question', source: src })
  }
  return entries
}

export function scaleEntries(base: Entry[], scale: number): Entry[] {
  if (scale <= 1) return base
  const result: Entry[] = [...base]
  const fullCopies = Math.floor(scale) - 1
  for (let i = 1; i <= fullCopies; i++) {
    for (const entry of base) {
      result.push({ ...entry, id: `${entry.id}_s${i}` })
    }
  }
  const fraction = scale - Math.floor(scale)
  if (fraction > 0) {
    const partialCount = Math.round(base.length * fraction)
    for (let j = 0; j < partialCount; j++) {
      result.push({ ...base[j], id: `${base[j].id}_sf` })
    }
  }
  return result
}

export async function loadEntries(): Promise<Entry[]> {
  const scale = parseFloat(process.env.SCALE ?? '3')
  const dataFile = join(process.cwd(), 'data', 'entries.json')
  let base: Entry[]
  try {
    base = JSON.parse(readFileSync(dataFile, 'utf8')) as Entry[]
  } catch {
    throw new Error('data/entries.json not found — run "npm run seed" first')
  }
  return scaleEntries(base, scale)
}
