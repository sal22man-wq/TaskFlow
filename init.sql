-- إعدادات قاعدة البيانات الأولية
-- Initial database setup for TaskFlow Management System

-- تمكين امتدادات PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- إعداد إعدادات قاعدة البيانات
ALTER DATABASE taskflow SET timezone TO 'Asia/Riyadh';

-- إنشاء فهارس إضافية للأداء
-- Performance indexes will be created by Drizzle migrations

-- إعدادات الأمان
-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO taskflow_user;
GRANT CREATE ON SCHEMA public TO taskflow_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO taskflow_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO taskflow_user;