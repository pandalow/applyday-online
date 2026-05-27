import {
  pgTable, uuid, varchar, text, timestamp, integer,
  real, boolean, jsonb, index, pgEnum
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'user'])
export const applicationStatusEnum = pgEnum('application_status', [
  'prepared', 'applied', 'interviewed', 'offered', 'rejected'
])
export const remoteworkEnum = pgEnum('remote_work', ['on-site', 'hybrid', 'remote'])
export const employmentTypeEnum = pgEnum('employment_type', [
  'full_time', 'contract', 'internship', 'part_time'
])
export const levelEnum = pgEnum('level', [
  'intern', 'junior', 'mid', 'senior', 'lead', 'manager'
])

// Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  googleId: varchar('google_id', { length: 255 }).unique(),
  avatarUrl: text('avatar_url'),
  rsaPublicKey: text('rsa_public_key'),
  role: userRoleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({ emailIdx: index('users_email_idx').on(t.email) }))

// Job Applications
export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  company: varchar('company', { length: 255 }).notNull(),
  jobTitle: varchar('job_title', { length: 255 }).notNull(),
  applicationDate: timestamp('application_date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  status: applicationStatusEnum('status').default('prepared').notNull(),
  stageNotes: text('stage_notes'),
  channel: varchar('channel', { length: 100 }),
}, (t) => ({
  userIdx: index('applications_user_idx').on(t.userId),
  statusIdx: index('applications_status_idx').on(t.status),
}))

// Job Description Text (raw)
export const jobDescriptionTexts = pgTable('job_description_texts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'set null' }),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({ userIdx: index('jdt_user_idx').on(t.userId) }))

// Job Description (structured/extracted)
export const jobDescriptions = pgTable('job_descriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobTextId: uuid('job_text_id').notNull().unique().references(() => jobDescriptionTexts.id, { onDelete: 'cascade' }),
  company: varchar('company', { length: 255 }),
  role: varchar('role', { length: 255 }),
  level: levelEnum('level'),
  location: varchar('location', { length: 255 }),
  employmentType: employmentTypeEnum('employment_type'),
  salaryEurMin: real('salary_eur_min'),
  salaryEurMax: real('salary_eur_max'),
  bonusPercent: real('bonus_percent'),
  yearsExperienceMin: integer('years_experience_min'),
  yearsExperienceMax: integer('years_experience_max'),
  educationRequired: text('education_required'),
  benefits: jsonb('benefits').$type<string[]>().default([]),
  responsibilities: jsonb('responsibilities').$type<string[]>().default([]),
  requiredCoreSkills: jsonb('required_core_skills').$type<string[]>().default([]),
  desirableSkills: jsonb('desirable_skills').$type<string[]>().default([]),
  programmingLanguages: jsonb('programming_languages').$type<string[]>().default([]),
  frameworksTools: jsonb('frameworks_tools').$type<string[]>().default([]),
  databases: jsonb('databases').$type<string[]>().default([]),
  cloudPlatforms: jsonb('cloud_platforms').$type<string[]>().default([]),
  apiProtocols: jsonb('api_protocols').$type<string[]>().default([]),
  methodologies: jsonb('methodologies').$type<string[]>().default([]),
  mobileTechnologies: jsonb('mobile_technologies').$type<string[]>().default([]),
  domainKeywords: jsonb('domain_keywords').$type<string[]>().default([]),
  languageRequirements: jsonb('language_requirements').$type<string[]>().default([]),
  remoteWork: remoteworkEnum('remote_work'),
  workPermitRequired: boolean('work_permit_required'),
  visaSponsorship: boolean('visa_sponsorship'),
  contactPerson: varchar('contact_person', { length: 255 }),
  contactEmailOrPhone: varchar('contact_email_or_phone', { length: 255 }),
  industry: varchar('industry', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Resume Texts
export const resumeTexts = pgTable('resume_texts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  text: text('text').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
}, (t) => ({ userIdx: index('resumes_user_idx').on(t.userId) }))

// Analysis Reports
export const reportStatusEnum = pgEnum('report_status', ['pending', 'done', 'failed'])

export const analysisReports = pgTable('analysis_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: reportStatusEnum('status').default('done').notNull(),
  applicationIds: jsonb('application_ids').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({ userIdx: index('reports_user_idx').on(t.userId) }))

// Application OKRs (AI-generated per application)
export const applicationOkrs = pgTable('application_okrs', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  language: varchar('language', { length: 10 }).default('en').notNull(),
  content: jsonb('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  appIdx: index('okrs_app_idx').on(t.applicationId),
  userIdx: index('okrs_user_idx').on(t.userId),
}))

// Password Reset Tokens
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Resume Suggestions (AI-generated per application + resume pair)
export type SuggestionStatus = 'pending' | 'accepted' | 'dismissed'
export type SuggestionType = 'keyword_gap' | 'quantify' | 'reframe' | 'add_section'
export interface SuggestionItem {
  id: string
  type: SuggestionType
  section: string
  original?: string
  text: string
  reason: string
  status: SuggestionStatus
}

export const resumeSuggestions = pgTable('resume_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id').notNull().references(() => applications.id, { onDelete: 'cascade' }),
  resumeId: uuid('resume_id').notNull().references(() => resumeTexts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  suggestions: jsonb('suggestions').$type<SuggestionItem[]>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  appIdx: index('resume_sug_app_idx').on(t.applicationId),
}))

export const resumeSuggestionsRelations = relations(resumeSuggestions, ({ one }) => ({
  application: one(applications, { fields: [resumeSuggestions.applicationId], references: [applications.id] }),
  resume: one(resumeTexts, { fields: [resumeSuggestions.resumeId], references: [resumeTexts.id] }),
  user: one(users, { fields: [resumeSuggestions.userId], references: [users.id] }),
}))

// Analysis Results
export const analysisResults = pgTable('analysis_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').notNull().references(() => analysisReports.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  result: jsonb('result'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Summaries (AI-generated insights)
export const summaries = pgTable('summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportId: uuid('report_id').notNull().references(() => analysisReports.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
  jobDescriptionTexts: many(jobDescriptionTexts),
  resumeTexts: many(resumeTexts),
  analysisReports: many(analysisReports),
}))

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  jobDescriptionText: one(jobDescriptionTexts, {
    fields: [applications.id],
    references: [jobDescriptionTexts.applicationId],
  }),
  okrs: many(applicationOkrs),
}))

export const applicationOkrsRelations = relations(applicationOkrs, ({ one }) => ({
  application: one(applications, { fields: [applicationOkrs.applicationId], references: [applications.id] }),
  user: one(users, { fields: [applicationOkrs.userId], references: [users.id] }),
}))

export const jobDescriptionTextsRelations = relations(jobDescriptionTexts, ({ one }) => ({
  user: one(users, { fields: [jobDescriptionTexts.userId], references: [users.id] }),
  application: one(applications, {
    fields: [jobDescriptionTexts.applicationId],
    references: [applications.id],
  }),
  jobDescription: one(jobDescriptions, {
    fields: [jobDescriptionTexts.id],
    references: [jobDescriptions.jobTextId],
  }),
}))

export const jobDescriptionsRelations = relations(jobDescriptions, ({ one }) => ({
  jobText: one(jobDescriptionTexts, {
    fields: [jobDescriptions.jobTextId],
    references: [jobDescriptionTexts.id],
  }),
}))

export const resumeTextsRelations = relations(resumeTexts, ({ one }) => ({
  user: one(users, { fields: [resumeTexts.userId], references: [users.id] }),
}))

export const analysisReportsRelations = relations(analysisReports, ({ one, many }) => ({
  user: one(users, { fields: [analysisReports.userId], references: [users.id] }),
  results: many(analysisResults),
  summaries: many(summaries),
}))

export const analysisResultsRelations = relations(analysisResults, ({ one }) => ({
  report: one(analysisReports, {
    fields: [analysisResults.reportId],
    references: [analysisReports.id],
  }),
}))

export const summariesRelations = relations(summaries, ({ one }) => ({
  report: one(analysisReports, {
    fields: [summaries.reportId],
    references: [analysisReports.id],
  }),
}))
