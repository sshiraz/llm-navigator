// CORS configuration for Edge Functions
// Restricts access to whitelisted domains only

// Allowed origins - add your production domain here
const ALLOWED_ORIGINS = [
  // Production
  'https://lucent-elf-359aef.netlify.app',
  'https://llmsearchinsight.com',
  'https://www.llmsearchinsight.com',

  // Development
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

// Check if origin is allowed
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some(allowed =>
    origin === allowed || origin.endsWith('.netlify.app')
  );
}

// Get CORS headers for a request
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');

  // If origin is allowed, reflect it back; otherwise use first allowed origin
  const allowedOrigin = isOriginAllowed(origin)
    ? origin!
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
  };
}

// Handle CORS preflight request
export function handleCorsPreflightWithValidation(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');

    if (!isOriginAllowed(origin)) {
      // Return 403 for unauthorized origins on preflight
      return new Response('Forbidden', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return new Response('ok', { headers: getCorsHeaders(req) });
  }
  return null;
}

// Validate origin and return error response if not allowed
export function validateOrigin(req: Request): Response | null {
  const origin = req.headers.get('origin');

  // Allow requests without origin (e.g., server-to-server, Stripe webhooks)
  if (!origin) return null;

  if (!isOriginAllowed(origin)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Origin not allowed',
        message: 'This API endpoint does not accept requests from your domain.'
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return null;
}

// Legacy cors headers for backward compatibility during migration
// Use this temporarily if you need to allow all origins
export const permissiveCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
