'use client'

import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

interface PieChartProps {
  data: Record<string, number>
  title?: string
}

const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#a855f7', '#d946ef', '#10b981', '#0ea5e9', '#f59e0b',
]

export default function PieChart({ data, title }: PieChartProps) {
  const entries = useMemo(
    () =>
      Object.entries(data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([name, value]) => ({ name, value })),
    [data],
  )

  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      title: title
        ? {
            text: title,
            left: 'center',
            textStyle: { fontSize: 14, fontWeight: 600, color: '#a1a1aa' },
          }
        : undefined,
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'rgba(24,24,27,0.9)',
        borderColor: '#3f3f46',
        textStyle: { color: '#f4f4f5', fontSize: 12 },
      },
      legend: {
        orient: 'vertical',
        right: '2%',
        top: 'center',
        textStyle: { color: '#a1a1aa', fontSize: 11 },
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
      },
      color: PALETTE,
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['38%', '55%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 4, borderColor: 'transparent', borderWidth: 2 },
          label: { show: false },
          labelLine: { show: false },
          emphasis: {
            label: { show: true, fontSize: 13, fontWeight: 'bold', color: '#f4f4f5' },
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
          },
          data: entries,
        },
      ],
    }),
    [entries, title],
  )

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400 dark:text-zinc-600 text-sm">
        No data
      </div>
    )
  }

  return (
    <ReactECharts
      option={option}
      style={{ width: '100%', height: 280 }}
      opts={{ renderer: 'canvas' }}
      notMerge
    />
  )
}
