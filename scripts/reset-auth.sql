-- Reset auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table if not exists
CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY,
    email text UNIQUE,
    encrypted_password text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    role text,
    email_confirmed_at timestamp with time zone,
    phone text,
    phone_confirmed_at timestamp with time zone,
    confirmation_token text,
    confirmation_sent_at timestamp with time zone,
    recovery_token text,
    recovery_sent_at timestamp with time zone,
    email_change_token text,
    email_change text,
    email_change_sent_at timestamp with time zone,
    last_sign_in_ip text,
    raw_confirmation_token text,
    raw_email_change_token text,
    raw_recovery_token text,
    raw_phone_change_token text,
    banned_until timestamp with time zone,
    reauthentication_token text,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false,
    deleted_at timestamp with time zone
);

-- Grant necessary privileges
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticated;

-- Create test user if not exists
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    created_at,
    updated_at,
    role,
    email_confirmed_at
)
VALUES (
    gen_random_uuid(),
    'sistem@acadezone.com',
    crypt('123456', gen_salt('bf')),
    now(),
    now(),
    'authenticated',
    now()
)
ON CONFLICT (email) DO NOTHING;
