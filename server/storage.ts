import {
  users,
  customers,
  teamMembers,
  tasks,
  messages,
  notifications,
  systemLogs,
  type User,
  type InsertUser,
  type Customer,
  type InsertCustomer,
  type TeamMember,
  type InsertTeamMember,
  type Task,
  type InsertTask,
  type UpdateTask,
  type TaskWithAssignees,
  type Message,
  type InsertMessage,
  type MessageWithSender,
  type Notification,
  type InsertNotification,
  type SystemLog,
  type InsertSystemLog,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Tasks
  getAllTasks(): Promise<TaskWithAssignees[]>;
  getTasksForUser(userId: string): Promise<TaskWithAssignees[]>;
  getTask(id: string): Promise<TaskWithAssignees | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Team Members
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: string): Promise<TeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(
    id: string,
    updates: Partial<TeamMember>,
  ): Promise<TeamMember | undefined>;
  deleteTeamMember(id: string): Promise<boolean>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(
    id: string,
    updates: Partial<Customer>,
  ): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserWithTeamMember(id: string): Promise<User & { teamMember?: TeamMember } | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserApproval(id: string, isApproved: string): Promise<User | undefined>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  
  // Team Member by User
  getTeamMemberByUserId(userId: string): Promise<TeamMember | undefined>;

  // Messages
  getMessages(userId1?: string, userId2?: string): Promise<MessageWithSender[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: string): Promise<Message | undefined>;
  getUnreadMessagesCount(userId: string): Promise<number>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<Notification | undefined>;
  getUnreadNotificationsCount(userId: string): Promise<number>;

  // System Logs
  getSystemLogs(limit?: number): Promise<SystemLog[]>;
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;
  logUserAction(action: string, userId: string, username: string, details?: any, ipAddress?: string, userAgent?: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    try {
      // Create admin user if doesn't exist
      const adminExists = await this.getUserByUsername("administrator");
      if (!adminExists) {
        await this.createAdminUser();
      }

      // Create default team members if none exist
      const existingMembers = await this.getTeamMembers();
      if (existingMembers.length === 0) {
        await this.createDefaultMembers();
      }
    } catch (error) {
      console.error("Error initializing data:", error);
    }
  }

  private async createAdminUser(): Promise<User> {
    const hashedPassword = await bcrypt.hash("wdq@#$", 10);
    
    return await this.createUser({
      username: "administrator",
      password: hashedPassword,
      role: "admin",
      isApproved: "approved"
    });
  }

  private async createDefaultMembers() {
    const defaultMembers = [
      {
        name: "Sarah Thompson",
        role: "Project Manager", 
        email: "sarah.thompson@company.com",
        status: "available",
        avatar: "ST"
      },
      {
        name: "Mike Johnson",
        role: "Backend Developer", 
        email: "mike.johnson@company.com",
        status: "busy",
        avatar: "MJ"
      },
      {
        name: "Emma Davis",
        role: "Frontend Developer",
        email: "emma.davis@company.com", 
        status: "available",
        avatar: "ED"
      },
      {
        name: "Alex Rodriguez",
        role: "Product Manager",
        email: "alex.rodriguez@company.com",
        status: "available", 
        avatar: "AR"
      }
    ];

    for (const member of defaultMembers) {
      await this.createTeamMember(member);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const userData = { ...insertUser, password: hashedPassword };
    
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    
    // Create corresponding team member for this user
    const teamMemberRole = 
      insertUser.role === 'admin' ? 'مدير النظام' : 
      insertUser.role === 'supervisor' ? 'مشرف' : 
      'عضو فريق';
      
    await this.createTeamMember({
      userId: user.id,
      name: insertUser.username,
      role: teamMemberRole,
      email: `${insertUser.username}@company.com`,
      status: 'available',
      avatar: insertUser.username.charAt(0).toUpperCase(),
    });
    
    return user;
  }

  async getUserWithTeamMember(id: string): Promise<User & { teamMember?: TeamMember } | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const teamMember = await this.getTeamMemberByUserId(id);
    return { ...user, teamMember };
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserApproval(id: string, isApproved: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isApproved })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    
    // Update corresponding team member role
    if (user) {
      const teamMemberRole = 
        role === 'admin' ? 'مدير النظام' : 
        role === 'supervisor' ? 'مشرف' : 
        'عضو فريق';
        
      await db
        .update(teamMembers)
        .set({ role: teamMemberRole })
        .where(eq(teamMembers.userId, user.id));
    }
    
    return user;
  }

  // Team Member by User
  async getTeamMemberByUserId(userId: string): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
    return member;
  }

  // Team member methods
  async getTeamMembers(): Promise<TeamMember[]> {
    return await db.select().from(teamMembers);
  }

  async getTeamMember(id: string): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return member;
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [teamMember] = await db
      .insert(teamMembers)
      .values(member)
      .returning();
    return teamMember;
  }

  async updateTeamMember(
    id: string,
    updates: Partial<TeamMember>,
  ): Promise<TeamMember | undefined> {
    const [updated] = await db
      .update(teamMembers)
      .set(updates)
      .where(eq(teamMembers.id, id))
      .returning();
    return updated;
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    const result = await db.delete(teamMembers).where(eq(teamMembers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async updateCustomer(
    id: string,
    updates: Partial<Customer>,
  ): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set(updates)
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Task methods
  async getTasksForUser(userId: string): Promise<TaskWithAssignees[]> {
    // Get team member ID for this user
    const teamMember = await this.getTeamMemberByUserId(userId);
    if (!teamMember) return [];
    
    // Get all tasks assigned to this team member
    const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    
    // Filter tasks where this team member is assigned
    const userTasks = allTasks.filter(task => 
      task.assigneeIds && task.assigneeIds.includes(teamMember.id)
    );
    
    // Get assignees for each task
    const tasksWithAssignees = await Promise.all(
      userTasks.map(async (task) => {
        if (!task.assigneeIds || task.assigneeIds.length === 0) {
          return { ...task, assignees: [] };
        }
        
        const assignees = await Promise.all(
          task.assigneeIds.map(async (assigneeId) => {
            const member = await this.getTeamMember(assigneeId);
            return member;
          })
        );
        
        return {
          ...task,
          assignees: assignees.filter((assignee): assignee is TeamMember => assignee !== undefined),
        };
      })
    );
    
    return tasksWithAssignees;
  }

  async getAllTasks(): Promise<TaskWithAssignees[]> {
    const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    const allMembers = await this.getTeamMembers();

    return allTasks.map((task) => ({
      ...task,
      assignees: task.assigneeIds
        ? task.assigneeIds
            .map((id) => allMembers.find((member) => member.id === id))
            .filter(Boolean) as TeamMember[]
        : [],
    }));
  }

  async getTask(id: string): Promise<TaskWithAssignees | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!task) return undefined;

    const allMembers = await this.getTeamMembers();
    return {
      ...task,
      assignees: task.assigneeIds
        ? task.assigneeIds
            .map((id) => allMembers.find((member) => member.id === id))
            .filter(Boolean) as TeamMember[]
        : [],
    };
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    return newTask;
  }

  async updateTask(id: string, updates: UpdateTask): Promise<Task | undefined> {
    const [updated] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Message methods
  async getMessages(userId1?: string, userId2?: string): Promise<MessageWithSender[]> {
    let query = db.select().from(messages).orderBy(desc(messages.createdAt));
    
    if (userId1 && userId2) {
      // Get messages between two specific users
      query = query.where(
        and(
          eq(messages.senderId, userId1),
          eq(messages.receiverId, userId2)
        )
      ) as any;
    } else if (userId1) {
      // Get all messages for a user (sent or received)
      query = query.where(
        eq(messages.senderId, userId1)
      ) as any;
    }
    
    const allMessages = await query;
    const allMembers = await this.getTeamMembers();
    const allUsers = await this.getAllUsers();
    
    return allMessages.map((message) => {
      let sender = allMembers.find(member => member.id === message.senderId) || 
                  allUsers.find(user => user.id === message.senderId);
      return {
        ...message,
        sender
      };
    });
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    
    // Create notification for receiver if it's a direct message
    if (message.receiverId) {
      await this.createNotification({
        userId: message.receiverId,
        title: "رسالة جديدة",
        content: "لديك رسالة جديدة",
        type: "new_message",
        relatedId: newMessage.id
      });
    }
    
    return newMessage;
  }

  async markMessageAsRead(messageId: string): Promise<Message | undefined> {
    const [updated] = await db
      .update(messages)
      .set({ isRead: "true" })
      .where(eq(messages.id, messageId))
      .returning();
    return updated;
  }

  async getUnreadMessagesCount(userId: string): Promise<number> {
    const unreadMessages = await db.select()
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.isRead, "false")
        )
      );
    return unreadMessages.length;
  }

  // Notification methods
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: "true" })
      .where(eq(notifications.id, notificationId))
      .returning();
    return updated;
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const unreadNotifications = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, "false")
        )
      );
    return unreadNotifications.length;
  }

  // Helper method to create task notifications
  async createTaskNotifications(task: Task, type: string): Promise<void> {
    if (task.assigneeIds && task.assigneeIds.length > 0) {
      const teamMembers = await this.getTeamMembers();
      
      for (const assigneeId of task.assigneeIds) {
        const assignee = teamMembers.find(member => member.id === assigneeId);
        if (assignee) {
          let title = "";
          let content = "";
          
          switch (type) {
            case "task_assigned":
              title = "مهمة جديدة";
              content = `تم تكليفك بمهمة جديدة: ${task.title}`;
              break;
            case "task_updated":
              title = "تحديث مهمة";
              content = `تم تحديث المهمة: ${task.title}`;
              break;
            case "task_overdue":
              title = "مهمة متأخرة";
              content = `المهمة ${task.title} متأخرة عن الموعد المحدد`;
              break;
          }
          
          await this.createNotification({
            userId: assigneeId,
            title,
            content,
            type: type as any,
            relatedId: task.id
          });
        }
      }
    }
  }

  // System Logs methods
  async getSystemLogs(limit: number = 100): Promise<SystemLog[]> {
    return await db.select()
      .from(systemLogs)
      .orderBy(desc(systemLogs.timestamp))
      .limit(limit);
  }

  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    const [systemLog] = await db.insert(systemLogs).values(log).returning();
    return systemLog;
  }

  async logUserAction(
    action: string,
    userId: string,
    username: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createSystemLog({
      action,
      userId,
      username,
      details: details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent,
    });
  }
}

export const storage = new DatabaseStorage();