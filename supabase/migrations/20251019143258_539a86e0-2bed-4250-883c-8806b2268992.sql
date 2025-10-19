-- Add missing columns to rfid_scans table
ALTER TABLE public.rfid_scans 
ADD COLUMN IF NOT EXISTS rfid_tag text,
ADD COLUMN IF NOT EXISTS balance numeric;

-- Update existing uid column data to rfid_tag if needed
UPDATE public.rfid_scans SET rfid_tag = uid WHERE rfid_tag IS NULL AND uid IS NOT NULL;

-- Drop the old uid and timestamp columns as they're redundant
ALTER TABLE public.rfid_scans 
DROP COLUMN IF EXISTS uid,
DROP COLUMN IF EXISTS timestamp;