ALTER TABLE orders
ADD COLUMN updated_at timestamptz DEFAULT now();
