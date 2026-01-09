-- Migration: Simplify signup by using database trigger for profile creation
-- This replaces the create-user-profile edge function with an automatic trigger
-- The trigger fires when a new user is created in auth.users and creates their profile

-- Function to auto-create user profile when auth user is created
-- Uses SECURITY DEFINER to bypass RLS (runs with function owner's privileges)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, subscription, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    'trial',
    NOW() + INTERVAL '14 days'
  )
  ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id,
    name = EXCLUDED.name,
    subscription = 'trial',
    trial_ends_at = NOW() + INTERVAL '14 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
-- AFTER INSERT ensures the auth user is fully created before we create the profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT, UPDATE ON public.users TO authenticated;
