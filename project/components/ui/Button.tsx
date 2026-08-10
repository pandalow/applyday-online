import React from 'react'

const VARIANTS = {
  primary:   'bg-indigo-600 hover:bg-indigo-700 text-white',
  secondary: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600',
  success:   'bg-emerald-600 hover:bg-emerald-700 text-white',
  danger:    'bg-red-600 hover:bg-red-700 text-white',
} as const

type Variant = keyof typeof VARIANTS

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors disabled:opacity-40',
        VARIANTS[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin shrink-0" />
      )}
      {children}
    </button>
  )
}
