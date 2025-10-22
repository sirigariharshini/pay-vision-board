-- Enable real-time updates for rfid_scan table
ALTER TABLE public.rfid_scan REPLICA IDENTITY FULL;

-- Add rfid_scan to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.rfid_scan;