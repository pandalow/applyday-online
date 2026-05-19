'use client'

import 'echarts-wordcloud'
import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

interface WordCloudChartProps {
  data: Record<string, number>
  title?: string
}

const PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#a855f7', '#d946ef', '#10b981', '#0ea5e9', '#f59e0b',
]

function randomColor(): string {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)]
}

export default function WordCloudChart({ data, title }: WordCloudChartProps) {
  const words = useMemo(
    () =>
      Object.entries(data)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 120)
        .map(([name, value]) => ({ name, value, textStyle: { color: randomColor() } })),
    [data],
  )

  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      title: title
        ? {
            text: title,
            left: 'center',
            textStyle: {
              fontSize: 14,
              fontWeight: 600,
              color: '#a1a1aa',
            },
          }
        : undefined,
      tooltip: {
        show: true,
        formatter: (params: { name: string; value: number }) =>
          `${params.name}: ${params.value}`,
      },
      series: [
        {
          type: 'wordCloud',
          shape: 'circle',
          keepAspect: false,
          left: 'center',
          top: title ? 40 : 'center',
          width: '90%',
          height: title ? 'calc(100% - 50px)' : '90%',
          right: null,
          bottom: null,
          sizeRange: [12, 56],
          rotationRange: [-45, 45],
          rotationStep: 15,
          gridSize: 8,
          drawOutOfBound: false,
          layoutAnimation: true,
          textStyle: {
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
          },
          emphasis: {
            focus: 'self',
            textStyle: {
              textShadowBlur: 10,
              textShadowColor: 'rgba(99,102,241,0.5)',
            },
          },
          data: words,
        },
      ],
    }),
    [words, title],
  )

  if (words.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400 dark:text-zinc-600 text-sm">
        No data
      </div>
    )
  }

  return (
    <ReactECharts
      option={option}
      style={{ width: '100%', height: 320 }}
      opts={{ renderer: 'canvas' }}
      notMerge
    />
  )
}
