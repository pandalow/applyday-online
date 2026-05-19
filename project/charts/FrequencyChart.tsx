'use client'

import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

interface FrequencyChartProps {
  data: Record<string, number>
  title?: string
  color?: string
}

export default function FrequencyChart({
  data,
  title,
  color = '#6366f1',
}: FrequencyChartProps) {
  const sorted = useMemo(
    () =>
      Object.entries(data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 30),
    [data],
  )

  const categories = sorted.map(([k]) => k)
  const values = sorted.map(([, v]) => v)

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
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(24,24,27,0.9)',
        borderColor: '#3f3f46',
        textStyle: { color: '#f4f4f5', fontSize: 12 },
      },
      grid: {
        left: '3%',
        right: '8%',
        bottom: '3%',
        top: title ? 50 : 16,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#3f3f46' } },
        splitLine: { lineStyle: { color: '#27272a', type: 'dashed' } },
        axisLabel: { color: '#a1a1aa', fontSize: 11 },
      },
      yAxis: {
        type: 'category',
        data: [...categories].reverse(),
        axisLine: { lineStyle: { color: '#3f3f46' } },
        axisLabel: {
          color: '#a1a1aa',
          fontSize: 11,
          width: 120,
          overflow: 'truncate',
          ellipsis: '…',
        },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: [...values].reverse(),
          itemStyle: {
            color,
            borderRadius: [0, 4, 4, 0],
          },
          emphasis: {
            itemStyle: { opacity: 0.85 },
          },
          label: {
            show: true,
            position: 'right',
            color: '#a1a1aa',
            fontSize: 11,
          },
        },
      ],
    }),
    [categories, values, title, color],
  )

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400 dark:text-zinc-600 text-sm">
        No data
      </div>
    )
  }

  const height = Math.max(200, sorted.length * 28 + (title ? 60 : 24))

  return (
    <ReactECharts
      option={option}
      style={{ width: '100%', height }}
      opts={{ renderer: 'canvas' }}
      notMerge
    />
  )
}
