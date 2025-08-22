import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTeamMemberSchema, insertTaskSchema, updateTaskSchema, insertCustomerSchema, insertUserSchema, insertMessageSchema, insertNotificationSchema, insertSystemLogSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { whatsappService } from "./whatsapp-service";
import * as XLSX from 'xlsx';
import archiver from 'archiver';
import { Readable } from 'stream';
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

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

  // Object storage endpoints for profile images
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Update team member profile image
  app.put("/api/team-members/:id/profile-image", requireAuth, async (req, res) => {
    if (!req.body.profileImageURL) {
      return res.status(400).json({ error: "profileImageURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.profileImageURL,
      );

      // Update team member with the profile image path
      const updatedMember = await storage.updateTeamMember(req.params.id, {
        profileImage: objectPath,
      });

      // Log the profile image update
      if (updatedMember) {
        await storage.createSystemLog({
          userId: req.session.userId!,
          action: "team_member_profile_image_updated",
          details: `تم تحديث الصورة الشخصية لعضو الفريق ${updatedMember.name}`,
        });
      }

      res.status(200).json({
        message: "تم تحديث الصورة الشخصية بنجاح",
        objectPath: objectPath,
        teamMember: updatedMember,
      });
    } catch (error) {
      console.error("Error setting profile image:", error);
      res.status(500).json({ error: "Internal server error" });
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

  // Delete team member (admin only)
  app.delete("/api/team-members/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get member info for logging before deletion
      const memberToDelete = await storage.getTeamMember(id);
      if (!memberToDelete) {
        return res.status(404).json({ message: "Team member not found" });
      }

      // Check if this team member has an associated user account
      const associatedUser = memberToDelete.userId ? await storage.getUser(memberToDelete.userId) : null;
      
      // If there's an associated user, prevent deletion if it's the current admin
      if (associatedUser && associatedUser.id === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own team member record" });
      }

      const deleted = await storage.deleteTeamMember(id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete team member" });
      }

      // Log admin action
      await storage.logUserAction(
        "team_member_deleted",
        req.session.userId!,
        req.session.username!,
        { 
          targetMemberId: id, 
          memberName: memberToDelete.name,
          memberEmail: memberToDelete.email,
          hadAssociatedUser: !!memberToDelete.userId,
          message: `تم حذف عضو الفريق: ${memberToDelete.name}`
        },
        req.ip,
        req.get('User-Agent')
      );

      res.json({ 
        message: "Team member deleted successfully",
        deletedMember: {
          id: memberToDelete.id,
          name: memberToDelete.name
        }
      });
    } catch (error) {
      console.error("Error deleting team member:", error);
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });

  // Clean up default/example team members (admin only)
  app.post("/api/admin/cleanup-default-members", requireAdmin, async (req, res) => {
    try {
      // Find team members that look like default/example data
      const allMembers = await storage.getTeamMembers();
      const defaultMembers = allMembers.filter(member => 
        // Check for typical default/example names and emails
        member.name.toLowerCase().includes('example') ||
        member.name.toLowerCase().includes('test') ||
        member.name.toLowerCase().includes('demo') ||
        member.email.toLowerCase().includes('example') ||
        member.email.toLowerCase().includes('test') ||
        member.email.toLowerCase().includes('demo') ||
        member.name === 'John Doe' ||
        member.name === 'Jane Smith' ||
        member.name === 'أحمد محمد' ||
        member.name === 'فاطمة علي' ||
        // Check if they don't have a linked user account (likely default data)
        !member.userId
      );

      if (defaultMembers.length === 0) {
        return res.json({ 
          message: "No default members found to clean up",
          cleaned: 0
        });
      }

      let cleanedCount = 0;
      const cleanedMembers = [];

      for (const member of defaultMembers) {
        try {
          const deleted = await storage.deleteTeamMember(member.id);
          if (deleted) {
            cleanedCount++;
            cleanedMembers.push({
              id: member.id,
              name: member.name,
              email: member.email
            });

            // Log the cleanup action
            await storage.logUserAction(
              "default_member_cleaned",
              req.session.userId!,
              req.session.username!,
              { 
                cleanedMember: {
                  id: member.id,
                  name: member.name,
                  email: member.email
                },
                reason: "تنظيف البيانات الافتراضية"
              },
              req.ip,
              req.get('User-Agent')
            );
          }
        } catch (error) {
          console.error(`Error deleting default member ${member.name}:`, error);
        }
      }

      res.json({ 
        message: `تم تنظيف ${cleanedCount} من الأعضاء الافتراضيين بنجاح`,
        cleaned: cleanedCount,
        cleanedMembers
      });
    } catch (error) {
      console.error("Error cleaning up default members:", error);
      res.status(500).json({ message: "Failed to clean up default members" });
    }
  });

  // Fix missing team members for existing users (admin only)
  app.post("/api/admin/fix-missing-team-members", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allMembers = await storage.getTeamMembers();
      
      // Find users that don't have corresponding team members
      const usersWithoutTeamMembers = allUsers.filter(user => 
        !allMembers.some(member => member.userId === user.id)
      );

      if (usersWithoutTeamMembers.length === 0) {
        return res.json({ 
          message: "All users already have team member records",
          created: 0
        });
      }

      let createdCount = 0;
      const createdMembers = [];

      for (const user of usersWithoutTeamMembers) {
        try {
          // Create team member role based on user role
          const teamMemberRole = 
            user.role === 'admin' ? 'مدير النظام' : 
            user.role === 'supervisor' ? 'مشرف' : 
            'عضو فريق';

          const teamMember = await storage.createTeamMember({
            userId: user.id,
            name: user.firstName && user.lastName ? 
              `${user.firstName} ${user.lastName}` : user.username,
            role: teamMemberRole,
            email: user.email || `${user.username}@company.com`,
            status: 'available',
            avatar: user.username.charAt(0).toUpperCase(),
          });

          createdCount++;
          createdMembers.push({
            userId: user.id,
            username: user.username,
            teamMemberId: teamMember.id,
            teamMemberName: teamMember.name
          });

          // Log the fix action
          await storage.logUserAction(
            "missing_team_member_created",
            req.session.userId!,
            req.session.username!,
            { 
              fixedUser: {
                id: user.id,
                username: user.username
              },
              createdTeamMember: {
                id: teamMember.id,
                name: teamMember.name
              },
              reason: "إنشاء عضو فريق مفقود"
            },
            req.ip,
            req.get('User-Agent')
          );
        } catch (error) {
          console.error(`Error creating team member for user ${user.username}:`, error);
        }
      }

      res.json({ 
        message: `تم إنشاء ${createdCount} عضو فريق للمستخدمين المفقودين`,
        created: createdCount,
        createdMembers
      });
    } catch (error) {
      console.error("Error fixing missing team members:", error);
      res.status(500).json({ message: "Failed to fix missing team members" });
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

  // Customer ratings routes (admin and supervisor only)
  app.get("/api/customer-ratings", requireSupervisorOrAdmin, async (req, res) => {
    try {
      const ratings = await storage.getCustomerRatings();
      res.json(ratings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer ratings" });
    }
  });

  // WhatsApp service status (admin only)
  app.get("/api/whatsapp/status", requireAdmin, async (req, res) => {
    try {
      const isReady = whatsappService.isServiceReady();
      const status = whatsappService.getStatus();
      res.json({ 
        isConnected: isReady,
        isReady,
        status: isReady ? "متصل" : "غير متصل",
        message: isReady ? "خدمة الواتساب تعمل بشكل طبيعي" : "خدمة الواتساب غير متاحة حالياً",
        senderNumber: status.senderNumber,
        lastConnected: status.lastConnected,
        qrCode: status.qrCode,
        messagesCount: status.messagesCount || 0
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check WhatsApp status" });
    }
  });

  // WhatsApp disconnect endpoint
  app.post("/api/whatsapp/disconnect", requireAdmin, async (req, res) => {
    try {
      await whatsappService.disconnect();
      res.json({ 
        message: "تم قطع الاتصال مع الواتساب بنجاح",
        success: true
      });
    } catch (error) {
      console.error("Error disconnecting WhatsApp:", error);
      res.status(500).json({ message: "Failed to disconnect WhatsApp" });
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
      
      // Send WhatsApp confirmation message to customer
      if (task.customerPhone && task.customerName) {
        try {
          const confirmationSent = await whatsappService.sendTaskConfirmationMessage(
            task.customerPhone,
            task.customerName,
            task.title,
            task.taskNumber,
            task.customerAddress
          );
          
          if (confirmationSent) {
            console.log(`📱 تم إرسال رسالة تأكيد المهمة للعميل: ${task.customerName}`);
          } else {
            console.log(`❌ فشل في إرسال رسالة تأكيد المهمة للعميل: ${task.customerName}`);
          }
        } catch (error) {
          console.error('❌ خطأ في إرسال رسالة تأكيد المهمة:', error);
        }
      }

      // Log task creation
      await storage.logUserAction(
        "task_created",
        req.session.userId!,
        req.session.username!,
        { 
          taskId: task.id, 
          taskTitle: task.title,
          customerName: task.customerName,
          customerPhone: task.customerPhone || 'غير محدد',
          priority: task.priority,
          assignees: task.assigneeIds?.length || 0,
          dueDate: task.dueDate?.toISOString().split('T')[0] || 'غير محدد',
          confirmationSent: task.customerPhone ? 'تم المحاولة' : 'رقم الهاتف غير متوفر'
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
        // Regular users can only update their assigned tasks and only status/progress/notes/finalReport
        const teamMember = await storage.getTeamMemberByUserId(currentUser.id);
        if (!teamMember || !task.assigneeIds?.includes(teamMember.id)) {
          return res.status(403).json({ message: "You can only update tasks assigned to you" });
        }
        
        // Regular users can only update status, progress, notes, and finalReport
        const allowedUpdates = ['status', 'progress', 'notes', 'finalReport'];
        const updateKeys = Object.keys(req.body);
        const hasUnauthorizedUpdate = updateKeys.some(key => !allowedUpdates.includes(key));
        
        if (hasUnauthorizedUpdate) {
          return res.status(403).json({ message: "You can only update task status, progress, notes, and final report" });
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

        // Send WhatsApp customer satisfaction rating when task is completed
        if (req.body.status === 'completed' && originalTask.status !== 'completed') {
          try {
            if (updatedTask.customerName && updatedTask.customerPhone) {
              const wasMessageSent = await whatsappService.sendCustomerRatingRequest(
                updatedTask.customerPhone,
                updatedTask.customerName,
                updatedTask.title,
                updatedTask.id
              );
              
              if (wasMessageSent) {
                console.log(`✅ تم إرسال رسالة تقييم العميل: ${updatedTask.customerName}`);
              } else {
                console.log(`❌ فشل إرسال رسالة تقييم للعميل: ${updatedTask.customerName}`);
              }
            }
          } catch (error) {
            console.error('خطأ في إرسال رسالة تقييم العميل:', error);
          }
        }
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

  // Reschedule task endpoint (supervisor/admin only)
  app.put("/api/tasks/:id/reschedule", requireSupervisorOrAdmin, async (req, res) => {
    try {
      const taskId = req.params.id;
      const { newDueDate, rescheduleReason } = req.body;
      
      if (!newDueDate || !rescheduleReason) {
        return res.status(400).json({ message: "New due date and reschedule reason are required" });
      }

      // Get current task info
      const currentTask = await storage.getTask(taskId);
      if (!currentTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Prevent rescheduling completed or cancelled tasks
      if (currentTask.status === "complete" || currentTask.status === "cancelled") {
        return res.status(400).json({ message: "Cannot reschedule completed or cancelled tasks" });
      }

      // Validate that new date is in the future
      const newDate = new Date(newDueDate);
      const currentDate = currentTask.dueDate ? new Date(currentTask.dueDate) : new Date();
      
      if (newDate <= currentDate) {
        return res.status(400).json({ message: "New due date must be after current date" });
      }

      // Update task with reschedule info
      const updatedTask = await storage.updateTask(taskId, {
        dueDate: newDate,
        originalDueDate: currentTask.dueDate ? new Date(currentTask.dueDate) : null,
        rescheduleCount: (currentTask as any).rescheduleCount ? (currentTask as any).rescheduleCount + 1 : 1,
        rescheduleReason,
        status: currentTask.status, // Keep current status, don't change to rescheduled
        updatedAt: new Date()
      });

      if (!updatedTask) {
        return res.status(500).json({ message: "Failed to reschedule task" });
      }

      // Create notification for all assignees
      if (currentTask.assigneeIds && currentTask.assigneeIds.length > 0) {
        for (const assigneeId of currentTask.assigneeIds) {
          await storage.createNotification({
            userId: assigneeId,
            title: "تم تأجيل المهمة",
            content: `تم تأجيل المهمة "${currentTask.title}" إلى ${new Date(newDate).toLocaleDateString('ar-SA')}. السبب: ${rescheduleReason}`,
            type: "task_rescheduled",
            relatedId: taskId
          });
        }
      }

      // Log the reschedule action
      await storage.logUserAction(
        "task_rescheduled",
        req.session.userId!,
        req.session.username!,
        { 
          taskId, 
          taskTitle: currentTask.title,
          oldDueDate: currentTask.dueDate,
          newDueDate: newDate,
          rescheduleReason,
          rescheduleCount: ((currentTask as any).rescheduleCount || 0) + 1,
          message: `تم تأجيل المهمة: ${currentTask.title}` 
        },
        req.ip,
        req.get('User-Agent')
      );

      res.json({ 
        message: "Task rescheduled successfully", 
        task: updatedTask 
      });
    } catch (error) {
      console.error("Error rescheduling task:", error);
      res.status(500).json({ message: "Failed to reschedule task" });
    }
  });

  // Cancel task endpoint (supervisor/admin only)
  app.put("/api/tasks/:id/cancel", requireSupervisorOrAdmin, async (req, res) => {
    try {
      const taskId = req.params.id;
      const { cancelledBy, cancellationReason } = req.body;
      
      if (!cancelledBy || !cancellationReason) {
        return res.status(400).json({ message: "Cancelled by and cancellation reason are required" });
      }

      // Validate cancelledBy value
      const validCancelledBy = ["customer", "admin", "system"];
      if (!validCancelledBy.includes(cancelledBy)) {
        return res.status(400).json({ message: "Invalid cancelled by value" });
      }

      // Get current task info
      const currentTask = await storage.getTask(taskId);
      if (!currentTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Prevent cancelling already completed or cancelled tasks
      if (currentTask.status === "complete" || currentTask.status === "cancelled") {
        return res.status(400).json({ message: "Task is already completed or cancelled" });
      }

      // Update task with cancellation info
      const updatedTask = await storage.updateTask(taskId, {
        status: "cancelled",
        cancelledBy,
        cancellationReason,
        updatedAt: new Date()
      });

      if (!updatedTask) {
        return res.status(500).json({ message: "Failed to cancel task" });
      }

      // Create notification for all assignees
      if (currentTask.assigneeIds && currentTask.assigneeIds.length > 0) {
        const cancelledByText = cancelledBy === "customer" ? "العميل" : 
                              cancelledBy === "admin" ? "الإدارة" : "النظام";
        
        for (const assigneeId of currentTask.assigneeIds) {
          await storage.createNotification({
            userId: assigneeId,
            title: "تم إلغاء المهمة",
            content: `تم إلغاء المهمة "${currentTask.title}" بواسطة ${cancelledByText}. السبب: ${cancellationReason}`,
            type: "task_cancelled",
            relatedId: taskId
          });
        }
      }

      // Log the cancellation action
      await storage.logUserAction(
        "task_cancelled",
        req.session.userId!,
        req.session.username!,
        { 
          taskId, 
          taskTitle: currentTask.title,
          customerName: currentTask.customerName,
          cancelledBy,
          cancellationReason,
          message: `تم إلغاء المهمة: ${currentTask.title}` 
        },
        req.ip,
        req.get('User-Agent')
      );

      res.json({ 
        message: "Task cancelled successfully", 
        task: updatedTask 
      });
    } catch (error) {
      console.error("Error cancelling task:", error);
      res.status(500).json({ message: "Failed to cancel task" });
    }
  });

  // Statistics route (protected)
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const allTasks = await storage.getAllTasks();
      
      const stats = {
        activeTasks: allTasks.filter(task => task.status !== "complete" && task.status !== "cancelled").length,
        completed: allTasks.filter(task => task.status === "complete").length,
        cancelled: allTasks.filter(task => task.status === "cancelled").length,
        overdue: allTasks.filter(task => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate) < new Date() && task.status !== "complete" && task.status !== "cancelled";
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

  app.get("/api/messages/conversation/:participantId/:type", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const { participantId, type } = req.params;
      
      let messages: any[] = [];
      if (type === "group") {
        // Get group messages
        messages = await storage.getGroupMessages();
      } else if (participantId && participantId !== "undefined") {
        // Get private messages between current user and participant
        messages = await storage.getConversationMessages(currentUserId, participantId);
      }
      
      res.json(messages || []);
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      res.status(500).json({ message: "Failed to fetch conversation messages" });
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

  // Admin password verification endpoint
  app.post("/api/admin/verify-password", requireAuth, async (req, res) => {
    try {
      const { password } = req.body;
      const userId = req.session.userId!;

      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is admin
      if (user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await storage.logUserAction(
          "admin_access_denied",
          userId,
          req.session.username!,
          { message: "فشل في الوصول للوحة الإدارة - كلمة مرور خاطئة" },
          req.ip,
          req.get('User-Agent')
        );
        return res.status(401).json({ message: "Invalid password" });
      }

      // Log successful admin access
      await storage.logUserAction(
        "admin_access_granted",
        userId,
        req.session.username!,
        { message: "تم منح الوصول للوحة الإدارة بنجاح" },
        req.ip,
        req.get('User-Agent')
      );

      res.json({ message: "Password verified successfully" });
    } catch (error) {
      console.error("Error verifying admin password:", error);
      res.status(500).json({ message: "Failed to verify password" });
    }
  });

  // WhatsApp management routes
  app.get("/api/whatsapp/status", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'supervisor')) {
        return res.status(403).json({ message: "Access denied. Admin or Supervisor role required." });
      }

      const whatsappService = (global as any).whatsappService;
      const status = {
        isConnected: whatsappService?.isReady || false,
        isReady: whatsappService?.isReady || false,
        senderNumber: whatsappService?.senderNumber || null,
        lastConnected: whatsappService?.lastConnected || null,
        qrCode: whatsappService?.getCurrentQRCode ? whatsappService.getCurrentQRCode() : null,
        messagesCount: whatsappService?.messageCount || 0
      };

      res.json(status);
    } catch (error) {
      console.error("Error fetching WhatsApp status:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp status" });
    }
  });

  app.get("/api/whatsapp/settings", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'supervisor')) {
        return res.status(403).json({ message: "Access denied. Admin or Supervisor role required." });
      }

      const settings = await storage.getWhatsAppSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching WhatsApp settings:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp settings" });
    }
  });

  app.put("/api/whatsapp/settings", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const { defaultMessage } = req.body;
      if (!defaultMessage || typeof defaultMessage !== 'string') {
        return res.status(400).json({ message: "Default message is required" });
      }

      await storage.updateWhatsAppSettings({ defaultMessage });
      
      // Log the action
      await storage.logUserAction(
        "update_whatsapp_settings",
        req.session.userId!,
        req.session.username!,
        { details: `تم تحديث نص رسالة التقييم الافتراضية` },
        req.ip,
        req.get('User-Agent')
      );

      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating WhatsApp settings:", error);
      res.status(500).json({ message: "Failed to update WhatsApp settings" });
    }
  });

  app.post("/api/whatsapp/reconnect", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'supervisor')) {
        return res.status(403).json({ message: "Access denied. Admin or Supervisor role required." });
      }

      const whatsappService = (global as any).whatsappService;
      if (whatsappService) {
        await whatsappService.reconnect();
        
        // Log the action
        await storage.logUserAction(
          "whatsapp_reconnect",
          req.session.userId!,
          req.session.username!,
          { details: `تم طلب إعادة ربط خدمة الواتساب` },
          req.ip,
          req.get('User-Agent')
        );
      }

      res.json({ message: "Reconnection initiated" });
    } catch (error) {
      console.error("Error reconnecting WhatsApp:", error);
      res.status(500).json({ message: "Failed to reconnect WhatsApp" });
    }
  });

  app.post("/api/whatsapp/test-message", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'supervisor')) {
        return res.status(403).json({ message: "Access denied. Admin or Supervisor role required." });
      }

      const { phoneNumber } = req.body;
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const whatsappService = (global as any).whatsappService;
      if (!whatsappService || !whatsappService.isReady) {
        return res.status(400).json({ message: "WhatsApp service is not ready" });
      }

      const settings = await storage.getWhatsAppSettings();
      const testMessage = `رسالة تجريبية من نظام إدارة المهام\n\n${settings.defaultMessage}\n\n--- رسالة تجريبية ---`;

      await whatsappService.sendMessage(phoneNumber, testMessage);
      
      // Log the action
      await storage.logUserAction(
        "send_test_message",
        req.session.userId!,
        req.session.username!,
        { phoneNumber, details: `تم إرسال رسالة تجريبية إلى ${phoneNumber}` },
        req.ip,
        req.get('User-Agent')
      );

      res.json({ message: "Test message sent successfully" });
    } catch (error) {
      console.error("Error sending test message:", error);
      res.status(500).json({ message: "Failed to send test message" });
    }
  });

  // إعادة تشغيل خدمة الواتساب وتجديد QR Code
  app.post("/api/whatsapp/restart", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'supervisor')) {
        return res.status(403).json({ message: "Access denied. Admin or Supervisor role required." });
      }

      const whatsappService = (global as any).whatsappService;
      if (whatsappService) {
        await whatsappService.restart();
        
        // Log the action
        await storage.logUserAction(
          "whatsapp_restart",
          req.session.userId!,
          req.session.username!,
          { details: `تم إعادة تشغيل خدمة الواتساب وتجديد رمز QR` },
          req.ip,
          req.get('User-Agent')
        );
      }

      res.json({ 
        message: "تم إعادة تشغيل الواتساب بنجاح",
        success: true
      });
    } catch (error) {
      console.error("Error restarting WhatsApp:", error);
      res.status(500).json({ message: "Failed to restart WhatsApp service" });
    }
  });

  // تفعيل الواتساب الحقيقي
  app.post("/api/whatsapp/enable-real", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      console.log('🔄 تفعيل الواتساب الحقيقي من routes...');
      
      // استخدام الطريقة الجديدة لتفعيل الوضع الحقيقي
      const whatsappService = (global as any).whatsappService;
      if (whatsappService) {
        console.log('✅ تم العثور على خدمة الواتساب - بدء التفعيل...');
        await whatsappService.enableRealMode();
        console.log('✅ انتهى استدعاء enableRealMode()');
      } else {
        console.error('❌ خدمة الواتساب غير موجودة!');
      }
      
      // Log the action
      await storage.logUserAction(
        "enable_real_whatsapp",
        req.session.userId!,
        req.session.username!,
        { details: `تم تفعيل الواتساب الحقيقي` },
        req.ip,
        req.get('User-Agent')
      );

      res.json({ 
        message: "تم تفعيل الواتساب الحقيقي بنجاح - امسح الآن رمز QR الجديد",
        success: true
      });
    } catch (error) {
      console.error("Error enabling real WhatsApp:", error);
      res.status(500).json({ message: "Failed to enable real WhatsApp" });
    }
  });

  // إلغاء تفعيل الواتساب الحقيقي والعودة للمحاكاة
  app.post("/api/whatsapp/disable-real", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      console.log('🔄 العودة لوضع المحاكاة...');
      
      // استخدام الطريقة الجديدة لإلغاء تفعيل الوضع الحقيقي
      const whatsappService = (global as any).whatsappService;
      if (whatsappService) {
        await whatsappService.disableRealMode();
      }
      
      // Log the action
      await storage.logUserAction(
        "disable_real_whatsapp",
        req.session.userId!,
        req.session.username!,
        { details: `تم إلغاء تفعيل الواتساب الحقيقي والعودة للمحاكاة` },
        req.ip,
        req.get('User-Agent')
      );

      res.json({ 
        message: "تم إلغاء تفعيل الواتساب الحقيقي والعودة لوضع المحاكاة",
        success: true
      });
    } catch (error) {
      console.error("Error disabling real WhatsApp:", error);
      res.status(500).json({ message: "Failed to disable real WhatsApp" });
    }
  });

  // Team Points stats for dashboard
  app.get("/api/team-points/stats", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const allPoints = await storage.getAllTeamMemberPoints();
      
      // إحصائيات عامة
      const totalMembers = allPoints.length;
      const totalPoints = allPoints.reduce((sum, p) => sum + (p.points || 0), 0);
      const averagePoints = totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0;
      const topScorer = allPoints.length > 0 ? allPoints[0] : null;

      // الحصول على نقاط المستخدم الحالي
      const teamMember = await storage.getTeamMemberByUserId(req.session.userId!);
      let userPoints = null;
      if (teamMember) {
        userPoints = await storage.getTeamMemberPoints(teamMember.id);
      }

      // أظهر جميع الإحصائيات لجميع المستخدمين
      res.json({
        totalMembers,
        totalPoints,
        averagePoints,
        topScorer: topScorer ? {
          name: topScorer.teamMember.name,
          points: topScorer.points || 0,
          role: topScorer.teamMember.role
        } : null,
        topPerformers: allPoints.slice(0, 3).map(p => ({
          name: p.teamMember.name,
          points: p.points || 0,
          role: p.teamMember.role
        })),
        userPoints: userPoints?.points || 0,
        userTotalEarned: userPoints?.totalEarned || 0,
        userRank: userPoints ? allPoints.findIndex(p => p.teamMemberId === teamMember?.id) + 1 : null,
        canViewAll: true
      });
    } catch (error) {
      console.error("Error fetching team points stats:", error);
      res.status(500).json({ message: "Failed to fetch team points stats" });
    }
  });

  // Team Points routes
  app.get("/api/team-points", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Admin can see all points, others only their own
      if (currentUser.role === 'admin') {
        const allPoints = await storage.getAllTeamMemberPoints();
        res.json(allPoints);
      } else {
        const teamMember = await storage.getTeamMemberByUserId(req.session.userId!);
        if (!teamMember) {
          return res.status(404).json({ message: "Team member not found" });
        }
        
        const points = await storage.getTeamMemberPoints(teamMember.id);
        if (!points) {
          // تهيئة النقاط إذا لم تكن موجودة
          const newPoints = await storage.initializeTeamMemberPoints(teamMember.id);
          res.json([{ ...newPoints, teamMember }]);
        } else {
          res.json([{ ...points, teamMember }]);
        }
      }
    } catch (error) {
      console.error("Error fetching team points:", error);
      res.status(500).json({ message: "Failed to fetch team points" });
    }
  });

  app.post("/api/team-points/:teamMemberId/add", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const { teamMemberId } = req.params;
      const { points, reason } = req.body;

      if (typeof points !== 'number' || points <= 0) {
        return res.status(400).json({ message: "Points must be a positive number" });
      }

      if (!reason || typeof reason !== 'string') {
        return res.status(400).json({ message: "Reason is required" });
      }

      await storage.addPointsToTeamMember(
        teamMemberId,
        points,
        reason,
        undefined,
        undefined,
        req.session.userId!
      );

      // تسجيل العملية
      await storage.logUserAction(
        "add_team_points",
        req.session.userId!,
        req.session.username!,
        { teamMemberId, points, reason },
        req.ip,
        req.get('User-Agent')
      );

      res.json({ message: "Points added successfully" });
    } catch (error) {
      console.error("Error adding team points:", error);
      res.status(500).json({ message: "Failed to add team points" });
    }
  });

  app.post("/api/team-points/:teamMemberId/reset", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      const { teamMemberId } = req.params;
      await storage.resetTeamMemberPoints(teamMemberId, req.session.userId!);

      // تسجيل العملية
      await storage.logUserAction(
        "reset_team_member_points",
        req.session.userId!,
        req.session.username!,
        { teamMemberId },
        req.ip,
        req.get('User-Agent')
      );

      res.json({ message: "Team member points reset successfully" });
    } catch (error) {
      console.error("Error resetting team member points:", error);
      res.status(500).json({ message: "Failed to reset team member points" });
    }
  });

  app.post("/api/team-points/reset-all", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      await storage.resetAllTeamMemberPoints(req.session.userId!);

      // تسجيل العملية
      await storage.logUserAction(
        "reset_all_team_points",
        req.session.userId!,
        req.session.username!,
        { details: "تم تصفير جميع نقاط أعضاء الفريق" },
        req.ip,
        req.get('User-Agent')
      );

      res.json({ message: "All team points reset successfully" });
    } catch (error) {
      console.error("Error resetting all team points:", error);
      res.status(500).json({ message: "Failed to reset all team points" });
    }
  });

  app.get("/api/points-history", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { teamMemberId, limit } = req.query;
      const limitNum = limit ? parseInt(limit as string) : 50;

      // Admin can see all history, others only their own
      if (currentUser.role === 'admin') {
        const history = await storage.getPointsHistory(
          teamMemberId as string | undefined,
          limitNum
        );
        res.json(history);
      } else {
        const teamMember = await storage.getTeamMemberByUserId(req.session.userId!);
        if (!teamMember) {
          return res.status(404).json({ message: "Team member not found" });
        }
        
        const history = await storage.getPointsHistory(teamMember.id, limitNum);
        res.json(history);
      }
    } catch (error) {
      console.error("Error fetching points history:", error);
      res.status(500).json({ message: "Failed to fetch points history" });
    }
  });

  // Admin backup and export routes
  app.get("/api/admin/export/customers", requireAdmin, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      
      // Prepare data for Excel
      const excelData = customers.map(customer => ({
        'اسم العميل': customer.name,
        'رقم الهاتف': customer.phone || '',
        'البريد الإلكتروني': customer.email || '',
        'العنوان': customer.address || '',
        'الموقع الجغرافي (خط الطول)': customer.gpsLongitude || '',
        'الموقع الجغرافي (خط العرض)': customer.gpsLatitude || '',
        'تاريخ الإضافة': customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-GB') : ''
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'العملاء');
      
      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      // Set headers for download
      const fileName = `customers_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      // Log the export action
      await storage.logUserAction(
        "customers_export",
        req.session.userId!,
        req.session.username!,
        { exportedCount: customers.length, fileName },
        req.ip,
        req.get('User-Agent')
      );
      
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting customers:", error);
      res.status(500).json({ message: "Failed to export customers data" });
    }
  });

  app.get("/api/admin/backup/full", requireAdmin, async (req, res) => {
    try {
      // Get all data
      const [
        users,
        tasks,
        customers,
        teamMembers,
        messages,
        notifications,
        systemLogs,
        customerRatings,
        pointsHistory
      ] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllTasks(),
        storage.getAllCustomers(),
        storage.getTeamMembers(),
        storage.getAllMessages(),
        storage.getAllNotifications(),
        storage.getAllSystemLogs(),
        storage.getAllCustomerRatings(),
        storage.getPointsHistory(undefined, 1000)
      ]);

      // Create ZIP archive
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      // Set headers for download
      const fileName = `backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.zip`;
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/zip');

      // Pipe archive to response
      archive.pipe(res);

      // Add JSON files to archive
      archive.append(JSON.stringify(users, null, 2), { name: 'users.json' });
      archive.append(JSON.stringify(tasks, null, 2), { name: 'tasks.json' });
      archive.append(JSON.stringify(customers, null, 2), { name: 'customers.json' });
      archive.append(JSON.stringify(teamMembers, null, 2), { name: 'team_members.json' });
      archive.append(JSON.stringify(messages, null, 2), { name: 'messages.json' });
      archive.append(JSON.stringify(notifications, null, 2), { name: 'notifications.json' });
      archive.append(JSON.stringify(systemLogs, null, 2), { name: 'system_logs.json' });
      archive.append(JSON.stringify(customerRatings, null, 2), { name: 'customer_ratings.json' });
      archive.append(JSON.stringify(pointsHistory, null, 2), { name: 'points_history.json' });

      // Create Excel files for key data
      // Users Excel
      const usersExcel = users.map(user => ({
        'اسم المستخدم': user.username,
        'الاسم الأول': user.firstName || '',
        'الاسم الأخير': user.lastName || '',
        'البريد الإلكتروني': user.email || '',
        'الهاتف': user.phone || '',
        'الدور': user.role,
        'حالة الموافقة': user.isApproved,
        'تاريخ الإنشاء': user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : ''
      }));
      const usersWb = XLSX.utils.book_new();
      const usersWs = XLSX.utils.json_to_sheet(usersExcel);
      XLSX.utils.book_append_sheet(usersWb, usersWs, 'المستخدمين');
      const usersBuffer = XLSX.write(usersWb, { type: 'buffer', bookType: 'xlsx' });
      archive.append(usersBuffer, { name: 'users.xlsx' });

      // Tasks Excel
      const tasksExcel = tasks.map(task => ({
        'رقم المهمة': task.taskNumber,
        'عنوان المهمة': task.title,
        'الوصف': task.description || '',
        'المكلف بالمهمة': task.assignees?.map(a => a.name).join(', ') || '',
        'اسم العميل': task.customerName || '',
        'هاتف العميل': task.customerPhone || '',
        'عنوان العميل': task.customerAddress || '',
        'الحالة': task.status,
        'الأولوية': task.priority,
        'النسبة المكتملة': task.progress + '%',
        'تاريخ الاستحقاق': task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : '',
        'تاريخ الإنشاء': task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-GB') : ''
      }));
      const tasksWb = XLSX.utils.book_new();
      const tasksWs = XLSX.utils.json_to_sheet(tasksExcel);
      XLSX.utils.book_append_sheet(tasksWb, tasksWs, 'المهام');
      const tasksBuffer = XLSX.write(tasksWb, { type: 'buffer', bookType: 'xlsx' });
      archive.append(tasksBuffer, { name: 'tasks.xlsx' });

      // Customers Excel
      const customersExcel = customers.map(customer => ({
        'اسم العميل': customer.name,
        'رقم الهاتف': customer.phone || '',
        'البريد الإلكتروني': customer.email || '',
        'العنوان': customer.address || '',
        'الموقع الجغرافي (خط الطول)': customer.gpsLongitude || '',
        'الموقع الجغرافي (خط العرض)': customer.gpsLatitude || '',
        'تاريخ الإضافة': customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-GB') : ''
      }));
      const customersWb = XLSX.utils.book_new();
      const customersWs = XLSX.utils.json_to_sheet(customersExcel);
      XLSX.utils.book_append_sheet(customersWb, customersWs, 'العملاء');
      const customersBuffer = XLSX.write(customersWb, { type: 'buffer', bookType: 'xlsx' });
      archive.append(customersBuffer, { name: 'customers.xlsx' });

      // Add backup info file
      const backupInfo = {
        backupDate: new Date().toISOString(),
        backupVersion: '1.0',
        dataCount: {
          users: users.length,
          tasks: tasks.length,
          customers: customers.length,
          teamMembers: teamMembers.length,
          messages: messages.length,
          notifications: notifications.length,
          systemLogs: systemLogs.length,
          customerRatings: customerRatings.length,
          pointsHistory: pointsHistory.length
        }
      };
      archive.append(JSON.stringify(backupInfo, null, 2), { name: 'backup_info.json' });

      // Finalize archive
      await archive.finalize();

      // Log the backup action
      await storage.logUserAction(
        "full_backup_created",
        req.session.userId!,
        req.session.username!,
        { fileName, ...backupInfo.dataCount },
        req.ip,
        req.get('User-Agent')
      );

    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
