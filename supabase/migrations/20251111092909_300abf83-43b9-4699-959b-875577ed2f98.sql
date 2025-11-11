-- Fix RLS policies for users table to allow registration
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;
DROP POLICY IF EXISTS "Anyone can update user balance" ON public.users;

-- Create comprehensive policies
CREATE POLICY "Anyone can view users"
  ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert users"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update users"
  ON public.users
  FOR UPDATE
  USING (true);