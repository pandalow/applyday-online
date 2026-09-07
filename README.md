# ApplyDay

**AI-powered job application tracker** — paste a job description and get instant analysis: match score, red flags, tailored resume suggestions, cover letter, and OKR goals, all in one place.

**AI 驱动的求职申请追踪工具** — 粘贴职位描述，立即获得智能分析：匹配度评分、风险提示、简历优化建议、求职信生成和 OKR 目标规划，一站式搞定。

---

## Features / 功能介绍

### Application Dashboard / 申请看板 (`/app`)

- Track applications with status pipeline: **Preparing → Applied → Interviewed → Offered → Rejected**
- Inline editing for company, job title, status, channel, and notes
- Search and filter across all applications
- Stats overview: total, per-status counts, last-7-days activity

---

- 状态流水线追踪：**准备中 → 已投递 → 面试中 → 已录用 → 已拒绝**
- 直接在表格内编辑公司、职位、状态、渠道和备注
- 跨申请搜索与筛选
- 数据概览：总数、各状态计数、近 7 天新增

---

### Workspace / 工作台 (`/applications/[id]`)

Each application gets a dedicated workspace with five tabs:  
每条申请拥有独立工作台，包含五个标签页：

| Tab 标签 | EN | 中文 |
|---|---|---|
| **JD** | Paste and save the full job description | 粘贴并保存完整职位描述 |
| **Job Insight** | Match score, verdict, key requirements, red flags, talking points | 匹配评分、风险标记、岗位要点、面试话术 |
| **Resume** | AI resume tailoring suggestions matched to the JD | AI 简历优化建议，逐条匹配 JD 要求 |
| **Cover Letter** | Generate a personalised cover letter in your language | 生成个性化求职信，支持中英文 |
| **OKR** | Auto-generate 30/60/90-day OKR goals for the role | 自动生成入职 30/60/90 天 OKR 目标 |

---

### Market Report / 市场报告 (`/market`)

Select multiple applications and generate a cross-application market analysis — skill gaps, salary positioning, and competitive landscape.

选择多条申请，生成跨职位市场分析——技能差距、薪资定位、竞争格局。

---

### Quick Start Wizard / 快速入门向导 (`/wizard`)

Guided flow for rapidly creating and analysing a new application:

引导式流程，快速创建并分析新申请：

1. Paste the job description / 粘贴职位描述
2. AI extracts company name and job title automatically / AI 自动提取公司名和职位
3. Creates the application and saves the JD / 创建申请并保存 JD
4. Generates a Job Insight immediately / 立即生成 Job Insight 分析
5. Redirects to the full Workspace / 跳转到完整工作台

**Guest / trial mode** — visitors can run the wizard without an account using their own API key. Results are shown inline; sign up to save them permanently.

**访客试用模式** — 无需注册，使用自己的 API Key 即可体验向导全流程。分析结果实时展示；注册后可永久保存。

---

### Resume Manager / 简历管理 (`/workspace`)

Upload and manage multiple resume versions (PDF or plain text). Select which resume to use per analysis.

上传并管理多版本简历（PDF 或纯文本），为每次分析指定使用哪份简历。

---

### AI Provider Support / AI 提供商支持 (BYOK)

Bring your own API key — no platform key required. API keys are stored in your browser only, never on the server.

使用自己的 API Key，无需平台代管。Key 仅存储在浏览器本地，不经过服务器留存。

| Provider | Models / 支持模型 |
|----------|---|
| **OpenAI** | GPT-4o, GPT-4o mini, o3-mini (reasoning) |
| **Anthropic Claude** | Claude 3.5 Sonnet, Claude 3.7 Sonnet + extended thinking |
| **Google Gemini** | Gemini 2.0 Flash, Gemini 2.5 Pro |
| **DeepSeek** | DeepSeek Chat, DeepSeek Reasoner |

---

### Auth / 账户系统

- Username / password registration and login / 用户名密码注册登录
- Google OAuth sign-in / Google 一键登录
- Password reset via email / 邮件重置密码（Resend）
- Rate-limited endpoints via Upstash Redis / 基于 Upstash Redis 的接口限流保护

---

## Tech Stack / 技术栈

| Layer 层 | Technology 技术 |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL · Supabase · Drizzle ORM |
| Auth | Custom RSA-JWT sessions · Google OAuth (Arctic) |
| AI | LangChain.js — OpenAI · Anthropic · Gemini · DeepSeek |
| Email | Resend |
| Rate Limiting | Upstash Redis |
| Styling | Tailwind CSS v4 |
| Testing | Vitest (unit) · Playwright (smoke + integration) |

---

## Quick Start / 快速开始

### Prerequisites / 前置条件

- Node.js 20+
- A PostgreSQL database (Supabase free tier works) / PostgreSQL 数据库（Supabase 免费版即可）
- At least one AI provider API key / 至少一个 AI 提供商的 API Key

### 1. Clone and install / 克隆并安装

```bash
git clone https://github.com/your-org/applyday.git
cd applyday/project
npm install
```

### 2. Configure environment variables / 配置环境变量

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` / 填写 `.env.local`：

```env
# Database / 数据库
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Session signing key / 会话签名密钥（生成命令：openssl rand -base64 32）
SESSION_SECRET=your-secret-here

# App URL
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (optional / 可选)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Email — password reset (optional / 可选)
RESEND_API_KEY=re_...
EMAIL_FROM=ApplyDay <noreply@yourdomain.com>

# Rate limiting (optional — gracefully skipped if absent / 可选，缺失时自动跳过限流)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### 3. Run database migrations / 执行数据库迁移

```bash
npm run db:migrate
```

### 4. Start the dev server / 启动开发服务器

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register an account, then go to **Settings → AI Configuration** to add your API key.

打开 [http://localhost:3000](http://localhost:3000)，注册账号后前往 **设置 → AI 配置** 填入 API Key 即可开始使用。

---

## Scripts / 脚本

```bash
npm run dev                   # Dev server / 开发服务器
npm run build                 # Production build / 生产构建
npm run db:migrate            # Run migrations / 执行迁移
npm run db:studio             # Drizzle Studio (database GUI / 数据库可视化)
npm run test                  # Unit tests / 单元测试 (Vitest)
npm run test:e2e              # All E2E tests / 完整端对端测试 (Playwright)
npm run test:e2e:integration  # Integration tests only / 仅集成测试
npm run test:e2e:ui           # Playwright UI mode
npm run test:e2e:report       # View last HTML test report / 查看测试报告
```

---

## Deployment / 部署到 Vercel

1. Push to GitHub and import the repo at [vercel.com](https://vercel.com)  
   推送到 GitHub，在 Vercel 导入该仓库

2. Set **Root Directory** to `project`  
   将根目录设置为 `project`

3. Add all environment variables in **Settings → Environment Variables**  
   在 Vercel 项目设置中填入所有环境变量

4. Deploy  
   部署

> **Note / 注意：** Upstash Redis credentials in `.env.local` are local-only. Update them separately in Vercel whenever you rotate the Redis database.  
> `.env.local` 中的 Upstash Redis 凭据仅用于本地开发。更换 Redis 数据库时，需同步在 Vercel 的环境变量设置中更新。
