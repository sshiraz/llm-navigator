// Quick debug script to check payment status
// Usage: VITE_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node debug-payment.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugPayment() {
  console.log('🔍 Checking recent payments and users...');
  
  // Check recent payments
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('💳 Recent payments:', payments);
  if (paymentsError) console.error('Payment error:', paymentsError);
  
  // Check users with recent updates
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(5);
    
  console.log('👤 Recent users:', users);
  if (usersError) console.error('Users error:', usersError);
  
  // Check for any user with trial subscription
  const { data: trialUsers, error: trialError } = await supabase
    .from('users')
    .select('*')
    .eq('subscription', 'trial');
    
  console.log('🎯 Trial users (should be upgraded):', trialUsers);
  if (trialError) console.error('Trial error:', trialError);
}

debugPayment().catch(console.error);