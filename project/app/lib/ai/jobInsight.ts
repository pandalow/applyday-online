import { jsonrepair } from 'jsonrepair'
import { createLLM } from '@/app/lib/ai/llm'
import type { AIProvider } from '@/app/lib/aiConfig'
import type { JobInsightContent } from '@/app/db/schema'

const PROMPT = `You are a senior hiring manager conducting a rigorous, honest evaluation. Your job is to protect the candidate from wasting time on applications where they are likely to be filtered out. You are NOT a cheerleader. Do NOT soften gaps, do NOT add encouraging language, do NOT say "with the right preparation" unless it is genuinely realistic.

You must respond with ONLY valid JSON matching the exact schema below. No markdown, no commentary.

LANGUAGE: Write ALL string values in the JSON in {language}. JSON keys must remain in English exactly as shown in the schema.

VERDICT CRITERIA — apply these strictly:
- "strong_fit": candidate meets ALL must-have requirements and most nice-to-haves. Rare.
- "good_fit": candidate meets most must-haves with only minor gaps. Do NOT use this if there is a hard technical or experience gap that would likely cause rejection at CV screen.
- "stretch": candidate meets some must-haves but has one or more significant gaps that would concern most hiring managers.
- "low_fit": candidate is missing multiple must-haves or has a fundamental mismatch (wrong level, wrong domain, missing core required skill).

MANDATORY RULES:
1. "mainRisks" must contain AT LEAST 3 items. Each item must quote or directly reference a specific requirement from the JD. Do not invent vague risks — they must trace to actual JD language.
2. If there is no resume provided, set verdict to "stretch" at best — you cannot verify fit without evidence.
3. Do not repeat positives as risks with softened language. A risk is a genuine gap, not "could be stronger."
4. "bestStory" must be realistic — do not invent strengths the resume does not demonstrate.
5. "resumeEdits.remove" must list specific resume items that HURT this application — irrelevant tech stacks, conflicting signals, or content that distracts from the target role. At least 2 items. Format each as: "[item] — reason".
6. "resumeEdits.add" must list concrete content to WRITE INTO the resume — specific skills, metrics, or bullet phrasing mapped to JD requirements. At least 3 items. Format: "[what to add] — maps to: [JD requirement]". If resume is absent, list what the JD requires that a strong candidate would demonstrate.
7. "resumeEdits" must always be present, even if the resume is absent.

Schema:
{
  "roleProfile": {
    "type": "string (e.g. 'Hands-on PM/PO', 'Graduate Software Engineer', 'Research Intern')",
    "seniority": "string (e.g. 'Junior to Mid', 'Mid-level', 'Senior', 'Graduate')",
    "orientation": "string (e.g. 'Execution-heavy delivery', 'Research-focused', 'Technical ownership')",
    "companyContext": "string (e.g. 'AI startup', 'Enterprise SaaS', 'Consulting firm')",
    "summary": "string — 2-3 sentences describing what this role is really looking for, including any hard filters"
  },
  "matchAnalysis": {
    "verdict": "one of: strong_fit | good_fit | stretch | low_fit — apply the criteria above strictly",
    "headline": "string — one honest sentence summarising the match, e.g. 'Solid backend skills but missing the required C#/.NET experience'",
    "strongSignals": ["string — specific resume evidence that maps to this JD, cite actual projects/companies/numbers"],
    "mainRisks": ["string — AT LEAST 3 items. Each must reference a specific JD requirement the candidate does not clearly meet. Be direct: name the gap, name the requirement."]
  },
  "requirements": {
    "mustHave": ["string — qualifications/skills that would filter the candidate out if missing"],
    "niceToHave": ["string — skills/experience that would add value but are not blocking"],
    "hiddenExpectations": ["string — things the JD implies but does not explicitly state"],
    "noise": ["string — filler/boilerplate in the JD that can be safely ignored"]
  },
  "strategy": {
    "bestEmphasis": ["string — specific resume items to highlight, with brief reason why"],
    "deEmphasize": ["string — items to downplay or omit, with brief reason why"],
    "bestStory": "string — the core narrative the candidate should tell in 2-3 sentences"
  },
  "applyDecision": {
    "recommendation": "one of: strong_apply | apply_with_tailoring | stretch | low_fit — must be consistent with the verdict above",
    "rationale": "string — 2-3 sentences. Be honest about the probability of passing CV screen. If there are hard gaps, say so.",
    "actionItems": ["string — specific, actionable things to do before applying. If a gap cannot realistically be fixed before applying, say so rather than inventing a workaround."]
  },
  "interviewPrep": {
    "whyCompany": ["string — genuine, specific reasons based on the company's mission/product"],
    "whyRole": ["string — reasons tied to candidate's background and goals"],
    "likelyTechnical": ["string — specific technical topics or questions likely to come up"],
    "behavioralThemes": ["string — STAR-style themes the interviewer will probe"],
    "objectionsToHandle": [
      { "objection": "string — a concern the interviewer might raise", "response": "string — how to address it" }
    ]
  },
  "applicationMaterials": {
    "resumeHeadline": "string — a tailored resume headline for this specific role",
    "shortStatement": "string — 150-200 word application form statement",
    "recruiterMessage": "string — concise LinkedIn/email outreach message (under 100 words)"
  },
  "resumeEdits": {
    "remove": ["string — AT LEAST 2 items. Each: '[specific resume item] — reason: [why it hurts this application]'"],
    "add": ["string — AT LEAST 3 items. Each: '[specific skill/bullet/metric to add] — maps to: [JD requirement]'. Include example phrasing where possible."]
  }
}

---

Job Description (full text):
{jd_text}

---

{resume_section}

---

Respond with ONLY the JSON object.`

export async function generateJobInsight(
  jdRawText: string,
  resume: { text: string } | null,
  apiKey: string,
  provider: AIProvider = 'openai',
  modelId = 'gpt-4o-mini',
  reasoning = false,
  language: 'en' | 'zh' = 'en',
): Promise<JobInsightContent> {
  const model = createLLM(provider, apiKey, modelId, reasoning)

  const resumeSection = resume
    ? `Candidate Resume:\n${resume.text.slice(0, 20000)}`
    : `No resume provided. Skip matchAnalysis.strongSignals details referencing resume, provide general guidance based on the role only.`

  const langLabel = language === 'zh' ? 'Chinese (Simplified)' : 'English'

  const prompt = PROMPT
    .replace('{language}', langLabel)
    .replace('{jd_text}', jdRawText.slice(0, 15000))
    .replace('{resume_section}', resumeSection)

  const response = await model.invoke(prompt)
  const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
  const cleaned = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(jsonrepair(cleaned)) as JobInsightContent
}
