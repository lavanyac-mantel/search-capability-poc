import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { generateEntries } from './data.js'
import type { Entry } from './types.js'

// 182 topics × 30 actions × 11 entries each ≈ 60,000 base entries
const TOPICS = [
  'driver licence', 'vehicle registration', 'birth certificate', 'marriage certificate',
  'death certificate', 'passport', 'proof of age card', 'seniors card', 'concession card',
  'disability parking permit', 'boat licence', 'learner licence', 'boat registration',
  'heavy vehicle licence', 'forklift licence', 'working with children check', 'police check',
  'business name registration', 'company registration', 'ABN registration',
  'GST registration', 'tax file number', 'medicare card', 'health care card',
  'pension card', 'veterans card', 'student card', 'international driving permit',
  'toll relief rebate', 'demerit points', 'traffic fine', 'parking fine',
  'speeding fine', 'vehicle inspection', 'roadworthy certificate', 'pink slip',
  'green slip', 'CTP insurance', 'vehicle transfer', 'vehicle cancellation',
  'number plate', 'personalised plate', 'caravan registration', 'trailer registration',
  'motorcycle licence', 'public housing application', 'social housing', 'rental assistance',
  'first home buyer grant', 'stamp duty', 'property title', 'land registry',
  'building approval', 'development application', 'strata title', 'rates notice',
  'electoral enrolment', 'jury duty', 'freedom of information', 'privacy complaint',
  'NDIS application', 'carer allowance', 'disability support pension', 'aged care assessment',
  'home care package', 'childcare subsidy', 'family tax benefit', 'parenting payment',
  'unemployment benefit', 'youth allowance', 'austudy', 'abstudy',
  'apprenticeship', 'traineeship', 'skills assessment', 'trade licence',
  'electrician licence', 'plumber licence', 'builder licence', 'contractor licence',
  'real estate licence', 'security licence', 'casino licence', 'liquor licence',
  'food handling certificate', 'food business registration', 'noise complaint',
  'planning permit', 'heritage listing', 'environmental assessment', 'water licence',
  'fishing licence', 'hunting licence', 'national park permit', 'camping permit',
  'adoption application', 'foster care registration', 'guardianship order',
  'name change', 'gender marker change', 'citizenship application', 'visa application',
  'travel document', 'biosecurity permit', 'import permit', 'export licence',
  'firearm licence', 'security clearance', 'blue card', 'yellow card',
  'working visa', 'student visa', 'partner visa', 'tourist visa',
  'refugee status', 'asylum application', 'sponsorship nomination', 'skilled migration',
  'employer nomination', 'regional migration', 'state nomination', 'points test',
  'english language test', 'health examination', 'character assessment', 'biometrics',
  'notarised document', 'apostille', 'document legalisation', 'statutory declaration',
  'affidavit', 'power of attorney', 'enduring guardianship', 'advance care directive',
  'will registration', 'probate application', 'letters of administration',
  'small claims court', 'mediation service', 'legal aid application', 'court fine',
  'apprehended violence order', 'intervention order', 'restraining order', 'bail application',
  'jury exemption', 'witness protection', 'victim compensation', 'crime report',
  'noise pollution complaint', 'air quality complaint', 'water quality report',
  'recycling service', 'waste collection', 'hard rubbish collection', 'green waste',
  'council rates', 'parking permit', 'street trading permit', 'busking permit',
  'filming permit', 'event permit', 'road closure permit', 'skip bin permit',
  'scaffolding permit', 'excavation permit', 'tree removal permit', 'signage permit',
  'mental health card', 'carer card', 'companion card', 'taxi subsidy scheme',
  'vehicle defect notice', 'tow truck licence', 'driving instructor accreditation',
  'mobile food vendor permit', 'outdoor dining permit', 'temporary road closure',
  'cultural heritage permit', 'marine safety certificate', 'vessel licence', 'survey licence',
]

const ACTIONS = [
  'apply for', 'renew', 'replace', 'cancel', 'transfer', 'update',
  'check', 'appeal', 'register', 'deregister', 'upgrade', 'downgrade',
  'extend', 'suspend', 'restore', 'verify', 'obtain', 'lodge',
  'submit', 'withdraw', 'track', 'pay for', 'appeal against', 'dispute',
  'request', 'book', 'schedule', 'change', 'link', 'unlink',
]

const TARGET = parseInt(process.env.SEED_COUNT ?? '45000', 10)

function main(): void {
  const entries: Entry[] = []
  let index = 0

  outer: for (const action of ACTIONS) {
    for (const topic of TOPICS) {
      entries.push(...generateEntries(topic, action, index++))
      if (entries.length >= TARGET) break outer
    }
  }

  mkdirSync(join(process.cwd(), 'data'), { recursive: true })
  const outPath = join(process.cwd(), 'data', 'entries.json')
  writeFileSync(outPath, JSON.stringify(entries, null, 2))
  console.log(`Seeded ${entries.length} base entries to data/entries.json`)
  console.log(`At SCALE=3 that is ${entries.length * 3} entries per backend`)
}

main()
