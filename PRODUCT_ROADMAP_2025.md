# 🎓 UniLife: One Year to Amazing
## Product-First Roadmap (No Monetization)

**Strategy:** Build the best product possible, grow organically through word-of-mouth on SA campuses, monetize later.

---

## 🎯 **Core Philosophy**

1. **Product > Revenue** - Make it so good people can't live without it
2. **Word-of-Mouth Growth** - Features that make students want to share
3. **Campus-First** - Built specifically for SA universities
4. **Student-Led** - Features students actually need, not what we think they need
5. **Free Forever** - No paywalls, no limits, just value

---

## 📅 **Quarter 1: Foundation & Core Features** (Months 1-3)

### **Month 1: Polish & Essential Features**

#### **Week 1-2: User Experience Polish**
- [ ] **Empty States** - Beautiful, helpful messages when no data
- [ ] **Loading States** - Skeleton screens, smooth transitions
- [ ] **Error Handling** - Friendly error messages, recovery flows
- [ ] **Mobile Responsiveness** - Perfect mobile experience
- [ ] **Accessibility** - Screen reader support, keyboard navigation
- [ ] **Performance** - Fast load times, smooth animations

#### **Week 3-4: Essential Features**
- [ ] **Password Reset Flow** - Forgot password functionality
- [ ] **Email Verification** - Verify accounts on signup
- [ ] **Profile Management** - Edit name, email, avatar, university
- [ ] **Data Export** - Export all data as JSON/CSV
- [ ] **Data Import** - Import from CSV/spreadsheet
- [ ] **Search Functionality** - Global search across modules, tasks, finances

**Goal:** Make the MVP feel polished and professional

---

### **Month 2: Assessment Tracking (The Game Changer)**

#### **Week 5-6: Assessment Management**
- [ ] **Add Assessments to Modules**
  - Name, type (assignment/test/exam)
  - Due date, weight (percentage)
  - Max marks, achieved marks
  - Status (not started, in progress, completed)
- [ ] **Weighted Grade Calculation**
  - Auto-calculate module grade from assessments
  - Visual weight breakdown (pie chart)
  - Real-time grade updates
- [ ] **Assessment Dashboard**
  - Upcoming assessments
  - Overdue assessments
  - Completed assessments
  - Grade distribution

#### **Week 7-8: Grade Calculators**
- [ ] **"What Grade Do I Need?" Calculator**
  - Input target module grade
  - Shows required grade on remaining assessments
  - "You need 65% on the exam to get 60% overall"
- [ ] **"What If?" Scenario Planner**
  - Test different grade outcomes
  - "If I get 70% on exam, my final grade will be..."
  - Visual scenarios
- [ ] **Minimum Grade Calculator**
  - "What's the minimum I need to pass?"
  - Shows pass/fail scenarios

**Why This Matters:** This is THE feature students need. Word-of-mouth gold.

**Database Schema:**
```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('assignment', 'test', 'exam', 'project')),
  weight DECIMAL(5,2) NOT NULL, -- percentage of module
  max_marks DECIMAL(5,2),
  achieved_marks DECIMAL(5,2),
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Goal:** Students can't imagine tracking grades without this

---

### **Month 3: Task Management 2.0**

#### **Week 9-10: Advanced Task Features**
- [ ] **Subtasks/Checklists** - Break tasks into steps
- [ ] **Task Dependencies** - "Task B requires Task A first"
- [ ] **Recurring Tasks** - Weekly problem sets, etc.
- [ ] **Task Templates** - Pre-made task structures
- [ ] **Bulk Actions** - Select multiple, mark complete, delete
- [ ] **Task Attachments** - Upload files, images, links
- [ ] **Task Comments** - Notes on tasks

#### **Week 11-12: Task Intelligence**
- [ ] **Smart Prioritization** - AI suggests what's most urgent
- [ ] **Time Estimates** - How long will this take?
- [ ] **Task Scheduling** - Drag tasks to calendar
- [ ] **Task Analytics** - Completion rate, average time, etc.
- [ ] **Task Search** - Find tasks by module, date, status

**Goal:** Best task management system for students

---

## 📅 **Quarter 2: Mobile & Study Tools** (Months 4-6)

### **Month 4: Mobile App (iOS First)**

#### **Week 13-14: React Native Setup**
- [ ] Initialize React Native project
- [ ] Supabase integration
- [ ] Authentication flow
- [ ] Data sync with web
- [ ] Navigation structure

#### **Week 15-16: Core Mobile Features**
- [ ] **Dashboard** - Quick stats, upcoming tasks
- [ ] **Task List** - Swipe to complete, quick add
- [ ] **Module Overview** - Grades, assessments
- [ ] **Quick Actions** - Add task, log expense, check grade
- [ ] **Offline Support** - Work without internet
- [ ] **Push Notifications** - Deadline reminders

**Tech Stack:**
```bash
npx react-native init UniLifeMobile
npm install @supabase/supabase-js
npm install @react-navigation/native
npm install react-native-paper
npm install @react-native-async-storage/async-storage
```

**Goal:** Students use mobile app daily

---

### **Month 5: Study Timer & Scheduling**

#### **Week 17-18: Study Timer**
- [ ] **Pomodoro Timer** - 25/5 min cycles
- [ ] **Custom Timer** - Set your own intervals
- [ ] **Study Session Tracking** - Track time per module
- [ ] **Break Reminders** - Smart break suggestions
- [ ] **Session History** - See your study patterns
- [ ] **Focus Mode** - Block distractions

#### **Week 19-20: Study Scheduling**
- [ ] **Weekly Calendar** - Visual time blocking
- [ ] **Drag & Drop** - Schedule study sessions
- [ ] **Recurring Sessions** - "Study Physics every Tuesday 2pm"
- [ ] **Module Time Allocation** - "I need 10 hours/week for PHY114"
- [ ] **Study Goals** - "Study 20 hours this week"
- [ ] **Study Analytics** - Time spent, productivity, streaks

**Components:**
```
components/study/
  ├── PomodoroTimer.tsx
  ├── WeeklyCalendar.tsx
  ├── TimeBlock.tsx
  ├── StudySessionForm.tsx
  ├── StudyAnalytics.tsx
  └── FocusMode.tsx
```

**Goal:** Students plan their study time with UniLife

---

### **Month 6: Advanced Analytics**

#### **Week 21-22: Performance Analytics**
- [ ] **Grade Trend Charts** - See improvement over time
- [ ] **Department Breakdown** - How am I doing in Physics vs Math?
- [ ] **Semester Comparison** - Compare performance across terms
- [ ] **Module Difficulty Analysis** - Which modules are hardest?
- [ ] **Study Time vs Performance** - Correlation analysis
- [ ] **Performance Heatmap** - Visual performance by module

#### **Week 23-24: Predictive Analytics**
- [ ] **Graduation Projection** - "You're on track to graduate in 3.5 years"
- [ ] **Risk Assessment** - "PHY114 is at risk - focus here"
- [ ] **Grade Prediction** - "If you maintain current pace, you'll get 65%"
- [ ] **Recommended Actions** - "Focus on these 3 modules this week"
- [ ] **Study Pattern Analysis** - "You're most productive on Tuesdays"

**Libraries:**
```bash
npm install recharts
# or
npm install @nivo/core @nivo/line @nivo/pie @nivo/heatmap
```

**Goal:** Students understand their academic performance deeply

---

## 📅 **Quarter 3: Degree Planning & Integrations** (Months 7-9)

### **Month 7: Degree Roadmap**

#### **Week 25-26: Prerequisite Tracking**
- [ ] **Add Prerequisites** - Link modules (PHY114 requires WTW114)
- [ ] **Prerequisite Graph** - Visual flow of requirements
- [ ] **"Can I Take This?" Checker** - Validates prerequisites
- [ ] **Optimal Course Sequence** - Suggests best order
- [ ] **Failed Module Impact** - "If you fail X, you can't take Y next year"

#### **Week 27-28: Full Degree Planning**
- [ ] **Degree Roadmap** - Visual 3-4 year plan
- [ ] **Year-by-Year Breakdown** - Plan each year
- [ ] **Credit Tracking** - Progress toward degree completion
- [ ] **Graduation Timeline** - "You'll graduate in June 2027"
- [ ] **"What If?" Scenarios** - Test different paths
- [ ] **Module Recommendations** - "You should take these next semester"

**Database:**
```sql
CREATE TABLE prerequisites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  prerequisite_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE degree_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  degree_name TEXT NOT NULL,
  total_credits INTEGER NOT NULL,
  required_modules JSONB, -- Array of module codes
  elective_credits INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Goal:** Students plan their entire degree with UniLife

---

### **Month 8: LMS & Calendar Integrations**

#### **Week 29-30: LMS Integration**
- [ ] **Canvas Integration** - Connect Canvas account
- [ ] **Blackboard Integration** - Connect Blackboard
- [ ] **Moodle Integration** - Connect Moodle
- [ ] **Auto-Import Grades** - Sync grades from LMS
- [ ] **Auto-Import Assignments** - Sync tasks/assessments
- [ ] **Two-Way Sync** - Update both systems

**Implementation:**
```typescript
// lib/integrations/canvas.ts
export const connectCanvas = async (apiKey: string, userId: string) => {
  // Fetch courses
  // Map to UniLife modules
  // Sync assignments to tasks
  // Sync grades to assessments
};

// lib/integrations/blackboard.ts
// Similar implementation
```

#### **Week 31-32: Calendar Sync**
- [ ] **Google Calendar** - Two-way sync
- [ ] **Outlook/Exchange** - Sync with Outlook
- [ ] **Tasks → Calendar** - Tasks appear in calendar
- [ ] **Study Blocks → Calendar** - Scheduled study time
- [ ] **Event Reminders** - Calendar notifications
- [ ] **Exam Schedule** - Import exam dates

**Goal:** UniLife becomes the central hub for academic life

---

### **Month 9: Academic Calendar & Deadlines**

#### **Week 33-34: University Calendar**
- [ ] **Import University Calendar** - SA university calendars
- [ ] **Important Dates** - Registration, exams, holidays
- [ ] **Drop/Add Deadlines** - Course registration deadlines
- [ ] **Exam Schedule** - Import exam dates
- [ ] **Custom Events** - Add personal academic events
- [ ] **Deadline Alerts** - Smart reminders

#### **Week 35-36: Smart Notifications**
- [ ] **Deadline Reminders** - 7 days, 1 day, 1 hour before
- [ ] **Grade Alerts** - "Your PHY114 grade was updated"
- [ ] **Study Reminders** - "Time for your Physics study session"
- [ ] **Weekly Digest** - Summary of week ahead
- [ ] **Risk Alerts** - "PHY114 is at risk - focus here"
- [ ] **Achievement Notifications** - "You studied 20 hours this week!"

**Goal:** Students never miss important deadlines

---

## 📅 **Quarter 4: Social & Advanced Features** (Months 10-12)

### **Month 10: Study Groups & Collaboration**

#### **Week 37-38: Study Groups**
- [ ] **Create/Join Groups** - Study groups by module
- [ ] **Shared Notes** - Collaborative note-taking
- [ ] **Group Tasks** - Assign tasks to group members
- [ ] **Group Calendar** - Shared study schedule
- [ ] **Group Chat** - In-app messaging
- [ ] **Resource Sharing** - Share files, links, notes

#### **Week 39-40: Peer Features**
- [ ] **Find Classmates** - Discover students in same modules
- [ ] **Compare Progress** - Anonymous progress comparison
- [ ] **Study Buddy Matching** - Find study partners
- [ ] **Group Project Tracker** - Track team projects
- [ ] **Peer Support** - Help each other succeed

**Database:**
```sql
CREATE TABLE study_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  module_code TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP DEFAULT NOW()
);
```

**Goal:** Students form study communities on UniLife

---

### **Month 11: Community & Resources**

#### **Week 41-42: Module Resources**
- [ ] **Resource Library** - Upload/download study materials
- [ ] **Module Notes** - Shared notes per module
- [ ] **Past Papers** - Upload past exam papers
- [ ] **Study Guides** - Community-created guides
- [ ] **Video Links** - Educational videos
- [ ] **Textbook Resources** - Links to textbooks

#### **Week 43-44: Community Features**
- [ ] **Module Reviews** - Rate modules, share experiences
- [ ] **Professor Ratings** - Rate professors (anonymous)
- [ ] **Study Tips** - Share tips with community
- [ ] **Course Difficulty Database** - Community ratings
- [ ] **Grade Distribution** - Anonymous grade sharing
- [ ] **Q&A Forum** - Ask questions, get help

**Goal:** UniLife becomes the go-to resource hub for SA students

---

### **Month 12: AI & Polish**

#### **Week 45-46: AI Study Assistant**
- [ ] **Claude/OpenAI Integration** - AI-powered features
- [ ] **Study Recommendations** - "What should I focus on?"
- [ ] **Personalized Study Plans** - AI creates weekly schedule
- [ ] **Material Summarization** - AI summarizes notes
- [ ] **Quiz Generation** - AI creates practice questions
- [ ] **Flashcard Generation** - Auto-generate flashcards

#### **Week 47-48: Final Polish**
- [ ] **Performance Optimization** - Fast, smooth, reliable
- [ ] **Bug Fixes** - Fix all known issues
- [ ] **UI/UX Refinement** - Polish every screen
- [ ] **Accessibility Audit** - Full accessibility compliance
- [ ] **Security Audit** - Ensure data security
- [ ] **Documentation** - User guides, help docs

**Goal:** UniLife is the best academic management tool in SA

---

## 🎯 **Word-of-Mouth Growth Features**

### **Features That Drive Sharing:**

1. **"Share My Progress"** - Students share achievements
2. **Referral System** - "Invite friends, get badges"
3. **Campus Leaderboards** - Opt-in progress comparison
4. **Achievement Badges** - Gamification, shareable
5. **Study Streaks** - "I've studied 30 days in a row!"
6. **Grade Celebrations** - "You got 80%! Share it!"
7. **Campus Challenges** - "Study 100 hours this month"
8. **Social Proof** - "500 students at UP use UniLife"

### **Campus-Specific Features:**

1. **University Selection** - Choose your university
2. **Campus-Specific Modules** - Pre-loaded module database
3. **Campus Events** - University-specific calendar
4. **Campus Groups** - University-specific study groups
5. **Campus Stats** - "Average grade at UP: 65%"
6. **Campus Resources** - University-specific resources

---

## 📊 **Success Metrics (No Revenue Focus)**

### **User Metrics:**
- **Active Users** - Daily, weekly, monthly active users
- **Retention** - % of users who return after 7/30/90 days
- **Engagement** - Tasks created, modules tracked, time in app
- **Growth Rate** - Month-over-month user growth
- **Referral Rate** - % of users who invite friends

### **Product Metrics:**
- **Feature Adoption** - Which features are most used?
- **Time to Value** - How quickly do users see value?
- **Support Tickets** - Track issues, improve UX
- **User Feedback** - Regular surveys, feature requests
- **App Store Ratings** - Target 4.5+ stars

### **Campus Metrics:**
- **Campus Penetration** - % of students at each university
- **Campus Growth** - Which campuses grow fastest?
- **Campus Engagement** - Most active campuses
- **Campus Communities** - Study groups per campus

---

## 🚀 **Growth Strategy**

### **Month 1-3: Founder-Led Growth**
- [ ] Launch at your university (UP/Tuks)
- [ ] Get 50-100 early users
- [ ] Gather feedback, iterate
- [ ] Build core features

### **Month 4-6: Campus Ambassadors**
- [ ] Recruit 5-10 campus ambassadors
- [ ] Each ambassador gets 20-50 users
- [ ] Provide swag, recognition
- [ ] Create ambassador program

### **Month 7-9: Organic Growth**
- [ ] Word-of-mouth takes over
- [ ] Social media presence
- [ ] Student blog posts, reviews
- [ ] University partnerships (informal)

### **Month 10-12: Scale**
- [ ] Expand to 5-10 SA universities
- [ ] Campus events, demos
- [ ] Student organization partnerships
- [ ] Media coverage (student publications)

---

## 🎯 **Feature Priority Matrix**

### **Must Have (Build First):**
1. ✅ Assessment Tracking
2. ✅ Grade Calculators
3. ✅ Mobile App
4. ✅ Study Timer
5. ✅ Advanced Analytics

### **Should Have (Build Second):**
6. ✅ Degree Roadmap
7. ✅ LMS Integration
8. ✅ Calendar Sync
9. ✅ Study Groups
10. ✅ Smart Notifications

### **Nice to Have (Build Third):**
11. ✅ AI Assistant
12. ✅ Community Features
13. ✅ Resource Library
14. ✅ Social Features
15. ✅ Gamification

---

## 📝 **Monthly Focus**

| Month | Primary Focus | Secondary Focus | Target Users |
|-------|--------------|-----------------|-------------|
| 1 | Polish MVP | Assessment Tracking | 50 |
| 2 | Assessment Tracking | Grade Calculators | 100 |
| 3 | Task Management 2.0 | Mobile Prep | 200 |
| 4 | Mobile App (iOS) | Push Notifications | 500 |
| 5 | Study Timer | Study Scheduling | 1,000 |
| 6 | Advanced Analytics | Performance Charts | 2,000 |
| 7 | Degree Roadmap | Prerequisites | 3,000 |
| 8 | LMS Integration | Calendar Sync | 5,000 |
| 9 | Academic Calendar | Smart Notifications | 7,000 |
| 10 | Study Groups | Collaboration | 10,000 |
| 11 | Community Features | Resources | 15,000 |
| 12 | AI Features | Final Polish | 20,000 |

---

## 💡 **Key Principles**

1. **Build in Public** - Share progress, get feedback
2. **Student-First** - Every feature serves students
3. **Fast Iteration** - Ship features weekly
4. **Listen to Users** - Feature requests drive roadmap
5. **Quality > Quantity** - Better to have 10 great features than 100 mediocre ones
6. **Free Forever** - No paywalls, no limits
7. **Campus-Focused** - Built for SA universities
8. **Word-of-Mouth** - Features that make students want to share

---

## 🎯 **Success Definition (End of Year)**

### **Product:**
- ✅ Best academic management tool in SA
- ✅ 20,000+ active users
- ✅ 4.5+ star rating
- ✅ Used daily by students
- ✅ Word-of-mouth growth

### **Features:**
- ✅ Complete assessment tracking
- ✅ Mobile apps (iOS + Android)
- ✅ Study tools (timer, scheduling)
- ✅ Degree planning
- ✅ LMS integrations
- ✅ Community features
- ✅ AI assistant

### **Growth:**
- ✅ 10+ SA universities
- ✅ Campus ambassadors program
- ✅ Organic growth (word-of-mouth)
- ✅ Strong retention (70%+ monthly)
- ✅ High engagement (daily active users)

---

## 🚀 **Next Steps (This Week)**

1. **Review this roadmap** - Adjust priorities based on your vision
2. **Start Month 1** - Polish MVP, build assessment tracking
3. **Set up user feedback** - Create feedback form, track requests
4. **Launch at your campus** - Get first 50 users
5. **Build in public** - Share progress on social media

---

**Remember:** You're building something students will love and share. Focus on making it amazing, and the growth will follow.

**Let's make UniLife the best academic tool in South Africa! 🚀**

