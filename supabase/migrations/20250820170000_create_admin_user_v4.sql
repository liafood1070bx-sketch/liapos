
-- Function to create a new user
CREATE OR REPLACE FUNCTION public.create_user(email text, password text)
RETURNS void AS $$
BEGIN
  INSERT INTO auth.users (email, encrypted_password, raw_app_meta_data)
  VALUES (email, crypt(password, gen_salt('bf')), '{"provider":"email","providers":["email"]}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the admin user
SELECT public.create_user('sermos73@gmail.com', 'errefw73');

-- Update the user's role to admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'sermos73@gmail.com');
