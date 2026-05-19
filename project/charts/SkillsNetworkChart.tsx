'use client'

import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'

interface NetworkEdge {
  source: string
  target: string
  weight: number
}

interface SkillsNetworkChartProps {
  data: NetworkEdge[]
  title?: string
}

function nodeColor(degree: number, maxDegree: number): string {
  const ratio = maxDegree > 0 ? degree / maxDegree : 0
  if (ratio >= 0.66) return '#ef4444'      // red — high degree
  if (ratio >= 0.33) return '#f97316'      // orange — medium
  return '#3b82f6'                          // blue — low
}

export default function SkillsNetworkChart({ data, title }: SkillsNetworkChartProps) {
  const { nodes, edges } = useMemo(() => {
    // Collect all unique nodes and compute degree
    const degreeMap = new Map<string, number>()
    for (const edge of data) {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + edge.weight)
      degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + edge.weight)
    }

    const maxDegree = Math.max(0, ...degreeMap.values())

    const nodes = Array.from(degreeMap.entries()).map(([name, degree]) => ({
      id: name,
      name,
      value: degree,
      symbolSize: Math.max(8, Math.min(40, 8 + (degree / (maxDegree || 1)) * 32)),
      itemStyle: { color: nodeColor(degree, maxDegree) },
      label: {
        show: degree / (maxDegree || 1) > 0.15,
        fontSize: 10,
        color: '#f4f4f5',
      },
    }))

    const edges = data.map(e => ({
      source: e.source,
      target: e.target,
      value: e.weight,
      lineStyle: {
        width: Math.max(1, Math.min(6, e.weight * 0.5)),
        opacity: 0.5,
        color: '#52525b',
        curveness: 0.1,
      },
    }))

    return { nodes, edges }
  }, [data])

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
        show: true,
        formatter: (params: { dataType: string; name: string; value?: number; data?: { value?: number } }) => {
          if (params.dataType === 'node') {
            return `<b>${params.name}</b><br/>Connections: ${params.data?.value ?? 0}`
          }
          if (params.dataType === 'edge') {
            return `Co-occurrence: ${params.value}`
          }
          return params.name
        },
        backgroundColor: 'rgba(24,24,27,0.9)',
        borderColor: '#3f3f46',
        textStyle: { color: '#f4f4f5', fontSize: 12 },
      },
      legend: [
        {
          data: ['High', 'Medium', 'Low'],
          right: '2%',
          top: title ? 40 : 8,
          orient: 'vertical',
          textStyle: { color: '#a1a1aa', fontSize: 10 },
          icon: 'circle',
          itemWidth: 8,
          itemHeight: 8,
        },
      ],
      series: [
        {
          type: 'graph',
          layout: 'force',
          animation: true,
          draggable: true,
          roam: true,
          zoom: 1,
          data: nodes,
          links: edges,
          force: {
            repulsion: 200,
            gravity: 0.1,
            edgeLength: [80, 200],
            layoutAnimation: true,
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: { width: 4 },
          },
          lineStyle: { color: 'source', curveness: 0.1 },
        },
      ],
    }),
    [nodes, edges, title],
  )

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400 dark:text-zinc-600 text-sm">
        No data
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Legend hint */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 text-[10px] font-medium">
        {[
          { label: 'High', color: '#ef4444' },
          { label: 'Medium', color: '#f97316' },
          { label: 'Low', color: '#3b82f6' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: color }}
            />
            <span className="text-zinc-400 dark:text-zinc-500">{label}</span>
          </div>
        ))}
      </div>

      <ReactECharts
        option={option}
        style={{ width: '100%', height: 480 }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
    </div>
  )
}
