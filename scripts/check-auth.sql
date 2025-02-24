-- Auth şemasını kontrol et
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'auth';

-- Auth kullanıcılar tablosunu kontrol et
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
);

-- Auth kullanıcıları listele
SELECT * FROM auth.users;

-- Auth şema izinlerini kontrol et
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'auth' 
AND table_name = 'users';
