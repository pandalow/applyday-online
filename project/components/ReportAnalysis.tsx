'use client'

import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

interface ReportAnalysisProps {
  content: string
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-zinc-900 dark:text-white mt-6 mb-3 border-b border-zinc-200 dark:border-zinc-700 pb-2">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mt-5 mb-2">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mt-4 mb-2">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-1 mb-3 pl-2">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1 mb-3 pl-2">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
      {children}
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-900 dark:text-white">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-zinc-600 dark:text-zinc-400">{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-indigo-400 dark:border-indigo-500 pl-4 py-1 my-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-r-md">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.startsWith('language-')
    if (isBlock) {
      return (
        <pre className="bg-zinc-900 dark:bg-zinc-950 rounded-lg px-4 py-3 overflow-x-auto my-3">
          <code className="text-xs font-mono text-green-400">{children}</code>
        </pre>
      )
    }
    return (
      <code className="bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 rounded text-xs font-mono">
        {children}
      </code>
    )
  },
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border-collapse border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-zinc-100 dark:bg-zinc-700">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
      {children}
    </td>
  ),
  hr: () => <hr className="my-4 border-zinc-200 dark:border-zinc-700" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
    >
      {children}
    </a>
  ),
}

export default function ReportAnalysis({ content }: ReportAnalysisProps) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert px-1">
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
