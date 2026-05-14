export const QUERIES: string[] = [
  // Prefix queries
  'renew',
  'driver lic',
  'birth cert',
  'vehicle reg',
  'pay fine',
  'apply for',
  'register',
  'transfer',
  'replace',
  'cancel',
  // Short keyword queries
  'renew driver licence',
  'birth certificate',
  'vehicle registration',
  'pay a fine',
  'proof of age',
  'working with children',
  'marriage certificate',
  'seniors card',
  'toll relief',
  'boat licence',
  // Natural language questions
  'how do I renew my driver licence',
  'how do I get a birth certificate',
  'how do I register my vehicle',
  'how do I pay a fine',
  'what documents do I need to renew my licence',
  'how long does it take to get a birth certificate',
  'how much does vehicle registration cost',
  'where do I go to renew my licence',
  'can I renew my rego online',
  'how do I replace a lost licence',
  // Misspelled queries
  'licenve renewal',
  'registraton',
  'certifcate',
  'vehicel rego',
  'drvier licence',
  'marrige certificate',
  'seniours card',
  'tol relief',
  'workin with children',
  'boat license',
  // Mixed and edge cases
  'renew licence nsw',
  'nsw birth certificate online',
  'rego check nsw',
  'demerit points',
  'p plate rules',
  'learner licence',
  'heavy vehicle',
  'interstate licence transfer',
  'concession card',
  'disability parking',
]

export interface RelevancePair {
  query: string
  expectedSubstring: string
}

export const RELEVANCE_PAIRS: RelevancePair[] = [
  { query: 'renew driver licence', expectedSubstring: 'driver licence' },
  { query: 'birth certificate', expectedSubstring: 'birth certificate' },
  { query: 'vehicle registration', expectedSubstring: 'registration' },
  { query: 'pay a fine', expectedSubstring: 'fine' },
  { query: 'working with children', expectedSubstring: 'children' },
  { query: 'seniors card', expectedSubstring: 'senior' },
  { query: 'proof of age', expectedSubstring: 'proof of age' },
  { query: 'boat licence', expectedSubstring: 'boat' },
  { query: 'licenve renewal', expectedSubstring: 'licence' },
  { query: 'how do I renew my driver licence', expectedSubstring: 'driver licence' },
  { query: 'marriage certificate', expectedSubstring: 'marriage' },
  { query: 'learner licence', expectedSubstring: 'learner' },
]
