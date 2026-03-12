# 🚀 UniLife Premium: The Complete Ladder

**From MVP to Premium App - Step by Step**

---

## 📊 **Current State (Rung 0)**
✅ Basic module tracking  
✅ Task management  
✅ Financial tracking  
✅ Analytics dashboard  
✅ Real-time sync  
✅ Authentication  

**Revenue:** R0  
**Users:** You (founder)  
**Premium Features:** 0  

---

## 🎯 **RUNG 1: Foundation for Premium** (Weeks 1-4)

### **Goal:** Build infrastructure to support premium features

### **Tasks:**

#### **1.1 Payment System Integration** (Week 1-2)
- [ ] Install Stripe or PayFast (SA-friendly)
- [ ] Create subscription plans table in Supabase
- [ ] Build subscription management UI
- [ ] Add payment form component
- [ ] Test payment flow end-to-end

**Tech Stack:**
```typescript
// New dependencies
- stripe (or @payfast/payfast)
- @stripe/stripe-js
- @stripe/react-stripe-js
```

**Database Schema:**
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  plan_id TEXT, -- 'free', 'premium'
  status TEXT, -- 'active', 'canceled', 'past_due'
  current_period_end TIMESTAMP,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **1.2 Feature Gating System** (Week 2-3)
- [ ] Create `useSubscription` hook
- [ ] Add premium checks throughout app
- [ ] Build "Upgrade" prompts/CTAs
- [ ] Create pricing page
- [ ] Add subscription status to user profile

**Implementation:**
```typescript
// hooks/useSubscription.ts
export const useSubscription = () => {
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
      return data;
    }
  });

  const isPremium = subscription?.plan_id === 'premium' && 
                    subscription?.status === 'active';
  
  return { subscription, isPremium };
};
```

#### **1.3 User Profile & Settings** (Week 3-4)
- [ ] Profile management page
- [ ] Subscription management page
- [ ] Billing history
- [ ] Cancel subscription flow
- [ ] Email verification (already have auth)

**Deliverables:**
- ✅ Payment system working
- ✅ Feature gating infrastructure
- ✅ User can subscribe/cancel
- ✅ Premium status tracked

**Revenue Target:** R0 (infrastructure only)

---

## 🎯 **RUNG 2: First Premium Feature** (Weeks 5-8)

### **Goal:** Launch first paid feature - Assessment Tracking

### **Why This First?**
- High value (students need this)
- Already have Assessment type defined
- Differentiates from free tier
- Clear upgrade path

### **Tasks:**

#### **2.1 Assessment Management** (Week 5-6)
- [ ] Build AssessmentForm component
- [ ] Add assessments to module detail page
- [ ] Weighted grade calculation
- [ ] Assessment CRUD operations
- [ ] Link assessments to tasks

**Features:**
- Add/edit/delete assessments per module
- Set weight (e.g., Assignment 1 = 20%, Exam = 50%)
- Auto-calculate module grade from assessments
- Visual weight breakdown (pie chart)
- "What grade do I need?" calculator

**UI Components:**
```
components/assessments/
  ├── AssessmentCard.tsx
  ├── AssessmentForm.tsx
  ├── WeightPieChart.tsx
  └── GradeCalculator.tsx
```

#### **2.2 Grade Calculators** (Week 6-7)
- [ ] "What grade do I need?" calculator
- [ ] "What if I get X?" scenario planner
- [ ] Minimum grade calculator
- [ ] Grade prediction based on current assessments

**Example:**
```
Current: 65% (from 2 assessments worth 40%)
Remaining: 60% of module
Need: 60% overall
Required: (60 - 65*0.4) / 0.6 = 56.67%
```

#### **2.3 Database Schema** (Week 7)
```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES modules(id),
  name TEXT NOT NULL,
  type TEXT, -- 'assignment', 'test', 'exam'
  weight DECIMAL(5,2), -- percentage
  max_marks DECIMAL(5,2),
  achieved_marks DECIMAL(5,2),
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **2.4 Feature Gate** (Week 8)
- [ ] Lock assessment features behind premium
- [ ] Show "Upgrade to track assessments" prompt
- [ ] Free tier: Can see but not add assessments
- [ ] Premium tier: Full assessment management

**Deliverables:**
- ✅ Assessment tracking working
- ✅ Grade calculators functional
- ✅ Premium-gated
- ✅ Ready for beta testers

**Revenue Target:** Get 5-10 paying customers (R500-R1,000/month)

---

## 🎯 **RUNG 3: Mobile Foundation** (Weeks 9-12)

### **Goal:** Launch mobile app (iOS first, then Android)

### **Why Mobile?**
- 78% of students use mobile primarily
- Better for on-the-go task management
- Push notifications for deadlines
- Native feel = better UX

### **Tasks:**

#### **3.1 React Native Setup** (Week 9)
- [ ] Initialize React Native project
- [ ] Set up Supabase client for mobile
- [ ] Implement authentication flow
- [ ] Basic navigation structure
- [ ] Sync with web app data

**Tech Stack:**
```bash
npx react-native init UniLifeMobile
npm install @supabase/supabase-js
npm install @react-navigation/native
npm install react-native-paper # UI library
```

#### **3.2 Core Mobile Features** (Week 10-11)
- [ ] Dashboard (quick stats)
- [ ] Task list (swipe to complete)
- [ ] Module overview
- [ ] Add task (quick entry)
- [ ] Push notifications setup

**Key Screens:**
```
screens/
  ├── Dashboard.tsx
  ├── Tasks.tsx
  ├── Modules.tsx
  ├── Analytics.tsx
  └── Settings.tsx
```

#### **3.3 Push Notifications** (Week 11-12)
- [ ] Set up Firebase Cloud Messaging (FCM)
- [ ] Deadline reminders (24h, 1h before)
- [ ] Grade alerts (when assessment graded)
- [ ] Weekly progress summaries
- [ ] Premium: Custom notification settings

**Premium Feature:**
- Free: Basic deadline reminders
- Premium: Customizable notifications, smart alerts

#### **3.4 App Store Submission** (Week 12)
- [ ] iOS App Store setup
- [ ] App Store Connect configuration
- [ ] Screenshots, descriptions
- [ ] Submit for review
- [ ] Launch!

**Deliverables:**
- ✅ iOS app live
- ✅ Push notifications working
- ✅ Data sync with web
- ✅ Premium features accessible

**Revenue Target:** 20-30 paying customers (R2,000-R3,000/month)

---

## 🎯 **RUNG 4: Advanced Analytics** (Weeks 13-16)

### **Goal:** Build premium analytics that justify R99/month

### **Tasks:**

#### **4.1 Performance Charts** (Week 13-14)
- [ ] Grade trend line chart (over time)
- [ ] Department breakdown (pie chart)
- [ ] Semester comparison (bar chart)
- [ ] Module difficulty analysis
- [ ] Study time vs performance correlation

**Libraries:**
```bash
npm install recharts
# or
npm install @nivo/core @nivo/line @nivo/pie
```

**Components:**
```
components/analytics/
  ├── GradeTrendChart.tsx
  ├── DepartmentBreakdown.tsx
  ├── SemesterComparison.tsx
  └── PerformanceHeatmap.tsx
```

#### **4.2 Predictive Analytics** (Week 14-15)
- [ ] Graduation projection (based on current pace)
- [ ] Risk assessment (modules at risk)
- [ ] Recommended actions ("Focus on PHY114")
- [ ] Grade prediction (ML-based if possible)
- [ ] Study pattern analysis

**Features:**
- "You're on track to graduate in 3.5 years"
- "PHY114 is at risk - focus here"
- "Your study pattern: Most productive on Tuesdays"

#### **4.3 Study Insights** (Week 15-16)
- [ ] Study time tracking (manual entry first)
- [ ] Task completion rate
- [ ] Productivity streaks
- [ ] Best study times analysis
- [ ] Module-specific insights

**Premium Features:**
- Free: Basic charts
- Premium: Advanced analytics, predictions, insights

**Deliverables:**
- ✅ Advanced analytics dashboard
- ✅ Predictive features
- ✅ Study insights
- ✅ Premium-gated

**Revenue Target:** 50 paying customers (R5,000/month)

---

## 🎯 **RUNG 5: Study Tools** (Weeks 17-20)

### **Goal:** Add study-focused premium features

### **Tasks:**

#### **5.1 Study Timer** (Week 17-18)
- [ ] Pomodoro timer (25/5 min cycles)
- [ ] Custom timer sessions
- [ ] Study session tracking
- [ ] Break reminders
- [ ] Session history

**Features:**
- Start timer for specific module
- Track time spent per module
- Weekly study time summary
- "You studied 12 hours this week"

#### **5.2 Study Schedule/Time Blocking** (Week 18-19)
- [ ] Weekly calendar view
- [ ] Drag-and-drop time blocks
- [ ] Module-specific time allocation
- [ ] Recurring study sessions
- [ ] Sync with tasks

**UI:**
```
components/study/
  ├── WeeklyCalendar.tsx
  ├── TimeBlock.tsx
  ├── StudySessionForm.tsx
  └── StudyAnalytics.tsx
```

#### **5.3 Focus Mode** (Week 19-20)
- [ ] Distraction-free study mode
- [ ] Block distracting websites (browser extension)
- [ ] Study session goals
- [ ] Achievement badges
- [ ] Streak tracking

**Premium Features:**
- Free: Basic timer
- Premium: Advanced scheduling, focus mode, analytics

**Deliverables:**
- ✅ Study timer working
- ✅ Time blocking calendar
- ✅ Focus mode
- ✅ Study analytics

**Revenue Target:** 100 paying customers (R10,000/month)

---

## 🎯 **RUNG 6: Degree Roadmap** (Weeks 21-24)

### **Goal:** Build comprehensive degree planning

### **Tasks:**

#### **6.1 Prerequisite Tracking** (Week 21-22)
- [ ] Add prerequisites to modules
- [ ] Visual prerequisite flow (graph)
- [ ] "Can I take this?" checker
- [ ] Optimal course sequence
- [ ] Failed module impact analysis

**Database:**
```sql
CREATE TABLE prerequisites (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES modules(id),
  prerequisite_id UUID REFERENCES modules(id),
  is_required BOOLEAN DEFAULT TRUE
);
```

#### **6.2 Degree Roadmap** (Week 22-23)
- [ ] Full degree visualization
- [ ] Year-by-year breakdown
- [ ] Credit tracking (toward degree)
- [ ] Graduation timeline
- [ ] "What if I fail X?" scenarios

**Components:**
```
components/roadmap/
  ├── DegreeRoadmap.tsx
  ├── YearSection.tsx
  ├── PrerequisiteGraph.tsx
  └── GraduationProjector.tsx
```

#### **6.3 Academic Calendar** (Week 23-24)
- [ ] Import university calendar
- [ ] Important dates (registration, exams)
- [ ] Drop/add deadlines
- [ ] Exam schedule
- [ ] Custom reminders

**Premium Features:**
- Free: Basic roadmap
- Premium: Full planning, prerequisites, calendar

**Deliverables:**
- ✅ Degree roadmap
- ✅ Prerequisite tracking
- ✅ Academic calendar
- ✅ Graduation planning

**Revenue Target:** 200 paying customers (R20,000/month)

---

## 🎯 **RUNG 7: Integrations** (Weeks 25-28)

### **Goal:** Connect with external systems

### **Tasks:**

#### **7.1 LMS Integration** (Week 25-26)
- [ ] Canvas API integration
- [ ] Blackboard integration
- [ ] Moodle integration
- [ ] Auto-import grades
- [ ] Sync assignments/tasks

**Implementation:**
```typescript
// lib/integrations/canvas.ts
export const connectCanvas = async (apiKey: string) => {
  // Fetch courses, assignments, grades
  // Sync to UniLife modules/tasks
};
```

#### **7.2 Calendar Sync** (Week 26-27)
- [ ] Google Calendar integration
- [ ] Outlook/Exchange sync
- [ ] Two-way sync (tasks → calendar)
- [ ] Event reminders
- [ ] Study blocks in calendar

#### **7.3 Email Integration** (Week 27-28)
- [ ] Parse assignment emails
- [ ] Auto-create tasks from emails
- [ ] Syllabus parsing
- [ ] Grade notification emails
- [ ] Smart filtering

**Premium Features:**
- Free: Manual entry
- Premium: Auto-sync, integrations

**Deliverables:**
- ✅ LMS integrations
- ✅ Calendar sync
- ✅ Email parsing
- ✅ Auto-import working

**Revenue Target:** 300 paying customers (R30,000/month)

---

## 🎯 **RUNG 8: AI Features** (Weeks 29-32)

### **Goal:** Add AI-powered features (premium only)

### **Tasks:**

#### **8.1 AI Study Assistant** (Week 29-30)
- [ ] Claude/OpenAI integration
- [ ] Study recommendations
- [ ] "What should I focus on?" queries
- [ ] Personalized study plans
- [ ] Grade improvement suggestions

**Implementation:**
```typescript
// lib/ai/studyAssistant.ts
export const getStudyRecommendation = async (userId: string) => {
  const modules = await getModules(userId);
  const performance = analyzePerformance(modules);
  
  const prompt = `Based on this student's performance:
  ${JSON.stringify(performance)}
  Recommend what they should focus on.`;
  
  return await claude.complete(prompt);
};
```

#### **8.2 Smart Task Prioritization** (Week 30-31)
- [ ] AI ranks tasks by urgency/importance
- [ ] Suggests optimal task order
- [ ] Time estimates
- [ ] Deadline risk assessment
- [ ] Personalized recommendations

#### **8.3 Study Material Summarizer** (Week 31-32)
- [ ] Upload notes/PDFs
- [ ] AI summarizes content
- [ ] Key points extraction
- [ ] Flashcard generation
- [ ] Quiz question generation

**Premium Features:**
- Free: No AI
- Premium: Full AI assistant, smart features

**Deliverables:**
- ✅ AI study assistant
- ✅ Smart prioritization
- ✅ Material summarization
- ✅ Premium-only

**Revenue Target:** 500 paying customers (R50,000/month)

---

## 🎯 **RUNG 9: Collaboration** (Weeks 33-36)

### **Goal:** Add social/collaborative features

### **Tasks:**

#### **9.1 Study Groups** (Week 33-34)
- [ ] Create/join study groups
- [ ] Shared module notes
- [ ] Group task assignments
- [ ] Peer progress visibility (opt-in)
- [ ] Group chat

#### **9.2 Peer Features** (Week 34-35)
- [ ] Find classmates (same modules)
- [ ] Compare progress (anonymized)
- [ ] Study buddy matching
- [ ] Group project tracker
- [ ] Shared resources

#### **9.3 Community Features** (Week 35-36)
- [ ] Module reviews/ratings
- [ ] Professor ratings
- [ ] Study tips sharing
- [ ] Course difficulty database
- [ ] Anonymous grade distribution

**Premium Features:**
- Free: Basic groups
- Premium: Advanced collaboration, unlimited groups

**Deliverables:**
- ✅ Study groups
- ✅ Peer features
- ✅ Community platform
- ✅ Premium tiers

**Revenue Target:** 1,000 paying customers (R100,000/month)

---

## 🎯 **RUNG 10: Enterprise/Institutional** (Weeks 37-40)

### **Goal:** Launch institutional licensing

### **Tasks:**

#### **10.1 Admin Dashboard** (Week 37-38)
- [ ] University admin portal
- [ ] Class-level analytics (anonymized)
- [ ] Student success metrics
- [ ] At-risk student identification
- [ ] Reporting tools

#### **10.2 Institutional Features** (Week 38-39)
- [ ] Bulk student onboarding
- [ ] University branding
- [ ] Custom integrations
- [ ] White-label option
- [ ] API access

#### **10.3 Sales & Pricing** (Week 39-40)
- [ ] Institutional pricing model
- [ ] Sales materials
- [ ] Pilot program structure
- [ ] Contract templates
- [ ] Onboarding process

**Pricing:**
- R50-100 per student per year
- Minimum 500 students
- Custom pricing for larger deals

**Deliverables:**
- ✅ Admin dashboard
- ✅ Institutional features
- ✅ Sales materials
- ✅ First pilot customer

**Revenue Target:** 1 institutional license (R25,000-R50,000/year)

---

## 📊 **Premium Feature Matrix**

### **FREE TIER:**
- ✅ Basic module tracking (5 modules max)
- ✅ Task management (20 tasks max)
- ✅ Basic analytics
- ✅ Financial tracking
- ✅ Mobile app (limited features)
- ✅ Basic calendar

### **PREMIUM TIER (R99/month):**
- ✅ Unlimited modules
- ✅ Unlimited tasks
- ✅ **Assessment tracking**
- ✅ **Grade calculators**
- ✅ **Advanced analytics**
- ✅ **Study timer & scheduling**
- ✅ **Degree roadmap**
- ✅ **LMS integrations**
- ✅ **AI study assistant**
- ✅ **Push notifications**
- ✅ **Focus mode**
- ✅ **Study insights**
- ✅ **Calendar sync**
- ✅ **Email integration**
- ✅ **Study groups**
- ✅ **Priority support**

---

## 🎯 **Milestone Summary**

| Rung | Feature | Timeline | Revenue Target |
|------|---------|---------|----------------|
| 1 | Payment System | Weeks 1-4 | R0 (setup) |
| 2 | Assessment Tracking | Weeks 5-8 | R500-R1K/month |
| 3 | Mobile App | Weeks 9-12 | R2K-R3K/month |
| 4 | Advanced Analytics | Weeks 13-16 | R5K/month |
| 5 | Study Tools | Weeks 17-20 | R10K/month |
| 6 | Degree Roadmap | Weeks 21-24 | R20K/month |
| 7 | Integrations | Weeks 25-28 | R30K/month |
| 8 | AI Features | Weeks 29-32 | R50K/month |
| 9 | Collaboration | Weeks 33-36 | R100K/month |
| 10 | Enterprise | Weeks 37-40 | R125K+/month |

---

## 💰 **Revenue Projections**

### **Conservative:**
- Month 3: R1,000 (10 customers)
- Month 6: R5,000 (50 customers)
- Month 9: R15,000 (150 customers)
- Month 12: R30,000 (300 customers)
- **Year 1 ARR: R360,000**

### **Realistic:**
- Month 3: R2,000 (20 customers)
- Month 6: R10,000 (100 customers)
- Month 9: R30,000 (300 customers)
- Month 12: R60,000 (600 customers)
- **Year 1 ARR: R720,000**

### **Optimistic:**
- Month 3: R5,000 (50 customers)
- Month 6: R20,000 (200 customers)
- Month 9: R50,000 (500 customers)
- Month 12: R100,000 (1,000 customers)
- **Year 1 ARR: R1,200,000**

---

## 🚀 **Next Steps (This Week)**

1. **Set up payment system** (Stripe or PayFast)
2. **Create subscription table** in Supabase
3. **Build feature gating hook** (`useSubscription`)
4. **Design pricing page** (R99/month premium)
5. **Start building Assessment tracking** (first premium feature)

---

## 📝 **Notes**

- **Focus on one rung at a time**
- **Validate each feature before moving to next**
- **Get paying customers early** (even if just 5-10)
- **Iterate based on feedback**
- **Don't build everything - build what sells**

**Remember:** A premium app with 100 paying customers (R10K/month) is better than a free app with 10,000 users and R0 revenue.

---

**Let's climb this ladder, one rung at a time! 🚀**

