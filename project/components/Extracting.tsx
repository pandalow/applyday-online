'use client'

interface ExtractingProps {
  message?: string
}

export default function Extracting({ message }: ExtractingProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      {/* Animated spinner */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-700" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
      </div>
      {/* Status message */}
      <p className="text-sm text-zinc-600 dark:text-zinc-400 animate-pulse">
        {message ?? 'Extracting…'}
      </p>
    </div>
  )
}
