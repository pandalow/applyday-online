'use client'

import { useState, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import type { AuthState } from '@/app/actions/auth'

const OAUTH_ERRORS: Record<string, string> = {
  oauth_invalid: 'OAuth state mismatch. Please try again.',
  oauth_failed: 'Google sign-in failed. Please try again.',
  email_not_verified: 'Your Google account email is not verified.',
}

type Tab = 'password' | 'rsa'

// ---- Password Login Form ----
function PasswordLoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, undefined)

  return (
    <form action={action} className="space-y-4">
      {state?.errors?.general && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {state.errors.general.join(', ')}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Username
        </label>
        <input
          type="text"
          name="username"
          required
          autoComplete="username"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
          placeholder="your_username"
        />
        {state?.errors?.username && (
          <p className="mt-1 text-xs text-red-500">{state.errors.username.join(', ')}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Password
        </label>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
          placeholder="••••••••"
        />
        {state?.errors?.password && (
          <p className="mt-1 text-xs text-red-500">{state.errors.password.join(', ')}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
      >
        {pending && (
          <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
        )}
        {pending ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  )
}

// ---- RSA Login Form ----
type RsaStep = 'username' | 'sign'

function RsaLoginForm() {
  const [step, setStep] = useState<RsaStep>('username')
  const [username, setUsername] = useState('')
  const [challenge, setChallenge] = useState('')
  const [nonce, setNonce] = useState('')
  const [signature, setSignature] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGetChallenge = async () => {
    if (!username.trim()) {
      setError('Please enter your username first.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/auth/challenge?username=${encodeURIComponent(username)}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? res.statusText)
      }
      const data = await res.json() as { challenge: string; nonce: string }
      setChallenge(data.challenge)
      setNonce(data.nonce)
      setStep('sign')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleRsaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/rsa-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, challenge, signature }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? res.statusText)
      }
      // Redirect after RSA login success
      window.location.href = '/app'
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Step 1: Enter username */}
      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
          Username
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setStep('username') }}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            placeholder="your_username"
            disabled={step === 'sign'}
          />
          {step === 'username' && (
            <button
              type="button"
              onClick={handleGetChallenge}
              disabled={loading}
              className="shrink-0 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold px-4 py-2.5 transition-colors flex items-center gap-1"
            >
              {loading && (
                <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              Get Challenge
            </button>
          )}
          {step === 'sign' && (
            <button
              type="button"
              onClick={() => { setStep('username'); setChallenge(''); setNonce(''); setSignature('') }}
              className="shrink-0 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-semibold px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Step 2: Show challenge + signature */}
      {step === 'sign' && challenge && (
        <form onSubmit={handleRsaSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nonce{' '}
              <span className="font-normal text-zinc-400">(sign this exact string with your RSA private key)</span>
            </label>
            <div className="relative">
              <pre className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5 text-xs font-mono text-zinc-800 dark:text-zinc-300 break-all whitespace-pre-wrap">
                {nonce}
              </pre>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(nonce)}
                className="absolute top-2 right-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Copy
              </button>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              Sign with: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">openssl dgst -sha256 -sign private.pem -out sig.bin &lt;(echo -n &quot;NONCE&quot;) &amp;&amp; base64 sig.bin</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Signature <span className="font-normal text-zinc-400">(base64 RSA-SHA256)</span>
            </label>
            <textarea
              value={signature}
              onChange={e => setSignature(e.target.value)}
              required
              rows={4}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-shadow"
              placeholder="base64-encoded signature…"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !signature.trim()}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            )}
            {loading ? 'Verifying…' : 'Sign In with RSA Key'}
          </button>
        </form>
      )}
    </div>
  )
}

// ---- Main Page ----
export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('password')
  const searchParams = useSearchParams()
  const oauthError = searchParams.get('error')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            ApplyDay
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to your account
          </p>
        </div>

        {oauthError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400 mb-4">
            {OAUTH_ERRORS[oauthError] ?? 'Sign-in failed. Please try again.'}
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            {(['password', 'rsa'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === t
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                    : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 border-b-2 border-transparent'
                }`}
              >
                {t === 'password' ? 'Password Login' : 'RSA Key Login'}
              </button>
            ))}
          </div>

          {/* Form area */}
          <div className="p-6 space-y-5">
            {tab === 'password' ? <PasswordLoginForm /> : <RsaLoginForm />}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-zinc-200 dark:border-zinc-700" />
              <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0">or</span>
              <div className="flex-1 border-t border-zinc-200 dark:border-zinc-700" />
            </div>

            {/* Google OAuth */}
            <a
              href="/api/auth/google"
              className="flex items-center justify-center gap-3 w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </a>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
