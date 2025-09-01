/*
  # Create Missing Database Tables

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, optional)
      - `color` (text, default blue)
      - `created_at` (timestamp)
    - `products`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `name` (text)
      - `description` (text, optional)
      - `category` (text)
      - `brand` (text, optional)
      - `purchase_price_ht` (decimal)
      - `sale_price_ht` (decimal)
      - `vat_rate` (decimal)
      - `sale_price_ttc` (decimal)
      - `stock` (integer)
      - `weight` (decimal, optional)
      - `unit` (text, optional)
      - `observations` (text, optional)
      - `alert_quantity` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `clients`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `name` (text)
      - `address` (text, optional)
      - `postal_code` (text, optional)
      - `city` (text, optional)
      - `country` (text, optional)
      - `contact` (text, optional)
      - `phone` (text, optional)
      - `mobile` (text, optional)
      - `fax` (text, optional)
      - `email` (text, optional)
      - `website` (text, optional)
      - `rib` (text, optional)
      - `balance` (decimal)
      - `initial_balance` (decimal)
      - `vat_intra` (text, optional)
      - `siret` (text, optional)
      - `ape` (text, optional)
      - `rcs` (text, optional)
      - `total_purchases` (decimal)
      - `created_at` (timestamp)
    - `invoices`
      - `id` (text, primary key)
      - `client_id` (uuid, foreign key)
      - `client_name` (text)
      - `items` (jsonb)
      - `subtotal` (decimal)
      - `tax` (decimal)
      - `total` (decimal)
      - `status` (text)
      - `created_at` (timestamp)
      - `due_date` (timestamp)
    - `company_settings`
      - `id` (uuid, primary key)
      - `company_name` (text)
      - `address` (text, optional)
      - `postal_code` (text, optional)
      - `city` (text, optional)
      - `country` (text, optional)
      - `phone` (text, optional)
      - `email` (text, optional)
      - `website` (text, optional)
      - `siret` (text, optional)
      - `ape_code` (text, optional)
      - `vat_number` (text, optional)
      - `logo_url` (text, optional)
      - `primary_color` (text)
      - `secondary_color` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT '',
  brand text DEFAULT '',
  purchase_price_ht decimal(10,2) DEFAULT 0,
  sale_price_ht decimal(10,2) DEFAULT 0,
  vat_rate decimal(5,2) DEFAULT 6.0,
  sale_price_ttc decimal(10,2) DEFAULT 0,
  stock integer DEFAULT 0,
  weight decimal(8,3) DEFAULT 0,
  unit text DEFAULT '',
  observations text DEFAULT '',
  alert_quantity integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  address text DEFAULT '',
  postal_code text DEFAULT '',
  city text DEFAULT '',
  country text DEFAULT '',
  contact text DEFAULT '',
  phone text DEFAULT '',
  mobile text DEFAULT '',
  fax text DEFAULT '',
  email text DEFAULT '',
  website text DEFAULT '',
  rib text DEFAULT '',
  balance decimal(10,2) DEFAULT 0,
  initial_balance decimal(10,2) DEFAULT 0,
  vat_intra text DEFAULT '',
  siret text DEFAULT '',
  ape text DEFAULT '',
  rcs text DEFAULT '',
  total_purchases decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY,
  client_id uuid REFERENCES clients(id),
  client_name text NOT NULL,
  items jsonb DEFAULT '[]'::jsonb,
  subtotal decimal(10,2) DEFAULT 0,
  tax decimal(10,2) DEFAULT 0,
  total decimal(10,2) DEFAULT 0,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  due_date timestamptz DEFAULT (now() + interval '30 days')
);

-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text DEFAULT 'StockManager Pro',
  address text DEFAULT '',
  postal_code text DEFAULT '',
  city text DEFAULT '',
  country text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  website text DEFAULT '',
  siret text DEFAULT '',
  ape_code text DEFAULT '',
  vat_number text DEFAULT '',
  logo_url text DEFAULT '',
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#1E40AF',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since there's no authentication system)
CREATE POLICY "Allow all operations on categories"
  ON categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on products"
  ON products
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on clients"
  ON clients
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on invoices"
  ON invoices
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on company_settings"
  ON company_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default company settings
INSERT INTO company_settings (
  company_name,
  address,
  postal_code,
  city,
  country,
  phone,
  email,
  website,
  siret,
  ape_code,
  vat_number,
  primary_color,
  secondary_color
) VALUES (
  'StockManager Pro',
  '123 Rue du Commerce',
  '75001',
  'Paris',
  'France',
  '+33 1 23 45 67 89',
  'contact@stockmanager.fr',
  'www.stockmanager.fr',
  '123 456 789 00012',
  '4651Z',
  'FR12345678901',
  '#3B82F6',
  '#1E40AF'
) ON CONFLICT DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, description, color) VALUES
  ('SNACK', 'Produits alimentaires', '#10B981'),
  ('BOISSON', 'Boissons et rafraîchissements', '#3B82F6'),
  ('EMBALLAGE', 'Matériel d''emballage', '#F59E0B')
ON CONFLICT (name) DO NOTHING;