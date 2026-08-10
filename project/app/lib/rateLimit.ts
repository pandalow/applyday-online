import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Gracefully degrade to a no-op if Upstash env vars are not set (local dev without Redis)
const isConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

const redis = isConfigured ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}) : null

// Sliding window limiters per endpoint type
const limiters = isConfigured ? {
  login:    new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(5,  '60 s'),   prefix: 'rl:login' }),
  register: new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(3,  '300 s'),  prefix: 'rl:register' }),
  forgot:   new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(3,  '300 s'),  prefix: 'rl:forgot' }),
  reset:    new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(5,  '60 s'),   prefix: 'rl:reset' }),
  try:      new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(5,  '3600 s'), prefix: 'rl:try' }),
  default:  new Ratelimit({ redis: redis!, limiter: Ratelimit.slidingWindow(20, '60 s'),   prefix: 'rl:default' }),
} : null

export type LimiterKey = keyof NonNullable<typeof limiters>

/**
 * Returns true if the request is allowed, false if rate-limited.
 * Falls back to allowing all requests if Upstash is not configured.
 */
export async function checkRateLimit(
  identifier: string,
  limiterKey: LimiterKey = 'default',
): Promise<boolean> {
  if (!limiters) return true
  const limiter = limiters[limiterKey] ?? limiters.default
  const { success } = await limiter.limit(identifier)
  return success
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
