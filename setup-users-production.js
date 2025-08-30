#!/usr/bin/env node
/**
 * Script لإعداد المستخدمين الأساسيين في قاعدة البيانات الإنتاج
 * تشغيل: node setup-users-production.js
 */

import { pool } from "./server/db.js";
import bcrypt from "bcryptjs";

const USERS_TO_CREATE = [
  {
    username: "admin",
    password: "123456",
    role: "admin",
    isApproved: "approved",
    isActive: "true",
    firstName: "مدير",
    lastName: "النظام",
    email: "admin@company.com"
  },
  {
    username: "supervisor",
    password: "123456", 
    role: "supervisor",
    isApproved: "approved",
    isActive: "true",
    firstName: "مشرف",
    lastName: "النظام",
    email: "supervisor@company.com"
  },
  {
    username: "user1",
    password: "123456",
    role: "user", 
    isApproved: "approved",
    isActive: "true",
    firstName: "مستخدم",
    lastName: "عادي",
    email: "user1@company.com"
  }
];

async function setupUsers() {
  console.log("🚀 بدء إعداد المستخدمين في قاعدة البيانات...");
  
  const client = await pool.connect();
  
  try {
    for (const userData of USERS_TO_CREATE) {
      // التحقق من وجود المستخدم
      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [userData.username]
      );
      
      if (existingUser.rows.length > 0) {
        console.log(`✅ المستخدم ${userData.username} موجود بالفعل`);
        continue;
      }
      
      // تشفير كلمة المرور
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // إنشاء المستخدم
      await client.query(`
        INSERT INTO users (username, password, role, is_approved, is_active, first_name, last_name, email) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        userData.username,
        hashedPassword,
        userData.role,
        userData.isApproved,
        userData.isActive,
        userData.firstName,
        userData.lastName,
        userData.email
      ]);
      
      console.log(`✅ تم إنشاء المستخدم: ${userData.username} (${userData.role})`);
    }
    
    console.log("\n🎉 تم إعداد جميع المستخدمين بنجاح!");
    console.log("\nالمستخدمين المتاحين للدخول:");
    console.log("👑 admin / 123456 (مدير النظام)");
    console.log("🔧 supervisor / 123456 (مشرف)");
    console.log("👤 user1 / 123456 (مستخدم عادي)");
    console.log("\n⚠️  تذكر تغيير كلمات المرور بعد أول تسجيل دخول!");
    
  } catch (error) {
    console.error("❌ خطأ في إعداد المستخدمين:", error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

// تشغيل إعداد المستخدمين
setupUsers()
  .then(() => {
    console.log("\n✅ تم الانتهاء بنجاح!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ فشل في إعداد المستخدمين:", error);
    process.exit(1);
  });