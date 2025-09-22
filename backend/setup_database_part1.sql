-- 1. Create the database user
CREATE USER wtitech_user WITH PASSWORD 'wtitech_pass';

-- 2. Create the database
CREATE DATABASE wtitech OWNER wtitech_user;

-- 3. Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE wtitech TO wtitech_user;

-- Verify the setup
SELECT 'Database and user created successfully!' as status;