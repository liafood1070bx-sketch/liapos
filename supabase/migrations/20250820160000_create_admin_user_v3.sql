
-- Function to create a new user
CREATE OR REPLACE FUNCTION public.create_user(email text, password text)
RETURNS void AS $$
BEGIN
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at, confirmed_at)
  VALUES
    ( '00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', email, crypt(password, gen_salt('bf')), now(), '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', NULL, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the admin user
SELECT public.create_user('sermos73@gmail.com', 'errefw73');

-- Update the user's role to admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'sermos73@gmail.com');
