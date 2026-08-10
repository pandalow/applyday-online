'use client'

import { useState, useEffect } from 'react'
import { useLocale } from '@/locales'
import { card, cardHeader, sectionLabel, fieldLabel, inputField, textareaField } from '@/app/lib/styles'
import Button from '@/components/ui/Button'
import ResumeManager from '@/components/ResumeManager'

interface UserInfo {
  id: string
  username: string
  email: string
  avatarUrl: string | null
}

interface ProfileData {
  headline: string | null
  bio: string | null
  skills: string | null
  location: string | null
  phone: string | null
  linkedinUrl: string | null
}

export default function ProfilePage() {
  const { t } = useLocale()

  const [user, setUser] = useState<UserInfo | null>(null)
  const [form, setForm] = useState<ProfileData>({
    headline: '', bio: '', skills: '', location: '', phone: '', linkedinUrl: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then((data: { user: UserInfo; profile: ProfileData | null } | null) => {
        if (!data) return
        setUser(data.user)
        if (data.profile) {
          setForm({
            headline:    data.profile.headline ?? '',
            bio:         data.profile.bio ?? '',
            skills:      data.profile.skills ?? '',
            location:    data.profile.location ?? '',
            phone:       data.profile.phone ?? '',
            linkedinUrl: data.profile.linkedinUrl ?? '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof ProfileData) => ({
    value: form[key] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value })),
  })

  const initials = user?.username?.[0]?.toUpperCase() ?? '?'

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 flex items-center gap-3 text-zinc-400">
        <div className="w-5 h-5 rounded-full border-2 border-zinc-300 border-t-indigo-500 animate-spin" />
        Loading…
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('profile')}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{t('profileDesc')}</p>
      </div>

      {/* Account info (read-only) */}
      <div className={`${card} p-5 flex items-center gap-4`}>
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-zinc-900 dark:text-white">{user?.username}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{user?.email}</p>
        </div>
      </div>

      {/* Professional profile */}
      <div className={`${card} overflow-hidden`}>
        <div className={cardHeader}>
          <h2 className={sectionLabel}>{t('professionalProfile')}</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={fieldLabel}>{t('profileHeadline')}</label>
            <input
              type="text"
              placeholder={t('profileHeadlinePlaceholder')}
              className={inputField}
              {...field('headline')}
            />
          </div>

          <div>
            <label className={fieldLabel}>{t('profileBio')}</label>
            <textarea
              rows={5}
              placeholder={t('profileBioPlaceholder')}
              className={textareaField}
              {...field('bio')}
            />
          </div>

          <div>
            <label className={fieldLabel}>{t('profileSkills')}</label>
            <textarea
              rows={3}
              placeholder={t('profileSkillsPlaceholder')}
              className={textareaField}
              {...field('skills')}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={fieldLabel}>{t('profileLocation')}</label>
              <input type="text" placeholder="e.g. Berlin, Germany" className={inputField} {...field('location')} />
            </div>
            <div>
              <label className={fieldLabel}>{t('profilePhone')}</label>
              <input type="text" placeholder="+49 123 456789" className={inputField} {...field('phone')} />
            </div>
          </div>

          <div>
            <label className={fieldLabel}>LinkedIn</label>
            <input
              type="url"
              placeholder="https://linkedin.com/in/your-profile"
              className={inputField}
              {...field('linkedinUrl')}
            />
          </div>

          <div className="pt-1 flex items-center gap-3">
            <Button onClick={handleSave} loading={saving}>
              {saved ? '✓ Saved' : t('saveProfile')}
            </Button>
            {saved && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">{t('profileSaved')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Resumes */}
      <div className={`${card} overflow-hidden`}>
        <div className={cardHeader}>
          <h2 className={sectionLabel}>{t('resumes')}</h2>
        </div>
        <div className="p-5">
          <ResumeManager />
        </div>
      </div>
    </div>
  )
}
