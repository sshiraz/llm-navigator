import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    subscription: string;
  };
  error?: string;
  status?: number;
  keyId?: string;
}

/**
 * Hash a string using SHA-256
 */
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate an API key from the Authorization header
 * Returns user info if valid, error if not
 */
export async function validateApiKey(req: Request): Promise<AuthResult> {
  // Get Authorization header
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    return {
      success: false,
      error: 'Missing Authorization header',
      status: 401,
    };
  }

  // Extract Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return {
      success: false,
      error: 'Invalid Authorization header format. Use: Bearer <api_key>',
      status: 401,
    };
  }

  const apiKey = parts[1];

  // Validate key format
  if (!apiKey.startsWith('llm_sk_') || apiKey.length < 20) {
    return {
      success: false,
      error: 'Invalid API key format',
      status: 401,
    };
  }

  // Hash the key
  const keyHash = await hashKey(apiKey);

  // Get Supabase admin client
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase environment variables");
    return {
      success: false,
      error: 'Server configuration error',
      status: 500,
    };
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Look up the key and join to users table
  const { data: keyData, error: keyError } = await supabaseAdmin
    .from('api_keys')
    .select(`
      id,
      user_id,
      revoked_at,
      users!inner (
        id,
        email,
        subscription
      )
    `)
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .single();

  if (keyError || !keyData) {
    console.log("API key lookup failed:", keyError?.message || 'Key not found');
    return {
      success: false,
      error: 'Invalid or revoked API key',
      status: 401,
    };
  }

  // Check if user is on Enterprise plan
  const user = keyData.users as { id: string; email: string; subscription: string };
  if (user.subscription !== 'enterprise') {
    return {
      success: false,
      error: 'API access requires Enterprise plan',
      status: 403,
    };
  }

  // Update last_used_at
  await supabaseAdmin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyData.id);

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      subscription: user.subscription,
    },
    keyId: keyData.id,
  };
}

/**
 * Create an error response with proper headers
 */
export function createErrorResponse(
  error: string,
  status: number,
  headers: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}

/**
 * Create a success response with proper headers
 */
export function createSuccessResponse(
  data: unknown,
  headers: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}
