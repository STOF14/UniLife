# UniLife Pro - Complete Development Blueprint

## Table of Contents
1. [Database Schema](#1-database-schema)
2. [Application Structure](#2-application-structure)
3. [Core Features & Pages](#3-core-features--pages)
4. [Component Library](#4-component-library)
5. [Hooks & Utilities](#5-hooks--utilities)
6. [Implementation Priority](#6-implementation-priority)

---

## 1. DATABASE SCHEMA

### Tables Overview
```
Core Tables (15):
├── profiles (user profiles)
├── degree_programs (BSc Physics, etc.)
├── degree_years (Year 1, 2, 3)
├── year_modules (module templates in degree)
├── module_attempts (student's actual modules)
├── assessments (assignments, tests, exams)
├── assessment_tasks (checklist items)
├── tasks (general to-do items)
├── study_sessions (time tracking)
├── study_goals (weekly targets)
├── resources (files, links, materials)
├── personal_notes (student notes)
├── transactions (financial tracking)
├── alerts (notifications)
└── user_preferences (settings)
```

### Key Relationships
```
degree_programs (1) → (many) degree_years
degree_years (1) → (many) year_modules
year_modules (1) → (many) module_attempts

module_attempts (1) → (many) assessments
assessments (1) → (many) assessment_tasks

module_attempts (1) → (many) study_sessions
module_attempts (1) → (many) resources
module_attempts (1) → (many) personal_notes

user (1) → (many) tasks
user (1) → (many) transactions
user (1) → (many) alerts
```

### Important Fields

#### **module_attempts** (most important table)
```typescript
{
  id: uuid,
  user_id: uuid,
  year_module_id: uuid (nullable - for flexibility),
  
  // Identity
  module_code: string,         // "PHY114"
  module_name: string,          // "First course in physics"
  credits: number,              // 16
  
  // Attempt tracking
  attempt_number: number,       // 1, 2, 3...
  semester: string,             // "2024-S1", "2025-S2"
  year: number,                 // 2024, 2025
  
  // Grades
  current_grade: decimal,       // Auto-calculated from assessments
  final_grade: decimal,         // Official final grade
  target_grade: decimal,        // Student's goal
  
  // Status
  status: enum,                 // 'registered', 'in_progress', 'passed', 'failed', 'dna', 'dropped'
  progress: number,             // 0-100% (based on completed assessments)
  
  // Additional data
  lecturer: jsonb,              // {name, email, office, hours}
  venues: jsonb,                // {lectures, tutorials, practicals}
  schedule: jsonb,              // Weekly schedule
  syllabus_topics: array,       // Topics covered
  textbooks: jsonb,             // Required textbooks
  cover_image: string,          // Module card image
  study_time_logged: number,   // Total minutes
  notes: text,                  // Personal notes
  tags: array
}
```

#### **assessments**
```typescript
{
  id: uuid,
  module_attempt_id: uuid,
  user_id: uuid,
  
  // Details
  type: enum,                   // 'assignment', 'test', 'practical', 'exam', 'project'
  number: number,               // Assignment 1, Test 2
  name: string,
  description: text,
  
  // Weighting
  weight: decimal,              // % of final grade (0-100)
  subminimum: decimal,          // Required minimum (e.g., 40% for exam)
  
  // Dates
  due_date: timestamp,
  test_date: timestamp,
  submission_date: timestamp,
  
  // Grading
  mark: decimal,                // 0-100
  total_marks: number,          // Out of X marks
  feedback: text,
  graded_at: timestamp,
  
  // Status
  status: enum,                 // 'upcoming', 'in_progress', 'submitted', 'graded', 'missed'
  
  // Tracking
  time_spent: number,           // Minutes
  difficulty_rating: number,    // 1-5
  
  // Files
  attachment_url: string,       // Brief/instructions
  submission_url: string        // Student submission
}
```

### Database Functions (Auto-triggers)

1. **Auto-calculate current_grade** when assessment is graded
2. **Auto-update progress** based on completed assessment weight
3. **Auto-calculate study_time_logged** from study_sessions
4. **Auto-update timestamps** on record changes

---

## 2. APPLICATION STRUCTURE

### File Tree
```
unilife-pro/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # Main app layout with sidebar
│   │   ├── page.tsx                      # Dashboard home
│   │   │
│   │   ├── roadmap/
│   │   │   ├── page.tsx                  # Full degree roadmap
│   │   │   └── [year]/page.tsx           # Year-specific view
│   │   │
│   │   ├── modules/
│   │   │   ├── page.tsx                  # All modules grid
│   │   │   ├── [code]/
│   │   │   │   ├── page.tsx              # Module overview (default tab)
│   │   │   │   ├── assessments/page.tsx  # Assessments tab
│   │   │   │   ├── materials/page.tsx    # Materials/resources tab
│   │   │   │   ├── notes/page.tsx        # Personal notes tab
│   │   │   │   └── history/page.tsx      # Attempt history tab
│   │   │   └── add/page.tsx              # Add module form
│   │   │
│   │   ├── tasks/
│   │   │   ├── page.tsx                  # Task list with filters
│   │   │   └── [id]/page.tsx             # Task detail (optional)
│   │   │
│   │   ├── analytics/
│   │   │   ├── page.tsx                  # Main analytics dashboard
│   │   │   ├── performance/page.tsx      # Deep performance analysis
│   │   │   ├── predictions/page.tsx      # Graduation projections
│   │   │   └── patterns/page.tsx         # Study pattern analysis
│   │   │
│   │   ├── study/
│   │   │   ├── page.tsx                  # Study dashboard
│   │   │   ├── timer/page.tsx            # Active study session
│   │   │   └── history/page.tsx          # Session history
│   │   │
│   │   ├── resources/
│   │   │   ├── page.tsx                  # All resources
│   │   │   └── [moduleCode]/page.tsx     # Module-specific resources
│   │   │
│   │   ├── finances/
│   │   │   ├── page.tsx                  # Finance overview
│   │   │   └── projections/page.tsx      # Cost projections
│   │   │
│   │   └── settings/
│   │       ├── page.tsx                  # General settings
│   │       ├── profile/page.tsx          # Profile settings
│   │       ├── degree/page.tsx           # Degree setup/edit
│   │       ├── notifications/page.tsx    # Notification preferences
│   │       └── import/page.tsx           # Import data wizard
│   │
│   ├── api/
│   │   ├── calculations/
│   │   │   ├── cwa/route.ts
│   │   │   ├── projections/route.ts
│   │   │   └── recommendations/route.ts
│   │   └── alerts/
│   │       └── generate/route.ts
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── MobileNav.tsx
│   │   └── Container.tsx
│   │
│   ├── pages/
│   │   ├── dashboard/
│   │   │   ├── QuickStats.tsx
│   │   │   ├── CalendarWidget.tsx
│   │   │   ├── UpcomingTasks.tsx
│   │   │   └── AlertPanel.tsx
│   │   │
│   │   ├── roadmap/
│   │   │   ├── ProgramHeader.tsx
│   │   │   ├── YearSection.tsx
│   │   │   ├── RoadmapModuleCard.tsx
│   │   │   ├── PrerequisiteFlow.tsx
│   │   │   └── FailedModulesAlert.tsx
│   │   │
│   │   ├── modules/
│   │   │   ├── ModuleGrid.tsx
│   │   │   ├── ModuleHeader.tsx
│   │   │   ├── ModuleOverview.tsx
│   │   │   ├── AssessmentManager.tsx
│   │   │   ├── MaterialsLibrary.tsx
│   │   │   ├── NotesEditor.tsx
│   │   │   └── AttemptComparison.tsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── CWAOverview.tsx
│   │   │   ├── TermComparison.tsx
│   │   │   ├── DepartmentBreakdown.tsx
│   │   │   ├── StrengthsWeaknesses.tsx
│   │   │   ├── GraduationProjector.tsx
│   │   │   └── RiskAssessment.tsx
│   │   │
│   │   └── study/
│   │       ├── ActiveTimer.tsx
│   │       ├── WeeklySummary.tsx
│   │       ├── SessionHistory.tsx
│   │       └── StudyAnalytics.tsx
│   │
│   ├── modules/
│   │   ├── ModuleCard.tsx
│   │   ├── ModuleForm.tsx
│   │   ├── PrerequisiteChip.tsx
│   │   └── ProgressRing.tsx
│   │
│   ├── assessments/
│   │   ├── AssessmentCard.tsx
│   │   ├── AssessmentForm.tsx
│   │   ├── GradeCalculator.tsx
│   │   ├── Checklist.tsx
│   │   └── WeightPieChart.tsx
│   │
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Tabs.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Toast.tsx
│   │
│   └── forms/
│       ├── FormInput.tsx
│       ├── FormSelect.tsx
│       ├── FormTextarea.tsx
│       └── FormDatePicker.tsx
│
├── hooks/
│   ├── useDatabase.ts           # CRUD operations
│   ├── useStore.tsx             # Global state
│   ├── useAuth.ts               # Authentication
│   ├── useRealtime.ts           # Real-time subscriptions
│   ├── useCalculations.ts       # CWA, projections
│   └── useNotifications.ts      # Notification system
│
├── lib/
│   ├── types.ts                 # TypeScript definitions
│   ├── constants.ts             # App constants
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── utils/
│   │   ├── calculations.ts      # CWA, grade calculations
│   │   ├── dates.ts             # Date utilities
│   │   ├── formatting.ts        # Format helpers
│   │   └── generators.ts        # Alert generation
│   └── schemas/
│       ├── module.ts            # Zod schemas
│       ├── assessment.ts
│       └── task.ts
│
└── supabase/
    ├── migrations/
    │   ├── 001_initial_schema.sql
    │   ├── 002_degree_structure.sql
    │   ├── 003_assessments.sql
    │   ├── 004_study_sessions.sql
    │   ├── 005_resources.sql
    │   └── 006_alerts.sql
    └── seed.sql
```

---

## 3. CORE FEATURES & PAGES

### 3.1 Dashboard (/)
**Purpose:** Daily command center

**Components:**
1. **Quick Stats** (4 cards)
   - Current CWA
   - Active modules count
   - Tasks completed ratio (X/Y)
   - Average module progress

2. **Calendar Widget**
   - Monthly calendar view
   - Task indicators on dates (colored dots by priority)
   - Click date to see tasks
   - Today/Prev/Next navigation
   - Selected date shows task list below

3. **This Week's Tasks**
   - Next 7 days tasks
   - Priority indicators
   - Module badges
   - Due date countdown
   - Quick complete checkbox

4. **Alert Panel** (if critical/high alerts exist)
   - Critical alerts (red border, red icon)
   - High priority alerts (yellow border)
   - Dismiss button
   - Action button linking to relevant page

**Data Requirements:**
- User's module attempts (active)
- User's tasks (due within 7 days)
- User's alerts (not dismissed)
- Calculated CWA from completed modules
- Progress from all modules

---

### 3.2 Degree Roadmap (/roadmap)
**Purpose:** See complete degree journey, track prerequisites, identify blockers

**Main View:**
1. **Program Header Card**
   - Degree name, specialization
   - Overall progress bar (credits completed/total)
   - Quick stats: Completed credits, Remaining credits, Expected graduation
   - Current year badge

2. **Failed/Incomplete Modules Alert** (if any exist)
   - Red card at top
   - Lists all failed modules
   - Shows which are blocking progression
   - "Must Retake" vs "Optional" distinction
   - Links to module detail

3. **Year Sections** (collapsible)
   - Year header with progress bar
   - Status badge (Not Started, In Progress, Completed)
   - Toggle expand/collapse
   
   **When Expanded:**
   - Organized by category (Fundamental, Core, Elective)
   - Module cards in grid (3 columns desktop)
   - Each card shows:
     - Module code & name
     - Credits badge
     - Status icon (passed, failed, in progress, not registered)
     - Prerequisites with checkmarks (met/not met)
     - Latest attempt grade (if exists)
     - Click to go to module detail

4. **Prerequisite Flow Visualization** (optional enhancement)
   - Visual diagram showing module dependencies
   - Arrows from prerequisite → dependent module
   - Color coded by status

**Data Requirements:**
- User's degree_program
- All degree_years for program
- All year_modules for each year
- User's module_attempts mapped to year_modules
- Prerequisite checking logic

---

### 3.3 Modules (/modules)
**Purpose:** Manage all modules, quick overview

**Main View:**
1. **Module Grid**
   - All user's module_attempts
   - Filter options:
     - Status: All, Active, Passed, Failed, Registered
     - Semester: All, 2024-S1, 2024-S2, 2025-S1, etc.
     - Department: All, Physics, CS, Math, etc.
   - Sort options:
     - Recent
     - Module code (A-Z)
     - Progress (high to low)
     - Grade (high to low)
   - Search by code or name

2. **Module Cards**
   - Cover image (gradient or uploaded)
   - Module code & name
   - Credits badge
   - Current grade vs target (if in progress)
   - Progress ring (based on assessments completed)
   - Status badge
   - "This week" task count
   - Click to go to detail

3. **Add Module Button** (floating action button)
   - Opens modal/page to add new module

**Data Requirements:**
- All module_attempts for user
- Assessment completion for progress
- Tasks linked to each module

---

### 3.4 Module Detail (/modules/[code])
**Purpose:** Deep dive into single module

**Layout:** Tabs with module header

**Module Header:**
- Module code & name
- Credits, NQF level, Semester
- Status badge
- Edit button (opens modal)
- Archive/Delete button

**Tab 1: Overview** (default)
- **Current Performance Card**
  - Current grade (auto-calculated)
  - Target grade (user set)
  - Progress to target (visual bar)
  - Contribution to CWA (weight × grade)

- **Prerequisites Card**
  - List prerequisites with status (met/not met)
  - Links to prerequisite modules

- **Feeds Into Card**
  - List modules that require this
  - Shows blocked modules if not passed

- **Schedule Card**
  - Lectures: Time, day, venue
  - Tutorials: Time, day, venue
  - Practicals: Time, day, venue

- **Lecturer Card**
  - Name, email, office, consultation hours

- **Syllabus Topics Checklist**
  - List of topics with checkboxes
  - Track what's been covered

**Tab 2: Assessments**
- **Current Grade Calculator**
  - Shows all assessments with weights
  - Completed assessments (graded)
  - Upcoming/in-progress assessments
  - Projected final grade based on targets
  - "What do I need?" calculator

- **Assessment Cards** (grouped: Upcoming, Completed)
  - Each assessment shows:
    - Type & number (Assignment 1, Test 2)
    - Due/test date
    - Weight (% of final)
    - Status (upcoming, in progress, submitted, graded)
    - Mark (if graded)
    - Checklist (if has tasks)
    - Time spent
    - Edit/Delete buttons

- **Add Assessment Button**

**Tab 3: Materials**
- **Textbooks Section**
  - List required textbooks
  - Status: Owned, Library loan, Need to buy
  - Relevant chapters
  - Links to files

- **Lecture Materials** (organized by week)
  - Week 1, Week 2, etc.
  - Slides, recordings, notes per week
  - Status: Not viewed, Viewed, Reviewed
  - Upload/add file buttons

- **Past Papers Section**
  - List by year
  - Paper + Memo
  - Completion status, score
  - Upload button

- **External Resources**
  - Links to videos, tutorials, websites
  - Add link button

**Tab 4: Notes**
- **Rich Text Editor**
  - Markdown or WYSIWYG editor
  - Save notes linked to this module
  - Search through notes
  - Tag notes

- **Notes List** (sidebar or below editor)
  - All notes for this module
  - Click to edit
  - Delete button

**Tab 5: History** (if multiple attempts)
- **Attempt Comparison**
  - Side-by-side comparison
  - Attempt 1 vs Attempt 2
  - Grades, study time, semester
  - "What changed?" notes

**Data Requirements:**
- module_attempt with all details
- All assessments for this attempt
- All resources for this module
- All notes for this module
- Prerequisites status (requires checking other attempts)
- Feeds_into modules

---

### 3.5 Tasks (/tasks)
**Purpose:** Task management across all modules

**Layout:**
1. **Filter Bar**
   - Module filter (dropdown of all modules)
   - Priority filter (All, Urgent, High, Medium, Low)
   - Status filter (All, To Do, In Progress, Done)
   - Search bar
   - Sort dropdown (Due date, Priority, Created date)

2. **Task List**
   - **Upcoming Section** (not completed)
     - Grouped by: Overdue, Today, Tomorrow, This Week, Later
     - Each task shows:
       - Priority indicator (colored dot/flag)
       - Title
       - Module badge
       - Due date
       - Status tag
       - Complete checkbox
       - Edit/Delete icons
     - Pagination (20 per page)

   - **Completed Section** (collapsible)
     - Recently completed tasks
     - Same card layout
     - "Uncomplete" option

3. **Add Task Button** (floating action button)
   - Opens modal
   - Fields: Title, Description, Module, Due date, Priority
   - Create button

4. **Module Stats** (optional sidebar)
   - Total tasks per module
   - Completed ratio per module

**Data Requirements:**
- All user tasks
- Module list for filter/assignment
- Assessment list (for linked tasks)

---

### 3.6 Analytics (/analytics)
**Purpose:** Insights into academic performance

**Main View:**

1. **CWA Overview Card**
   - Large CWA number
   - Change from last term (+X% or -X%)
   - Trend arrow (up/down/stable)
   - Target CWA (user set)
   - Gap to target

2. **Term-by-Term Comparison**
   - Line/bar chart
   - X-axis: Terms (2024-S1, 2024-S2, 2025-S1)
   - Y-axis: Average grade
   - Shows clear improvement/decline trend
   - Hover for exact values

3. **Performance by Department**
   - Table or bar chart
   - Departments: Physics, CS, Math, etc.
   - Average grade per department
   - Module count per department
   - Trend indicator (improving/declining/stable)

4. **Strengths & Weaknesses**
   - **Strengths Card** (green border)
     - Areas where you excel
     - E.g., "Programming: 63.5% average"
     - Evidence: List of high-performing modules
   
   - **Weaknesses Card** (yellow border)
     - Areas needing support
     - E.g., "Pure Mathematics: 48.1% average"
     - Recommendation: "Consider math tutoring"
     - List of struggling modules

5. **Module Type Performance**
   - Programming vs Theory vs Practical
   - First attempts vs Retakes
   - Semester 1 vs Semester 2 performance

6. **Grade Distribution**
   - Pie/bar chart
   - A: 75-100%, B: 65-74%, C: 55-64%, D: 50-54%, F: <50%
   - Count of modules in each range

**Sub-pages:**

**Performance (/analytics/performance)**
- Deep dive charts
- Module-by-module performance over time
- Correlation analysis (study time vs grades)

**Predictions (/analytics/predictions)**
- **Graduation Projector**
  - Current trajectory
  - "What if" scenarios
  - Required averages to hit target CWA
  - Timeline to graduation

- **Risk Assessment**
  - Modules at risk (low current grade)
  - Prerequisites at risk (borderline passes)
  - Course load warnings

**Patterns (/analytics/patterns)**
- **Study Patterns**
  - Best performing semester
  - Optimal course load (credits)
  - Best module types
  - Time-of-day productivity

- **Recommendations**
  - Based on your data
  - E.g., "Take math modules in Semester 2"
  - E.g., "Limit to 48 credits per term"

**Data Requirements:**
- All module_attempts with grades
- Calculated CWA (from lib/utils/calculations.ts)
- Department categorization
- Study sessions for correlation
- Prerequisite data for risk assessment

---

### 3.7 Study Tracking (/study)
**Purpose:** Track and optimize study time

**Main View:**

1. **Active Session Card** (if session active)
   - Timer (MM:SS)
   - Module selected
   - Session type (self study, assignment work, etc.)
   - Pause/Stop buttons
   - Notes field (what are you working on?)

   **OR**

   **Start Session Card** (if no active session)
   - Quick start buttons per module
   - "Start General Study" button
   - Opens modal to select module, type, location

2. **This Week Summary**
   - Progress bar: Hours logged / Weekly goal
   - Percentage (e.g., 18.5 / 40 hours = 46%)
   - Breakdown by module (visual bars)
   - Breakdown by type (lecture, self-study, etc.)
   - Comparison to last week

3. **Study Goals**
   - Weekly hours target (editable)
   - Module-specific goals (optional)
   - Progress to each goal

4. **Study Analytics**
   - **Time-of-Day Heatmap**
     - Grid: Days of week × Hours of day
     - Color intensity = study time
     - Shows peak productivity times

   - **Module Comparison**
     - Bar chart: Hours per module
     - Recommended vs actual
     - Efficiency rating (hours per % grade)

   - **Productivity Trends**
     - Line chart: Average productivity rating over time
     - Identifies slumps and peaks

5. **Recent Sessions**
   - Table of last 20 sessions
   - Date, module, type, duration, productivity
   - Edit/Delete options

**Study Timer Page (/study/timer)**
- Full-screen focus mode
- Large timer
- Module & task info
- Minimal distractions
- Pause/Stop/End buttons

**Data Requirements:**
- study_sessions for user
- study_goals for user
- Calculations for weekly totals, averages
- Module list for quick start

---

### 3.8 Resources (/resources)
**Purpose:** Centralized materials hub

**Main View:**

1. **Resource Filter**
   - Module filter
   - Type filter (Textbook, Slides, Recording, Notes, Past Paper, Link)
   - Status filter (Not started, In progress, Completed, Reviewed)
   - Search bar

2. **Resource Grid**
   - Cards for each resource
   - Thumbnail/icon based on type
   - Title, description
   - Module badge
   - Type badge
   - Status badge
   - Last accessed date
   - Click to open/view
   - Edit/Delete buttons

3. **Add Resource Button**
   - Modal with fields:
     - Module
     - Type
     - Title, description
     - File upload OR external URL
     - Week number (optional)
     - Chapter (optional)
     - Tags
   - Create button

**Module-Specific View (/resources/[moduleCode])**
- Same as main view but filtered to one module
- Organized by week or type
- Quick access from module detail page

**Data Requirements:**
- resources for user
- File URLs (Supabase Storage)
- Module list for filtering

---

### 3.9 Finances (/finances)
**Purpose:** Track expenses and tuition

**Main View:**

1. **Financial Overview Card**
   - Total balance (income - expenses)
   - This month spending
   - This month income
   - Transaction count this month

2. **Quick Stats**
   - Outstanding tuition
   - Textbook expenses YTD
   - Average monthly spending

3. **Add Transaction**
   - Quick amount buttons (R100, R500, R1000)
   - Fields: Date, Description, Amount, Category, Module (optional)
   - Income (positive) or Expense (negative) toggle

4. **Transaction History**
   - List of recent transactions
   - Date, description, amount, category
   - Color coded (green = income, red = expense)
   - Filter by category, module, date range
   - Edit/Delete options

5. **Category Breakdown**
   - Pie chart of spending by category
   - Tuition, Books, Food, Transport, etc.

**Projections Page (/finances/projections)**
- **Degree Cost Estimator**
  - Total cost to date
  - Remaining semesters
  - Projected total cost (including retakes)
  
- **Retake Cost Calculator**
  - Cost per failed module
  - Total retake fees needed
  - "Cost of graduating late" calculation

- **Budget Planner**
  - Monthly budget targets
  - Track against targets
  - Alerts when overspending

**Data Requirements:**
- transactions for user
- Module_attempts (for retake cost calculation)
- Degree program (for remaining cost projection)

---

### 3.10 Settings (/settings)
**Purpose:** Configure app preferences

**General Settings (/settings)**
- Theme (Dark - default, Light)
- Dashboard layout (Standard, Compact, Detailed)
- Language (English - for now)
- Data retention period

**Profile (/settings/profile)**
- Full name
- Student number
- Email (read-only, from auth)
- Phone number
- University
- Avatar upload
- Change password

**Degree Setup (/settings/degree)**
- Current degree program details
- Edit program (name, specialization, start year)
- Expected graduation year
- Total credits required
- Year structure (Year 1, 2, 3 credits)
- "Import Module Structure" button (for setting up year_modules)

**Notifications (/settings/notifications)**
- **Email Notifications**
  - Deadlines (3 days, 1 day, same day)
  - Grades posted
  - Alerts
  - Achievements

- **Push Notifications** (if PWA)
  - Same options as email

- **Notification Frequency**
  - Immediate, Daily digest, Weekly digest

**Import Data (/settings/import)**
- **Import Past Modules** (wizard)
  - Upload CSV or manual entry
  - Map columns (Module Code, Name, Semester, Credits, Grade)
  - Preview before import
  - Duplicate detection
  - Bulk import button

- **Import BSc Physics Structure** (pre-configured)
  - Button to import Year 1, 2, 3 structure
  - With prerequisites, credits, departments
  - From your yearbook PDF

**Data Requirements:**
- user_preferences for user
- profiles for user
- degree_programs for editing

---

## 4. COMPONENT LIBRARY

### 4.1 UI Components (Reusable)

**Button.tsx**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}
```

**Input.tsx**
```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  icon?: React.ReactNode;
}
```

**Select.tsx**
```typescript
interface SelectProps {
  label?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}
```

**Modal.tsx**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}
```

**Card.tsx**
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean; // Hover effect
  onClick?: () => void;
}
```

**Badge.tsx**
```typescript
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

**Tabs.tsx**
```typescript
interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
}

interface TabsListProps {
  children: React.ReactNode;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
}
```

**ProgressBar.tsx**
```typescript
interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  showLabel?: boolean;
  color?: string;
  height?: string;
  className?: string;
}
```

**ProgressRing.tsx** (circular progress)
```typescript
interface ProgressRingProps {
  value: number; // 0-100
  size?: number; // diameter in pixels
  strokeWidth?: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
}
```

**Toast.tsx** (notification system)
```typescript
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // milliseconds
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

// Usage:
toast.success('Module added successfully!');
toast.error('Failed to save changes');
```

**Dropdown.tsx**
```typescript
interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right' | 'center';
}

interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}
```

**Skeleton.tsx** (loading states)
```typescript
interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: boolean;
  className?: string;
}
```

---

### 4.2 Feature-Specific Components

**ModuleCard.tsx**
- Displays module with cover image
- Progress ring
- Grade info
- Status badge
- Click handler
- Used in: Dashboard, Modules page, Roadmap

**AssessmentCard.tsx**
- Assessment details
- Weight indicator
- Status badge
- Checklist progress
- Due date countdown
- Edit/Delete buttons
- Used in: Module detail assessments tab

**TaskCard.tsx**
- Task title, description
- Priority indicator
- Module badge
- Due date
- Complete checkbox
- Edit/Delete
- Used in: Dashboard, Tasks page

**CalendarWidget.tsx**
- Monthly calendar grid
- Task indicators
- Date selection
- Navigation
- Used in: Dashboard

**QuickStats.tsx**
- 4 stat cards
- Icon, label, value, color
- Used in: Dashboard

**YearSection.tsx**
- Collapsible year section
- Progress bar
- Module cards grid
- Used in: Roadmap

**RoadmapModuleCard.tsx**
- Module in roadmap context
- Status icon
- Prerequisite chips
- Attempt info
- Used in: Roadmap

**AlertCard.tsx**
- Alert message with icon
- Priority-based styling
- Dismiss button
- Action button
- Used in: Dashboard, throughout app

**GradeCalculator.tsx**
- Shows current grade calculation
- List assessments with weights
- Projected final grade
- "What do I need?" inputs
- Used in: Module assessments tab

**Checklist.tsx**
- List of checkable items
- Progress indicator
- Add/remove items
- Reorder (drag-drop optional)
- Used in: Assessments

**StudyTimer.tsx**
- Running timer display
- Start/pause/stop controls
- Module & type selection
- Notes field
- Used in: Study pages

---

## 5. HOOKS & UTILITIES

### 5.1 Custom Hooks

**useDatabase.ts**
```typescript
// CRUD operations for all tables
export function useDatabase() {
  const supabase = useSupabaseClient();
  const { user } = useAuth();
  
  // Module Attempts
  const getModuleAttempts = async (userId: string) => {
    const { data, error } = await supabase
      .from('module_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  const getModuleAttempt = async (id: string) => {
    const { data, error } = await supabase
      .from('module_attempts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  const createModuleAttempt = async (data: Partial<ModuleAttempt>) => {
    const { data: result, error } = await supabase
      .from('module_attempts')
      .insert({ ...data, user_id: user?.id })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
  
  const updateModuleAttempt = async (id: string, data: Partial<ModuleAttempt>) => {
    const { data: result, error } = await supabase
      .from('module_attempts')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
  
  const deleteModuleAttempt = async (id: string) => {
    const { error } = await supabase
      .from('module_attempts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  
  // Assessments
  const getAssessments = async (moduleAttemptId: string) => {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('module_attempt_id', moduleAttemptId)
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data;
  }
  
  const createAssessment = async (data: Partial<Assessment>) => {
    const { data: result, error } = await supabase
      .from('assessments')
      .insert({ ...data, user_id: user?.id })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
  
  const updateAssessment = async (id: string, data: Partial<Assessment>) => {
    const { data: result, error } = await supabase
      .from('assessments')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
  
  const deleteAssessment = async (id: string) => {
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  
  // Tasks
  const getTasks = async (userId: string, filters?: any) => {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);
    
    if (filters?.module_code) {
      query = query.eq('module_code', filters.module_code);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.completed !== undefined) {
      query = query.eq('completed', filters.completed);
    }
    
    const { data, error } = await query.order('due_date', { ascending: true });
    
    if (error) throw error;
    return data;
  }
  
  const createTask = async (data: Partial<Task>) => {
    const { data: result, error } = await supabase
      .from('tasks')
      .insert({ ...data, user_id: user?.id })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
  
  const updateTask = async (id: string, data: Partial<Task>) => {
    const { data: result, error } = await supabase
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
  
  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  
  const toggleTaskComplete = async (id: string) => {
    // Get current task
    const { data: task } = await supabase
      .from('tasks')
      .select('completed')
      .eq('id', id)
      .single();
    
    // Toggle
    const { data: result, error } = await supabase
      .from('tasks')
      .update({
        completed: !task?.completed,
        completed_at: !task?.completed ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
  
  // Study Sessions
  const getStudySessions = async (userId: string, filters?: any) => {
    let query = supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId);
    
    if (filters?.module_code) {
      query = query.eq('module_code', filters.module_code);
    }
    
    if (filters?.start_date) {
      query = query.gte('start_time', filters.start_date);
    }
    
    if (filters?.end_date) {
      query = query.lte('start_time', filters.end_date);
    }
    
    const { data, error } = await query.order('start_time', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  const createStudySession = async (data: Partial<StudySession>) => {
    const { data: result, error } = await supabase
      .from('study_sessions')
      .insert({ ...data, user_id: user?.id })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
  
  const updateStudySession = async (id: string, data: Partial<StudySession>) => {
    const { data: result, error } = await supabase
      .from('study_sessions')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
  
  const endStudySession = async (id: string) => {
    const { data: result, error } = await supabase
      .from('study_sessions')
      .update({ end_time: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
  
  // Resources
  const getResources = async (moduleCode?: string) => {
    let query = supabase
      .from('resources')
      .select('*')
      .eq('user_id', user?.id);
    
    if (moduleCode) {
      query = query.eq('module_code', moduleCode);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  const createResource = async (data: Partial<Resource>) => {
    const { data: result, error } = await supabase
      .from('resources')
      .insert({ ...data, user_id: user?.id })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
  
  const uploadResourceFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('resources')
      .upload(path, file);
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('resources')
      .getPublicUrl(path);
    
    return publicUrl;
  }
  
  // Degree Program
  const getDegreeProgram = async (userId: string) => {
    const { data, error } = await supabase
      .from('degree_programs')
      .select(`
        *,
        years:degree_years(
          *,
          modules:year_modules(*)
        )
      `)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  const createDegreeProgram = async (data: Partial<DegreeProgram>) => {
    const { data: result, error } = await supabase
      .from('degree_programs')
      .insert({ ...data, user_id: user?.id })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
  
  // Alerts
  const getAlerts = async (userId: string, dismissed: boolean = false) => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('dismissed', dismissed)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  const dismissAlert = async (id: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({ dismissed: true, dismissed_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }
  
  // Transactions
  const getTransactions = async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  const createTransaction = async (data: Partial<Transaction>) => {
    const { data: result, error } = await supabase
      .from('transactions')
      .insert({ ...data, user_id: user?.id })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
  
  // User Preferences
  const getUserPreferences = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  const updateUserPreferences = async (userId: string, data: Partial<UserPreferences>) => {
    const { data: result, error } = await supabase
      .from('user_preferences')
      .upsert({ ...data, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }
  
  return {
    // Module Attempts
    getModuleAttempts,
    getModuleAttempt,
    createModuleAttempt,
    updateModuleAttempt,
    deleteModuleAttempt,
    
    // Assessments
    getAssessments,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    
    // Tasks
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    
    // Study Sessions
    getStudySessions,
    createStudySession,
    updateStudySession,
    endStudySession,
    
    // Resources
    getResources,
    createResource,
    uploadResourceFile,
    
    // Degree Program
    getDegreeProgram,
    createDegreeProgram,
    
    // Alerts
    getAlerts,
    dismissAlert,
    
    // Transactions
    getTransactions,
    createTransaction,
    
    // User Preferences
    getUserPreferences,
    updateUserPreferences
  };
}
```

**useAuth.ts**
```typescript
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabaseClient();
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }
  
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }
  
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
  
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }
  
  return { user, loading, signIn, signUp, signOut, resetPassword };
}
```

**useCalculations.ts**
```typescript
export function useCalculations() {
  const calculateCWA = (modules: ModuleAttempt[]) => {
    // Filter: only passed modules (final_grade >= 50)
    // Exclude: special codes (988, 997, 998)
    const validModules = modules.filter(
      m => m.status === 'passed' && 
           m.final_grade !== null && 
           m.final_grade >= 50 &&
           ![988, 997, 998].includes(m.final_grade)
    );
    
    if (validModules.length === 0) return 0;
    
    // Formula: SUM(grade × credits) / SUM(credits)
    const totalWeightedGrade = validModules.reduce(
      (sum, m) => sum + (m.final_grade! * m.credits),
      0
    );
    
    const totalCredits = validModules.reduce(
      (sum, m) => sum + m.credits,
      0
    );
    
    return totalCredits > 0 ? totalWeightedGrade / totalCredits : 0;
  }
  
  const calculateCurrentGrade = (assessments: Assessment[]) => {
    // Sum: mark × (weight/100) for graded assessments
    const gradedAssessments = assessments.filter(
      a => a.status === 'graded' && a.mark !== null
    );
    
    if (gradedAssessments.length === 0) return null;
    
    const currentGrade = gradedAssessments.reduce(
      (sum, a) => sum + (a.mark! * a.weight / 100),
      0
    );
    
    return currentGrade;
  }
  
  const calculateProjectedGrade = (
    assessments: Assessment[], 
    targetMarks: Record<string, number>
  ) => {
    // Current graded + projected future assessments
    let projectedGrade = 0;
    
    assessments.forEach(assessment => {
      if (assessment.status === 'graded' && assessment.mark !== null) {
        projectedGrade += assessment.mark * assessment.weight / 100;
      } else {
        const targetMark = targetMarks[assessment.id] || 0;
        projectedGrade += targetMark * assessment.weight / 100;
      }
    });
    
    return projectedGrade;
  }
  
  const calculateRequiredGrade = (assessments: Assessment[], targetFinal: number) => {
    // Given target final, calculate needed grade on remaining
    const gradedAssessments = assessments.filter(a => a.status === 'graded');
    const remainingAssessments = assessments.filter(a => a.status !== 'graded');
    
    if (remainingAssessments.length === 0) return null;
    
    const currentWeightedGrade = gradedAssessments.reduce(
      (sum, a) => sum + (a.mark! * a.weight / 100),
      0
    );
    
    const remainingWeight = remainingAssessments.reduce(
      (sum, a) => sum + a.weight,
      0
    );
    
    if (remainingWeight === 0) return null;
    
    const neededWeightedGrade = targetFinal - currentWeightedGrade;
    const requiredAverage = (neededWeightedGrade / remainingWeight) * 100;
    
    return requiredAverage;
  }
  
  const calculateTermAverage = (modules: ModuleAttempt[], term: string) => {
    const termModules = modules.filter(m => m.semester === term && m.final_grade !== null);
    
    if (termModules.length === 0) return 0;
    
    const average = termModules.reduce((sum, m) => sum + m.final_grade!, 0) / termModules.length;
    return average;
  }
  
  const checkPrerequisites = (
    required: string[], 
    completed: ModuleAttempt[]
  ): Record<string, boolean> => {
    const result: Record<string, boolean> = {};
    
    required.forEach(prereq => {
      const prereqModule = completed.find(
        m => m.module_code === prereq && m.status === 'passed'
      );
      result[prereq] = !!prereqModule;
    });
    
    return result;
  }
  
  const projectGraduation = (
    completedModules: ModuleAttempt[],
    degreeProgram: DegreeProgram,
    averageGradeAssumption: number = 60
  ) => {
    const completedCredits = completedModules
      .filter(m => m.status === 'passed')
      .reduce((sum, m) => sum + m.credits, 0);
    
    const remainingCredits = degreeProgram.total_credits_required - completedCredits;
    
    // Assume 48 credits per semester
    const semestersRemaining = Math.ceil(remainingCredits / 48);
    const yearsRemaining = Math.ceil(semestersRemaining / 2);
    
    // Project final CWA
    const currentCWA = calculateCWA(completedModules);
    const totalWeightedGrade = (currentCWA * completedCredits) + (averageGradeAssumption * remainingCredits);
    const projectedCWA = totalWeightedGrade / degreeProgram.total_credits_required;
    
    // Calculate graduation date
    const currentYear = new Date().getFullYear();
    const graduationYear = currentYear + yearsRemaining;
    
    return {
      yearsRemaining,
      semestersRemaining,
      projectedCWA,
      graduationYear,
      remainingCredits
    };
  }
  
  return {
    calculateCWA,
    calculateCurrentGrade,
    calculateProjectedGrade,
    calculateRequiredGrade,
    calculateTermAverage,
    checkPrerequisites,
    projectGraduation
  };
}
```

**useRealtime.ts**
```typescript
export function useRealtime<T>(
  table: string,
  filter?: { column: string; value: any }
) {
  const [data, setData] = useState<T[]>([]);
  const supabase = useSupabaseClient();
  
  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      let query = supabase.from(table).select('*');
      
      if (filter) {
        query = query.eq(filter.column, filter.value);
      }
      
      const { data: initialData } = await query;
      if (initialData) setData(initialData as T[]);
    };
    
    fetchData();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: filter ? `${filter.column}=eq.${filter.value}` : undefined
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(current => [...current, payload.new as T]);
          } else if (payload.eventType === 'UPDATE') {
            setData(current =>
              current.map(item =>
                (item as any).id === (payload.new as any).id
                  ? (payload.new as T)
                  : item
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setData(current =>
              current.filter(item => (item as any).id !== (payload.old as any).id)
            );
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter?.column, filter?.value]);
  
  return data;
}
```

**useNotifications.ts**
```typescript
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);
  
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    const permission = await Notification.requestPermission();
    setPermission(permission);
    return permission === 'granted';
  }
  
  const sendNotification = (
    title: string,
    body: string,
    options?: NotificationOptions
  ) => {
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }
    
    const notification = new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      ...options
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    return notification;
  }
  
  const scheduleNotification = (
    date: Date,
    title: string,
    body: string
  ) => {
    const now = new Date();
    const delay = date.getTime() - now.getTime();
    
    if (delay < 0) {
      console.log('Scheduled time is in the past');
      return;
    }
    
    setTimeout(() => {
      sendNotification(title, body);
    }, delay);
  }
  
  return {
    permission,
    requestPermission,
    sendNotification,
    scheduleNotification
  };
}
```

---

### 5.2 Utility Functions

**lib/utils/calculations.ts**
```typescript
import { ModuleAttempt, Assessment, DegreeProgram } from '@/lib/types';

// CWA Calculation
export function calculateCWA(modules: ModuleAttempt[]): number {
  // Filter: only passed modules (final_grade >= 50)
  // Exclude: special codes (988, 997, 998)
  const validModules = modules.filter(
    m => m.status === 'passed' && 
         m.final_grade !== null && 
         m.final_grade >= 50 &&
         ![988, 997, 998].includes(m.final_grade)
  );
  
  if (validModules.length === 0) return 0;
  
  // Formula: SUM(grade × credits) / SUM(credits)
  const totalWeightedGrade = validModules.reduce(
    (sum, m) => sum + (m.final_grade! * m.credits),
    0
  );
  
  const totalCredits = validModules.reduce(
    (sum, m) => sum + m.credits,
    0
  );
  
  return totalCredits > 0 ? totalWeightedGrade / totalCredits : 0;
}

// Grade Calculations
export function calculateCurrentGrade(assessments: Assessment[]): number | null {
  const gradedAssessments = assessments.filter(
    a => a.status === 'graded' && a.mark !== null
  );
  
  if (gradedAssessments.length === 0) return null;
  
  return gradedAssessments.reduce(
    (sum, a) => sum + (a.mark! * a.weight / 100),
    0
  );
}

export function calculateProjectedGrade(
  assessments: Assessment[], 
  targetMarks: Record<string, number>
): number {
  let proj