export const STATUS_OPTIONS = ['prepared', 'applied', 'interviewed', 'offered', 'rejected'] as const
export type ApplicationStatus = typeof STATUS_OPTIONS[number]

export const STATUS_COLORS: Record<string, string> = {
  prepared:    'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
  applied:     'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  interviewed: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  offered:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}
