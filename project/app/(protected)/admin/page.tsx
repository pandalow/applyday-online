'use client'

import { useEffect, useState } from 'react'

interface UserRow {
  id: string
  username: string
  email: string
  role: string
  createdAt: string
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  user:  'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => {
        if (!r.ok) throw new Error(r.status === 403 ? 'Access denied' : r.statusText)
        return r.json() as Promise<UserRow[]>
      })
      .then(data => { setUsers(data); setLoading(false) })
      .catch(err => { setError(err instanceof Error ? err.message : String(err)); setLoading(false) })
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Admin Panel
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          User management and system overview.
        </p>
      </div>

      {/* Stats bar */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Users', value: users.length },
            { label: 'Admins', value: users.filter(u => u.role === 'admin').length },
            { label: 'Regular Users', value: users.filter(u => u.role === 'user').length },
          ].map(s => (
            <div
              key={s.label}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {s.label}
              </p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Users table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Users
          </h2>
          {!loading && !error && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">{users.length} total</span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-zinc-200 dark:border-zinc-700 border-t-purple-500 animate-spin" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="px-5 py-8 text-center">
            <p className="text-red-600 dark:text-red-400 text-sm">Error: {error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && users.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-zinc-400 dark:text-zinc-600 text-sm">No users found.</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  {['Username', 'Email', 'Role', 'Joined'].map(h => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {users.map(user => (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-zinc-900 dark:text-white">
                      {user.username}
                    </td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                      {user.email}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[user.role] ?? ROLE_BADGE.user}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
