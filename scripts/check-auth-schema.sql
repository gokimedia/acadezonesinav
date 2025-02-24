-- Check auth schema existence
SELECT schema_name, catalog_name
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- Check auth.users table existence
SELECT table_schema, table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'auth' 
AND table_name = 'users';

-- Check role memberships
SELECT r.rolname, m.member, m.grantor, m.admin_option
FROM pg_auth_members m
JOIN pg_roles r ON r.oid = m.roleid
WHERE r.rolname = 'authenticated'
OR r.rolname = 'anon'
OR r.rolname LIKE '%supabase%';

-- Check table privileges
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'auth'
AND table_name = 'users';

-- List all schemas
SELECT schema_name
FROM information_schema.schemata
ORDER BY schema_name;
