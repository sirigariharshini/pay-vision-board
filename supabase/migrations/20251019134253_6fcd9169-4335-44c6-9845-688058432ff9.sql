-- Enable RLS on rfid_scans table
ALTER TABLE public.rfid_scans ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert RFID scans
CREATE POLICY "Anyone can insert rfid scans"
ON public.rfid_scans
FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to view rfid scans
CREATE POLICY "Anyone can view rfid scans"
ON public.rfid_scans
FOR SELECT
TO public
USING (true);

-- Enable realtime for rfid_scans
ALTER PUBLICATION supabase_realtime ADD TABLE public.rfid_scans;