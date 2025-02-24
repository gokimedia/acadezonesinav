-- Kullanıcı oluştur
SELECT supabase_admin.create_user(
  uuid_generate_v4(),
  'sistem@acadezone.com',
  '123456',
  null,
  null,
  null,
  null,
  null,
  null,
  false,
  'authenticated',
  'email',
  now(),
  now()
);
