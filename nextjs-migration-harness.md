# ApplyDay — Next.js Migration Harness

> 参考文档，供将现有 React + Vite 前端迁移到 Next.js App Router 时使用。  
> 后端 Django REST API 保持不变，仅替换前端层。

---

## 1. 项目概览

| 维度 | 现状 | Next.js 目标 |
|------|------|-------------|
| 框架 | React 19 + Vite | Next.js 15 (App Router) |
| 路由 | React Router v7 | 文件系统路由 (`app/`) |
| 数据获取 | axios + useEffect | Server Actions / Route Handlers + fetch |
| 样式 | Tailwind CSS v4 | Tailwind CSS v4（保持不变） |
| 动画 | Framer Motion | Framer Motion（保持不变，需标记 `'use client'`） |
| 图表 | ECharts (echarts-for-react) | 同上（`'use client'`） |
| 国际化 | 自定义 locales/index.js | next-intl 或保留原方案 |

---

## 2. 目录结构映射

### 现有结构
```
frontend/applyday/src/
├── pages/           # Application.jsx, Data.jsx, Home.jsx, Report.jsx
├── components/      # 所有 UI 组件
├── charts/          # ECharts 图表组件
├── service/         # axios API 调用层
├── utils/           # applicationUtils.js
├── config/          # api.js (BASE_URL 配置)
├── locales/         # en.js, zh.js, index.js
└── App.jsx          # 路由定义
```

### 目标 Next.js 结构
```
app/
├── layout.tsx              # RootLayout → app/layout.tsx
├── page.tsx                # Home → app/page.tsx
├── app/
│   └── page.tsx            # /app → ApplicationManager
├── report/
│   └── page.tsx            # /report → Report
├── extract/
│   └── page.tsx            # /extract → DataManagement
└── api/                    # Route Handlers（代理后端 or 直接用）
    ├── applications/
    │   └── route.ts
    ├── reports/
    │   └── route.ts
    └── resumes/
        └── route.ts

components/                 # 与现有 components/ 对应
charts/                     # 与现有 charts/ 对应（全部 'use client'）
lib/
├── api.ts                  # 替换 config/api.js + service/*.js
└── applicationUtils.ts     # 直接迁移 utils/applicationUtils.js
locales/                    # 保持 en.js / zh.js
```

---

## 3. 路由对照表

| 旧路由 (React Router) | 新路由 (App Router) | 对应文件 |
|----------------------|---------------------|---------|
| `/` | `/` | `app/page.tsx` |
| `/app` | `/app` | `app/app/page.tsx` |
| `/report` | `/report` | `app/report/page.tsx` |
| `/extract` | `/extract` | `app/extract/page.tsx` |

> `RootLayout`（Navigation + Footer）→ `app/layout.tsx`

---

## 4. 数据模型（后端不变）

### Application
```ts
interface Application {
  id: number
  company: string
  job_title: string
  status: 'prepared' | 'applied' | 'interviewed' | 'offered' | 'rejected'
  stage_notes?: string
  application_date: string   // auto_now_add DateField
  created_at: string         // auto_now_add DateTimeField
  apply_description?: JobDescriptionText
}
```

### JobDescriptionText
```ts
interface JobDescriptionText {
  id: number
  application: number        // FK → Application.id
  text?: string
  created_at: string
  text_description?: JobDescription
}
```

### JobDescription（结构化 JD 提取结果）
```ts
interface JobDescription {
  id: number
  company?: string
  role?: string
  level?: string
  location?: string
  employment_type?: string
  salary_eur_min?: number
  salary_eur_max?: number
  bonus_percent?: number
  benefits?: string[]
  years_experience_min?: number
  years_experience_max?: number
  education_required?: string
  responsibilities?: string[]
  required_core_skills?: string[]
  desirable_skills?: string[]
  programming_languages?: string[]
  frameworks_tools?: string[]
  databases?: string[]
  cloud_platforms?: string[]
  api_protocols?: string[]
  methodologies?: string[]
  mobile_technologies?: string[]
  domain_keywords?: string[]
  remote_work?: 'remote' | 'hybrid' | 'on-site'
  work_permit_required?: boolean
  visa_sponsorship?: boolean
  contact_person?: string
  contact_email_or_phone?: string
  industry?: string
  language_requirements?: string[]
}
```

### ResumeText
```ts
interface ResumeText {
  id: number
  name: string
  text: string
  uploaded_at: string
}
```

### AnalysisReport / Result / Summary
```ts
interface AnalysisReport {
  id: number
  created_at: string
  results: AnalysisResult[]
  summary: Summary[]
}

interface AnalysisResult {
  id: number
  name: string
  result: Record<string, unknown> | null
}

interface Summary {
  id: number
  content: string
  created_at: string
}
```

---

## 5. API 端点清单

后端基础地址：`NEXT_PUBLIC_API_BASE_URL`（默认 `http://127.0.0.1:8000`）

### Application API — `/app/info/`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/app/info/` | 获取全部 Application |
| POST | `/app/info/` | 创建 Application |
| GET | `/app/info/{id}/` | 获取单条 |
| PATCH | `/app/info/{id}/` | 更新单条 |
| DELETE | `/app/info/{id}/` | 删除 |
| GET | `/app/info/get_stats/` | 统计数据 |

### Job Description API — `/app/jd/`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/app/jd/` | 获取全部 JD |
| POST | `/app/jd/` | 创建 JD |
| PUT | `/app/jd/{id}/` | 全量更新 |
| DELETE | `/app/jd/{id}/` | 删除 |

### Extract API — `/app/extract/`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/app/extract/` | 获取全部 |
| POST | `/app/extract/` | 创建 |
| PATCH | `/app/extract/{id}/` | 局部更新 |
| DELETE | `/app/extract/{id}/` | 删除 |

### Resume API — `/app/resumes/`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/app/resumes/` | 获取全部简历 |
| POST | `/app/resumes/` | 上传简历（`multipart/form-data`） |
| GET | `/app/resumes/{id}/` | 获取单条 |
| PUT | `/app/resumes/{id}/` | 更新 |
| DELETE | `/app/resumes/{id}/` | 删除 |

### Report API — `/report/`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/report/` | 获取全部报告 |
| POST | `/report/` | 创建报告 |
| GET | `/report/{id}/` | 获取单条报告 |
| DELETE | `/report/{id}/` | 删除 |
| POST | `/report/run/` | 触发分析 pipeline |
| POST | `/report/{id}/insight/` | 生成 summary（需传 `resume_id`） |

---

## 6. 组件迁移说明

### 需要添加 `'use client'` 的组件
所有使用以下能力的组件都必须标记为 Client Component：

- `useState` / `useEffect` / `useRef` / `useMemo` — 全部交互组件
- `framer-motion` — Dashboard、ApplicationItem 等动画组件
- `echarts-for-react` — 所有 `charts/` 下的组件
- `react-router-dom` 的 `useNavigate` → 替换为 `next/navigation` 的 `useRouter`
- `react-markdown` — ReportDetail、ReportAnalysis

### 可作为 Server Component 的部分
- 静态内容页：`Home` 中不含交互的介绍段落可拆分为 Server Component
- 布局层：`app/layout.tsx` 本身是 Server Component，Navigation/Footer 如有交互需单独标注

### 关键组件对照
| 原组件 | 迁移要点 |
|--------|---------|
| `RootLayout.jsx` | → `app/layout.tsx`，Navigation/Footer 拆出 |
| `Navigation.jsx` | `'use client'`（含路由高亮、语言切换等交互） |
| `Dashboard.jsx` | `'use client'`（含图表 + 动画） |
| `ApplicationForm.jsx` | `'use client'`（表单状态） |
| `ReportGenerator.jsx` | `'use client'`（含 pipeline 触发） |
| `charts/*` | 全部 `'use client'`（ECharts SSR 不支持） |
| `ResumeManager.jsx` | `'use client'`（文件上传） |

---

## 7. 数据获取策略

### 替换 axios + useEffect 模式

**现有模式：**
```jsx
// pages/Application.jsx
useEffect(() => {
  fetchApplications().then(setApplications)
}, [])
```

**Next.js 推荐方案（根据场景选择）：**

#### 方案 A：Server Component 直接 fetch（SEO 友好页面）
```tsx
// app/app/page.tsx
export default async function ApplicationPage() {
  const res = await fetch(`${process.env.API_BASE_URL}/app/info/`, {
    cache: 'no-store'  // 实时数据
  })
  const applications = await res.json()
  return <ApplicationManager initialData={applications} />
}
```

#### 方案 B：Client Component + SWR（交互频繁的组件）
```tsx
'use client'
import useSWR from 'swr'

const { data: applications, mutate } = useSWR('/api/applications', fetcher)
```

#### 方案 C：Route Handler 代理（解决 CORS）
```ts
// app/api/applications/route.ts
export async function GET() {
  const res = await fetch(`${process.env.API_BASE_URL}/app/info/`)
  return Response.json(await res.json())
}
```

> 推荐：大部分列表页用方案 A 初始加载 + 方案 B 做乐观更新。

---

## 8. 环境变量

### 现有（Vite）
```
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_APPLICATION_API=http://127.0.0.1:8000/app/
VITE_REPORT_API=http://127.0.0.1:8000/report/
```

### 迁移到 Next.js
```
# .env.local
API_BASE_URL=http://127.0.0.1:8000          # Server-side only（Route Handlers）
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000  # Client-side 可见
```

> `NEXT_PUBLIC_` 前缀暴露给浏览器，无前缀仅服务端可用。

---

## 9. 状态管理

现有项目无全局状态库，全部使用组件内 `useState`，迁移时保持不变。  
若后续引入全局状态（如语言切换、当前用户），推荐使用：
- **Zustand**（轻量，无 Provider 样板）
- 或 React Context（语言切换等简单场景）

---

## 10. 国际化（i18n）

现有方案：自定义 `locales/index.js` + `useState` 切换语言。

迁移选项：
1. **保持现有方案**：将 `locales/` 直接复制，在 Client Component 中使用，零改动成本。
2. **升级 next-intl**：支持 URL 路径语言（`/en/app`, `/zh/app`），更标准但需重构路由。

> 推荐先保持现有方案，功能稳定后再升级。

---

## 11. 图表注意事项

ECharts 在 SSR 环境会报错（依赖 `window`），需做以下处理：

```tsx
// 方式 1：动态导入 + ssr: false
import dynamic from 'next/dynamic'
const WordCloudChart = dynamic(() => import('@/charts/WordCloudChart'), { ssr: false })

// 方式 2：在文件顶部声明 'use client'（整个 charts/ 目录）
```

推荐对整个 `charts/` 目录统一添加 `'use client'`，无需逐一动态导入。

---

## 12. Docker 部署调整

### Dockerfile（Next.js standalone 模式）
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### next.config.ts 配置
```ts
const nextConfig = {
  output: 'standalone',   // 启用 standalone 模式
  env: {
    API_BASE_URL: process.env.API_BASE_URL,
  },
}
export default nextConfig
```

### docker-compose.yml 调整
```yaml
frontend:
  build:
    context: ./frontend/
  ports:
    - "3000:3000"       # 改为 3000，不再需要 Nginx
  environment:
    - API_BASE_URL=http://api:8000   # 容器内部通信
    - NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 13. 迁移步骤清单

- [ ] 1. 初始化 Next.js 项目（`npx create-next-app@latest`，选 App Router + TypeScript + Tailwind）
- [ ] 2. 复制 `components/`、`charts/`、`locales/`、`utils/` 到新项目
- [ ] 3. 为所有 `charts/` 文件添加 `'use client'`
- [ ] 4. 为所有含交互的 `components/` 文件添加 `'use client'`
- [ ] 5. 将 `config/api.js` + `service/*.js` 合并为 `lib/api.ts`（替换 `import.meta.env` 为 `process.env`）
- [ ] 6. 复制 `utils/applicationUtils.js` → `lib/applicationUtils.ts`（可选加类型）
- [ ] 7. 创建 `app/layout.tsx`，迁移 `RootLayout.jsx`
- [ ] 8. 依次创建 4 个页面路由（`/`、`/app`、`/report`、`/extract`）
- [ ] 9. 将 `useNavigate` 替换为 `useRouter`（from `next/navigation`）
- [ ] 10. 配置环境变量（`.env.local`）
- [ ] 11. 更新 Dockerfile 和 docker-compose.yml
- [ ] 12. 本地联调验证所有 API 端点可达
- [ ] 13. 验证图表、动画正常渲染（无 SSR hydration 错误）
- [ ] 14. 验证文件上传（Resume multipart/form-data）

---

## 14. 主要依赖版本参考

```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "tailwindcss": "^4.0.0",
  "framer-motion": "^12.0.0",
  "echarts": "^5.6.0",
  "echarts-for-react": "^3.0.2",
  "echarts-wordcloud": "^2.1.0",
  "recharts": "^3.0.0",
  "react-markdown": "^10.0.0",
  "swr": "^2.0.0",
  "axios": "^1.0.0"
}
```

> 移除：`react-router-dom`、`vite`、`@vitejs/plugin-react`

---

## 15. 常见陷阱

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| ECharts 报 `window is not defined` | SSR 执行阶段无 DOM | 整个 `charts/` 加 `'use client'` |
| Framer Motion hydration 警告 | 动画初始值 SSR/CSR 不一致 | 组件加 `'use client'` |
| `import.meta.env` 报错 | Vite 专属语法 | 替换为 `process.env.NEXT_PUBLIC_*` |
| CORS 错误 | 浏览器直连 Django | 使用 Next.js Route Handler 代理，或确认 Django CORS 配置允许前端域 |
| `useNavigate` 报错 | React Router 已移除 | 替换为 `import { useRouter } from 'next/navigation'` |
| 文件上传 size 限制 | Next.js 默认 body 4MB | `next.config.ts` 中配置 `api.bodyParser.sizeLimit` |
