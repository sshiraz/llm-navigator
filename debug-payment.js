// Quick debug script to check payment status
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jgkdzaoajbzmuuajpndv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impna2R6YW9hamJ6bXV1YWpwbmR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUyMzc1OSwiZXhwIjoyMDY3MDk5NzU5fQ.DOYDCrZJrV895yP6Qev4y8cRN1b0PUNK-JMvlwTFCBo';

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