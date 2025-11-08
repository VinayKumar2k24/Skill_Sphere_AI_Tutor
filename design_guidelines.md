# Design Guidelines: AI Skill Assessment & Training Platform

## Design Approach

**Selected Approach:** Design System (Material Design 3)  
**Justification:** This is a utility-focused, information-dense educational platform where clarity, usability, and data visualization are paramount. Material Design provides excellent patterns for dashboards, form interactions, and progressive disclosure of complex information.

**Design Principles:**
- **Clarity First:** Educational content must be scannable and digestible
- **Progressive Complexity:** Start simple (onboarding), reveal depth (dashboard analytics)
- **Feedback-Rich:** Every action (quiz submission, course completion) gets clear visual confirmation
- **Data-Forward:** Charts and progress indicators are first-class citizens

---

## Typography

**Font Stack:**
- **Primary:** Inter (via Google Fonts) - for UI, body text, data labels
- **Display/Headers:** Poppins - for page titles and section headers

**Hierarchy:**
- **Hero/Page Titles:** Poppins Bold, text-5xl (mobile: text-4xl)
- **Section Headers:** Poppins SemiBold, text-3xl (mobile: text-2xl)
- **Card Titles:** Inter SemiBold, text-xl
- **Body Text:** Inter Regular, text-base, leading-relaxed
- **Labels/Metadata:** Inter Medium, text-sm
- **Fine Print:** Inter Regular, text-xs

---

## Layout System

**Spacing Primitives:** Use Tailwind units **2, 4, 8, 12, 16, 24** consistently
- Component padding: `p-4` or `p-6`
- Section spacing: `py-12` to `py-16`
- Card gaps: `gap-4` or `gap-6`
- Form fields: `space-y-4`

**Grid System:**
- **Dashboard:** 12-column grid with responsive breakpoints
- **Quiz Interface:** Single column, max-w-3xl centered
- **Course Cards:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

**Container Widths:**
- Full app wrapper: `max-w-7xl mx-auto px-4`
- Content sections: `max-w-6xl`
- Reading content: `max-w-3xl`

---

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header with logo left, user profile/notifications right
- Main nav items: Dashboard, Assessments, Courses, Mentor Chat, Schedule
- Sticky on scroll with elevated shadow
- Mobile: Hamburger menu with slide-out drawer

### Dashboard Components

**Hero Stats Cards (4-across on desktop, stack mobile):**
- Large metric numbers with labels
- Icon indicators for trends
- Subtle hover elevation

**Progress Visualization:**
- Circular progress rings for skill levels (Beginner/Intermediate/Advanced percentages)
- Horizontal skill bars with domain labels
- Line chart for learning timeline (Chart.js)
- Use `aspect-video` or `aspect-square` containers

**Course Recommendation Cards:**
- Horizontal layout: thumbnail left (160px), content right
- Include: Course title, provider, duration, difficulty badge, price (Free/Paid)
- CTA button: "Start Learning" or "Continue"
- Stack 2-3 recommendations vertically with dividers

### Quiz Interface

**Question Container:**
- Single question per screen (centered, max-w-3xl)
- Large question text with question number indicator
- Multiple choice: Large touch-friendly option cards (min-height: 56px)
- Radio buttons with full-card clickable areas
- Navigation: "Previous" | Progress dots | "Next" buttons at bottom
- Sticky footer with Submit/Next actions

**Results Screen:**
- Score display: Large circular percentage with congratulatory message
- Skill classification badge (Beginner/Intermediate/Advanced) - prominent placement
- Breakdown: Correct/incorrect per topic area
- Immediate CTA: "View Recommended Courses"

### AI Chatbot Mentor

**Chat Interface:**
- Fixed bottom-right bubble launcher (60px diameter)
- Expands to modal overlay (mobile) or docked sidebar (desktop, 400px wide)
- Message bubbles: User (right-aligned, max 70% width), AI (left-aligned)
- Input: Sticky bottom with auto-resize textarea
- Quick suggestions chips above input
- Typing indicator with animated dots

### Course Tracking

**Course Detail Cards:**
- Progress bar (0-100%) with percentage label
- Module checklist with completed/incomplete icons
- Next quiz unlock indicator
- Schedule reminder with date/time

### Schedule View

**Calendar Component:**
- Month view with highlighted learning sessions
- List view toggle showing upcoming tasks
- Filterable by course/assessment
- Each item shows: time, course name, task type (Quiz/Module/Review)

### Forms (Onboarding/Profile)

**Multi-step Onboarding:**
- Progress stepper at top (4 steps: Welcome → Domains → Skills → Initial Assessment)
- Each step: Centered card (max-w-2xl) with clear heading
- Domain selection: Tag-style multi-select chips
- Skill level: Radio cards with descriptions
- Navigation: "Back" | "Skip" | "Continue" buttons

**Form Inputs:**
- Labels: text-sm, font-medium, above input
- Input fields: rounded-lg, border, px-4 py-3
- Error states: Red border + helper text below
- Focus: Prominent border change (no color specified)

---

## Animations

**Minimal, Purposeful Motion:**
- Page transitions: Simple fade-in (duration-200)
- Card hover: Subtle lift (translate-y-1, shadow-lg)
- Quiz option selection: Quick scale pulse (scale-105)
- Progress bars: Smooth width animation (transition-all duration-500)
- NO scroll-triggered animations or complex parallax

---

## Images

**Hero Image (Pre-Login Landing):**
- Full-width hero section with illustration/photo showing diverse learners or technology interface
- Place engaging, modern educational imagery (students with laptops, digital learning concept art)
- Overlay: Semi-transparent treatment with CTA buttons on blurred background

**Dashboard Placeholder:**
- Small avatar placeholder for user profile (top-right nav)
- Course thumbnails: 16:9 aspect ratio, placeholder images for courses
- Achievement badges/icons for milestones

**Course Cards:**
- Each course includes thumbnail image (providers' logos or course topic imagery)
- Consistent 16:9 or 4:3 aspect ratio across all course cards

**Empty States:**
- Illustrative graphics for "No courses yet," "No assessments," etc.
- Friendly, encouraging visual tone

---

## Accessibility

- All interactive elements: minimum 44x44px touch targets
- Form inputs: Associated labels, error messages with aria-live
- Skip navigation link for keyboard users
- Focus indicators on all interactive elements
- Quiz timer: Pause option for accessibility compliance