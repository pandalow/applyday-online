'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale } from '@/locales'

// ─── Shared primitives ───────────────────────────────────────────────────────

function EmptyChart({ title }: { title: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{title}</h3>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No data</p>
    </div>
  )
}

function HBar({ label, value, max, color, suffix = '' }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500 dark:text-zinc-400 w-36 shrink-0 truncate text-right">{label}</span>
      <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-4 overflow-hidden">
        <div className={`h-full ${color} rounded-full flex items-center justify-end pr-1.5`}
          style={{ width: `${pct}%`, minWidth: pct > 0 ? 4 : 0 }}>
          {pct > 12 && <span className="text-[10px] font-semibold text-white">{value}{suffix}</span>}
        </div>
      </div>
      <span className="text-xs text-zinc-500 dark:text-zinc-400 w-10 shrink-0 text-right">{value}{suffix}</span>
    </div>
  )
}

// ─── Existing charts ──────────────────────────────────────────────────────────

function FrequencyChart({ data, title }: { data: Record<string, number>; title: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 20)
  const max = entries[0]?.[1] ?? 1
  if (!entries.length) return <EmptyChart title={title} />
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{title}</h3>
      <div className="space-y-1.5">
        {entries.map(([label, value]) => (
          <HBar key={label} label={label} value={value} max={max} color="bg-indigo-400 dark:bg-indigo-500" />
        ))}
      </div>
    </div>
  )
}

function WordCloud({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 40)
  const max = entries[0]?.[1] ?? 1
  if (!entries.length) return <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No data</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([word, count]) => {
        const size = 10 + Math.round((count / max) * 14)
        const opacity = 0.5 + (count / max) * 0.5
        return (
          <span key={word} style={{ fontSize: `${size}px`, opacity }}
            className="font-medium text-indigo-600 dark:text-indigo-400 leading-tight">
            {word}
          </span>
        )
      })}
    </div>
  )
}

function POSChart({ data, title }: {
  data: { all: Record<string, number>; verbs: Record<string, number>; nouns: Record<string, number>; adjectives: Record<string, number> }
  title: string
}) {
  const [active, setActive] = useState<'all' | 'verbs' | 'nouns' | 'adjectives'>('all')
  const tabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'verbs' as const, label: 'Verbs' },
    { key: 'nouns' as const, label: 'Nouns' },
    { key: 'adjectives' as const, label: 'Adjectives' },
  ]
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{title}</h3>
      <div className="flex gap-1 mb-3">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActive(tab.key)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              active === tab.key
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>
      <WordCloud data={data[active]} />
    </div>
  )
}

function TFIDFChart({ data, title }: { data: Record<string, Array<{ skill: string; score: number }>>; title: string }) {
  const roles = Object.keys(data)
  if (!roles.length) return <EmptyChart title={title} />
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">{title}</h3>
      <div className="space-y-5">
        {roles.map(role => {
          const skills = data[role].slice(0, 10)
          const maxScore = skills[0]?.score ?? 1
          return (
            <div key={role}>
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-2">{role}</p>
              <div className="space-y-1">
                {skills.map(({ skill, score }) => (
                  <div key={skill} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 w-28 shrink-0 truncate text-right">{skill}</span>
                    <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
                      <div className="h-full bg-teal-400 dark:bg-teal-500 rounded-full"
                        style={{ width: `${(score / maxScore) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 w-10 text-right">{score.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SkillsNetworkChart({ data, title }: { data: Array<{ source: string; target: string; weight: number }>; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const edges = data.slice(0, 60)
  const nodeSet = new Set<string>()
  edges.forEach(e => { nodeSet.add(e.source); nodeSet.add(e.target) })
  const nodes = [...nodeSet]

  if (!edges.length) return <EmptyChart title={title} />

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const r = Math.min(W, H) * 0.38
    const N = nodes.length

    const positions: Record<string, { x: number; y: number }> = {}
    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / N - Math.PI / 2
      positions[node] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
    })

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    ctx.fillStyle = isDark ? '#27272a' : '#f4f4f5'
    ctx.fillRect(0, 0, W, H)
    const maxW = Math.max(...edges.map(e => e.weight), 1)

    edges.forEach(edge => {
      const a = positions[edge.source], b = positions[edge.target]
      if (!a || !b) return
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
      ctx.strokeStyle = isDark ? '#6366f1' : '#818cf8'
      ctx.globalAlpha = 0.2 + (edge.weight / maxW) * 0.5
      ctx.lineWidth = 0.5 + (edge.weight / maxW) * 2
      ctx.stroke()
    })
    ctx.globalAlpha = 1

    nodes.forEach(node => {
      const pos = positions[node]
      ctx.beginPath(); ctx.arc(pos.x, pos.y, 4, 0, 2 * Math.PI)
      ctx.fillStyle = isDark ? '#a5b4fc' : '#4f46e5'; ctx.fill()
      ctx.font = '9px sans-serif'
      ctx.fillStyle = isDark ? '#e4e4e7' : '#18181b'
      ctx.textAlign = 'center'; ctx.fillText(node, pos.x, pos.y - 7)
    })
  }, [edges, nodes])

  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{title}</h3>
      <canvas ref={canvasRef} width={520} height={380}
        className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-700" />
    </div>
  )
}

function SwissKnifeChart({ data, title }: {
  data: Array<{ index: number; role: string | null; company: string | null; odi_tools: number | null; is_swiss_jd: boolean }>
  title: string
}) {
  const swiss = data.filter(d => d.is_swiss_jd)
  const normal = data.filter(d => !d.is_swiss_jd)
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{title}</h3>
      <div className="flex gap-4 mb-4">
        <div className="flex-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{swiss.length}</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-0.5">Swiss Knife Jobs</p>
        </div>
        <div className="flex-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">{normal.length}</p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Focused Jobs</p>
        </div>
      </div>
      {swiss.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-2">Swiss Knife Roles (ODI &gt; 1.0)</p>
          {swiss.map(item => (
            <div key={item.index} className="flex items-center justify-between px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/10 rounded-md border border-yellow-100 dark:border-yellow-900/30">
              <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                {item.role ?? '—'}{item.company ? ` @ ${item.company}` : ''}
              </span>
              <span className="text-xs font-mono text-yellow-700 dark:text-yellow-400 shrink-0 ml-2">
                ODI {item.odi_tools?.toFixed(2) ?? '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── New charts ───────────────────────────────────────────────────────────────

function SkillDemandChart({ data, title }: { data: Record<string, { count: number; pct: number }>; title: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1].pct - a[1].pct).slice(0, 25)
  if (!entries.length) return <EmptyChart title={title} />
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{title}</h3>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">% of jobs that require this skill</p>
      <div className="space-y-1.5">
        {entries.map(([skill, { pct }]) => (
          <div key={skill} className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-36 shrink-0 truncate text-right">{skill}</span>
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-4 overflow-hidden">
              <div className="h-full bg-violet-400 dark:bg-violet-500 rounded-full flex items-center justify-end pr-1.5"
                style={{ width: `${pct}%`, minWidth: pct > 0 ? 4 : 0 }}>
                {pct > 12 && <span className="text-[10px] font-semibold text-white">{pct}%</span>}
              </div>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-10 shrink-0 text-right">{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type ReqDesItem = { skill: string; required: number; desirable: number; requiredPct: number; desirablePct: number }

function ReqVsDesirableChart({ data, title }: { data: ReqDesItem[]; title: string }) {
  if (!data.length) return <EmptyChart title={title} />
  const maxPct = Math.max(...data.map(d => Math.max(d.requiredPct, d.desirablePct)), 1)
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{title}</h3>
      <div className="flex gap-4 mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" /> Required
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Desirable
        </span>
      </div>
      <div className="space-y-2.5">
        {data.slice(0, 20).map(item => (
          <div key={item.skill} className="flex items-start gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-36 shrink-0 truncate text-right pt-0.5">{item.skill}</span>
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center gap-1">
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
                  <div className="h-full bg-rose-400 dark:bg-rose-500 rounded-full"
                    style={{ width: `${(item.requiredPct / maxPct) * 100}%` }} />
                </div>
                <span className="text-[10px] text-rose-500 dark:text-rose-400 w-8 text-right">{item.requiredPct}%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
                  <div className="h-full bg-amber-400 dark:bg-amber-500 rounded-full"
                    style={{ width: `${(item.desirablePct / maxPct) * 100}%` }} />
                </div>
                <span className="text-[10px] text-amber-500 dark:text-amber-400 w-8 text-right">{item.desirablePct}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SalaryStats { count: number; min: number; max: number; avg: number; median: number }
interface SalaryInsights {
  overall: SalaryStats | null
  byRole: Record<string, SalaryStats>
  byLevel: Record<string, SalaryStats>
  hasSalaryPct: number
}

function SalaryChart({ data, title }: { data: SalaryInsights; title: string }) {
  const fmt = (n: number) => `€${n.toLocaleString()}`

  if (!data.overall) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{title}</h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
          No salary data in selected jobs. Salary is disclosed in {data.hasSalaryPct}% of JDs.
        </p>
      </div>
    )
  }

  const levelOrder = ['intern', 'junior', 'mid', 'senior', 'lead', 'manager']
  const levelEntries = Object.entries(data.byLevel).sort(
    ([a], [b]) => levelOrder.indexOf(a) - levelOrder.indexOf(b)
  )

  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{title}</h3>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
        Salary data available in {data.hasSalaryPct}% of jobs ({data.overall.count} total)
      </p>

      {/* Overall summary */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Avg', value: fmt(data.overall.avg) },
          { label: 'Median', value: fmt(data.overall.median) },
          { label: 'Min', value: fmt(data.overall.min) },
          { label: 'Max', value: fmt(data.overall.max) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2.5 text-center border border-zinc-100 dark:border-zinc-700">
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* By level */}
      {levelEntries.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-2">By Level</p>
          <div className="space-y-1.5">
            {levelEntries.map(([level, s]) => {
              const barPct = (s.avg / data.overall!.max) * 100
              return (
                <div key={level} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 w-20 shrink-0 text-right capitalize">{level}</span>
                  <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-5 overflow-hidden">
                    <div className="h-full bg-emerald-400 dark:bg-emerald-500 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${barPct}%`, minWidth: 4 }}>
                      {barPct > 18 && <span className="text-[10px] font-semibold text-white">{fmt(s.avg)}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 w-24 shrink-0">{fmt(s.avg)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* By role */}
      {Object.keys(data.byRole).length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-2">By Role</p>
          <div className="space-y-1.5">
            {Object.entries(data.byRole)
              .sort(([, a], [, b]) => b.avg - a.avg)
              .map(([role, s]) => {
                const barPct = (s.avg / data.overall!.max) * 100
                return (
                  <div key={role} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 w-28 shrink-0 truncate text-right">{role}</span>
                    <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-4 overflow-hidden">
                      <div className="h-full bg-sky-400 dark:bg-sky-500 rounded-full flex items-center justify-end pr-1.5"
                        style={{ width: `${barPct}%`, minWidth: 4 }}>
                        {barPct > 18 && <span className="text-[10px] font-semibold text-white">{fmt(s.avg)}</span>}
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 w-24 shrink-0">{fmt(s.avg)}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

interface ExperienceProfile {
  distribution: Record<string, number>
  avgMin: number | null
  avgMax: number | null
  hasExperiencePct: number
}

function ExperienceChart({ data, title }: { data: ExperienceProfile; title: string }) {
  const entries = Object.entries(data.distribution)
  const ORDER = ['0', '1–2', '3–5', '5–7', '7+']
  const sorted = entries.sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b))
  const max = Math.max(...sorted.map(([, v]) => v), 1)

  if (!sorted.length) return <EmptyChart title={title} />

  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{title}</h3>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">
        {data.hasExperiencePct}% of jobs state requirements
        {data.avgMin != null && ` · avg min ${data.avgMin}y`}
        {data.avgMax != null && ` · avg max ${data.avgMax}y`}
      </p>
      <div className="space-y-1.5">
        {sorted.map(([bucket, count]) => (
          <HBar key={bucket} label={`${bucket} yrs`} value={count} max={max}
            color="bg-orange-400 dark:bg-orange-500" />
        ))}
      </div>
    </div>
  )
}

// ─── Chart resolver ───────────────────────────────────────────────────────────

type ChartType = 'freq' | 'pos' | 'tfidf' | 'network' | 'swiss' | 'skillDemand' | 'reqVsDes' | 'salary' | 'experience'

function resolveChart(name: string): { type: ChartType; titleKey: string } {
  if (name === 'pos.responsibilities') return { type: 'pos',        titleKey: 'posResponsibilities' }
  if (name === 'tfidf.skills')         return { type: 'tfidf',      titleKey: 'tfidfSkills' }
  if (name === 'graph.skills')         return { type: 'network',    titleKey: 'graphSkills' }
  if (name === 'swiss_knife')          return { type: 'swiss',      titleKey: 'swissKnife' }
  if (name === 'skill_demand_pct')     return { type: 'skillDemand',titleKey: 'skillDemandPct' }
  if (name === 'req_vs_desirable')     return { type: 'reqVsDes',   titleKey: 'reqVsDesirable' }
  if (name === 'salary_insights')      return { type: 'salary',     titleKey: 'salaryInsights' }
  if (name === 'experience_profile')   return { type: 'experience', titleKey: 'experienceProfile' }
  if (name === 'freq.role')                  return { type: 'freq', titleKey: 'freqRole' }
  if (name === 'freq.level')                 return { type: 'freq', titleKey: 'freqLevel' }
  if (name === 'freq.location')              return { type: 'freq', titleKey: 'freqLocation' }
  if (name === 'freq.programming_languages') return { type: 'freq', titleKey: 'freqProgrammingLanguages' }
  if (name === 'freq.frameworks_tools')      return { type: 'freq', titleKey: 'freqFrameworksTools' }
  if (name === 'freq.cloud_platforms')       return { type: 'freq', titleKey: 'freqCloudPlatforms' }
  if (name === 'freq.databases')             return { type: 'freq', titleKey: 'freqDatabases' }
  if (name === 'freq.employment_type')       return { type: 'freq', titleKey: 'freqEmploymentType' }
  if (name === 'freq.remote_work')           return { type: 'freq', titleKey: 'freqRemoteWork' }
  if (name === 'freq.benefits')              return { type: 'freq', titleKey: 'freqBenefits' }
  return { type: 'freq', titleKey: name }
}

// ─── Public component ─────────────────────────────────────────────────────────

interface ReportItemProps {
  result: { name: string; result: unknown }
}

export default function ReportItem({ result }: ReportItemProps) {
  const { t } = useLocale()
  const { type, titleKey } = resolveChart(result.name)
  const title = t(titleKey as Parameters<typeof t>[0])
  const data = result.result

  const renderChart = () => {
    if (type === 'freq' && data && typeof data === 'object' && !Array.isArray(data))
      return <FrequencyChart data={data as Record<string, number>} title={title} />
    if (type === 'pos' && data && typeof data === 'object' && !Array.isArray(data))
      return <POSChart data={data as { all: Record<string, number>; verbs: Record<string, number>; nouns: Record<string, number>; adjectives: Record<string, number> }} title={title} />
    if (type === 'tfidf' && data && typeof data === 'object' && !Array.isArray(data))
      return <TFIDFChart data={data as Record<string, Array<{ skill: string; score: number }>>} title={title} />
    if (type === 'network' && Array.isArray(data))
      return <SkillsNetworkChart data={data as Array<{ source: string; target: string; weight: number }>} title={title} />
    if (type === 'swiss' && Array.isArray(data))
      return <SwissKnifeChart data={data as Array<{ index: number; role: string | null; company: string | null; odi_tools: number | null; is_swiss_jd: boolean }>} title={title} />
    if (type === 'skillDemand' && data && typeof data === 'object' && !Array.isArray(data))
      return <SkillDemandChart data={data as Record<string, { count: number; pct: number }>} title={title} />
    if (type === 'reqVsDes' && Array.isArray(data))
      return <ReqVsDesirableChart data={data as ReqDesItem[]} title={title} />
    if (type === 'salary' && data && typeof data === 'object' && !Array.isArray(data))
      return <SalaryChart data={data as SalaryInsights} title={title} />
    if (type === 'experience' && data && typeof data === 'object' && !Array.isArray(data))
      return <ExperienceChart data={data as ExperienceProfile} title={title} />
    return <EmptyChart title={title} />
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm">
      {renderChart()}
    </div>
  )
}
