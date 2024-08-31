DO $$
BEGIN
  RAISE NOTICE 'Starting seed process';
    -- Insert a default user with a hardcoded UUID and set email as verified
    INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, email_confirmed_at)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'hello@visioncreator.earth',
        jsonb_build_object('name', 'Visioncreator'),
        now(),
        now()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert the corresponding profile with the same hardcoded UUID
    INSERT INTO public.profiles (id, name, created_at)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Visioncreator',
        now()
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Seed process completed';
END $$;
