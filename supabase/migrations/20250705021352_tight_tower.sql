/*
  # Manual subscription fix for successful payment

  1. Changes
    - Update user subscription to 'starter' for users with successful payments
    - Set payment_method_added to true for these users
*/

-- Find users with successful payments but still on free/trial plan
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT u.id, u.email, u.subscription, p.plan
    FROM users u
    JOIN payments p ON u.id = p.user_id
    WHERE p.status = 'succeeded'
    AND (u.subscription = 'free' OR u.subscription = 'trial')
  LOOP
    -- Update user subscription based on their payment
    UPDATE users
    SET 
      subscription = p.plan,
      payment_method_added = true,
      updated_at = now()
    FROM payments p
    WHERE users.id = p.user_id
    AND p.user_id = user_record.id
    AND p.status = 'succeeded'
    AND (users.subscription = 'free' OR users.subscription = 'trial');
    
    RAISE NOTICE 'Updated user % (%) from % to %', 
      user_record.id, 
      user_record.email, 
      user_record.subscription, 
      user_record.plan;
  END LOOP;
END $$;