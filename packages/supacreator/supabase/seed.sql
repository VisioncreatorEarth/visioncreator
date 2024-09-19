CREATE OR REPLACE FUNCTION public.create_user(
    user_id uuid,
    email text,
    password text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
    encrypted_pw text;
BEGIN
    IF password IS NULL THEN
        -- Generate a secure random password if none is provided
        password := encode(gen_random_bytes(56), 'base64');
    END IF;

    encrypted_pw := crypt(password, gen_salt('bf'));

    INSERT INTO auth.users
        (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES
        ('00000000-0000-0000-0000-000000000000', user_id, 'authenticated', 'authenticated', email, encrypted_pw, now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

    INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES
        (user_id, user_id, format('{"sub":"%s","email":"%s"}', user_id::text, email)::jsonb, 'email', now(), now(), now());

    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    admin_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
    -- Create admin user with a generated password
    PERFORM public.create_user(admin_id, 'architects@visioncreator.earth');

    -- Insert the corresponding profile
    INSERT INTO public.profiles (id, name, created_at)
    VALUES (admin_id, 'Visioncreator', now())
    ON CONFLICT (id) DO UPDATE SET name = 'Visioncreator';

    RAISE NOTICE 'Seed process completed';
END $$;
