import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { AIProvider } from '@/app/lib/aiConfig'

export function createLLM(
  provider: AIProvider,
  apiKey: string,
  model: string,
  reasoning = false,
): BaseChatModel {
  switch (provider) {
    case 'openai':
      return new ChatOpenAI({
        model,
        apiKey,
        temperature: reasoning ? 1 : 0,
        timeout: 120_000,
        maxRetries: 2,
      })

    case 'claude': {
      const baseParams = {
        model,
        anthropicApiKey: apiKey,
        maxTokens: reasoning ? 16000 : 4096,
        timeout: 120_000,
        maxRetries: 2,
      }
      if (reasoning) {
        return new ChatAnthropic({
          ...baseParams,
          temperature: 1,
          thinking: { type: 'enabled', budget_tokens: 8000 },
        } as ConstructorParameters<typeof ChatAnthropic>[0])
      }
      return new ChatAnthropic({ ...baseParams, temperature: 0 })
    }

    case 'deepseek':
      return new ChatOpenAI({
        model,
        apiKey,
        temperature: 0,
        configuration: { baseURL: 'https://api.deepseek.com' },
        timeout: 120_000,
        maxRetries: 2,
      })

    case 'gemini':
      return new ChatGoogleGenerativeAI({
        model,
        apiKey,
        temperature: 0,
        maxRetries: 2,
      })
  }
}
