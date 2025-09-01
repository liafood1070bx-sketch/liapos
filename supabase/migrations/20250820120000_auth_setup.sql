-- Create user_roles enum type
CREATE TYPE user_role AS ENUM ('admin', 'client');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  full_name TEXT,
  avatar_url TEXT,
  vat_number TEXT UNIQUE
);

-- Function to create a profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'client');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update RLS policies

-- Drop existing open policies
DROP POLICY IF EXISTS "Users can read categories" ON categories;
DROP POLICY IF EXISTS "Users can manage categories" ON categories;
DROP POLICY IF EXISTS "Users can read products" ON products;
DROP POLICY IF EXISTS "Users can manage products" ON products;
DROP POLICY IF EXISTS "Users can read clients" ON clients;
DROP POLICY IF EXISTS "Users can manage clients" ON clients;
DROP POLICY IF EXISTS "Users can read invoices" ON invoices;
DROP POLICY IF EXISTS "Users can manage invoices" ON invoices;
DROP POLICY IF EXISTS "Users can read company_settings" ON company_settings;
DROP POLICY IF EXISTS "Users can manage company_settings" ON company_settings;
DROP POLICY IF EXISTS "Allow all operations on orders" ON orders;

-- Categories
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Authenticated users can read categories" ON categories FOR SELECT USING (auth.role() = 'authenticated');

-- Products
CREATE POLICY "Admins can manage products" ON products FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Authenticated users can read products" ON products FOR SELECT USING (auth.role() = 'authenticated');

-- Clients
CREATE POLICY "Admins can manage clients" ON clients FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Invoices
CREATE POLICY "Admins can manage invoices" ON invoices FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Company Settings
CREATE POLICY "Admins can manage company_settings" ON company_settings FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Orders
CREATE POLICY "Admins can manage orders" ON orders FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Secure RLS policy for clients managing their own orders
CREATE POLICY "Clients can manage their own orders" ON orders FOR ALL
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'client' AND
    (SELECT vat_number FROM public.profiles WHERE id = auth.uid()) = client_vat_number
)
WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'client' AND
    (SELECT vat_number FROM public.profiles WHERE id = auth.uid()) = client_vat_number
);