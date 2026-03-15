# App/Page.tsx Refactoring Plan

## Current State
- **1,606 lines** of code in a single file
- Monolithic component with inline sub-components
- Multiple responsibilities mixed together

## Target Structure

### 1. Extract Page Components (Already Partially Done)
Move these inline components to their existing files:
- ✅ DashboardPage → Already exists in `components/pages/DashboardPage.tsx`
- ✅ TasksPage → Already exists in `components/pages/TasksPage.tsx`
- ✅ FinancesPage → Already exists in `components/pages/FinancesPage.tsx`
- ✅ AnalyticsPage → Already exists in `components/pages/AnalyticsPage.tsx`
- ✅ SettingsPage → Already exists in `components/pages/SettingsPage.tsx`
- ⚠️ Academic page logic → Currently mixed with RoadmapPage

### 2. Extract Form Components
Create separate files for inline forms:
- `components/forms/TaskForm.tsx` (already exists - use it!)
- `components/forms/TransactionForm.tsx` (already exists - use it!)
- Modal wrappers can stay in page.tsx for now

### 3. Extract Utility Functions
Move to `lib/utils/`:
- `getDaysInMonth()` → `lib/utils/calendar.ts`
- `getEventsForDate()` → `lib/utils/calendar.ts`
- `getThisWeekTasks()` → `lib/utils/tasks.ts`
- `exportData()` → `lib/utils/dataExport.ts`

### 4. Simplify Main Component
The app/page.tsx should only:
- Handle authentication/loading
- Manage navigation state
- Render the correct page component
- ~100-200 lines max

## Implementation Priority

### Phase 1: Use Existing Page Components (HIGH IMPACT)
Replace inline DashboardPage with import from components/pages/

### Phase 2: Extract Utilities (MEDIUM IMPACT)
Move helper functions to utility files

### Phase 3: Use Existing Form Components (MEDIUM IMPACT)
Replace inline forms with existing form components

### Phase 4: Clean Architecture (FUTURE)
- Add proper error boundaries
- Implement loading states
- Add suspense boundaries
