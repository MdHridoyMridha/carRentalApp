/*
  SQL Schema for Supabase Car Rental App
  Run this in your Supabase SQL Editor
*/

-- 1. Create Profiles table (extends Supabase Auth users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Cars table
CREATE TABLE cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  price_per_day NUMERIC NOT NULL,
  availability BOOLEAN DEFAULT TRUE,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  transmission TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  seats INTEGER NOT NULL
);

-- 3. Create Bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  car_id UUID REFERENCES cars ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

-- 4. Set up Row Level Security (RLS)

-- Helper function to check admin status safely
-- SECURITY DEFINER runs with the privileges of the creator (postgres)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Profiles: Everyone can read, only admins/owners can update
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Cars: Everyone can read, only admins can modify
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Cars are viewable by everyone" ON cars;
DROP POLICY IF EXISTS "Admins can insert cars" ON cars;
DROP POLICY IF EXISTS "Admins can update cars" ON cars;
DROP POLICY IF EXISTS "Admins can delete cars" ON cars;
CREATE POLICY "Cars are viewable by everyone" ON cars FOR SELECT USING (true);
CREATE POLICY "Admins can insert cars" ON cars FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update cars" ON cars FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete cars" ON cars FOR DELETE USING (is_admin());

-- Bookings: Users can read/create their own bookings, admins can read all
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;

CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (
  auth.uid() = user_id OR is_admin()
);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (
  auth.uid() = user_id OR is_admin()
);

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. PROPER ADMIN PROMOTION
INSERT INTO public.profiles (id, full_name, email, is_admin)
SELECT id, 'Admin User', email, true
FROM auth.users
WHERE email = 'hridoyhs369@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_admin = true, email = EXCLUDED.email;
