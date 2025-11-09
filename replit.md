# AI Skill Assessment & Training Platform - SkillPath

## Overview

SkillPath is an AI-powered educational platform that provides personalized skill assessments and training recommendations. The platform uses adaptive quizzes to determine user skill levels, generates customized course recommendations, and includes an AI chatbot mentor to guide learners through their educational journey. Users can track their progress across multiple learning domains, manage their course enrollments, and schedule learning activities.

**Latest Enhancements (November 2025)**
- Secure authentication with protected routes and user profile management
- Expanded learning domains: IoT, Space Technology, and Hardware
- Enhanced quiz results with detailed feedback showing correct/incorrect answers
- AI Mentor auto-assignment with proactive quiz and course recommendations
- Context-aware AI chat with access to user skills, courses, and quiz history
- **Complete Futuristic Glassmorphism UI Redesign:**
  - Pure black background (#000000) with transparent glass cards
  - Neon cyan (hsl(180 100% 50%)) and electric blue (hsl(210 100% 50%)) accents
  - Animated 3D parallax background with floating academic elements (books, pencils, graduation caps)
  - Glass effects with backdrop-blur and subtle transparency
  - Interactive neon glow hover effects on cards and buttons
  - Space Grotesk and Orbitron fonts for futuristic aesthetic
- **Recent Platform Improvements (November 8, 2025):**
  - **Fixed enrolled course display**: Dashboard now shows complete course information (title, provider, URL) by using correct field mappings from backend API
  - **Retake quiz functionality**: Beginner/Intermediate users can retake quizzes to improve skill assessment accuracy with encouraging messaging
  - **Enhanced AI Mentor UI**: Increased text sizes from text-sm to text-base/lg for better readability; improved card sizing and spacing
  - **Improved hero contrast**: Added stronger dark overlay and text shadows on landing page for better heading visibility
  - **Unique quiz generation**: Implemented timestamp-based seed + temperature 0.9 for OpenAI; enhanced fallback with multiple question banks (10 total), shuffling, and random selection (252+ combinations)
  - **AI Mentor platform navigation**: Enhanced system prompt to guide users through platform features (Dashboard, Courses, Assessments, Schedule) with step-by-step usage instructions
  - **Visual enhancements with professional imagery**:
    - Added professional stock photo to hero section that complements the futuristic design
    - **Fixed enrolled course images**: Replaced mismatched portrait photos with relevant course thumbnails
    - Dashboard now uses generated course thumbnails (ML, Data Science, Web Dev, Mobile Dev)
    - Smart image matching checks both course title and domain for accurate visuals
    - Course cards feature 128×128px thumbnail images with gradient overlays
    - All taglines (domain, skill level) remain clearly visible with proper contrast
    - Hover effects on course images for enhanced interactivity
  - **3D Holographic Hero Image**:
    - Generated stunning 3D AI learning hologram with neon cyan/blue glowing circuits and geometric shapes
    - Two-column responsive layout: text content on left, floating 3D hologram on right (desktop only)
    - Continuous floating animation with cyan glow effects and hover interactions
    - Mobile-optimized: 3D image hidden on smaller screens to preserve text focus
    - Background opacity reduced to 25% to enhance 3D image visibility while maintaining text clarity
  - **AI Mentor Reliability Improvements (November 9, 2025)**:
    - Increased OpenAI timeout from 15s to 30s for better reliability
    - Added retry mechanism (1 retry) to handle intermittent connection issues
    - Enhanced chat timeout to 25s specifically for user-facing interactions
    - Improved frontend error handling with graceful fallback messages
    - More conversational responses with higher temperature (0.8) and longer max tokens (500)
    - Better error messages displayed in chat interface when connectivity issues occur
    - **Simplified full-chat layout**: Removed recommendation cards to dedicate entire page to chat conversation
    - Fixed message display issue by replacing ScrollArea with standard scrollable div
    - Chat now takes full viewport height with cleaner, more focused interface
    - **Fixed Repeated Responses Bug**: Excluded initial welcome message from conversation history sent to OpenAI, ensuring unique contextual responses to different questions
  - **Course Recommendation System Fixes (November 9, 2025)**:
    - **Latest Assessment Skill Levels**: Fixed `getUserSkillLevels()` to order by `determinedAt DESC` and return only the most recent skill level per domain
      - After retaking a quiz and achieving Intermediate level, courses now correctly show Intermediate recommendations instead of old Beginner results
      - Database query ensures latest assessment drives course recommendations
      - Eliminated stale skill level data from impacting user experience
    - **Skill-Level Appropriate Titles**: Fixed fallback course titles to match user's assessed skill level
      - Beginner courses: "Introduction to...", "...Fundamentals", "Guide for Beginners"
      - Intermediate courses: "Intermediate...", "Building Projects with...", "Practical..."
      - Advanced courses: "Advanced...", "Mastering...", "Professional..."
      - No more confusing "Advanced Masterclass" titles for Beginner users
  - **Course URL Fix - Real Course Links (November 9, 2025)**:
    - **Major Fix**: Course links now redirect to actual, specific course pages instead of platform homepages
    - **AI Prompt Enhancement**: Explicit instructions with examples of valid vs invalid URLs
      - ✅ Valid: `youtube.com/watch?v=VIDEO_ID`, `coursera.org/learn/course-name`
      - ❌ Invalid: `youtube.com`, `coursera.org` (platform homepages)
    - **URL Validation System**: Backend automatically filters out platform homepage URLs
      - Only courses with specific paths (/watch?v=, /learn/, /course/) are accepted
      - AI must provide at least 6 valid courses, otherwise fallback is used
    - **Curated Fallback Courses**: Real, verified course URLs for all 8 domains
      - Web Development: YouTube full course, freeCodeCamp responsive web design certification
      - Machine Learning: Python ML course, Coursera ML specialization (Andrew Ng)
      - Data Science: Data analysis tutorial, Johns Hopkins data science specialization
      - Mobile Development: React Native full course, Android app development
      - Cybersecurity: Complete cyber security course tutorials
      - IoT: Introduction to IoT with real projects
      - Space Technology: Aerospace engineering, space mission design
      - Hardware: Electronics for beginners, computer building courses
    - **Smart Search Fallback**: For unmapped domains, generates search URLs to find relevant courses

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server, providing fast HMR and optimized production builds
- **Wouter** for lightweight client-side routing instead of React Router
- **TanStack Query v5** for server state management, data fetching, and caching

**UI Component System**
- **shadcn/ui** (New York variant) as the base design system, built on Radix UI primitives
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Futuristic Glassmorphism Design System**:
  - Pure black background (#000000) for high-tech aesthetic
  - Transparent glass cards with `backdrop-filter: blur(20px)` and `rgba(255, 255, 255, 0.05)` backgrounds
  - Neon cyan primary accents (hsl(180 100% 50%)) with electric blue secondary (hsl(210 100% 50%))
  - Custom utility classes: `.glass-card`, `.neon-glow`, `.neon-border`, `.pop-hover`
  - Typography: Space Grotesk for body text, Orbitron for futuristic display headers
  - Animated 3D parallax background with 12 floating academic icons responding to mouse movement
  - Interactive hover effects: neon border glow, card elevation, smooth pop animations
  - Smooth transitions and micro-interactions for modern UX

**State Management Strategy**
- Server state managed via TanStack Query with infinite stale time
- Local UI state uses React hooks (useState, useEffect)
- User session data persisted in localStorage (userId, selectedDomains, userName)
- No global state management library; data flows through component props and React Query cache

**Key Design Decisions**
- Mobile-first responsive design with breakpoints at 768px (md) and 1024px (lg)
- Accessibility-first approach using Radix UI primitives with ARIA attributes
- Reusable component library with examples for each major component
- Path aliases (@/, @shared/, @assets/) simplify imports and improve maintainability

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript running on Node.js
- ESM module system (type: "module" in package.json)
- Custom middleware for request logging and JSON body parsing with raw buffer capture
- Vite integration in development mode for SSR and HMR support

**API Design**
- RESTful endpoints under `/api` prefix
- POST `/api/user/onboard` - Creates users and stores domain preferences
- POST `/api/quiz/generate` - Generates AI-powered adaptive quizzes
- POST `/api/quiz/submit` - Processes quiz answers and determines skill levels
- Error responses include status codes and descriptive JSON messages
- Request/response logging captures method, path, status, duration, and truncated response bodies

**Authentication & Sessions**
- Currently uses demo authentication with generated user IDs
- Session data stored in localStorage on client side
- Production-ready session management uses `connect-pg-simple` for PostgreSQL-backed sessions
- User passwords stored (currently demo mode; would hash in production)

**AI Integration**
- **OpenAI API** integration for quiz generation and chatbot interactions
- Fallback quiz data ensures graceful degradation if AI service fails
- Quiz questions generated based on user's selected learning domains
- AI determines skill levels (Beginner/Intermediate/Advanced) from quiz performance
- **Context-Aware AI Mentor** with comprehensive user context (skills, courses, quiz history)
- **Proactive Recommendations** via `/api/mentor/recommendations/:userId` endpoint
- Auto-assigned quizzes after course completion and for unevaluated domains
- Smart course suggestions based on user enrollment patterns and skill gaps

### Data Storage Solutions

**Database**
- **PostgreSQL** via Neon serverless with WebSocket support
- **Drizzle ORM** for type-safe database queries and schema management
- Connection pooling via `@neondatabase/serverless` Pool

**Schema Design**
- `users` - Stores user credentials and selected learning domains
- `domain_skill_levels` - Tracks determined skill level per domain per user
- `quiz_attempts` - Logs quiz questions, answers, scores, and skill assessments
- `enrolled_courses` - Manages course enrollments with progress tracking
- `chat_messages` - Stores AI chatbot conversation history
- `learning_schedules` - Tracks scheduled learning activities and completion status

**Data Access Layer**
- `DbStorage` class implements `IStorage` interface for testability
- CRUD operations use Drizzle query builder with `eq`, `and`, `desc` filters
- UUID primary keys generated via PostgreSQL's `gen_random_uuid()`
- JSONB columns store complex data (quiz questions/answers)
- Timestamps use PostgreSQL's `defaultNow()` function

**Migration Strategy**
- Schema defined in `shared/schema.ts` for client/server sharing
- Drizzle Kit configured to generate migrations in `./migrations` directory
- `npm run db:push` applies schema changes directly (development workflow)

### External Dependencies

**Third-Party Services**
- **OpenAI API** - Generates adaptive quiz questions and powers AI chatbot mentor
- **Neon Database** - Serverless PostgreSQL hosting with WebSocket support
- **Google Fonts** - Serves Inter and Poppins font families

**UI Component Libraries**
- **Radix UI** - Comprehensive suite of accessible, unstyled React primitives (accordion, alert-dialog, avatar, checkbox, dialog, dropdown-menu, hover-card, label, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, switch, tabs, toast, tooltip, toggle)
- **cmdk** - Command palette component for keyboard-driven navigation
- **Lucide React** - Icon library providing consistent SVG icons
- **class-variance-authority** - Utility for creating variant-based component APIs
- **tailwind-merge** & **clsx** - Class name merging utilities

**Development Tools**
- **@replit/vite-plugin-runtime-error-modal** - Enhanced error overlay for development
- **@replit/vite-plugin-cartographer** - Code navigation and visualization
- **@replit/vite-plugin-dev-banner** - Development environment indicators
- **tsx** - TypeScript execution engine for Node.js
- **esbuild** - Bundles server code for production deployment

**Form & Validation**
- **react-hook-form** - Form state management and validation
- **@hookform/resolvers** - Validation schema resolvers
- **zod** & **drizzle-zod** - Runtime type validation and schema generation

**Date Handling**
- **date-fns** - Modern date manipulation library (alternative to moment.js)