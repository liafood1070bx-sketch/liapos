
-- Create the admin user using the auth.sign_up function
SELECT auth.sign_up(
  email := 'sermos73@gmail.com',
  password := 'errefw73'
);

-- Update the user's role to admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'sermos73@gmail.com');
