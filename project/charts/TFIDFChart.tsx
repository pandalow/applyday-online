'use client'

import ReactECharts from 'echarts-for-react'
import { useMemo, useState } from 'react'

interface TFIDFEntry {
  skill: string
  score: number
}

interface TFIDFChartProps {
  data: Record<string, TFIDFEntry[]>
  title?: string
}

export default function TFIDFChart({ data, title }: TFIDFChartProps) {
  const roles = useMemo(() => Object.keys(data), [data])
  const [activeRole, setActiveRole] = useState<string>(() => roles[0] ?? '')

  const activeData = useMemo(() => {
    const entries = (data[activeRole] ?? [])
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
    return entries
  }, [data, activeRole])

  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(24,24,27,0.9)',
        borderColor: '#3f3f46',
        textStyle: { color: '#f4f4f5', fontSize: 12 },
        formatter: (params: Array<{ name: string; value: number }>) => {
          const p = params[0]
          return `${p.name}: ${Number(p.value).toFixed(4)}`
        },
      },
      grid: {
        left: '3%',
        right: '10%',
        bottom: '3%',
        top: 16,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#3f3f46' } },
        splitLine: { lineStyle: { color: '#27272a', type: 'dashed' } },
        axisLabel: {
          color: '#a1a1aa',
          fontSize: 10,
          formatter: (v: number) => v.toFixed(3),
        },
      },
      yAxis: {
        type: 'category',
        data: [...activeData].reverse().map(e => e.skill),
        axisLine: { lineStyle: { color: '#3f3f46' } },
        axisLabel: { color: '#a1a1aa', fontSize: 11 },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: [...activeData].reverse().map(e => e.score),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#6366f1' },
                { offset: 1, color: '#8b5cf6' },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
          emphasis: { itemStyle: { opacity: 0.85 } },
          label: {
            show: true,
            position: 'right',
            color: '#a1a1aa',
            fontSize: 10,
            formatter: (p: { value: number }) => p.value.toFixed(3),
          },
        },
      ],
    }),
    [activeData],
  )

  if (roles.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400 dark:text-zinc-600 text-sm">
        No data
      </div>
    )
  }

  const chartHeight = Math.max(200, activeData.length * 28 + 24)

  return (
    <div className="space-y-3">
      {title && (
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 text-center tracking-wide">
          {title}
        </p>
      )}

      {/* Role tabs */}
      <div className="flex flex-wrap gap-1.5">
        {roles.map(role => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              activeRole === role
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Chart */}
      {activeData.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-zinc-400 dark:text-zinc-600 text-sm">
          No skills for this role
        </div>
      ) : (
        <ReactECharts
          option={option}
          style={{ width: '100%', height: chartHeight }}
          opts={{ renderer: 'canvas' }}
          notMerge
        />
      )}
    </div>
  )
}
