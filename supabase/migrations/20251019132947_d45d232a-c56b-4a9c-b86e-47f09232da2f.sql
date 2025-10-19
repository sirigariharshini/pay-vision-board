-- Create drinks table
CREATE TABLE IF NOT EXISTS public.drinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (for RFID users)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY, -- RFID UID
  name TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  drink_id UUID NOT NULL REFERENCES public.drinks(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.drinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create policies (public read access for canteen terminal)
CREATE POLICY "Anyone can view drinks" ON public.drinks FOR SELECT USING (true);
CREATE POLICY "Anyone can view users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Anyone can view purchases" ON public.purchases FOR SELECT USING (true);
CREATE POLICY "Anyone can insert purchases" ON public.purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update user balance" ON public.users FOR UPDATE USING (true);

-- Enable realtime
ALTER TABLE public.drinks REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.purchases REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.drinks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;

-- Insert sample data for testing
INSERT INTO public.drinks (name, price) VALUES
  ('Coffee', 2.50),
  ('Tea', 2.00),
  ('Coca Cola', 1.50),
  ('Water', 1.00),
  ('Orange Juice', 3.00)
ON CONFLICT DO NOTHING;

INSERT INTO public.users (id, name, balance) VALUES
  ('RFID001', 'John Doe', 50.00),
  ('RFID002', 'Jane Smith', 25.00),
  ('RFID003', 'Bob Johnson', 10.00)
ON CONFLICT DO NOTHING;