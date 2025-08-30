#!/usr/bin/env node
/**
 * Script لإعداد المستخدمين الأساسيين في قاعدة البيانات
 * يستخدم في الإنتاج لإنشاء المستخدمين الضروريين
 */

import { db } from "../server/db.js";
import { users } from "../shared/schema.js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

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
  
  try {
    for (const userData of USERS_TO_CREATE) {
      // التحقق من وجود المستخدم
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, userData.username));
      
      if (existingUser) {
        console.log(`✅ المستخدم ${userData.username} موجود بالفعل`);
        continue;
      }
      
      // تشفير كلمة المرور
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // إنشاء المستخدم
      await db.insert(users).values({
        username: userData.username,
        password: hashedPassword,
        role: userData.role,
        isApproved: userData.isApproved,
        isActive: userData.isActive,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email
      });
      
      console.log(`✅ تم إنشاء المستخدم: ${userData.username} (${userData.role})`);
    }
    
    console.log("\n🎉 تم إعداد جميع المستخدمين بنجاح!");
    console.log("\nالمستخدمين المتاحين:");
    console.log("- admin / 123456 (مدير النظام)");
    console.log("- supervisor / 123456 (مشرف)");
    console.log("- user1 / 123456 (مستخدم عادي)");
    
  } catch (error) {
    console.error("❌ خطأ في إعداد المستخدمين:", error);
    process.exit(1);
  }
}

// تشغيل إعداد المستخدمين
if (import.meta.url === `file://${process.argv[1]}`) {
  setupUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ فشل في إعداد المستخدمين:", error);
      process.exit(1);
    });
}

export { setupUsers };