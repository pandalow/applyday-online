import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-indigo-950 py-24 px-6">
          {/* Background orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-300/20 dark:bg-indigo-700/10 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-purple-300/20 dark:bg-purple-700/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-700 mb-6">
              Job Application Manager &amp; Market Analysis
            </span>

            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight mb-6">
              Land your next job
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                smarter &amp; faster
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 mb-10">
              ApplyDay helps you track applications, extract insights from job descriptions,
              generate market reports, and get personalized AI career guidance — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-colors"
              >
                Get Started — it&apos;s free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 px-8 py-3.5 text-base font-semibold text-zinc-800 dark:text-zinc-200 transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-6 bg-white dark:bg-zinc-950">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-white mb-3">
              Everything you need
            </h2>
            <p className="text-center text-zinc-500 dark:text-zinc-400 mb-14">
              From tracking to insights — the full job-search stack.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map(f => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  <div className="mb-4 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats banner */}
        <section className="bg-indigo-600 dark:bg-indigo-700 py-12 px-6">
          <div className="mx-auto max-w-4xl grid sm:grid-cols-3 gap-8 text-center text-white">
            {[
              { value: '100%', label: 'Open Source' },
              { value: 'AI-Powered', label: 'Market Insights' },
              { value: 'Zero', label: 'Vendor Lock-in' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-4xl font-extrabold mb-1">{s.value}</p>
                <p className="text-indigo-200 text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 bg-white dark:bg-zinc-950 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">
            Ready to take control of your job search?
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">
            Create your free account and start tracking today.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-colors"
          >
            Create Free Account
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}

const FEATURES = [
  {
    title: 'Application Tracking',
    description:
      'Log every application with status, stage notes, and timeline. Never lose track of where you stand.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'JD Analysis',
    description:
      'Paste raw job descriptions and let AI extract structured data: skills, salary, level, remote policy, and more.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Market Reports',
    description:
      'Generate visual reports across your JD collection — skill frequencies, TF-IDF rankings, co-occurrence networks.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'AI Insights',
    description:
      'Upload your resume and get personalised gap-analysis, prioritisation advice, and career recommendations.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
]
