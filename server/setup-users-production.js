// setup-users-production.js
import "dotenv/config";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as schema from "./server/db/schema.js"; // تأكد من المسار الصحيح للـ schema

const { Pool } = pkg;

async function main() {
  console.log("🚀 بدء زرع المستخدمين في قاعدة بيانات الإنتاج...");

  // إعداد الاتصال بقاعدة البيانات
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // لازم يكون عندك DATABASE_URL بالـ .env.production
  });
  const db = drizzle(pool, { schema });

  // تعريف المستخدمين الأساسيين
  const users = [
    { username: "admin", password: "123456", role: "admin" },
    { username: "supervisor", password: "123456", role: "supervisor" },
    { username: "user1", password: "123456", role: "user" },
  ];

  for (const user of users) {
    const hashedPassword = bcrypt.hashSync(user.password, 10);

    try {
      // إدخال المستخدمين
      await db
        .insert(schema.users)
        .values({
          username: user.username,
          password: hashedPassword,
          role: user.role,
        })
        .onConflictDoNothing(); // إذا موجود، يتجاهل
      console.log(`✅ تمت إضافة/تأكيد المستخدم: ${user.username}`);
    } catch (err) {
      console.error(`❌ خطأ مع المستخدم ${user.username}:`, err.message);
    }
  }

  await pool.end();
  console.log("🎉 تم زرع المستخدمين بنجاح!");
}

main().catch((err) => {
  console.error("❌ خطأ عام:", err);
});
