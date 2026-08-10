// Shared UI class tokens — import these instead of writing raw Tailwind strings.
// Rule: one semantic name, one string. Never duplicate or fork these per-component.

// ─── Cards ────────────────────────────────────────────────────────────────────
export const card        = 'bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm'
export const cardHeader  = 'px-4 py-3 border-b border-zinc-100 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30'
export const cardBody    = 'px-4 py-4'

// ─── Buttons ──────────────────────────────────────────────────────────────────
export const btnPrimary   = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors'
export const btnSecondary = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-40 transition-colors'
export const btnSuccess   = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-colors'
export const btnDanger    = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-40 transition-colors'
// Icon-only ghost — wraps an svg, no text
export const btnGhost     = 'p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors'
export const btnGhostDanger = 'p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'

// ─── Inputs ───────────────────────────────────────────────────────────────────
// Base (apply to input / select)
export const inputBase = 'w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500'
// With placeholder colours (apply to input / textarea)
export const inputField   = `${inputBase} placeholder-zinc-400 dark:placeholder-zinc-500`
export const textareaField = `${inputField} resize-y`

// ─── Typography ───────────────────────────────────────────────────────────────
// Section / sub-section labels (ALL CAPS, small, muted)
export const sectionLabel = 'text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider'
// Form field label
export const fieldLabel   = 'block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1'

// ─── Alerts ───────────────────────────────────────────────────────────────────
export const alertAmber = 'flex items-center justify-between gap-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3'
export const alertRed   = 'rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400'
