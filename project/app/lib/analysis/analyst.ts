// TypeScript analytics engine replacing Python's analyst.py (spaCy + sklearn + pandas)
import nlp from 'compromise'

type JobRecord = {
  role?: string | null
  company?: string | null
  responsibilities?: string[]
  required_core_skills?: string[]
  desirable_skills?: string[]
  programming_languages?: string[]
  frameworks_tools?: string[]
  cloud_platforms?: string[]
  databases?: string[]
  api_protocols?: string[]
  methodologies?: string[]
  benefits?: string[]
  level?: string | null
  location?: string | null
  employment_type?: string | null
  remote_work?: string | null
  salary_eur_min?: number | null
  salary_eur_max?: number | null
  years_experience_min?: number | null
  years_experience_max?: number | null
  industry?: string | null
  language_requirements?: string[]
  mobile_technologies?: string[]
  domain_keywords?: string[]
  work_permit_required?: boolean | null
  visa_sponsorship?: boolean | null
  [key: string]: unknown
}

interface SalaryStats {
  count: number; min: number; max: number; avg: number; median: number
}

type FreqMap = Record<string, number>
type POSResult = { all: FreqMap; verbs: FreqMap; nouns: FreqMap; adjectives: FreqMap }
type TFIDFResult = Record<string, Array<{ skill: string; score: number }>>
type PMIEdge = { source: string; target: string; weight: number }
type SwissKnifeItem = { index: number; role: string | null; company: string | null; odi_tools: number | null; is_swiss_jd: boolean }

const ALL_SKILL_FIELDS = [
  'required_core_skills', 'desirable_skills',
  'programming_languages', 'frameworks_tools', 'cloud_platforms',
  'databases', 'api_protocols', 'methodologies', 'mobile_technologies',
] as const

const STOPWORDS = new Set([
  'or', 'in', 'a', 'with', 'from', 'an', 'other', 'such', 'as', 'to', 'for', 'on', 'of', 'and',
  's', 'the', 'is', 'be', 'are', 'was', 'were', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'not', 'no', 'nor',
  'but', 'if', 'then', 'than', 'too', 'very', 'so', 'yet', 'both', 'either', 'each',
  'recent', 'currently', 'first', 'high', 'preferred', 'similar', 'relevant', 'equivalent',
  'related', 'degree', 'field', 'fields', 'discipline', 'work', 'experience'
])

function counter(items: string[]): FreqMap {
  const map: FreqMap = {}
  for (const item of items) {
    map[item] = (map[item] ?? 0) + 1
  }
  return map
}

function topN(freq: FreqMap, n: number): FreqMap {
  return Object.fromEntries(
    Object.entries(freq).sort(([, a], [, b]) => b - a).slice(0, n)
  )
}

function lemmatize(text: string): string[] {
  const doc = nlp(text)
  const terms = doc.terms().json() as Array<{ normal: string; tags: string[] }>
  return terms
    .filter(t => t.normal)
    .map(t => t.normal.toLowerCase())
    .filter(w => w.length > 1 && !STOPWORDS.has(w) && /^[a-z]/.test(w))
}

function getVerbs(text: string): string[] {
  const doc = nlp(text)
  return (doc.verbs().json() as Array<{ normal: string }>)
    .filter(t => t.normal)
    .map(t => t.normal.toLowerCase())
}

export class Analyst {
  private data: JobRecord[]

  constructor(data: JobRecord[]) {
    this.data = data
  }

  getPOSTagsTokens(column: string): POSResult {
    const texts = this.data.map(r => r[column]).filter(Boolean)
    if (!texts.length) return { all: {}, verbs: {}, nouns: {}, adjectives: {} }

    const allTokens: string[] = []
    const verbs: string[] = []
    const nouns: string[] = []
    const adjs: string[] = []

    for (const item of texts) {
      const text = Array.isArray(item) ? item.join(' ') : String(item)
      const normalized = text.replace(/_/g, ' ')
      const doc = nlp(normalized)
      const terms = doc.terms().json() as Array<{ normal: string; tags: string[] }>

      for (const term of terms) {
        if (!term.normal) continue
        const w = term.normal.toLowerCase()
        if (w.length <= 1 || STOPWORDS.has(w) || !/^[a-z]/.test(w)) continue
        allTokens.push(w)
        const tags = term.tags ?? []
        if (tags.includes('Verb')) verbs.push(w)
        else if (tags.includes('Noun')) nouns.push(w)
        else if (tags.includes('Adjective')) adjs.push(w)
      }
    }

    return {
      all: topN(counter(allTokens), 50),
      verbs: topN(counter(verbs), 30),
      nouns: topN(counter(nouns), 30),
      adjectives: topN(counter(adjs), 20),
    }
  }

  getFrequencies(column: string, textMode = false): FreqMap {
    const items = this.data.map(r => r[column]).filter(Boolean)
    if (!items.length) return {}

    if (Array.isArray(items[0])) {
      const flat = (items as string[][]).flat().map(x => x.toLowerCase())
      return topN(counter(flat), 30)
    }

    if (textMode) {
      const tokens: string[] = []
      for (const item of items as string[]) {
        tokens.push(...lemmatize(item))
      }
      return topN(counter(tokens), 20)
    }

    return topN(counter((items as string[]).map(x => x.toLowerCase())), 20)
  }

  getTFIDFSkills(topK = 10): TFIDFResult {
    type RoleSkills = Record<string, string[]>
    const byRole: Record<string, RoleSkills> = {}

    for (const row of this.data) {
      if (!row.role) continue
      if (!byRole[row.role]) byRole[row.role] = Object.fromEntries(ALL_SKILL_FIELDS.map(f => [f, []]))
      for (const f of ALL_SKILL_FIELDS) {
        const arr = row[f] as string[] | undefined
        if (arr) byRole[row.role][f].push(...arr)
      }
    }

    const roles = Object.keys(byRole)
    if (!roles.length) return {}

    const roleDocs = roles.map(role => {
      const all = (Object.values(byRole[role]) as string[][]).flat()
      return lemmatize(all.join(' ')).join(' ')
    })

    // TF-IDF implementation
    const tokenSet = new Set<string>()
    const tokenizedDocs = roleDocs.map(d => {
      const toks = d.split(/\s+/).filter(Boolean)
      toks.forEach(t => tokenSet.add(t))
      return toks
    })

    const vocabulary = [...tokenSet]
    const N = roleDocs.length

    // Compute IDF
    const idf: Record<string, number> = {}
    for (const term of vocabulary) {
      const docCount = tokenizedDocs.filter(d => d.includes(term)).length
      idf[term] = Math.log((N + 1) / (docCount + 1)) + 1
    }

    // Compute TF-IDF per document
    const result: TFIDFResult = {}
    for (let i = 0; i < roles.length; i++) {
      const toks = tokenizedDocs[i]
      const tf: Record<string, number> = {}
      for (const t of toks) tf[t] = (tf[t] ?? 0) + 1
      const len = toks.length || 1

      const scores = vocabulary.map(term => ({
        skill: term,
        score: (tf[term] ?? 0) / len * idf[term],
      })).filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)

      result[roles[i]] = scores
    }
    return result
  }

  getPMINetworks(minCofreq = 2): PMIEdge[] {
    const jobSkillsList: string[][] = []
    for (const row of this.data) {
      const skills: string[] = []
      for (const f of ALL_SKILL_FIELDS) {
        const arr = row[f] as string[] | undefined
        if (arr) skills.push(...arr)
      }
      jobSkillsList.push(lemmatize(skills.join(' ')))
    }

    const skillFreq: Record<string, number> = {}
    const pairFreq: Record<string, number> = {}
    const totalDocs = jobSkillsList.length

    for (const skillList of jobSkillsList) {
      const unique = [...new Set(skillList)]
      for (const s of unique) skillFreq[s] = (skillFreq[s] ?? 0) + 1
      for (let i = 0; i < unique.length; i++) {
        for (let j = i + 1; j < unique.length; j++) {
          const key = [unique[i], unique[j]].sort().join('::')
          pairFreq[key] = (pairFreq[key] ?? 0) + 1
        }
      }
    }

    const edges: PMIEdge[] = []
    for (const [pair, coFreq] of Object.entries(pairFreq)) {
      if (coFreq < minCofreq) continue
      const [s1, s2] = pair.split('::')
      const px = (skillFreq[s1] ?? 0) / totalDocs
      const py = (skillFreq[s2] ?? 0) / totalDocs
      const pxy = coFreq / totalDocs
      if (pxy > 0 && px > 0 && py > 0) {
        const pmi = Math.log2(pxy / (px * py))
        if (pmi > 0) edges.push({ source: s1, target: s2, weight: pmi })
      }
    }

    return edges.sort((a, b) => b.weight - a.weight)
  }

  assessSwissKnifeJob(): SwissKnifeItem[] {
    return this.data.map((row, idx) => {
      const skills: string[] = []
      for (const f of ALL_SKILL_FIELDS) {
        const arr = row[f] as string[] | undefined
        if (arr) skills.push(...arr)
      }
      const numSkills = new Set(skills).size

      const responsibilities = (row.responsibilities as string[] | undefined) ?? []
      const verbCount = getVerbs(responsibilities.join(' ').replace(/_/g, ' ')).length

      const odi = verbCount > 0 ? Math.round((numSkills / verbCount) * 100) / 100 : null

      return {
        index: idx,
        role: row.role ?? null,
        company: row.company ?? null,
        odi_tools: odi,
        is_swiss_jd: odi !== null && odi > 1.0,
      }
    })
  }

  getSkillDemandPct(): Record<string, { count: number; pct: number }> {
    const total = this.data.length || 1
    const skillCount: Record<string, number> = {}

    for (const row of this.data) {
      const seen = new Set<string>()
      for (const f of ALL_SKILL_FIELDS) {
        for (const s of (row[f] ?? []) as string[]) {
          const k = s.toLowerCase()
          if (!seen.has(k)) { skillCount[k] = (skillCount[k] ?? 0) + 1; seen.add(k) }
        }
      }
    }

    const result: Record<string, { count: number; pct: number }> = {}
    Object.entries(skillCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 30)
      .forEach(([skill, count]) => { result[skill] = { count, pct: Math.round((count / total) * 100) } })
    return result
  }

  getReqVsDesirable(): Array<{ skill: string; required: number; desirable: number; requiredPct: number; desirablePct: number }> {
    const total = this.data.length || 1
    const req: Record<string, number> = {}
    const des: Record<string, number> = {}

    for (const row of this.data) {
      for (const s of (row.required_core_skills ?? []) as string[]) {
        const k = s.toLowerCase(); req[k] = (req[k] ?? 0) + 1
      }
      for (const s of (row.desirable_skills ?? []) as string[]) {
        const k = s.toLowerCase(); des[k] = (des[k] ?? 0) + 1
      }
    }

    const all = new Set([...Object.keys(req), ...Object.keys(des)])
    return [...all]
      .map(skill => ({
        skill,
        required: req[skill] ?? 0,
        desirable: des[skill] ?? 0,
        requiredPct: Math.round(((req[skill] ?? 0) / total) * 100),
        desirablePct: Math.round(((des[skill] ?? 0) / total) * 100),
      }))
      .filter(s => s.required + s.desirable >= 2)
      .sort((a, b) => (b.required + b.desirable) - (a.required + a.desirable))
      .slice(0, 25)
  }

  getSalaryInsights(): {
    overall: SalaryStats | null
    byRole: Record<string, SalaryStats>
    byLevel: Record<string, SalaryStats>
    hasSalaryPct: number
  } {
    const total = this.data.length || 1
    const all: number[] = []
    const byRole: Record<string, number[]> = {}
    const byLevel: Record<string, number[]> = {}

    for (const row of this.data) {
      const lo = row.salary_eur_min as number | null
      const hi = row.salary_eur_max as number | null
      const mid = lo != null && hi != null ? (lo + hi) / 2 : (lo ?? hi)
      if (mid == null) continue
      all.push(mid)
      if (row.role)  { byRole[row.role]   ??= []; byRole[row.role].push(mid) }
      if (row.level) { byLevel[row.level] ??= []; byLevel[row.level].push(mid) }
    }

    function stats(vals: number[]): SalaryStats {
      const s = [...vals].sort((a, b) => a - b)
      return {
        count: vals.length,
        min: Math.round(s[0]),
        max: Math.round(s[s.length - 1]),
        avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
        median: Math.round(s[Math.floor(s.length / 2)]),
      }
    }

    return {
      overall: all.length ? stats(all) : null,
      byRole:  Object.fromEntries(Object.entries(byRole).map(([k, v]) => [k, stats(v)])),
      byLevel: Object.fromEntries(Object.entries(byLevel).map(([k, v]) => [k, stats(v)])),
      hasSalaryPct: Math.round((all.length / total) * 100),
    }
  }

  getExperienceProfile(): {
    distribution: Record<string, number>
    avgMin: number | null
    avgMax: number | null
    hasExperiencePct: number
  } {
    const total = this.data.length || 1
    const mins: number[] = []
    const maxs: number[] = []
    const buckets: Record<string, number> = { '0': 0, '1–2': 0, '3–5': 0, '5–7': 0, '7+': 0 }

    for (const row of this.data) {
      const lo = row.years_experience_min as number | null
      const hi = row.years_experience_max as number | null
      if (lo == null && hi == null) continue
      const val = lo ?? hi!
      if (lo != null) mins.push(lo)
      if (hi != null) maxs.push(hi)
      if (val === 0)      buckets['0']++
      else if (val <= 2)  buckets['1–2']++
      else if (val <= 5)  buckets['3–5']++
      else if (val <= 7)  buckets['5–7']++
      else                buckets['7+']++
    }

    const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null

    return {
      distribution: Object.fromEntries(Object.entries(buckets).filter(([, v]) => v > 0)),
      avgMin: avg(mins),
      avgMax: avg(maxs),
      hasExperiencePct: Math.round((mins.length / total) * 100),
    }
  }

  getVisaStats(): { workPermitRequired: number; visaSponsorship: number; total: number } {
    let workPermit = 0, visa = 0
    for (const row of this.data) {
      if (row.work_permit_required) workPermit++
      if (row.visa_sponsorship)     visa++
    }
    return { workPermitRequired: workPermit, visaSponsorship: visa, total: this.data.length }
  }

  analyze(): Record<string, unknown> {
    const FREQ_CHOICES = [
      'level', 'location', 'programming_languages', 'frameworks_tools', 'cloud_platforms',
      'databases', 'api_protocols', 'methodologies', 'mobile_technologies',
      'employment_type', 'remote_work', 'benefits', 'industry', 'language_requirements',
    ]
    const results: Record<string, unknown> = {}

    results['freq.role'] = this.getFrequencies('role', true)
    for (const choice of FREQ_CHOICES) {
      results[`freq.${choice}`] = this.getFrequencies(choice, false)
    }
    results['visa_stats']        = this.getVisaStats()
    results['skill_demand_pct']  = this.getSkillDemandPct()
    results['req_vs_desirable']  = this.getReqVsDesirable()
    results['salary_insights']   = this.getSalaryInsights()
    results['experience_profile'] = this.getExperienceProfile()
    results['pos.responsibilities'] = this.getPOSTagsTokens('responsibilities')
    results['tfidf.skills']      = this.getTFIDFSkills()
    results['graph.skills']      = this.getPMINetworks()
    results['swiss_knife']       = this.assessSwissKnifeJob()

    return results
  }
}
