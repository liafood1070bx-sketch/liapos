/*
  # Create Orders Table for POS System

  1. New Tables
    - `orders`
      - `id` (text, primary key)
      - `client_vat_number` (text)
      - `client_name` (text, optional)
      - `items` (jsonb)
      - `subtotal` (decimal)
      - `tax` (decimal)
      - `total` (decimal)
      - `status` (text)
      - `created_at` (timestamp)
      - `prepared_at` (timestamp, optional)

  2. Security
    - Enable RLS on orders table
    - Add policies for public access
*/

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  client_vat_number text NOT NULL,
  client_name text DEFAULT '',
  items jsonb DEFAULT '[]'::jsonb,
  subtotal decimal(10,2) DEFAULT 0,
  tax decimal(10,2) DEFAULT 0,
  total decimal(10,2) DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  prepared_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Allow all operations on orders"
  ON orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_date_status ON orders(created_at, status);
CREATE INDEX IF NOT EXISTS idx_orders_client_vat ON orders(client_vat_number);