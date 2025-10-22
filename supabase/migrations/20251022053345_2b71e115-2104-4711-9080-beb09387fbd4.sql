-- Enable RLS on rfid_scan table if not already enabled
ALTER TABLE public.rfid_scan ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read RFID scans (needed for real-time subscription)
CREATE POLICY "Anyone can view RFID scans"
ON public.rfid_scan
FOR SELECT
USING (true);

-- Allow anyone to insert RFID scans (so external systems can write)
CREATE POLICY "Anyone can insert RFID scans"
ON public.rfid_scan
FOR INSERT
WITH CHECK (true);