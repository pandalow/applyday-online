'use client'

import { useMemo, useEffect, useRef, useState } from 'react'

type AnalysisResult = { id: string; name: string; result: unknown }

interface Props {
  results: AnalysisResult[]
}

// ─── Layout primitives ────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.12em] shrink-0">
        {children}
      </span>
      <div className="flex-1 border-t border-zinc-200 dark:border-zinc-700" />
    </div>
  )
}

function ChartTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{children}</h3>
}

function Empty({ title }: { title: string }) {
  return (
    <div>
      <ChartTitle>{title}</ChartTitle>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No data</p>
    </div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent = 'text-zinc-900 dark:text-white' }: {
  label: string; value: string; sub?: string; accent?: string
}) {
  return (
    <Card className="flex flex-col justify-between min-h-[90px]">
      <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{label}</p>
      <div>
        <p className={`text-2xl font-bold leading-none ${accent}`}>{value}</p>
        {sub && <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">{sub}</p>}
      </div>
    </Card>
  )
}

// ─── Horizontal bar ───────────────────────────────────────────────────────────

function HBar({ label, value, max, color, suffix = '', labelWidth = 'w-32' }: {
  label: string; value: number; max: number; color: string; suffix?: string; labelWidth?: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs text-zinc-500 dark:text-zinc-400 ${labelWidth} shrink-0 truncate text-right`}>{label}</span>
      <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-4 overflow-hidden">
        <div className={`h-full ${color} rounded-full flex items-center justify-end pr-1.5 transition-all`}
          style={{ width: `${pct}%`, minWidth: pct > 0 ? 4 : 0 }}>
          {pct > 12 && <span className="text-[10px] font-semibold text-white">{value}{suffix}</span>}
        </div>
      </div>
      <span className="text-xs text-zinc-500 dark:text-zinc-400 w-8 shrink-0 text-right">{value}{suffix}</span>
    </div>
  )
}

// ─── Frequency bar chart ──────────────────────────────────────────────────────

function FreqChart({ data, title, color = 'bg-indigo-400 dark:bg-indigo-500', top = 12 }: {
  data: Record<string, number>; title: string; color?: string; top?: number
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, top)
  const max = entries[0]?.[1] ?? 1
  if (!entries.length) return <Empty title={title} />
  return (
    <div>
      <ChartTitle>{title}</ChartTitle>
      <div className="space-y-1.5">
        {entries.map(([label, value]) => (
          <HBar key={label} label={label} value={value} max={max} color={color} />
        ))}
      </div>
    </div>
  )
}

// ─── Stacked pill — for remote/employment type ────────────────────────────────

function StackedPills({ data, title, colors }: {
  data: Record<string, number>; title: string
  colors: Record<string, string>
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1
  if (!entries.length) return <Empty title={title} />

  const defaultColors = ['bg-indigo-400', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400', 'bg-sky-400']

  return (
    <div>
      <ChartTitle>{title}</ChartTitle>
      {/* Stacked bar */}
      <div className="flex h-6 rounded-full overflow-hidden mb-3 gap-px">
        {entries.map(([label, value], i) => (
          <div
            key={label}
            style={{ width: `${(value / total) * 100}%` }}
            className={`${colors[label] ?? defaultColors[i % defaultColors.length]} transition-all`}
            title={`${label}: ${value} (${Math.round((value / total) * 100)}%)`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="space-y-1.5">
        {entries.map(([label, value], i) => {
          const pct = Math.round((value / total) * 100)
          return (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${colors[label] ?? defaultColors[i % defaultColors.length]}`} />
              <span className="text-xs text-zinc-600 dark:text-zinc-300 flex-1 capitalize">{label.replace(/-/g, ' ')}</span>
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{value}</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 w-8 text-right">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Skill demand ─────────────────────────────────────────────────────────────

function SkillDemandChart({ data, title }: { data: Record<string, { count: number; pct: number }>; title: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1].pct - a[1].pct).slice(0, 20)
  if (!entries.length) return <Empty title={title} />
  return (
    <div>
      <ChartTitle>{title}</ChartTitle>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 -mt-1.5 mb-3">% of jobs requiring this skill</p>
      <div className="space-y-1.5">
        {entries.map(([skill, { count, pct }]) => (
          <div key={skill} className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-32 shrink-0 truncate text-right">{skill}</span>
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-4 overflow-hidden">
              <div className="h-full bg-violet-400 dark:bg-violet-500 rounded-full flex items-center justify-end pr-1.5"
                style={{ width: `${pct}%`, minWidth: pct > 0 ? 4 : 0 }}>
                {pct > 12 && <span className="text-[10px] font-semibold text-white">{pct}%</span>}
              </div>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-9 shrink-0 text-right">{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Required vs Desirable ────────────────────────────────────────────────────

type ReqDesItem = { skill: string; required: number; desirable: number; requiredPct: number; desirablePct: number }

function ReqVsDesChart({ data, title }: { data: ReqDesItem[]; title: string }) {
  if (!data.length) return <Empty title={title} />
  const maxPct = Math.max(...data.map(d => Math.max(d.requiredPct, d.desirablePct)), 1)
  return (
    <div>
      <ChartTitle>{title}</ChartTitle>
      <div className="flex gap-4 mb-3 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-rose-400 inline-block" />Required</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-2.5 rounded-sm bg-amber-400 inline-block" />Desirable</span>
      </div>
      <div className="space-y-2">
        {data.slice(0, 18).map(item => (
          <div key={item.skill} className="flex items-start gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-32 shrink-0 truncate text-right pt-0.5">{item.skill}</span>
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center gap-1">
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full bg-rose-400 dark:bg-rose-500 rounded-full" style={{ width: `${(item.requiredPct / maxPct) * 100}%` }} />
                </div>
                <span className="text-[10px] text-rose-500 dark:text-rose-400 w-7 text-right">{item.requiredPct}%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full bg-amber-400 dark:bg-amber-500 rounded-full" style={{ width: `${(item.desirablePct / maxPct) * 100}%` }} />
                </div>
                <span className="text-[10px] text-amber-500 dark:text-amber-400 w-7 text-right">{item.desirablePct}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Salary ───────────────────────────────────────────────────────────────────

interface SalaryStats { count: number; min: number; max: number; avg: number; median: number }
interface SalaryInsights {
  overall: SalaryStats | null
  byRole: Record<string, SalaryStats>
  byLevel: Record<string, SalaryStats>
  hasSalaryPct: number
}

function SalaryChart({ data, title }: { data: SalaryInsights; title: string }) {
  const fmt = (n: number) => `€${n.toLocaleString()}`
  const levelOrder = ['intern', 'junior', 'mid', 'senior', 'lead', 'manager']

  if (!data.overall) {
    return (
      <div>
        <ChartTitle>{title}</ChartTitle>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
          Salary data available in {data.hasSalaryPct}% of JDs — not enough to display.
        </p>
      </div>
    )
  }

  const levelEntries = Object.entries(data.byLevel)
    .sort(([a], [b]) => levelOrder.indexOf(a) - levelOrder.indexOf(b))
  const globalMax = data.overall.max

  return (
    <div>
      <ChartTitle>{title}</ChartTitle>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 -mt-1.5 mb-3">
        Data from {data.hasSalaryPct}% of JDs ({data.overall.count} total)
      </p>
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[['Avg', fmt(data.overall.avg)], ['Median', fmt(data.overall.median)],
          ['Min', fmt(data.overall.min)], ['Max', fmt(data.overall.max)]].map(([l, v]) => (
          <div key={l} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2 text-center border border-zinc-100 dark:border-zinc-700/60">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{l}</p>
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{v}</p>
          </div>
        ))}
      </div>
      {/* By level */}
      {levelEntries.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">By Level</p>
          <div className="space-y-1.5">
            {levelEntries.map(([level, s]) => (
              <HBar key={level} label={level} value={s.avg} max={globalMax}
                color="bg-emerald-400 dark:bg-emerald-500" suffix="" labelWidth="w-16" />
            ))}
          </div>
        </div>
      )}
      {/* By role */}
      {Object.keys(data.byRole).length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">By Role</p>
          <div className="space-y-1.5">
            {Object.entries(data.byRole).sort(([, a], [, b]) => b.avg - a.avg).map(([role, s]) => (
              <HBar key={role} label={role} value={s.avg} max={globalMax}
                color="bg-sky-400 dark:bg-sky-500" suffix="" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Experience ───────────────────────────────────────────────────────────────

interface ExperienceProfile {
  distribution: Record<string, number>
  avgMin: number | null
  avgMax: number | null
  hasExperiencePct: number
}

function ExperienceChart({ data, title }: { data: ExperienceProfile; title: string }) {
  const ORDER = ['0', '1–2', '3–5', '5–7', '7+']
  const sorted = Object.entries(data.distribution).sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b))
  const max = Math.max(...sorted.map(([, v]) => v), 1)
  if (!sorted.length) return <Empty title={title} />
  return (
    <div>
      <ChartTitle>{title}</ChartTitle>
      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 -mt-1.5 mb-3">
        {data.hasExperiencePct}% state requirements
        {data.avgMin != null && ` · avg ${data.avgMin}–${data.avgMax ?? '?'}y`}
      </p>
      <div className="space-y-1.5">
        {sorted.map(([bucket, count]) => (
          <HBar key={bucket} label={`${bucket} yrs`} value={count} max={max}
            color="bg-orange-400 dark:bg-orange-500" labelWidth="w-14" />
        ))}
      </div>
    </div>
  )
}

// ─── TF-IDF ───────────────────────────────────────────────────────────────────

function TFIDFChart({ data, title }: { data: Record<string, Array<{ skill: string; score: number }>>; title: string }) {
  const roles = Object.keys(data)
  const [active, setActive] = useState(roles[0] ?? '')
  if (!roles.length) return <Empty title={title} />

  const skills = (data[active] ?? []).slice(0, 12)
  const maxScore = skills[0]?.score ?? 1

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <ChartTitle>{title}</ChartTitle>
        <div className="flex flex-wrap gap-1 justify-end shrink-0">
          {roles.map(r => (
            <button key={r} onClick={() => setActive(r)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                active === r
                  ? 'bg-teal-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
              }`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {skills.map(({ skill, score }) => (
          <div key={skill} className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-24 shrink-0 truncate text-right">{skill}</span>
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
              <div className="h-full bg-teal-400 dark:bg-teal-500 rounded-full"
                style={{ width: `${(score / maxScore) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Skills network ───────────────────────────────────────────────────────────

function SkillsNetworkChart({ data, title }: { data: Array<{ source: string; target: string; weight: number }>; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const edges = data.slice(0, 80)
  const nodeSet = new Set<string>()
  edges.forEach(e => { nodeSet.add(e.source); nodeSet.add(e.target) })
  const nodes = [...nodeSet]

  if (!edges.length) return <Empty title={title} />

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const r = Math.min(W, H) * 0.4
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
      ctx.globalAlpha = 0.15 + (edge.weight / maxW) * 0.55
      ctx.lineWidth = 0.5 + (edge.weight / maxW) * 2.5
      ctx.stroke()
    })
    ctx.globalAlpha = 1

    nodes.forEach(node => {
      const pos = positions[node]
      const deg = edges.filter(e => e.source === node || e.target === node).length
      const nodeR = 3 + Math.min(deg * 0.8, 5)
      ctx.beginPath(); ctx.arc(pos.x, pos.y, nodeR, 0, 2 * Math.PI)
      ctx.fillStyle = isDark ? '#a5b4fc' : '#4f46e5'; ctx.fill()
      ctx.font = `${deg > 3 ? '9' : '8'}px sans-serif`
      ctx.fillStyle = isDark ? '#e4e4e7' : '#18181b'
      ctx.textAlign = 'center'; ctx.fillText(node, pos.x, pos.y - nodeR - 2)
    })
  }, [edges, nodes])

  return (
    <div>
      <ChartTitle>{title}</ChartTitle>
      <canvas ref={canvasRef} width={480} height={340}
        className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-700" />
    </div>
  )
}

// ─── Swiss knife ──────────────────────────────────────────────────────────────

type SwissItem = { index: number; role: string | null; company: string | null; odi_tools: number | null; is_swiss_jd: boolean }

function SwissKnifeChart({ data, title }: { data: SwissItem[]; title: string }) {
  const swiss = data.filter(d => d.is_swiss_jd)
  const normal = data.filter(d => !d.is_swiss_jd)
  return (
    <div>
      <ChartTitle>{title}</ChartTitle>
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{swiss.length}</p>
          <p className="text-xs text-yellow-600 dark:text-yellow-500">Swiss Knife</p>
        </div>
        <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{normal.length}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500">Focused</p>
        </div>
      </div>
      {swiss.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {swiss.map(item => (
            <div key={item.index} className="flex items-center justify-between px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/10 rounded-md border border-yellow-100 dark:border-yellow-900/30">
              <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">
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

// ─── Word cloud ───────────────────────────────────────────────────────────────

function WordCloud({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 50)
  const max = entries[0]?.[1] ?? 1
  if (!entries.length) return <p className="text-xs text-zinc-400 italic">No data</p>
  return (
    <div className="flex flex-wrap gap-2 leading-relaxed">
      {entries.map(([word, count]) => {
        const size = 11 + Math.round((count / max) * 16)
        const opacity = 0.45 + (count / max) * 0.55
        return (
          <span key={word} style={{ fontSize: `${size}px`, opacity }}
            className="font-medium text-indigo-600 dark:text-indigo-400">
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
  const [tab, setTab] = useState<'all' | 'verbs' | 'nouns' | 'adjectives'>('all')
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <ChartTitle>{title}</ChartTitle>
        <div className="flex gap-1">
          {(['all', 'verbs', 'nouns', 'adjectives'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                tab === t ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <WordCloud data={data[tab]} />
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function ReportDashboard({ results }: Props) {
  const r = useMemo(() => {
    const m: Record<string, unknown> = {}
    for (const item of results) m[item.name] = item.result
    return m
  }, [results])

  // KPI derivations
  const swissData      = r['swiss_knife'] as SwissItem[] | undefined
  const totalJDs       = swissData?.length ?? 0

  const skillDemand    = r['skill_demand_pct'] as Record<string, { count: number; pct: number }> | undefined
  const topSkillEntry  = skillDemand ? Object.entries(skillDemand)[0] : null

  const salary         = r['salary_insights'] as SalaryInsights | undefined

  const remoteFreq     = r['freq.remote_work'] as Record<string, number> | undefined
  const remoteTotal    = remoteFreq ? Object.values(remoteFreq).reduce((a, b) => a + b, 0) : 0
  const remotePct      = remoteFreq && remoteTotal > 0
    ? Math.round(((remoteFreq['remote'] ?? 0) + (remoteFreq['hybrid'] ?? 0)) / remoteTotal * 100)
    : null

  const exp            = r['experience_profile'] as ExperienceProfile | undefined

  const reqVsDes       = r['req_vs_desirable'] as ReqDesItem[] | undefined
  const tfidf          = r['tfidf.skills'] as Record<string, Array<{ skill: string; score: number }>> | undefined
  const network        = r['graph.skills'] as Array<{ source: string; target: string; weight: number }> | undefined
  const posResp        = r['pos.responsibilities'] as { all: Record<string, number>; verbs: Record<string, number>; nouns: Record<string, number>; adjectives: Record<string, number> } | undefined

  const freqLang      = r['freq.programming_languages'] as Record<string, number> | undefined
  const freqFw         = r['freq.frameworks_tools']       as Record<string, number> | undefined
  const freqDB         = r['freq.databases']              as Record<string, number> | undefined
  const freqCloud      = r['freq.cloud_platforms']        as Record<string, number> | undefined
  const freqApi        = r['freq.api_protocols']          as Record<string, number> | undefined
  const freqMethod     = r['freq.methodologies']          as Record<string, number> | undefined
  const freqMobile     = r['freq.mobile_technologies']    as Record<string, number> | undefined
  const freqLevel      = r['freq.level']                  as Record<string, number> | undefined
  const freqEmploy     = r['freq.employment_type']        as Record<string, number> | undefined
  const freqRemote     = r['freq.remote_work']            as Record<string, number> | undefined
  const freqRole       = r['freq.role']                   as Record<string, number> | undefined
  const freqLocation   = r['freq.location']               as Record<string, number> | undefined
  const freqBenefits   = r['freq.benefits']               as Record<string, number> | undefined
  const freqIndustry   = r['freq.industry']               as Record<string, number> | undefined
  const freqLangReq    = r['freq.language_requirements']  as Record<string, number> | undefined
  const visaStats      = r['visa_stats'] as { workPermitRequired: number; visaSponsorship: number; total: number } | undefined

  const REMOTE_COLORS: Record<string, string> = {
    remote: 'bg-emerald-400',
    hybrid: 'bg-sky-400',
    'on-site': 'bg-zinc-400',
  }
  const EMPLOY_COLORS: Record<string, string> = {
    full_time: 'bg-indigo-400',
    contract: 'bg-amber-400',
    internship: 'bg-violet-400',
    part_time: 'bg-rose-400',
  }

  return (
    <div className="space-y-5">

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="JDs Analyzed" value={String(totalJDs)}
          accent="text-indigo-600 dark:text-indigo-400" />
        <KpiCard
          label="Top Skill Demand"
          value={topSkillEntry?.[0] ?? '—'}
          sub={topSkillEntry ? `${topSkillEntry[1].pct}% of jobs` : undefined}
          accent="text-violet-600 dark:text-violet-400"
        />
        <KpiCard
          label="Avg Salary"
          value={salary?.overall ? `€${salary.overall.avg.toLocaleString()}` : '—'}
          sub={salary ? `${salary.hasSalaryPct}% disclose` : undefined}
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          label="Remote-Friendly"
          value={remotePct !== null ? `${remotePct}%` : '—'}
          sub="remote + hybrid"
          accent="text-sky-600 dark:text-sky-400"
        />
        <KpiCard
          label="Avg Exp Required"
          value={exp?.avgMin != null ? `${exp.avgMin}y` : '—'}
          sub={exp?.avgMax != null ? `up to ${exp.avgMax}y` : 'minimum years'}
          accent="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* ── Skills demand ─────────────────────────────────────────────────── */}
      <SectionHeader>Skills Demand</SectionHeader>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {skillDemand && (
          <Card><SkillDemandChart data={skillDemand} title="Market Demand by Skill" /></Card>
        )}
        {reqVsDes && reqVsDes.length > 0 && (
          <Card><ReqVsDesChart data={reqVsDes} title="Required vs Desirable Skills" /></Card>
        )}
      </div>

      {/* ── Compensation & Experience ──────────────────────────────────────── */}
      <SectionHeader>Compensation &amp; Experience</SectionHeader>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {salary && <Card className="lg:col-span-2"><SalaryChart data={salary} title="Salary Analysis" /></Card>}
        {exp && <Card><ExperienceChart data={exp} title="Experience Requirements" /></Card>}
      </div>

      {/* ── Tech stack — only show section when there is actual tech data ── */}
      {[freqLang, freqFw, freqDB, freqCloud, freqApi, freqMethod, freqMobile].some(d => d && Object.keys(d).length > 0) && (<>
        <SectionHeader>Tech Stack</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {freqLang  && Object.keys(freqLang).length  > 0 && <Card><FreqChart data={freqLang}   title="Programming Languages" color="bg-blue-400 dark:bg-blue-500"     /></Card>}
          {freqFw    && Object.keys(freqFw).length    > 0 && <Card><FreqChart data={freqFw}     title="Frameworks & Tools"    color="bg-teal-400 dark:bg-teal-500"     /></Card>}
          {freqDB    && Object.keys(freqDB).length    > 0 && <Card><FreqChart data={freqDB}     title="Databases"             color="bg-amber-400 dark:bg-amber-500"   /></Card>}
          {freqCloud && Object.keys(freqCloud).length > 0 && <Card><FreqChart data={freqCloud}  title="Cloud Platforms"       color="bg-sky-400 dark:bg-sky-500"       /></Card>}
          {freqApi   && Object.keys(freqApi).length   > 0 && <Card><FreqChart data={freqApi}    title="API Protocols"         color="bg-violet-400 dark:bg-violet-500" /></Card>}
          {freqMethod && Object.keys(freqMethod).length > 0 && <Card><FreqChart data={freqMethod} title="Methodologies"       color="bg-pink-400 dark:bg-pink-500"     /></Card>}
          {freqMobile && Object.keys(freqMobile).length > 0 && <Card><FreqChart data={freqMobile} title="Mobile Technologies" color="bg-lime-500 dark:bg-lime-600"     /></Card>}
        </div>
      </>)}

      {/* ── Job characteristics ───────────────────────────────────────────── */}
      <SectionHeader>Job Characteristics</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {freqLevel  && <Card><FreqChart data={freqLevel}  title="Seniority Level"  color="bg-indigo-400 dark:bg-indigo-500" top={6} /></Card>}
        {freqRemote && <Card><StackedPills data={freqRemote} title="Remote Work"   colors={REMOTE_COLORS} /></Card>}
        {freqEmploy && <Card><StackedPills data={freqEmploy} title="Employment Type" colors={EMPLOY_COLORS} /></Card>}
        {freqIndustry && Object.keys(freqIndustry).length > 0 && (
          <Card><FreqChart data={freqIndustry} title="Industry Distribution" color="bg-cyan-400 dark:bg-cyan-500" top={8} /></Card>
        )}
        {freqLangReq && Object.keys(freqLangReq).length > 0 && (
          <Card><FreqChart data={freqLangReq} title="Language Requirements" color="bg-rose-400 dark:bg-rose-500" top={8} /></Card>
        )}
        {visaStats && visaStats.total > 0 && (
          <Card>
            <ChartTitle>Work Permit &amp; Visa</ChartTitle>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 -mt-1.5 mb-4">out of {visaStats.total} JDs</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600 dark:text-zinc-300">Work permit required</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-zinc-100 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-rose-400 dark:bg-rose-500 rounded-full"
                      style={{ width: `${(visaStats.workPermitRequired / visaStats.total) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 w-8 text-right">
                    {Math.round((visaStats.workPermitRequired / visaStats.total) * 100)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600 dark:text-zinc-300">Visa sponsorship offered</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-zinc-100 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-emerald-400 dark:bg-emerald-500 rounded-full"
                      style={{ width: `${(visaStats.visaSponsorship / visaStats.total) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 w-8 text-right">
                    {Math.round((visaStats.visaSponsorship / visaStats.total) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* ── TF-IDF deep dive ──────────────────────────────────────────────── */}
      {tfidf && Object.keys(tfidf).length > 0 && (
        <>
          <SectionHeader>Differentiating Skills by Role (TF-IDF)</SectionHeader>
          <Card><TFIDFChart data={tfidf} title="Top Distinctive Skills per Role" /></Card>
        </>
      )}

      {/* ── Network & quality ─────────────────────────────────────────────── */}
      <SectionHeader>Skill Synergies &amp; Job Quality</SectionHeader>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {network && <Card><SkillsNetworkChart data={network} title="Skills Co-occurrence Network" /></Card>}
        {swissData && <Card><SwissKnifeChart data={swissData} title="Swiss Knife Job Assessment" /></Card>}
      </div>

      {/* ── Role, location, benefits ──────────────────────────────────────── */}
      <SectionHeader>Roles, Location &amp; Benefits</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {freqRole     && <Card><FreqChart data={freqRole}     title="Role Distribution" color="bg-violet-400 dark:bg-violet-500" /></Card>}
        {freqLocation && <Card><FreqChart data={freqLocation} title="Location"          color="bg-rose-400 dark:bg-rose-500"   /></Card>}
        {freqBenefits && <Card><FreqChart data={freqBenefits} title="Benefits"          color="bg-emerald-400 dark:bg-emerald-500" /></Card>}
      </div>

      {/* ── Responsibilities word cloud ───────────────────────────────────── */}
      {posResp && (
        <>
          <SectionHeader>Responsibilities Language</SectionHeader>
          <Card><POSChart data={posResp} title="Responsibilities Word Analysis" /></Card>
        </>
      )}

    </div>
  )
}
