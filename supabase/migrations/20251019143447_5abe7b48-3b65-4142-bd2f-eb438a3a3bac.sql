-- Add category column to drinks table
ALTER TABLE public.drinks 
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'drinks';

-- Add more sample food items
INSERT INTO public.drinks (name, price, category) VALUES
  -- Drinks
  ('Coffee', 2.50, 'drinks'),
  ('Tea', 2.00, 'drinks'),
  ('Juice', 3.00, 'drinks'),
  ('Soda', 2.50, 'drinks'),
  ('Water', 1.00, 'drinks'),
  
  -- Snacks
  ('Chips', 1.50, 'snacks'),
  ('Cookies', 2.00, 'snacks'),
  ('Chocolate Bar', 2.50, 'snacks'),
  ('Granola Bar', 2.00, 'snacks'),
  ('Nuts', 3.00, 'snacks'),
  
  -- Main Meals
  ('Burger', 6.50, 'meals'),
  ('Pizza Slice', 4.00, 'meals'),
  ('Sandwich', 5.00, 'meals'),
  ('Pasta', 7.00, 'meals'),
  ('Salad', 5.50, 'meals'),
  
  -- Breakfast
  ('Pancakes', 4.50, 'breakfast'),
  ('Omelette', 5.00, 'breakfast'),
  ('Toast', 2.50, 'breakfast'),
  ('Muffin', 3.00, 'breakfast'),
  ('Bagel', 3.50, 'breakfast'),
  
  -- Desserts
  ('Ice Cream', 3.50, 'desserts'),
  ('Cake Slice', 4.00, 'desserts'),
  ('Brownie', 3.00, 'desserts'),
  ('Donut', 2.50, 'desserts'),
  ('Pie Slice', 4.50, 'desserts')
ON CONFLICT DO NOTHING;

-- Update purchases table to support multiple items per transaction
ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_price numeric NOT NULL DEFAULT 0;