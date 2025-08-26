-- =============================
-- تهيئة أول مستخدم Admin في قاعدة البيانات
-- Email: admin@example.com
-- Password: 123456 (مشفرة بـ bcrypt)
-- =============================

-- التحقق من وجود الجداول
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- إدخال المستخدم
INSERT INTO users (email, password)
VALUES (
  'admin@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZ2hV8sDT9T1cYy8nbxEMF0F6sYZ7.'
);

-- التحقق من الإدخال
SELECT * FROM users;
