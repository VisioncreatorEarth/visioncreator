-- Create a function to safely create users if they don't exist
CREATE OR REPLACE FUNCTION public.create_user(
    user_id uuid,
    email text,
    password text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
    encrypted_pw text;
BEGIN
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
        RETURN user_id;
    END IF;

    IF password IS NULL THEN
        -- Generate a secure random password if none is provided
        password := encode(gen_random_bytes(56), 'base64');
    END IF;

    encrypted_pw := crypt(password, gen_salt('bf'));

    -- Create user only if they don't exist
    INSERT INTO auth.users
        (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES
        ('00000000-0000-0000-0000-000000000000', user_id, 'authenticated', 'authenticated', email, encrypted_pw, now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
    ON CONFLICT (id) DO NOTHING;

    -- Create identity only if it doesn't exist
    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES
        (user_id, user_id, format('{"sub":"%s","email":"%s"}', user_id::text, email)::jsonb, 'email', now(), now(), now())
    ON CONFLICT (provider_id, provider) DO NOTHING;

    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    admin_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
    -- Create admin user with a generated password
    PERFORM public.create_user(admin_id, 'architects@visioncreator.earth');

    -- Insert or update the corresponding profile
    INSERT INTO public.profiles (id, name, created_at)
    VALUES (admin_id, 'Visioncreator', now())
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    RAISE NOTICE 'Admin user migration completed';
END $$;

-- Clean up the temporary function
DROP FUNCTION IF EXISTS public.create_user;
