import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for persistence across deployments
export const sessions = pgTable("sessions", {
  sid: varchar("sid", { length: 128 }).primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // user, supervisor, admin
  isApproved: text("is_approved").notNull().default("pending"), // pending, approved, rejected
  isActive: text("is_active").notNull().default("true"), // true, false
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").unique(), // link to users table
  name: text("name").notNull(),
  role: text("role").notNull(),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("available"), // available, busy, offline
  activeTasks: integer("active_tasks").notNull().default(0),
  avatar: text("avatar"), // optional avatar URL or initials
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  whatsappNumber: text("whatsapp_number"), // رقم الواتساب
  email: text("email"),
  address: text("address"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// جدول تقييمات العملاء
export const customerRatings = pgTable("customer_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  customerId: varchar("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  rating: text("rating").notNull(), // angry, satisfied, very_satisfied
  ratingText: text("rating_text").notNull(), // غاضب، راضي، راضي جدا
  comments: text("comments"), // تعليقات إضافية اختيارية
  messageSent: text("message_sent").notNull().default("false"), // تم إرسال الرسالة
  responseReceived: text("response_received").notNull().default("false"), // تم تلقي الرد
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  time: text("time").notNull(), // estimated time or schedule
  notes: text("notes"), // additional notes
  status: text("status").notNull().default("pending"), // pending, start, complete
  priority: text("priority").notNull().default("medium"), // low, medium, high
  assigneeIds: text("assignee_ids").array(), // Array of team member IDs
  dueDate: timestamp("due_date"),
  progress: integer("progress").notNull().default(0), // 0-100
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id"), // null for group messages
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"), // text, task, system
  messageScope: text("message_scope").notNull().default("private"), // private, group
  taskId: varchar("task_id"), // reference to task if message is task-related
  isRead: text("is_read").notNull().default("false"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // task_assigned, task_completed, new_message, task_overdue
  relatedId: varchar("related_id"), // task id, message id, etc.
  isRead: text("is_read").notNull().default("false"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  isApproved: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  activeTasks: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
}).partial();

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerRatingSchema = createInsertSchema(customerRatings).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertCustomerRating = z.infer<typeof insertCustomerRatingSchema>;
export type CustomerRating = typeof customerRatings.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type TaskWithAssignees = Task & {
  assignees?: TeamMember[];
};

// Relations
export const userRelations = relations(users, ({ one }) => ({
  teamMember: one(teamMembers, {
    fields: [users.id],
    references: [teamMembers.userId],
  }),
}));

export const teamMemberRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export type MessageWithSender = Message & {
  sender?: TeamMember | User;
};

export type UserWithTeamMember = User & {
  teamMember?: TeamMember;
};

// System Logs table
export const systemLogs = pgTable("system_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(), // login, logout, task_created, task_updated, user_created, role_changed, etc.
  userId: varchar("user_id").references(() => users.id),
  username: text("username"),
  details: text("details"), // JSON string with additional details
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").default(sql`now()`),
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({
  id: true,
  timestamp: true,
});
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;

// WhatsApp settings table
export const whatsappSettings = pgTable("whatsapp_settings", {
  id: varchar("id").primaryKey().default("default"),
  defaultMessage: text("default_message").notNull().default(`مرحباً {customerName}

✅ تم إتمام مهمة "{taskTitle}" بنجاح من قبل شركة اشراق الودق لتكنولوجيا المعلومات.

🌟 نرجو تقييم مستوى رضاكم عن أدائنا:

رد برقم واحد فقط:
1️⃣ - غاضب 😠
2️⃣ - راضي 😊  
3️⃣ - راضي جدا 😍

شكراً لثقتكم بنا 🙏`),
  senderName: varchar("sender_name").default("شركة اشراق الودق لتكنولوجيا المعلومات"),
  autoSend: boolean("auto_send").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type WhatsAppSettings = typeof whatsappSettings.$inferSelect;
export type UpsertWhatsAppSettings = typeof whatsappSettings.$inferInsert;
