import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTeamMemberSchema, insertTaskSchema, updateTaskSchema, insertCustomerSchema, insertUserSchema, insertMessageSchema, insertNotificationSchema, insertSystemLogSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

// Extend Express session interface
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    username?: string;
  }
}

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.userId) {
    return next();
  } else {
    return res.status(401).json({ message: "Authentication required" });
  }
};

// Admin middleware
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ message: "Authorization check failed" });
  }
};

// Supervisor or Admin middleware
const requireSupervisorOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user || (user.role !== "admin" && user.role !== "supervisor")) {
      return res.status(403).json({ message: "Supervisor or admin access required" });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ message: "Authorization check failed" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session store with PostgreSQL
  const PgSession = connectPgSimple(session);
  const sessionStore = new PgSession({
    pool: pool,
    tableName: 'sessions',
    createTableIfMissing: true
  });

  // Configure session middleware
  app.use(session({
    store: sessionStore,
    secret: 'wdq-task-management-secret-2025',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  }));

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Check if account is approved (except for admin)
      if (user.role !== "admin" && user.isApproved !== "approved") {
        return res.status(403).json({ message: "Account pending approval" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;

      // Log successful login
      await storage.logUserAction(
        "login_success",
        user.id,
        username,
        { role: user.role, isApproved: user.isApproved },
        req.ip,
        req.get('User-Agent')
      );

      res.json({ 
        message: "Login successful",
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          isApproved: user.isApproved
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const userId = req.session.userId;
    const username = req.session.username;
    
    // Log logout action
    if (userId && username) {
      await storage.logUserAction(
        "logout",
        userId,
        username,
        null,
        req.ip,
        req.get('User-Agent')
      );
    }
    
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const userWithTeamMember = await storage.getUserWithTeamMember(req.session.userId!);
      if (!userWithTeamMember) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ 
        id: userWithTeamMember.id, 
        username: userWithTeamMember.username,
        role: userWithTeamMember.role,
        isApproved: userWithTeamMember.isApproved,
        firstName: userWithTeamMember.firstName,
        lastName: userWithTeamMember.lastName,
        email: userWithTeamMember.email,
        phone: userWithTeamMember.phone,
        teamMember: userWithTeamMember.teamMember
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  // Profile update schema
  const profileUpdateSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"), 
    email: z.string().email("Invalid email"),
    phone: z.string().optional(),
  });

  // Password change schema
  const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  });

  // Update user profile
  app.put("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const validatedData = profileUpdateSchema.parse(req.body);
      const userId = req.session.userId!;
      
      // Update user
      const updatedUser = await storage.updateUser(userId, {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
      });

      // Update corresponding team member name
      const teamMember = await storage.getTeamMemberByUserId(userId);
      if (teamMember) {
        await storage.updateTeamMember(teamMember.id, {
          name: `${validatedData.firstName} ${validatedData.lastName}`,
          email: validatedData.email,
        });
      }

      // Log the profile update
      await storage.logUserAction(
        "profile_updated",
        userId,
        req.session.username!,
        {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          phone: validatedData.phone,
        },
        req.ip,
        req.get('User-Agent')
      );

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Change password
  app.put("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const validatedData = passwordChangeSchema.parse(req.body);
      const userId = req.session.userId!;

      // Verify passwords match
      if (validatedData.newPassword !== validatedData.confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(validatedData.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, saltRounds);

      // Update password
      await storage.updateUser(userId, {
        password: hashedNewPassword,
      });

      // Log the password change
      await storage.logUserAction(
        "password_changed",
        userId,
        req.session.username!,
        { message: "تم تغيير كلمة المرور بنجاح" },
        req.ip,
        req.get('User-Agent')
      );

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      // Create user (this will also create team member automatically)
      const user = await storage.createUser({
        username,
        password
      });

      res.status(201).json({
        message: "User created successfully",
        user: { id: user.id, username: user.username }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // System Logs routes (admin only)
  app.get("/api/admin/logs", requireAdmin, async (req, res) => {
    try {
      const { limit } = req.query;
      const logs = await storage.getSystemLogs(limit ? parseInt(limit as string) : 100);
      res.json(logs);
    } catch (error) {
      console.error("Get logs error:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // Admin routes (protected)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Admin get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/approve", requireAdmin, async (req, res) => {
    try {
      const { isApproved } = req.body;
      const userId = req.params.id;

      if (!["approved", "rejected"].includes(isApproved)) {
        return res.status(400).json({ message: "Invalid approval status" });
      }

      const user = await storage.updateUserApproval(userId, isApproved);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: `User ${isApproved} successfully`,
        user: { 
          id: user.id, 
          username: user.username,
          isApproved: user.isApproved
        }
      });
    } catch (error) {
      console.error("Admin approval error:", error);
      res.status(500).json({ message: "Failed to update user approval" });
    }
  });

  app.patch("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      const userId = req.params.id;

      if (!["user", "supervisor", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.updateUserRole(userId, role);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log role change
      await storage.logUserAction(
        "role_changed",
        req.session.userId!,
        req.session.username!,
        { targetUser: user.username, newRole: role },
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        message: `User role updated successfully`,
        user: { 
          id: user.id, 
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Admin role update error:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Toggle user status (admin only)
  app.patch("/api/admin/users/:id/toggle", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      if (id === req.session.userId) {
        return res.status(400).json({ message: "Cannot disable your own account" });
      }
      
      const user = await storage.toggleUserStatus(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log admin action
      await storage.logUserAction(
        user.isActive === "true" ? "user_enabled" : "user_disabled",
        req.session.userId!,
        req.session.username!,
        { targetUserId: id, username: user.username },
        req.ip,
        req.get('User-Agent')
      );
      
      res.json({
        message: `User ${user.isActive === "true" ? "enabled" : "disabled"} successfully`,
        user: { 
          id: user.id, 
          username: user.username,
          isActive: user.isActive
        }
      });
    } catch (error) {
      console.error("Error toggling user status:", error);
      res.status(500).json({ message: "Failed to toggle user status" });
    }
  });

  // Admin reset user password (admin only)
  app.patch("/api/admin/users/:id/reset-password", requireAdmin, async (req, res) => {
    try {
      const { newPassword } = req.body;
      const userId = req.params.id;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      // Check if target user exists
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent admin from resetting their own password this way
      if (userId === req.session.userId) {
        return res.status(400).json({ message: "Cannot reset your own password. Use profile settings instead." });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await storage.updateUser(userId, {
        password: hashedPassword,
      });

      // Log the password reset action
      await storage.logUserAction(
        "admin_password_reset",
        req.session.userId!,
        req.session.username!,
        { 
          targetUserId: userId, 
          targetUsername: targetUser.username,
          message: `تم إعادة تعيين كلمة مرور المستخدم ${targetUser.username}`
        },
        req.ip,
        req.get('User-Agent')
      );

      res.json({ 
        message: "Password reset successfully",
        targetUser: {
          id: targetUser.id,
          username: targetUser.username
        }
      });
    } catch (error) {
      console.error("Error resetting user password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      if (id === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      // Get user info for logging
      const userToDelete = await storage.getUser(id);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete user" });
      }
      
      // Log admin action
      await storage.logUserAction(
        "user_deleted",
        req.session.userId!,
        req.session.username!,
        { targetUserId: id, username: userToDelete.username },
        req.ip,
        req.get('User-Agent')
      );
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Team member routes (protected)
  app.get("/api/team-members", requireAuth, async (req, res) => {
    try {
      const members = await storage.getTeamMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get("/api/team-members/:id", requireAuth, async (req, res) => {
    try {
      const member = await storage.getTeamMember(req.params.id);
      if (!member) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team member" });
    }
  });

  app.post("/api/team-members", requireAuth, async (req, res) => {
    try {
      const validatedData = insertTeamMemberSchema.parse(req.body);
      const member = await storage.createTeamMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid team member data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create team member" });
    }
  });

  app.put("/api/team-members/:id", async (req, res) => {
    try {
      const updates = req.body;
      const member = await storage.updateTeamMember(req.params.id, updates);
      if (!member) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Failed to update team member" });
    }
  });

  app.delete("/api/team-members/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTeamMember(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });

  // Customer routes (protected)
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const updates = req.body;
      const customer = await storage.updateCustomer(req.params.id, updates);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCustomer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Task routes (protected)
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      let tasks;
      
      // Admin and supervisors can see all tasks, regular users only see their assigned tasks
      if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
        tasks = await storage.getAllTasks();
      } else {
        tasks = await storage.getTasksForUser(currentUser.id);
      }

      const { status, assigneeId } = req.query;
      
      // Filter tasks by status if provided
      if (status) {
        tasks = tasks.filter(task => task.status === status);
      }
      
      // Filter tasks by assignee if provided
      if (assigneeId) {
        tasks = tasks.filter(task => 
          task.assigneeIds && task.assigneeIds.includes(assigneeId as string)
        );
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", requireSupervisorOrAdmin, async (req, res) => {
    try {
      console.log("Received task data:", JSON.stringify(req.body, null, 2));
      
      // Convert dueDate string to Date object if provided
      const taskData = { ...req.body };
      if (taskData.dueDate && typeof taskData.dueDate === 'string') {
        taskData.dueDate = new Date(taskData.dueDate);
      }
      
      const validatedData = insertTaskSchema.parse(taskData);
      console.log("Validated task data:", JSON.stringify(validatedData, null, 2));
      const task = await storage.createTask(validatedData);
      
      // Create notifications for assigned team members
      await storage.createTaskNotifications(task, "task_assigned");
      
      // Log task creation
      await storage.logUserAction(
        "task_created",
        req.session.userId!,
        req.session.username!,
        { 
          taskId: task.id, 
          taskTitle: task.title,
          customerName: task.customerName,
          priority: task.priority,
          assignees: task.assigneeIds?.length || 0,
          dueDate: task.dueDate?.toISOString().split('T')[0] || 'غير محدد'
        },
        req.ip,
        req.get('User-Agent')
      );
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Task creation error:", error);
      if (error instanceof z.ZodError) {
        console.log("Validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check permissions based on user role
      if (currentUser.role === 'user') {
        // Regular users can only update their assigned tasks and only status/progress
        const teamMember = await storage.getTeamMemberByUserId(currentUser.id);
        if (!teamMember || !task.assigneeIds?.includes(teamMember.id)) {
          return res.status(403).json({ message: "You can only update tasks assigned to you" });
        }
        
        // Regular users can only update status and progress
        const allowedUpdates = ['status', 'progress', 'notes'];
        const updateKeys = Object.keys(req.body);
        const hasUnauthorizedUpdate = updateKeys.some(key => !allowedUpdates.includes(key));
        
        if (hasUnauthorizedUpdate) {
          return res.status(403).json({ message: "You can only update task status, progress, and notes" });
        }
      }

      const validatedData = updateTaskSchema.parse(req.body);
      const originalTask = task; // We already fetched it above
      const updatedTask = await storage.updateTask(req.params.id, validatedData);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Create notifications for assigned team members when task is updated
      await storage.createTaskNotifications(updatedTask, "task_updated");

      // Log task status change if status was updated
      if (req.body.status && originalTask.status !== req.body.status) {
        await storage.logUserAction(
          "task_status_changed",
          req.session.userId!,
          req.session.username!,
          { 
            taskId: updatedTask.id, 
            taskTitle: updatedTask.title,
            oldStatus: originalTask.status,
            newStatus: req.body.status,
            customerName: updatedTask.customerName
          },
          req.ip,
          req.get('User-Agent')
        );
      }

      // Log task progress update if progress was updated
      if (req.body.progress !== undefined && originalTask.progress !== req.body.progress) {
        await storage.logUserAction(
          "task_progress_updated",
          req.session.userId!,
          req.session.username!,
          { 
            taskId: updatedTask.id, 
            taskTitle: updatedTask.title,
            oldProgress: originalTask.progress || 0,
            newProgress: req.body.progress,
            customerName: updatedTask.customerName
          },
          req.ip,
          req.get('User-Agent')
        );
      }
      
      res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", requireSupervisorOrAdmin, async (req, res) => {
    try {
      // Get task details before deletion for logging
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const deleted = await storage.deleteTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Log task deletion
      await storage.logUserAction(
        "task_deleted",
        req.session.userId!,
        req.session.username!,
        { 
          taskId: task.id, 
          taskTitle: task.title,
          customerName: task.customerName,
          status: task.status
        },
        req.ip,
        req.get('User-Agent')
      );

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Statistics route (protected)
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const allTasks = await storage.getAllTasks();
      
      const stats = {
        activeTasks: allTasks.filter(task => task.status !== "complete").length,
        completed: allTasks.filter(task => task.status === "complete").length,
        overdue: allTasks.filter(task => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate) < new Date() && task.status !== "complete";
        }).length,
        total: allTasks.length
      };
      const teamMembers = await storage.getTeamMembers();
      
      res.json({
        ...stats,
        teamMembers: teamMembers.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Admin routes - User management
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    try {
      // Check if user is admin
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        isApproved: user.isApproved,
        createdAt: user.createdAt
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/approval", requireAuth, async (req, res) => {
    try {
      // Check if user is admin
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { isApproved } = req.body;
      const updatedUser = await storage.updateUserApproval(req.params.id, isApproved);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        message: `User ${isApproved === 'approved' ? 'approved' : 'rejected'} successfully`,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          isApproved: updatedUser.isApproved
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user approval" });
    }
  });

  // Messages routes
  app.get("/api/messages", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const messages = await storage.getAllMessagesForUser(currentUserId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const senderId = req.session.userId!;
      const { receiverId, content, messageScope = "private" } = req.body;
      
      const messageData = {
        senderId,
        receiverId: messageScope === "group" ? null : receiverId,
        content,
        messageScope
      };
      
      const validatedData = insertMessageSchema.parse(messageData);
      const message = await storage.createMessage(validatedData);
      
      // If it's a group message, create notifications for all team members except sender
      if (messageScope === "group") {
        await storage.createGroupMessageNotifications(senderId, message.id, content);
      }
      
      // Log the message action
      const currentUser = await storage.getUser(senderId);
      await storage.logUserAction(
        messageScope === "group" ? "group_message_sent" : "private_message_sent",
        senderId,
        currentUser?.username || "unknown",
        { messageId: message.id, content: content.substring(0, 50) + (content.length > 50 ? '...' : '') }
      );
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.patch("/api/messages/:id/read", requireAuth, async (req, res) => {
    try {
      const message = await storage.markMessageAsRead(req.params.id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.get("/api/messages/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadMessagesCount(req.session.userId!);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread messages count" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.session.userId!);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationsCount(req.session.userId!);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread notifications count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
