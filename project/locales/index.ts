'use client'

import { useState, useEffect, useCallback } from 'react'

export type Lang = 'en' | 'zh'

const STORAGE_KEY = 'applyday-lang'
const EVENT_NAME = 'applyday-lang-change'

const translations = {
  en: {
    // Nav
    home: 'Home',
    application: 'Application',
    report: 'Report',
    extract: 'Extract',
    admin: 'Admin',
    logout: 'Logout',
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    refresh: 'Refresh',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    all: 'All',
    none: 'None',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    upload: 'Upload',
    download: 'Download',
    generate: 'Generate',
    extract_btn: 'Extract',
    extracting: 'Extracting...',
    // Applications
    company: 'Company',
    jobTitle: 'Job Title',
    status: 'Status',
    stageNotes: 'Stage Notes',
    applicationDate: 'Application Date',
    prepared: 'Prepared',
    applied: 'Applied',
    interviewed: 'Interviewed',
    offered: 'Offered',
    rejected: 'Rejected',
    totalApplications: 'Total Applications',
    conversionFunnel: 'Conversion Funnel',
    newApplication: 'New Application',
    editApplication: 'Edit Application',
    sortBy: 'Sort by',
    filterByStatus: 'Filter by Status',
    sortDate: 'Date',
    sortCompany: 'Company',
    sortStatus: 'Status',
    // JD / Extract
    jobDescription: 'Job Description',
    rawText: 'Raw JD Text',
    enterJDText: 'Enter raw job description text here...',
    extracted: 'Extracted',
    notExtracted: 'Not extracted',
    linkedApplication: 'Linked Application',
    noLinkedApp: 'No linked application',
    textPreview: 'Text Preview',
    // JD Fields
    role: 'Role',
    level: 'Level',
    location: 'Location',
    employmentType: 'Employment Type',
    remoteWork: 'Remote Work',
    salaryRange: 'Salary Range',
    benefits: 'Benefits',
    responsibilities: 'Responsibilities',
    requiredSkills: 'Required Core Skills',
    desirableSkills: 'Desirable Skills',
    programmingLanguages: 'Programming Languages',
    frameworksTools: 'Frameworks & Tools',
    databases: 'Databases',
    cloudPlatforms: 'Cloud Platforms',
    // Resumes
    resume: 'Resume',
    resumes: 'Resumes',
    uploadResume: 'Upload Resume',
    uploadPDF: 'Upload PDF (max 10 MB)',
    noResumes: 'No resumes uploaded yet.',
    characters: 'characters',
    selectedResume: 'Selected',
    selectResume: 'Select',
    // Reports
    newReport: 'New Report',
    reports: 'Reports',
    noReports: 'No reports yet.',
    allApplications: 'All Applications',
    selectedByIds: 'Selected Job Descriptions',
    dateRange: 'Date Range',
    language: 'Language',
    english: 'English',
    chinese: 'Chinese',
    generateReport: 'Generate Report',
    generateInsight: 'Generate AI Insight',
    visualizations: 'Visualizations',
    aiAnalysis: 'AI Analysis',
    noResults: 'No results available.',
    noSummaries: 'No AI summaries yet. Generate one above.',
    // Chart titles
    freqRole: 'Role Frequency',
    freqLevel: 'Level Distribution',
    freqLocation: 'Location Distribution',
    freqProgrammingLanguages: 'Programming Languages',
    freqFrameworksTools: 'Frameworks & Tools',
    freqCloudPlatforms: 'Cloud Platforms',
    freqDatabases: 'Databases',
    freqEmploymentType: 'Employment Type',
    posResponsibilities: 'Responsibilities Word Analysis',
    tfidfSkills: 'TF-IDF Skill Scores by Role',
    graphSkills: 'Skills Co-occurrence Network',
    swissKnife: 'Swiss Knife Job Assessment',
    // Misc
    deleteConfirm: 'Are you sure you want to delete this item?',
    noData: 'No data available',
    page: 'Page',
    of: 'of',
    perPage: 'per page',
    startDate: 'Start Date',
    endDate: 'End Date',
    selectJDs: 'Select Job Descriptions',
    createdAt: 'Created',
    uploadedAt: 'Uploaded',
  },
  zh: {
    // Nav
    home: '首页',
    application: '申请管理',
    report: '分析报告',
    extract: '提取管理',
    admin: '管理员',
    logout: '退出登录',
    // Common
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    create: '创建',
    search: '搜索',
    refresh: '刷新',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    confirm: '确认',
    all: '全部',
    none: '无',
    close: '关闭',
    back: '返回',
    next: '下一页',
    previous: '上一页',
    submit: '提交',
    upload: '上传',
    download: '下载',
    generate: '生成',
    extract_btn: '提取',
    extracting: '提取中...',
    // Applications
    company: '公司',
    jobTitle: '职位名称',
    status: '状态',
    stageNotes: '阶段备注',
    applicationDate: '申请日期',
    prepared: '准备中',
    applied: '已申请',
    interviewed: '面试中',
    offered: '已录用',
    rejected: '已拒绝',
    totalApplications: '申请总数',
    conversionFunnel: '转化漏斗',
    newApplication: '新建申请',
    editApplication: '编辑申请',
    sortBy: '排序方式',
    filterByStatus: '按状态筛选',
    sortDate: '日期',
    sortCompany: '公司',
    sortStatus: '状态',
    // JD / Extract
    jobDescription: '职位描述',
    rawText: '原始JD文本',
    enterJDText: '在此输入原始职位描述文本...',
    extracted: '已提取',
    notExtracted: '未提取',
    linkedApplication: '关联申请',
    noLinkedApp: '无关联申请',
    textPreview: '文本预览',
    // JD Fields
    role: '职位',
    level: '级别',
    location: '地点',
    employmentType: '就业类型',
    remoteWork: '远程工作',
    salaryRange: '薪资范围',
    benefits: '福利',
    responsibilities: '职责',
    requiredSkills: '必需核心技能',
    desirableSkills: '期望技能',
    programmingLanguages: '编程语言',
    frameworksTools: '框架与工具',
    databases: '数据库',
    cloudPlatforms: '云平台',
    // Resumes
    resume: '简历',
    resumes: '简历列表',
    uploadResume: '上传简历',
    uploadPDF: '上传PDF（最大10MB）',
    noResumes: '暂无上传的简历',
    characters: '个字符',
    selectedResume: '已选择',
    selectResume: '选择',
    // Reports
    newReport: '新建报告',
    reports: '分析报告',
    noReports: '暂无报告',
    allApplications: '全部申请',
    selectedByIds: '选择职位描述',
    dateRange: '日期范围',
    language: '语言',
    english: '英文',
    chinese: '中文',
    generateReport: '生成报告',
    generateInsight: '生成AI洞察',
    visualizations: '可视化图表',
    aiAnalysis: 'AI分析',
    noResults: '暂无分析结果',
    noSummaries: '暂无AI摘要，请在上方生成',
    // Chart titles
    freqRole: '职位频率',
    freqLevel: '级别分布',
    freqLocation: '地点分布',
    freqProgrammingLanguages: '编程语言',
    freqFrameworksTools: '框架与工具',
    freqCloudPlatforms: '云平台',
    freqDatabases: '数据库',
    freqEmploymentType: '就业类型',
    posResponsibilities: '职责词语分析',
    tfidfSkills: '各职位TF-IDF技能评分',
    graphSkills: '技能共现网络',
    swissKnife: '万金油职位评估',
    // Misc
    deleteConfirm: '确定要删除这条记录吗？',
    noData: '暂无数据',
    page: '第',
    of: '共',
    perPage: '条/页',
    startDate: '开始日期',
    endDate: '结束日期',
    selectJDs: '选择职位描述',
    createdAt: '创建时间',
    uploadedAt: '上传时间',
  },
} as const

export type TranslationKey = keyof typeof translations.en

function readLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  return ((localStorage.getItem(STORAGE_KEY) as Lang) ?? 'en') === 'zh' ? 'zh' : 'en'
}

export function useLocale() {
  const [lang, setLangState] = useState<Lang>(readLang)

  useEffect(() => {
    // Re-read on mount in case SSR defaulted to 'en'
    setLangState(readLang())

    const handler = () => setLangState(readLang())
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  }, [])

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l)
    window.dispatchEvent(new Event(EVENT_NAME))
    setLangState(l)
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => {
      return (translations[lang] as Record<string, string>)[key]
        ?? (translations.en as Record<string, string>)[key]
        ?? key
    },
    [lang],
  )

  return { t, lang, setLang }
}
