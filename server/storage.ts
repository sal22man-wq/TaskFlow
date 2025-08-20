import { type User, type InsertUser, type TeamMember, type InsertTeamMember, type Task, type InsertTask, type UpdateTask, type TaskWithAssignees } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Team member methods
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: string): Promise<TeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: string): Promise<boolean>;

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

  constructor() {
    this.users = new Map();
    this.teamMembers = new Map();
    this.tasks = new Map();
    
    // Initialize with some default team members
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
      status: task.status || "to_be_completed",
      priority: task.priority || "medium",
      progress: task.progress || 0,
      assigneeIds: task.assigneeIds || [],
      dueDate: task.dueDate || null,
      notes: task.notes || null,
      createdAt: now,
      updatedAt: now
    };
    this.tasks.set(id, newTask);

    // Update assignees' active task counts
    if (task.assigneeIds && task.assigneeIds.length > 0 && task.status !== 'completed') {
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
      if (updates.status === 'completed') {
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
      if (previousStatus === 'completed' && updates.status !== 'completed') {
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
    if (task.assigneeIds && task.assigneeIds.length > 0 && task.status !== 'completed') {
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
      task.status === 'started' || task.status === 'in_progress' || task.status === 'to_be_completed'
    ).length;
    
    const completed = allTasks.filter(task => task.status === 'completed').length;
    
    const overdue = allTasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < now && task.status !== 'completed'
    ).length;

    return {
      activeTasks,
      completed, 
      overdue,
      total: allTasks.length
    };
  }
}

export const storage = new MemStorage();
