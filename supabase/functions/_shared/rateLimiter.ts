// Server-side rate limiting for Edge Functions
// Uses in-memory storage with IP-based tracking

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets when function cold starts, which is acceptable for rate limiting)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default rate limits by endpoint type
export const RATE_LIMITS = {
  // Expensive operations (AI queries)
  expensive: { windowMs: 60 * 1000, maxRequests: 10 },     // 10/minute
  // Standard operations
  standard: { windowMs: 60 * 1000, maxRequests: 30 },     // 30/minute
  // Auth/webhook operations
  webhook: { windowMs: 60 * 1000, maxRequests: 100 },     // 100/minute
};

// Get client identifier from request (IP or user ID)
export function getClientId(req: Request): string {
  // Try to get user ID from auth header
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    // Extract a hash of the token as identifier
    const tokenHash = simpleHash(authHeader);
    return `user:${tokenHash}`;
  }

  // Fall back to IP address
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return `ip:${realIp}`;
  }

  // Default identifier
  return 'ip:unknown';
}

// Simple hash function for tokens
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Check rate limit for a client
export function checkRateLimit(
  clientId: string,
  config: RateLimitConfig = RATE_LIMITS.standard
): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);

  // Clean up expired entry
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(clientId);
  }

  const currentEntry = rateLimitStore.get(clientId);

  if (!currentEntry) {
    // First request in window
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }

  if (currentEntry.count >= config.maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((currentEntry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: currentEntry.resetTime,
      retryAfter
    };
  }

  // Increment count
  currentEntry.count++;
  rateLimitStore.set(clientId, currentEntry);

  return {
    allowed: true,
    remaining: config.maxRequests - currentEntry.count,
    resetTime: currentEntry.resetTime
  };
}

// Create rate limit response headers
export function rateLimitHeaders(
  remaining: number,
  resetTime: number,
  limit: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
  };
}

// Create rate limit exceeded response
export function rateLimitExceededResponse(
  retryAfter: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      }
    }
  );
}

// Middleware function to apply rate limiting
export function withRateLimit(
  req: Request,
  corsHeaders: Record<string, string>,
  config: RateLimitConfig = RATE_LIMITS.standard
): { allowed: boolean; response?: Response; headers: Record<string, string> } {
  const clientId = getClientId(req);
  const result = checkRateLimit(clientId, config);

  const headers = rateLimitHeaders(result.remaining, result.resetTime, config.maxRequests);

  if (!result.allowed) {
    return {
      allowed: false,
      response: rateLimitExceededResponse(result.retryAfter || 60, corsHeaders),
      headers
    };
  }

  return { allowed: true, headers };
}

// Clean up old entries periodically (call this occasionally)
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}
