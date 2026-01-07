/*
  # Add INSERT policy for users table

  The signup flow creates an auth user, then tries to insert into the users table.
  Without an INSERT policy, RLS blocks this operation.

  Error: "new row violates row-level security policy for table 'users'"
*/

-- Allow authenticated users to insert their own profile (id must match auth.uid())
-- Use DO block to check if policy exists first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'Users can create own profile'
  ) THEN
    CREATE POLICY "Users can create own profile"
      ON users
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
