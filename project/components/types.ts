// Shared domain types for ApplyDay components

export type Application = {
  id: string
  company: string
  jobTitle: string
  status: string
  applicationDate: string
  createdAt: string
  stageNotes?: string
  channel?: string
}

export type JobDescription = {
  id: string
  jobTextId: string
  company?: string
  role?: string
  level?: string
  location?: string
  employmentType?: string
  salaryEurMin?: number
  salaryEurMax?: number
  benefits?: string[]
  responsibilities?: string[]
  requiredCoreSkills?: string[]
  desirableSkills?: string[]
  programmingLanguages?: string[]
  frameworksTools?: string[]
  databases?: string[]
  cloudPlatforms?: string[]
  remoteWork?: string
}

export type JDText = {
  id: string
  text: string
  createdAt: string
  applicationId?: string
  jobDescription?: JobDescription
}

export type Resume = {
  id: string
  name: string
  text: string
  uploadedAt: string
}

export type AnalysisReport = {
  id: string
  status: 'pending' | 'done' | 'failed'
  createdAt: string
  results?: Array<{ id: string; name: string; result: unknown }>
  summaries?: Array<{ id: string; content: string; createdAt: string }>
}
