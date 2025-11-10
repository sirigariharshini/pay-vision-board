-- Add face recognition fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS face_embedding jsonb,
ADD COLUMN IF NOT EXISTS face_image_url text;

-- Create verification_events table to track face+RFID verification
CREATE TABLE IF NOT EXISTS public.verification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.users(id),
  rfid_tag text NOT NULL,
  face_verified boolean NOT NULL DEFAULT false,
  rfid_verified boolean NOT NULL DEFAULT false,
  verification_timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on verification_events
ALTER TABLE public.verification_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert and view verification events
CREATE POLICY "Anyone can insert verification events"
ON public.verification_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view verification events"
ON public.verification_events
FOR SELECT
USING (true);

-- Enable realtime for verification_events
ALTER TABLE public.verification_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_events;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_events_user_id ON public.verification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_events_timestamp ON public.verification_events(verification_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_users_rfid_lookup ON public.users(id) WHERE face_embedding IS NOT NULL;