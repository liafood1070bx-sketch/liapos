
CREATE TYPE payment_method_enum AS ENUM ('Espèce', 'Virement bancaire', 'Versement bancaire');

ALTER TABLE invoices
ADD COLUMN payment_method payment_method_enum;
