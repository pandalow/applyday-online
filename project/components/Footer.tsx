'use client'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-4 px-6 mt-auto">
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
        &copy; {year} ApplyDay &mdash; Job Application Manager &amp; Market Analysis
      </p>
    </footer>
  )
}
