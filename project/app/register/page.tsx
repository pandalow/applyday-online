'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register } from '@/app/actions/auth'
import type { AuthState } from '@/app/actions/auth'

export default function RegisterPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(register, undefined)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            ApplyDay
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Create a new account
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-5">
            Register
          </h2>

          <form action={action} className="space-y-4">
            {state?.errors?.general && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {state.errors.general.join(', ')}
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                required
                minLength={3}
                maxLength={50}
                autoComplete="username"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                placeholder="Choose a username (min 3 chars)"
              />
              {state?.errors?.username && (
                <p className="mt-1 text-xs text-red-500">{state.errors.username.join(', ')}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                placeholder="you@example.com"
              />
              {state?.errors?.email && (
                <p className="mt-1 text-xs text-red-500">{state.errors.email.join(', ')}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                placeholder="Minimum 8 characters"
              />
              {state?.errors?.password && (
                <p className="mt-1 text-xs text-red-500">{state.errors.password.join(', ')}</p>
              )}
            </div>

            {/* RSA Public Key */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                RSA Public Key{' '}
                <span className="font-normal text-zinc-400">(optional — enables key-based login)</span>
              </label>
              <textarea
                name="rsaPublicKey"
                rows={5}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-shadow"
                placeholder="-----BEGIN PUBLIC KEY-----&#10;MIIBIjANBgkqhkiG9w0BAQEFAAOC...&#10;-----END PUBLIC KEY-----"
              />
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Paste your PEM-encoded RSA public key to enable passwordless RSA login.
              </p>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 text-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {pending && (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              {pending ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
