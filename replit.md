# WordPress Plugin Marketplace

## Overview

A full-stack WordPress plugin marketplace platform built with React, Express, and PostgreSQL. The application enables users to browse, purchase, and manage WordPress plugins through flexible subscription plans (monthly, yearly, lifetime). It features secure license management, payment processing through multiple providers (Stripe, MercadoPago, Hotmart, Monetizze, Yampi), coupon/discount functionality, and comprehensive admin controls for plugin management, user administration, and revenue reporting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack Query (React Query) for server state
- **Styling:** Tailwind CSS with custom design system
- **UI Components:** Shadcn/ui (Radix UI primitives)
- **Forms:** React Hook Form with Zod validation

**Design System:**
- Dark/Light theme support via ThemeProvider
- Custom color palette with HSL variables
- Responsive design with mobile-first approach
- Component library based on shadcn/ui New York style
- Custom elevation system (hover-elevate, active-elevate-2)

**Key Architectural Decisions:**
- **Problem:** Complex server state management across multiple data types (plugins, subscriptions, licenses)
- **Solution:** TanStack Query for automatic caching, background updates, and optimistic updates
- **Rationale:** Reduces boilerplate, provides automatic refetching, and simplifies async state handling

**Authentication Flow:**
- Passport.js local strategy on backend
- Session-based authentication with persistent storage
- Protected routes using custom ProtectedRoute component
- Auth context provider for global auth state

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript (ESM modules)
- **Framework:** Express.js
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL (Neon serverless)
- **Session Storage:** connect-pg-simple (PostgreSQL-backed sessions)
- **Authentication:** Passport.js with Local Strategy
- **File Upload:** Multer (plugin files: .zip, .tar, .tar.gz, 50MB limit)

**API Design:**
- RESTful endpoints organized by resource type
- Middleware-based authentication (isAuthenticated, isAdmin)
- Centralized error handling with ApiError class
- Session-based authentication with secure cookies

**Key Architectural Decisions:**
- **Problem:** Need for secure, scalable session management
- **Solution:** PostgreSQL-backed sessions instead of memory store
- **Rationale:** Enables horizontal scaling, session persistence across restarts, and centralized session management

**Payment Integration:**
- Factory pattern (PaymentServiceFactory) for multiple payment providers
- Webhook signature verification for security
- Idempotent event processing using processedWebhookEvents table
- Transactional subscription and license creation

**File Storage:**
- Local disk storage for plugin files in uploads/plugins directory
- Unique filename generation using timestamp + random bytes
- File type validation and size limits enforced by Multer

### Database Schema

**Core Tables:**
- **users:** User accounts with admin flags, Stripe customer IDs
- **plugins:** Plugin catalog with pricing (monthly/yearly/lifetime), versioning, categories
- **subscriptions:** User plugin subscriptions with status tracking
- **licenses:** Generated license keys tied to subscriptions
- **downloads:** Download history tracking
- **payment_providers:** Multi-provider payment configuration
- **coupons:** Discount coupons with percentage/fixed amount, expiry dates
- **coupon_usages:** Coupon redemption tracking
- **sessions:** Express session storage
- **processed_webhook_events:** Webhook idempotency tracking

**Key Design Decisions:**
- **Problem:** Support multiple payment providers without code duplication
- **Solution:** Abstract payment provider configuration in database, service factory pattern
- **Pros:** Easy to add new providers, centralized configuration
- **Cons:** Requires careful interface design for provider abstraction

- **Problem:** Prevent duplicate webhook processing
- **Solution:** Track processed events by payment ID in database
- **Rationale:** Ensures idempotent payment processing, prevents duplicate subscriptions/licenses

### External Dependencies

**Payment Providers:**
- **Stripe:** Primary payment processor with webhook support
  - Public/secret keys configuration
  - Webhook signature verification
  - Checkout session creation
- **MercadoPago:** Brazilian payment gateway (configured but implementation pending)
- **Hotmart:** Digital product marketplace integration (configured)
- **Monetizze:** Affiliate platform integration (configured)
- **Yampi:** E-commerce platform integration (configured)

**Database:**
- **Neon Serverless PostgreSQL:** Managed PostgreSQL with connection pooling
- SSL disabled for development (configurable for production)

**Development Tools:**
- **Vite:** Frontend build tool with HMR
- **Drizzle Kit:** Database migrations and schema management
- **ESBuild:** Backend bundling for production

**Replit-Specific Integrations:**
- @replit/vite-plugin-runtime-error-modal
- @replit/vite-plugin-cartographer (dev only)
- @replit/vite-plugin-dev-banner (dev only)

**Third-Party UI:**
- Google Fonts: Inter (UI font), JetBrains Mono (code font)

**Key Integration Decisions:**
- **Problem:** Supporting multiple Brazilian payment gateways
- **Solution:** Unified payment service interface with provider-specific implementations
- **Alternatives Considered:** Single provider (Stripe only)
- **Pros:** Market flexibility, regional payment support
- **Cons:** Increased complexity, maintenance overhead per provider