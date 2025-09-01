CREATE TABLE company_info (
    id SERIAL PRIMARY KEY,
    name TEXT,
    address TEXT,
    postal_code TEXT,
    city TEXT,
    vat_number TEXT
);

INSERT INTO company_info (name, address, postal_code, city, vat_number) VALUES
('LIA FOOD SRL', 'RUE DE FIERLANT 120 FORESTBRUXELLES', '1190', 'Bruxelles', 'TVA BE10 1540 8965');
