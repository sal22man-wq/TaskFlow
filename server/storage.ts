import { type User, type InsertUser, type TeamMember, type InsertTeamMember, type Task, type InsertTask, type UpdateTask, type TaskWithAssignees, type Customer, type InsertCustomer, users, teamMembers, tasks, customers } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserApproval(id: string, isApproved: string): Promise<User | undefined>;
  createAdminUser(): Promise<User>;

  // Team member methods
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: string): Promise<TeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: string): Promise<boolean>;

  // Customer methods
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByName(name: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  // Task methods
  getTasks(): Promise<TaskWithAssignees[]>;
  getTask(id: string): Promise<TaskWithAssignees | undefined>;
  getTasksByStatus(status: string): Promise<TaskWithAssignees[]>;
  getTasksByAssignee(assigneeId: string): Promise<TaskWithAssignees[]>;
  createTask(task: InsertTask): Promise<TaskWithAssignees>;
  updateTask(id: string, updates: UpdateTask): Promise<TaskWithAssignees | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Statistics
  getTaskStats(): Promise<{
    activeTasks: number;
    completed: number;
    overdue: number;
    total: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private teamMembers: Map<string, TeamMember>;
  private tasks: Map<string, Task>;
  private customers: Map<string, Customer>;

  constructor() {
    this.users = new Map();
    this.teamMembers = new Map();
    this.tasks = new Map();
    this.customers = new Map();
    
    // Initialize with some default team members and admin user
    this.seedData();
  }

  private async seedData() {
    // Add default team members
    const defaultMembers = [
      {
        name: "Sarah Chen",
        role: "UI/UX Designer",
        email: "sarah.chen@company.com",
        status: "available",
        activeTasks: 0,
        avatar: "SC"
      },
      {
        name: "Mike Johnson",
        role: "Backend Developer", 
        email: "mike.johnson@company.com",
        status: "busy",
        activeTasks: 0,
        avatar: "MJ"
      },
      {
        name: "Emma Davis",
        role: "Frontend Developer",
        email: "emma.davis@company.com", 
        status: "available",
        activeTasks: 0,
        avatar: "ED"
      },
      {
        name: "Alex Rodriguez",
        role: "Product Manager",
        email: "alex.rodriguez@company.com",
        status: "available", 
        activeTasks: 0,
        avatar: "AR"
      }
    ];

    for (const member of defaultMembers) {
      await this.createTeamMember(member);
    }
    
    // Create admin user if doesn't exist
    const adminExists = await this.getUserByUsername("administrator");
    if (!adminExists) {
      await this.createAdminUser();
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "user",
      isApproved: insertUser.isApproved || "pending",
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUserApproval(id: string, isApproved: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, isApproved };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createAdminUser(): Promise<User> {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash("wdq@#$", 10);
    
    return await this.createUser({
      username: "administrator",
      password: hashedPassword,
      role: "admin",
      isApproved: "approved"
    });
  }

  // Team member methods
  async getTeamMembers(): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values());
  }

  async getTeamMember(id: string): Promise<TeamMember | undefined> {
    return this.teamMembers.get(id);
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const id = randomUUID();
    const teamMember: TeamMember = { 
      ...member, 
      id,
      status: member.status || "available",
      activeTasks: 0,
      avatar: member.avatar || null
    };
    this.teamMembers.set(id, teamMember);
    return teamMember;
  }

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember | undefined> {
    const member = this.teamMembers.get(id);
    if (!member) return undefined;
    
    const updatedMember = { ...member, ...updates };
    this.teamMembers.set(id, updatedMember);
    return updatedMember;
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    return this.teamMembers.delete(id);
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByName(name: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(customer => customer.name.toLowerCase() === name.toLowerCase());
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const customer: Customer = {
      id: randomUUID(),
      ...customerData,
      phone: customerData.phone || null,
      email: customerData.email || null,
      address: customerData.address || null,
      createdAt: new Date(),
    };
    
    this.customers.set(customer.id, customer);
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updatedCustomer = { ...customer, ...updates };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Task methods
  async getTasks(): Promise<TaskWithAssignees[]> {
    const tasks = Array.from(this.tasks.values());
    return await Promise.all(
      tasks.map(async (task) => {
        const assignees = task.assigneeIds && task.assigneeIds.length > 0 
          ? await Promise.all(task.assigneeIds.map(id => this.getTeamMember(id)).filter(Boolean)) 
          : [];
        return { ...task, assignees: assignees.filter(a => a !== undefined) as TeamMember[] };
      })
    );
  }

  async getTask(id: string): Promise<TaskWithAssignees | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const assignees = task.assigneeIds && task.assigneeIds.length > 0 
      ? await Promise.all(task.assigneeIds.map(id => this.getTeamMember(id)).filter(Boolean)) 
      : [];
    return { ...task, assignees: assignees.filter(a => a !== undefined) as TeamMember[] };
  }

  async getTasksByStatus(status: string): Promise<TaskWithAssignees[]> {
    const allTasks = await this.getTasks();
    return allTasks.filter(task => task.status === status);
  }

  async getTasksByAssignee(assigneeId: string): Promise<TaskWithAssignees[]> {
    const allTasks = await this.getTasks();
    return allTasks.filter(task => task.assigneeIds && task.assigneeIds.includes(assigneeId));
  }

  async createTask(task: InsertTask): Promise<TaskWithAssignees> {
    const id = randomUUID();
    const now = new Date();
    const newTask: Task = { 
      ...task, 
      id,
      status: task.status || "pending",
      priority: task.priority || "medium",
      progress: task.progress || 0,
      assigneeIds: task.assigneeIds || [],
      dueDate: task.dueDate || null,
      notes: task.notes || null,
      customerPhone: task.customerPhone || null,
      customerAddress: task.customerAddress || null,
      createdAt: now,
      updatedAt: now
    };
    this.tasks.set(id, newTask);

    // Update assignees' active task counts
    if (task.assigneeIds && task.assigneeIds.length > 0 && task.status !== 'complete') {
      for (const assigneeId of task.assigneeIds) {
        const assignee = await this.getTeamMember(assigneeId);
        if (assignee) {
          await this.updateTeamMember(assigneeId, {
            activeTasks: assignee.activeTasks + 1
          });
        }
      }
    }

    return await this.getTask(id) as TaskWithAssignees;
  }

  async updateTask(id: string, updates: UpdateTask): Promise<TaskWithAssignees | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const previousStatus = task.status;
    const previousAssigneeIds = task.assigneeIds || [];
    
    const updatedTask = { 
      ...task, 
      ...updates, 
      updatedAt: new Date()
    };
    this.tasks.set(id, updatedTask);

    // Update assignees' active task counts if status changed
    if (updates.status && updates.status !== previousStatus) {
      const currentAssigneeIds = updatedTask.assigneeIds || [];
      
      // If task completed, decrease all assignees' counts
      if (updates.status === 'complete') {
        for (const assigneeId of currentAssigneeIds) {
          const assignee = await this.getTeamMember(assigneeId);
          if (assignee && assignee.activeTasks > 0) {
            await this.updateTeamMember(assigneeId, {
              activeTasks: assignee.activeTasks - 1
            });
          }
        }
      }
      
      // If task reactivated from completed, increase assignees' counts
      if (previousStatus === 'complete' && updates.status !== 'complete') {
        for (const assigneeId of currentAssigneeIds) {
          const assignee = await this.getTeamMember(assigneeId);
          if (assignee) {
            await this.updateTeamMember(assigneeId, {
              activeTasks: assignee.activeTasks + 1
            });
          }
        }
      }
    }

    // Handle assignee changes
    if (updates.assigneeIds) {
      const newAssigneeIds = updates.assigneeIds;
      
      // Decrease counts for removed assignees
      for (const prevId of previousAssigneeIds) {
        if (!newAssigneeIds.includes(prevId) && updatedTask.status !== 'completed') {
          const assignee = await this.getTeamMember(prevId);
          if (assignee && assignee.activeTasks > 0) {
            await this.updateTeamMember(prevId, {
              activeTasks: assignee.activeTasks - 1
            });
          }
        }
      }
      
      // Increase counts for new assignees
      for (const newId of newAssigneeIds) {
        if (!previousAssigneeIds.includes(newId) && updatedTask.status !== 'completed') {
          const assignee = await this.getTeamMember(newId);
          if (assignee) {
            await this.updateTeamMember(newId, {
              activeTasks: assignee.activeTasks + 1
            });
          }
        }
      }
    }

    return await this.getTask(id);
  }

  async deleteTask(id: string): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) return false;

    // Decrease assignees' active task counts if task was active
    if (task.assigneeIds && task.assigneeIds.length > 0 && task.status !== 'complete') {
      for (const assigneeId of task.assigneeIds) {
        const assignee = await this.getTeamMember(assigneeId);
        if (assignee && assignee.activeTasks > 0) {
          await this.updateTeamMember(assigneeId, {
            activeTasks: assignee.activeTasks - 1
          });
        }
      }
    }

    return this.tasks.delete(id);
  }

  async getTaskStats(): Promise<{
    activeTasks: number;
    completed: number;
    overdue: number;
    total: number;
  }> {
    const allTasks = Array.from(this.tasks.values());
    const now = new Date();
    
    const activeTasks = allTasks.filter(task => 
      task.status === 'pending' || task.status === 'start'
    ).length;
    
    const completed = allTasks.filter(task => task.status === 'complete').length;
    
    const overdue = allTasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < now && task.status !== 'complete'
    ).length;

    return {
      activeTasks,
      completed, 
      overdue,
      total: allTasks.length
    };
  }
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Check if data already exists
    const existingMembers = await this.getTeamMembers();
    if (existingMembers.length === 0) {
      await this.seedData();
    }
  }

  private async seedData() {
    // Add default team members
    const defaultMembers = [
      {
        name: "Sarah Chen",
        role: "UI/UX Designer",
        email: "sarah.chen@company.com",
        status: "available",
        avatar: "SC"
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
    
    // Create admin user if doesn't exist
    const adminExists = await this.getUserByUsername("administrator");
    if (!adminExists) {
      await this.createAdminUser();
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserApproval(id: string, isApproved: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ isApproved })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async createAdminUser(): Promise<User> {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash("wdq@#$", 10);
    
    return await this.createUser({
      username: "administrator",
      password: hashedPassword,
      role: "admin",
      isApproved: "approved"
    });
  }

  // Team member methods
  async getTeamMembers(): Promise<TeamMember[]> {
    return await db.select().from(teamMembers);
  }

  async getTeamMember(id: string): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return member || undefined;
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [teamMember] = await db.insert(teamMembers).values(member).returning();
    return teamMember;
  }

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember | undefined> {
    const [updatedMember] = await db
      .update(teamMembers)
      .set(updates)
      .where(eq(teamMembers.id, id))
      .returning();
    return updatedMember || undefined;
  }

  async deleteTeamMember(id: string): Promise<boolean> {
    const result = await db.delete(teamMembers).where(eq(teamMembers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByName(name: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.name, name));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(updates)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer || undefined;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Task methods
  async getTasks(): Promise<TaskWithAssignees[]> {
    const allTasks = await db.select().from(tasks);
    
    // For each task, get its assignees
    const tasksWithAssignees = await Promise.all(
      allTasks.map(async (task) => {
        let assignees: TeamMember[] = [];
        if (task.assigneeIds && task.assigneeIds.length > 0) {
          assignees = await db
            .select()
            .from(teamMembers)
            .where(inArray(teamMembers.id, task.assigneeIds));
        }
        return { ...task, assignees };
      })
    );
    
    return tasksWithAssignees;
  }

  async getTask(id: string): Promise<TaskWithAssignees | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!task) return undefined;
    
    let assignees: TeamMember[] = [];
    if (task.assigneeIds && task.assigneeIds.length > 0) {
      assignees = await db
        .select()
        .from(teamMembers)
        .where(inArray(teamMembers.id, task.assigneeIds));
    }
    
    return { ...task, assignees };
  }

  async getTasksByStatus(status: string): Promise<TaskWithAssignees[]> {
    const statusTasks = await db.select().from(tasks).where(eq(tasks.status, status));
    
    const tasksWithAssignees = await Promise.all(
      statusTasks.map(async (task) => {
        let assignees: TeamMember[] = [];
        if (task.assigneeIds && task.assigneeIds.length > 0) {
          assignees = await db
            .select()
            .from(teamMembers)
            .where(inArray(teamMembers.id, task.assigneeIds));
        }
        return { ...task, assignees };
      })
    );
    
    return tasksWithAssignees;
  }

  async getTasksByAssignee(assigneeId: string): Promise<TaskWithAssignees[]> {
    const assigneeTasks = await db
      .select()
      .from(tasks)
      .where(sql`${assigneeId} = ANY(${tasks.assigneeIds})`);
    
    const tasksWithAssignees = await Promise.all(
      assigneeTasks.map(async (task) => {
        let assignees: TeamMember[] = [];
        if (task.assigneeIds && task.assigneeIds.length > 0) {
          assignees = await db
            .select()
            .from(teamMembers)
            .where(inArray(teamMembers.id, task.assigneeIds));
        }
        return { ...task, assignees };
      })
    );
    
    return tasksWithAssignees;
  }

  async createTask(task: InsertTask): Promise<TaskWithAssignees> {
    const [newTask] = await db.insert(tasks).values(task).returning();

    // Update assignees' active task counts
    if (task.assigneeIds && task.assigneeIds.length > 0 && task.status !== 'complete') {
      for (const assigneeId of task.assigneeIds) {
        await db
          .update(teamMembers)
          .set({ activeTasks: sql`${teamMembers.activeTasks} + 1` })
          .where(eq(teamMembers.id, assigneeId));
      }
    }

    return (await this.getTask(newTask.id)) as TaskWithAssignees;
  }

  async updateTask(id: string, updates: UpdateTask): Promise<TaskWithAssignees | undefined> {
    // Get the current task to compare changes
    const currentTask = await this.getTask(id);
    if (!currentTask) return undefined;

    const [updatedTask] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: sql`now()` })
      .where(eq(tasks.id, id))
      .returning();

    if (!updatedTask) return undefined;

    // Handle active task count updates
    const previousStatus = currentTask.status;
    const previousAssigneeIds = currentTask.assigneeIds || [];

    // Update assignees' active task counts if status changed
    if (updates.status && updates.status !== previousStatus) {
      const currentAssigneeIds = updatedTask.assigneeIds || [];
      
      // If task completed, decrease all assignees' counts
      if (updates.status === 'complete') {
        for (const assigneeId of currentAssigneeIds) {
          await db
            .update(teamMembers)
            .set({ activeTasks: sql`GREATEST(0, ${teamMembers.activeTasks} - 1)` })
            .where(eq(teamMembers.id, assigneeId));
        }
      }
      
      // If task reactivated from completed, increase assignees' counts
      if (previousStatus === 'complete' && updates.status !== 'complete') {
        for (const assigneeId of currentAssigneeIds) {
          await db
            .update(teamMembers)
            .set({ activeTasks: sql`${teamMembers.activeTasks} + 1` })
            .where(eq(teamMembers.id, assigneeId));
        }
      }
    }

    // Handle assignee changes
    if (updates.assigneeIds) {
      const newAssigneeIds = updates.assigneeIds;
      
      // Decrease counts for removed assignees
      for (const prevId of previousAssigneeIds) {
        if (!newAssigneeIds.includes(prevId) && updatedTask.status !== 'complete') {
          await db
            .update(teamMembers)
            .set({ activeTasks: sql`GREATEST(0, ${teamMembers.activeTasks} - 1)` })
            .where(eq(teamMembers.id, prevId));
        }
      }
      
      // Increase counts for new assignees
      for (const newId of newAssigneeIds) {
        if (!previousAssigneeIds.includes(newId) && updatedTask.status !== 'complete') {
          await db
            .update(teamMembers)
            .set({ activeTasks: sql`${teamMembers.activeTasks} + 1` })
            .where(eq(teamMembers.id, newId));
        }
      }
    }

    return await this.getTask(id);
  }

  async deleteTask(id: string): Promise<boolean> {
    const task = await this.getTask(id);
    if (!task) return false;

    // Decrease assignees' active task counts if task was active
    if (task.assigneeIds && task.assigneeIds.length > 0 && task.status !== 'complete') {
      for (const assigneeId of task.assigneeIds) {
        await db
          .update(teamMembers)
          .set({ activeTasks: sql`GREATEST(0, ${teamMembers.activeTasks} - 1)` })
          .where(eq(teamMembers.id, assigneeId));
      }
    }

    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getTaskStats(): Promise<{
    activeTasks: number;
    completed: number;
    overdue: number;
    total: number;
  }> {
    const allTasks = await db.select().from(tasks);
    const now = new Date();
    
    const activeTasks = allTasks.filter(task => 
      task.status === 'pending' || task.status === 'start'
    ).length;
    
    const completed = allTasks.filter(task => task.status === 'complete').length;
    
    const overdue = allTasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < now && task.status !== 'complete'
    ).length;

    return {
      activeTasks,
      completed, 
      overdue,
      total: allTasks.length
    };
  }
}

export const storage = new DatabaseStorage();
