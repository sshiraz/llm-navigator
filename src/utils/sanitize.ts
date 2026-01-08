/**
 * Input Sanitization Utilities
 *
 * Prevents XSS, SQL injection, and other injection attacks by sanitizing user input.
 * All user-provided input should be sanitized before:
 * - Storing in database
 * - Rendering in UI
 * - Using in URLs or queries
 */

// HTML entities to escape
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

// Dangerous URL protocols
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'vbscript:',
  'data:',
  'file:',
  'about:'
];

// Common SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/gi,
  /(--)|(\/\*)|(\*\/)/g,
  /(;|\|)/g,
  /(\bOR\b\s+\d+\s*=\s*\d+)/gi,
  /(\bAND\b\s+\d+\s*=\s*\d+)/gi
];

/**
 * Escapes HTML special characters to prevent XSS
 * Use for any text that will be rendered in HTML
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strips all HTML tags from input
 * Use for plain text fields like names, descriptions
 */
export function stripHtmlTags(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove potential event handlers that might slip through
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Remove javascript: and other dangerous protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');

  return sanitized.trim();
}

/**
 * Sanitizes text input - strips HTML and escapes special characters
 * Use for: names, company names, descriptions, search queries
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // First strip HTML tags
  let sanitized = stripHtmlTags(input);

  // Remove null bytes (can bypass some filters)
  sanitized = sanitized.replace(/\0/g, '');

  // Normalize unicode to prevent homograph attacks
  sanitized = sanitized.normalize('NFKC');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Collapse multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ');

  return sanitized;
}

/**
 * Validates and sanitizes URL input
 * Use for: website URLs, redirect URLs
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let url = input.trim().toLowerCase();

  // Check for dangerous protocols
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (url.startsWith(protocol)) {
      return '';
    }
  }

  // Remove any encoded dangerous protocols
  const decoded = decodeURIComponent(url);
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (decoded.startsWith(protocol)) {
      return '';
    }
  }

  // Restore original casing but trimmed
  url = input.trim();

  // Add https:// if no protocol specified
  if (!url.match(/^https?:\/\//i)) {
    url = 'https://' + url;
  }

  // Validate URL format
  try {
    const parsed = new URL(url);

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }

    // Ensure hostname exists
    if (!parsed.hostname || parsed.hostname.length === 0) {
      return '';
    }

    return parsed.href;
  } catch {
    return '';
  }
}

/**
 * Validates URL without modifying it (for checking user input)
 */
export function isValidUrl(input: string): boolean {
  const sanitized = sanitizeUrl(input);
  return sanitized.length > 0;
}

/**
 * Validates and sanitizes email input
 * Use for: email addresses
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Basic sanitization
  let email = input.trim().toLowerCase();

  // Remove any HTML
  email = stripHtmlTags(email);

  // Remove null bytes
  email = email.replace(/\0/g, '');

  // Basic email regex validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return '';
  }

  return email;
}

/**
 * Validates email without modifying it
 */
export function isValidEmail(input: string): boolean {
  const sanitized = sanitizeEmail(input);
  return sanitized.length > 0;
}

/**
 * Sanitizes search/query input
 * Use for: search boxes, keyword/prompt inputs
 */
export function sanitizeSearchQuery(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Strip HTML
  let query = stripHtmlTags(input);

  // Remove potential SQL injection patterns (log but don't block)
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(query)) {
      console.warn('Potential SQL injection attempt detected:', input.substring(0, 50));
      // Remove the suspicious pattern
      query = query.replace(pattern, '');
    }
  }

  // Remove null bytes
  query = query.replace(/\0/g, '');

  // Trim and collapse whitespace
  query = query.trim().replace(/\s+/g, ' ');

  return query;
}

/**
 * Sanitizes password input (minimal sanitization to allow special chars)
 * Use for: password fields
 */
export function sanitizePassword(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Only remove null bytes and control characters (except allowed ones)
  let password = input.replace(/\0/g, '');

  // Remove control characters except tab, newline
  password = password.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return password;
}

/**
 * Sanitizes an array of strings (e.g., keywords, tags)
 */
export function sanitizeArray(inputs: string[]): string[] {
  if (!Array.isArray(inputs)) {
    return [];
  }

  return inputs
    .map(input => sanitizeText(input))
    .filter(input => input.length > 0);
}

/**
 * Sanitizes object values (shallow)
 * Use for: form data objects before submission
 */
export function sanitizeFormData<T extends Record<string, unknown>>(
  data: T,
  config?: {
    urlFields?: string[];
    emailFields?: string[];
    passwordFields?: string[];
    skipFields?: string[];
  }
): T {
  const result = { ...data };
  const { urlFields = [], emailFields = [], passwordFields = [], skipFields = [] } = config || {};

  for (const key of Object.keys(result)) {
    const value = result[key];

    if (skipFields.includes(key)) {
      continue;
    }

    if (typeof value === 'string') {
      if (urlFields.includes(key)) {
        (result as Record<string, unknown>)[key] = sanitizeUrl(value);
      } else if (emailFields.includes(key)) {
        (result as Record<string, unknown>)[key] = sanitizeEmail(value);
      } else if (passwordFields.includes(key)) {
        (result as Record<string, unknown>)[key] = sanitizePassword(value);
      } else {
        (result as Record<string, unknown>)[key] = sanitizeText(value);
      }
    } else if (Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeArray(value as string[]);
    }
  }

  return result;
}

/**
 * Escapes string for safe use in regex
 */
export function escapeRegex(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validates that input doesn't contain injection attempts
 * Returns true if safe, false if suspicious
 */
export function isSafeInput(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return true;
  }

  // Check for HTML tags (use non-global regex to avoid state issues)
  if (/<[^>]*>/.test(input)) {
    return false;
  }

  // Check for script-related content
  if (/javascript:|vbscript:|on\w+\s*=/i.test(input)) {
    return false;
  }

  // Check for SQL injection patterns
  // Reset lastIndex for global regexes to avoid state issues
  for (const pattern of SQL_INJECTION_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(input)) {
      return false;
    }
  }

  return true;
}
