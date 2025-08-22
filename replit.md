# Overview

TaskFlow is a mobile-first task management and team collaboration platform designed for "شركة اشراق الودق لتكنولوجيا المعلومات" with full Arabic language support. The application features unified user-team member system where each user account automatically corresponds to a team member with the same username, three-tier permission system (Admin, Supervisor, Regular User), comprehensive messaging system, notifications for new tasks and messages, administrator-controlled user approval system, and mobile-optimized interface with Arabic as the primary interface language.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Custom component library built on Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with custom design system using CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing optimized for mobile applications
- **Mobile-First Design**: Responsive layout with bottom navigation, floating action buttons, and touch-optimized interactions

## Backend Architecture
- **Runtime**: Node.js with Express.js framework for REST API endpoints
- **Language**: TypeScript throughout the entire application for consistency
- **API Design**: RESTful endpoints for CRUD operations on tasks, team members, and statistics
- **Data Storage**: PostgreSQL database integration using DatabaseStorage implementation with full CRUD operations
- **Validation**: Zod schemas for runtime type checking and API request validation
- **Development Server**: Custom Vite integration for seamless full-stack development

## Data Layer
- **ORM**: Drizzle ORM configured for PostgreSQL with type-safe database operations
- **Schema Management**: Shared schema definitions between client and server using drizzle-zod
- **Database**: PostgreSQL configured through Neon Database serverless connection with persistent session storage
- **Migration System**: Drizzle Kit for database schema migrations and management
- **User-Team Integration**: Unified system where each user account automatically creates corresponding team member record
- **Messaging & Notifications**: Database-backed real-time messaging system with automatic task notifications
- **Type Safety**: End-to-end type safety from database schema to frontend components

## Key Design Patterns
- **Unified User-Team System**: Each user account automatically creates a corresponding team member with the same username
- **Arabic-First Interface**: Comprehensive Arabic localization with RTL support throughout the application
- **Shared Types**: Common TypeScript interfaces and Zod schemas shared between frontend and backend
- **Component Architecture**: Modular React components with consistent naming and structure
- **Mobile-First Approach**: Touch-friendly interfaces with optimized mobile navigation patterns
- **Real-Time Messaging**: Database-backed messaging system with automatic notifications for task assignments
- **Error Handling**: Comprehensive error boundaries and user feedback through toast notifications
- **Performance Optimization**: Query caching, lazy loading, and optimized bundle splitting

## Recent Changes (2025-08-22)
- **Arabic Language Fix**: Modified LanguageProvider to force Arabic as the default language system-wide, removing dependency on localStorage for language detection to ensure consistent Arabic interface
- **Three-Tier Permission System**: Implemented comprehensive role-based access control with Admin, Supervisor, and Regular User levels
- **Admin Panel**: Added complete user management interface with role assignment and approval controls
- **Task Access Control**: Users only see assigned tasks, Supervisors can create and view all tasks, Admins have full system access
- **Permission-Based UI**: Dynamic interface elements based on user role with appropriate action restrictions
- **Role Management**: Admin can change user roles with automatic team member role synchronization
- **Unified User-Team System**: Integrated user accounts with team member records - each user now automatically becomes a team member
- **Messaging System**: Complete implementation with real-time notifications for new tasks and messages
- **Database Migration**: Successfully migrated from memory storage to persistent PostgreSQL database
- **Arabic Interface**: Full translation of dashboard, messaging, and notification interfaces
- **Navigation Updates**: Added messaging and notifications to bottom navigation with Arabic labels
- **Advanced User Management**: Added disable/delete user functionality for administrators with confirmation dialogs
- **Comprehensive Logging**: Implemented complete system logging for all user actions, task activities, and system events
- **Task Activity Logging**: Added detailed logging for task creation, status changes, progress updates, and deletions
- **Sorting Functionality**: Added date-based sorting options for tasks, system logs, and notifications with compact UI controls
- **Profile Management System**: Complete profile editing functionality with personal information updates (firstName, lastName, email, phone) and secure password change with current password verification
- **Database Schema Updates**: Added firstName, lastName, email, and phone fields to users table with automatic team member synchronization
- **Profile API Endpoints**: Implemented secure profile update and password change endpoints with proper validation and automatic logging
- **WhatsApp Integration**: Implemented WhatsApp Web.js integration for customer satisfaction rating requests with QR Code authentication and automatic message sending upon task completion
- **Customer Rating System**: Complete customer satisfaction rating system with automatic WhatsApp message sending when tasks are marked as completed, supporting three rating levels (غاضب، راضي، راضي جداً)
- **Rating Management Interface**: Comprehensive admin interface for viewing, filtering, and managing customer ratings with statistics and response tracking
- **Profile Image Upload System**: Complete implementation of profile image upload functionality using Object Storage with Uppy.js, featuring real-time image updates, cache busting, and seamless integration with team member cards
- **Object Storage Integration**: Full integration with Replit Object Storage for secure file uploads, automatic ACL policy management, and optimized image serving with proper caching headers
- **Real-time Image Display**: Implemented immediate image display updates after upload with force re-rendering, local state management, and fallback handling for failed image loads

### Permission System Details:
- **Admin (مدير النظام)**: Full system access, user management, role changes, all CRUD operations, profile management
- **Supervisor (مشرف)**: Task creation, view all tasks, team management, cannot change user roles, profile management
- **User (مستخدم عادي)**: View only assigned tasks, update task status/progress/notes, limited access, profile management

### Profile Management Features:
- **Personal Information Editing**: Users can update firstName, lastName, email, and phone number through an intuitive form interface
- **Password Management**: Secure password change functionality with current password verification and confirmation matching
- **Automatic Synchronization**: Profile updates automatically sync with team member records (name and email)
- **Form Validation**: Comprehensive client-side and server-side validation with Arabic error messages
- **Security Logging**: All profile changes are automatically logged in the system for audit purposes
- **Real-time Updates**: Profile changes reflect immediately in the interface after successful updates

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connectivity
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **express**: Web application framework for Node.js
- **zod**: Runtime type validation and schema definition

## UI and Styling
- **@radix-ui/***: Comprehensive set of unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Utility for creating variant-based component APIs
- **clsx**: Utility for constructing className strings conditionally

## Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **@replit/vite-plugin-runtime-error-modal**: Development error handling for Replit environment
- **tsx**: TypeScript execution environment for Node.js

## Form Handling and Validation
- **react-hook-form**: Performant forms with easy validation
- **@hookform/resolvers**: Resolvers for various schema validation libraries
- **date-fns**: Modern JavaScript date utility library

## Additional Utilities
- **wouter**: Minimalist routing for React applications
- **cmdk**: Command menu component for React
- **embla-carousel-react**: Carousel component library
- **nanoid**: Unique string ID generator