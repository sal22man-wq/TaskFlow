# Overview

TaskFlow is a mobile-first task management and team collaboration platform designed for "شركة اشراق الودق لتكنولوجيا المعلومات" with full Arabic language support. The application features unified user-team member system where each user account automatically corresponds to a team member with the same username, comprehensive messaging system, notifications for new tasks and messages, administrator-controlled user approval system, and mobile-optimized interface with Arabic as the primary interface language.

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

## Recent Changes (2025-08-20)
- **Unified User-Team System**: Integrated user accounts with team member records - each user now automatically becomes a team member
- **Messaging System**: Complete implementation with real-time notifications for new tasks and messages
- **Database Migration**: Successfully migrated from memory storage to persistent PostgreSQL database
- **Arabic Interface**: Full translation of dashboard, messaging, and notification interfaces
- **Navigation Updates**: Added messaging and notifications to bottom navigation with Arabic labels

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