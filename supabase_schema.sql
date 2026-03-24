/*
  SQL Schema for Supabase Car Rental App
  Run this in your Supabase SQL Editor
*/

-- 1. Create Profiles table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Cars table
CREATE TABLE IF NOT EXISTS public.cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  price_per_day NUMERIC NOT NULL,
  driver_fee NUMERIC DEFAULT 0,
  availability BOOLEAN DEFAULT TRUE,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  transmission TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  seats INTEGER NOT NULL
);

-- 3. Create Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'Cash on Delivery' CHECK (payment_method IN ('Cash on Delivery', 'Card', 'bKash')),
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'rented')),
  phone_number TEXT,
  nid_number TEXT,
  with_driver BOOLEAN DEFAULT FALSE
);

-- Ensure existing table has the new column and updated constraints
DO $$ 
BEGIN 
  -- Add payment_method if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='payment_method') THEN
    ALTER TABLE public.bookings ADD COLUMN payment_method TEXT DEFAULT 'Cash on Delivery' CHECK (payment_method IN ('Cash on Delivery', 'Card', 'bKash'));
  END IF;

  -- Update status constraint to remove 'pending' if it exists
  ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
  ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('confirmed', 'cancelled', 'completed', 'rented'));
  ALTER TABLE public.bookings ALTER COLUMN status SET DEFAULT 'confirmed';
END $$;

-- 4. Automatic Car Availability Trigger
CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changes to 'rented', car becomes unavailable
  IF NEW.status = 'rented' THEN
    UPDATE public.cars SET availability = false WHERE id = NEW.car_id;
  -- If status changes to 'completed' or 'cancelled', car becomes available again
  ELSIF NEW.status = 'completed' OR NEW.status = 'cancelled' THEN
    UPDATE public.cars SET availability = true WHERE id = NEW.car_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_booking_status_change ON public.bookings;
CREATE TRIGGER on_booking_status_change
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_booking_status_change();

-- 5. Set up Row Level Security (RLS)

-- Helper function to check admin status safely
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Profiles Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Cars Policies
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cars are viewable by everyone" ON public.cars;
DROP POLICY IF EXISTS "Admins can insert cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can update cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can delete cars" ON public.cars;
CREATE POLICY "Cars are viewable by everyone" ON public.cars FOR SELECT USING (true);
CREATE POLICY "Admins can insert cars" ON public.cars FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update cars" ON public.cars FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete cars" ON public.cars FOR DELETE USING (public.is_admin());

-- Bookings Policies
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- 5. Trigger for new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 7. Admin Promotion
INSERT INTO public.profiles (id, full_name, email, is_admin)
SELECT id, 'Admin User', email, true
FROM auth.users
WHERE email = 'hridoyhs369@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_admin = true, email = EXCLUDED.email;
