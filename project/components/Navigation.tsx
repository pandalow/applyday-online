'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from '@/locales'

interface User {
  id: string
  username: string
  email: string
  role: string
}

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, lang, setLang } = useLocale()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => (r.ok ? r.json() : null))
      .then((data: User | null) => setUser(data))
      .catch(() => setUser(null))
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/wizard', label: t('quickStart') },
    { href: '/app', label: t('application') },
    { href: '/workspace', label: t('workspace') },
    { href: '/market', label: t('market') },
    ...(user?.role === 'admin' ? [{ href: '/admin', label: t('admin') }] : []),
  ]

  const initials = user?.username?.[0]?.toUpperCase() ?? '?'

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 px-4 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      {/* Brand + nav links */}
      <div className="flex items-center gap-1">
        <span className="font-bold text-zinc-900 dark:text-white tracking-tight mr-3 text-lg">
          ApplyDay
        </span>
        <div className="hidden sm:flex items-center gap-0.5">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <div className="flex rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs font-medium">
          {(['en', 'zh'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1.5 transition-colors ${
                lang === l
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* User dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                dropdownOpen
                  ? 'bg-zinc-100 dark:bg-zinc-800'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
                {initials}
              </div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden sm:block max-w-[120px] truncate">
                {user.username}
              </span>
              <svg
                className={`w-3.5 h-3.5 text-zinc-400 transition-transform hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-lg overflow-hidden z-50">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-700">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{user.username}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{user.email}</p>
                </div>

                {/* Profile */}
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    pathname === '/profile'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60'
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t('profile')}
                </Link>

                {/* Settings */}
                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    pathname === '/settings'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/60'
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t('settings')}
                </Link>

                <div className="border-t border-zinc-100 dark:border-zinc-700" />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 py-2 px-4 flex flex-col gap-1 shadow-lg z-50">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-zinc-100 dark:border-zinc-700 mt-1 pt-1">
            <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              {t('profile')}
            </Link>
            <Link href="/settings" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              {t('settings')}
            </Link>
            <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
              {t('logout')}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
