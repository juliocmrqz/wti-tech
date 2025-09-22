-- Grant privileges on the public schema
GRANT ALL ON SCHEMA public TO wtitech_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wtitech_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wtitech_user;

-- Set default privileges for future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO wtitech_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO wtitech_user;

-- Verify the setup
SELECT 'Schema privileges granted successfully!' as status;