// Environment configuration utility
// Handles missing environment variables and provides helpful error messages

export interface EnvironmentConfig {
  // Supabase configuration
  supabase: {
    url: string;
    anonKey: string;
  };
  
  // Stripe configuration
  stripe: {
    publishableKey?: string;
    priceIds: {
      starter?: string;
      professional?: string;
      enterprise?: string;
    };
  };
  
  // App configuration
  app: {
    version: string;
    debugMode: boolean;
    isDevelopment: boolean;
    isProduction: boolean;
  };
}

// Environment variable validation
export interface EnvValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  errors: string[];
}

/**
 * Get environment configuration with validation
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },
    stripe: {
      publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
      priceIds: {
        starter: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID,
        professional: import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID,
        enterprise: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID,
      },
    },
    app: {
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
      isDevelopment: import.meta.env.DEV === true,
      isProduction: import.meta.env.PROD === true,
    },
  };
}

/**
 * Validate environment configuration
 */
export function validateEnvironment(): EnvValidationResult {
  const config = getEnvironmentConfig();
  const missing: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Required Supabase variables
  if (!config.supabase.url) {
    missing.push('VITE_SUPABASE_URL');
    errors.push('Supabase URL is required for database connectivity');
  }
  
  if (!config.supabase.anonKey) {
    missing.push('VITE_SUPABASE_ANON_KEY');
    errors.push('Supabase anonymous key is required for client-side operations');
  }

  // Optional but recommended Supabase variables
  // (serviceRoleKey removed from frontend)

  // Stripe configuration
  if (!config.stripe.publishableKey) {
    warnings.push('VITE_STRIPE_PUBLISHABLE_KEY not set - payment features will be disabled');
  }

  // Stripe price IDs
  if (!config.stripe.priceIds.starter) {
    warnings.push('VITE_STRIPE_STARTER_PRICE_ID not set - starter plan purchases will fail');
  }

  if (!config.stripe.priceIds.professional) {
    warnings.push('VITE_STRIPE_PROFESSIONAL_PRICE_ID not set - professional plan purchases will fail');
  }

  if (!config.stripe.priceIds.enterprise) {
    warnings.push('VITE_STRIPE_ENTERPRISE_PRICE_ID not set - enterprise plan purchases will fail');
  }

  // Check if we're in live mode
  if (config.stripe.publishableKey?.startsWith('pk_live_')) {
    warnings.push('Using LIVE Stripe keys - ensure all production environment variables are set');
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    errors,
  };
}

/**
 * Get environment status for debugging
 */
export function getEnvironmentStatus(): {
  isConfigured: boolean;
  hasSupabase: boolean;
  hasStripe: boolean;
  isLiveMode: boolean;
  missingCritical: string[];
  missingOptional: string[];
} {
  const config = getEnvironmentConfig();
  const validation = validateEnvironment();

  const missingCritical = validation.errors.map(error => {
    if (error.includes('VITE_SUPABASE_URL')) return 'VITE_SUPABASE_URL';
    if (error.includes('VITE_SUPABASE_ANON_KEY')) return 'VITE_SUPABASE_ANON_KEY';
    return '';
  }).filter(Boolean);

  const missingOptional = validation.warnings.map(warning => {
    if (warning.includes('VITE_STRIPE_PUBLISHABLE_KEY')) return 'VITE_STRIPE_PUBLISHABLE_KEY';
    if (warning.includes('VITE_STRIPE_STARTER_PRICE_ID')) return 'VITE_STRIPE_STARTER_PRICE_ID';
    if (warning.includes('VITE_STRIPE_PROFESSIONAL_PRICE_ID')) return 'VITE_STRIPE_PROFESSIONAL_PRICE_ID';
    if (warning.includes('VITE_STRIPE_ENTERPRISE_PRICE_ID')) return 'VITE_STRIPE_ENTERPRISE_PRICE_ID';
    return '';
  }).filter(Boolean);

  return {
    isConfigured: validation.isValid,
    hasSupabase: !!(config.supabase.url && config.supabase.anonKey),
    hasStripe: !!config.stripe.publishableKey,
    isLiveMode: config.stripe.publishableKey?.startsWith('pk_live_') || false,
    missingCritical,
    missingOptional,
  };
}

/**
 * Get setup instructions based on missing environment variables
 */
export function getSetupInstructions(): string[] {
  const status = getEnvironmentStatus();
  const instructions: string[] = [];

  if (status.missingCritical.length > 0) {
    instructions.push('🚨 CRITICAL: Missing required environment variables:');
    status.missingCritical.forEach(varName => {
      instructions.push(`   - ${varName}`);
    });
    instructions.push('');
    instructions.push('📝 Setup required:');
    instructions.push('1. Copy env.example to .env');
    instructions.push('2. Fill in your Supabase project details');
    instructions.push('3. Restart the development server');
  }

  if (status.missingOptional.length > 0) {
    instructions.push('⚠️  OPTIONAL: Missing Stripe configuration:');
    status.missingOptional.forEach(varName => {
      instructions.push(`   - ${varName}`);
    });
    instructions.push('');
    instructions.push('💳 To enable payments:');
    instructions.push('1. Create a Stripe account');
    instructions.push('2. Get your API keys from Stripe Dashboard');
    instructions.push('3. Create products and get price IDs');
    instructions.push('4. Add them to your .env file');
  }

  if (instructions.length === 0) {
    instructions.push('✅ Environment is properly configured!');
  }

  return instructions;
}

/**
 * Check if the app can run in demo mode
 */
export function canRunInDemoMode(): boolean {
  const status = getEnvironmentStatus();
  return status.hasSupabase && !status.missingCritical.length;
}

/**
 * Get demo mode message
 */
export function getDemoModeMessage(): string {
  const status = getEnvironmentStatus();
  
  if (status.hasSupabase && !status.hasStripe) {
    return '🎉 Running in Demo Mode - All features work except real payments';
  }
  
  if (status.hasSupabase && status.hasStripe) {
    return '🚀 Running in Full Mode - All features including payments are enabled';
  }
  
  return '⚠️  Limited Mode - Some features may not work properly';
} 