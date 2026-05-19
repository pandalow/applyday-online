'use client'

import { useEffect, useRef } from 'react'
import { useLocale } from '@/locales'

// ---------------------------------------------------------------------------
// Inline chart sub-components (each handles one result shape)
// ---------------------------------------------------------------------------

// Freq: Record<string, number>
function FrequencyChart({ data, title }: { data: Record<string, number>; title: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 20)
  const max = entries[0]?.[1] ?? 1
  if (!entries.length) return <EmptyChart title={title} />
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{title}</h3>
      <div className="space-y-1.5">
        {entries.map(([label, value]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 w-36 shrink-0 truncate text-right">{label}</span>
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-indigo-400 dark:bg-indigo-500 rounded-full flex items-center justify-end pr-1.5 transition-all"
                style={{ width: `${(value / max) * 100}%` }}
              >
                <span className="text-[10px] font-semibold text-white">{value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// POS: { all, verbs, nouns, adjectives } each Record<string,number>
function POSChart({ data, title }: { data: { all: Record<string, number>; verbs: Record<string, number>; nouns: Record<string, number>; adjectives: Record<string, number> }; title: string }) {
  const tabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'verbs' as const, label: 'Verbs' },
    { key: 'nouns' as const, label: 'Nouns' },
    { key: 'adjectives' as const, label: 'Adjectives' },
  ]
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{title}</h3>
      <div className="space-y-4">
        {tabs.map(tab => (
          <div key={tab.key}>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wide">{tab.label}</p>
            <WordCloud data={data[tab.key]} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Word cloud via canvas-free tag cloud
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
          <span
            key={word}
            style={{ fontSize: `${size}px`, opacity }}
            className="font-medium text-indigo-600 dark:text-indigo-400 leading-tight"
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}

// TFIDF: Record<string, Array<{ skill: string; score: number }>>
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
                      <div
                        className="h-full bg-teal-400 dark:bg-teal-500 rounded-full"
                        style={{ width: `${(score / maxScore) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 w-10 text-right">
                      {score.toFixed(3)}
                    </span>
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

// Skills network: PMIEdge[] = Array<{ source, target, weight }>
function SkillsNetworkChart({ data, title }: { data: Array<{ source: string; target: string; weight: number }>; title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Collect top edges and unique nodes
  const edges = data.slice(0, 60)
  const nodeSet = new Set<string>()
  edges.forEach(e => { nodeSet.add(e.source); nodeSet.add(e.target) })
  const nodes = [...nodeSet]

  if (!edges.length) return <EmptyChart title={title} />

  // Simple static layout: place nodes in a circle, draw edges
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    const cx = W / 2, cy = H / 2
    const r = Math.min(W, H) * 0.38
    const N = nodes.length

    // Position nodes
    const positions: Record<string, { x: number; y: number }> = {}
    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / N - Math.PI / 2
      positions[node] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
    })

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const bgColor = isDark ? '#27272a' : '#f4f4f5'
    const edgeColor = isDark ? '#6366f1' : '#818cf8'
    const nodeColor = isDark ? '#a5b4fc' : '#4f46e5'
    const textColor = isDark ? '#e4e4e7' : '#18181b'

    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, W, H)

    const maxW = Math.max(...edges.map(e => e.weight), 1)

    // Draw edges
    edges.forEach(edge => {
      const a = positions[edge.source]
      const b = positions[edge.target]
      if (!a || !b) return
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.strokeStyle = edgeColor
      ctx.globalAlpha = 0.2 + (edge.weight / maxW) * 0.5
      ctx.lineWidth = 0.5 + (edge.weight / maxW) * 2
      ctx.stroke()
    })
    ctx.globalAlpha = 1

    // Draw nodes + labels
    nodes.forEach(node => {
      const pos = positions[node]
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 4, 0, 2 * Math.PI)
      ctx.fillStyle = nodeColor
      ctx.fill()
      ctx.font = '9px sans-serif'
      ctx.fillStyle = textColor
      ctx.textAlign = 'center'
      ctx.fillText(node, pos.x, pos.y - 7)
    })
  }, [edges, nodes])

  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">{title}</h3>
      <canvas
        ref={canvasRef}
        width={520}
        height={380}
        className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-700"
      />
    </div>
  )
}

// Swiss knife: SwissKnifeItem[]
function SwissKnifeChart({ data, title }: { data: Array<{ index: number; role: string | null; company: string | null; odi_tools: number | null; is_swiss_jd: boolean }>; title: string }) {
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

function EmptyChart({ title }: { title: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">{title}</h3>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">No data</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Map result name → friendly title key and chart type
// ---------------------------------------------------------------------------

type ChartType = 'freq' | 'pos' | 'tfidf' | 'network' | 'swiss'

function resolveChart(name: string): { type: ChartType; titleKey: string } {
  if (name === 'pos.responsibilities') return { type: 'pos', titleKey: 'posResponsibilities' }
  if (name === 'tfidf.skills')         return { type: 'tfidf', titleKey: 'tfidfSkills' }
  if (name === 'graph.skills')         return { type: 'network', titleKey: 'graphSkills' }
  if (name === 'swiss_knife')          return { type: 'swiss', titleKey: 'swissKnife' }
  // freq.*
  if (name === 'freq.role')                    return { type: 'freq', titleKey: 'freqRole' }
  if (name === 'freq.level')                   return { type: 'freq', titleKey: 'freqLevel' }
  if (name === 'freq.location')                return { type: 'freq', titleKey: 'freqLocation' }
  if (name === 'freq.programming_languages')   return { type: 'freq', titleKey: 'freqProgrammingLanguages' }
  if (name === 'freq.frameworks_tools')        return { type: 'freq', titleKey: 'freqFrameworksTools' }
  if (name === 'freq.cloud_platforms')         return { type: 'freq', titleKey: 'freqCloudPlatforms' }
  if (name === 'freq.databases')               return { type: 'freq', titleKey: 'freqDatabases' }
  if (name === 'freq.employment_type')         return { type: 'freq', titleKey: 'freqEmploymentType' }
  return { type: 'freq', titleKey: name }
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface ReportItemProps {
  result: { name: string; result: unknown }
}

export default function ReportItem({ result }: ReportItemProps) {
  const { t } = useLocale()
  const { type, titleKey } = resolveChart(result.name)
  const title = t(titleKey as Parameters<typeof t>[0])

  const data = result.result

  const renderChart = () => {
    if (type === 'freq' && data && typeof data === 'object' && !Array.isArray(data)) {
      return <FrequencyChart data={data as Record<string, number>} title={title} />
    }
    if (type === 'pos' && data && typeof data === 'object' && !Array.isArray(data)) {
      return <POSChart data={data as { all: Record<string, number>; verbs: Record<string, number>; nouns: Record<string, number>; adjectives: Record<string, number> }} title={title} />
    }
    if (type === 'tfidf' && data && typeof data === 'object' && !Array.isArray(data)) {
      return <TFIDFChart data={data as Record<string, Array<{ skill: string; score: number }>>} title={title} />
    }
    if (type === 'network' && Array.isArray(data)) {
      return <SkillsNetworkChart data={data as Array<{ source: string; target: string; weight: number }>} title={title} />
    }
    if (type === 'swiss' && Array.isArray(data)) {
      return <SwissKnifeChart data={data as Array<{ index: number; role: string | null; company: string | null; odi_tools: number | null; is_swiss_jd: boolean }>} title={title} />
    }
    return <EmptyChart title={title} />
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 shadow-sm">
      {renderChart()}
    </div>
  )
}
