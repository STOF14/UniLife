# UniLife - Comprehensive University Management System

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2.35-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4.0-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</div>

## 🎓 Overview

UniLife is a sophisticated, modern university management system designed to help students track their academic journey, manage modules, monitor progress, and visualize their entire university experience. Built with cutting-edge web technologies and featuring a sleek Apple-inspired dark theme interface.

### 🌟 Key Features

- **📚 Academic Module Management**: Comprehensive module tracking with progress monitoring
- **📖 Yearbook PDF Import**: Advanced parsing of university yearbook PDFs with intelligent module extraction
- **🗺️ Interactive Roadmap**: Visual journey planner showing 3-year progression with milestones
- **📊 Analytics Dashboard**: Deep insights into academic performance and trends
- **✅ Task Management**: Integrated task tracking with module associations
- **💰 Financial Tracking**: Monitor expenses and budget management
- **🎯 Goal Setting**: Set and track academic goals with progress visualization
- **📱 Responsive Design**: Perfect experience on all devices

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0+ 
- npm or yarn
- Supabase account (for database)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/unilife.git
cd unilife

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run the development server
npm run dev
```

### Environment Setup

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_vercel_analytics_id
```

### Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql`
3. Set up Row Level Security (RLS) policies
4. Configure authentication providers

---

## 📁 Project Structure

```
unilife/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main application page
│   ├── academic/
│   │   └── modules/              # Academic module pages
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Select.tsx
│   ├── academic/                 # Academic-specific components
│   │   ├── AcademicDashboard.tsx
│   │   ├── ModuleForm.tsx
│   │   ├── ModuleList.tsx
│   │   ├── RoadmapPage.tsx
│   │   └── YearbookImport.tsx
│   ├── pages/                    # Page components
│   │   ├── AnalyticsPage.tsx
│   │   ├── FinancesPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── TasksPage.tsx
│   └── layout/                   # Layout components
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── lib/                          # Utility libraries
│   ├── types.ts                  # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   │   ├── advancedPdfParser.ts  # PDF parsing logic
│   │   ├── calculations.ts       # Grade calculations
│   │   └── pdfParser.ts          # Legacy PDF parser
│   └── hooks/                    # Custom React hooks
│       ├── useAcademic.ts
│       ├── useDatabase.ts
│       └── useStore.ts
├── database/                     # Database schemas
│   ├── schema.sql                # Supabase schema
│   └── migrations/               # Database migrations
├── public/                       # Static assets
├── docs/                         # Documentation
└── README.md                     # This file
```

---

## 🎯 Core Features

### 📚 Academic Module Management

The academic system provides comprehensive module tracking with:

- **Module Creation**: Add modules with detailed information
- **Progress Tracking**: Monitor completion status and grades
- **Credit Management**: Track credit accumulation per semester
- **Assessment Tracking**: Monitor assignments, tests, and exams
- **Prerequisite Management**: Handle module dependencies

#### Key Components:
- `AcademicDashboard.tsx` - Main academic interface
- `ModuleForm.tsx` - Module creation/editing
- `ModuleList.tsx` - Module display and management

### 📖 Yearbook PDF Import

Advanced PDF parsing system specifically designed for University of Pretoria yearbooks:

#### Features:
- **Intelligent Text Extraction**: Position-aware text parsing
- **Module Pattern Recognition**: Identifies modules using regex patterns
- **Curriculum Structure Parsing**: Extracts year-by-year breakdown
- **Admission Requirements**: Parses admission criteria
- **Study Streams**: Handles second major options
- **Prerequisite Relationships**: Maps module dependencies

#### Technical Implementation:
```typescript
// Main extraction function
export async function extractYearbookData(file: File): Promise<ExtractedYearbookData> {
  const text = await extractTextFromPDF(file);
  const programInfo = extractProgramInfo(text);
  const curriculumStructure = parseCurriculumStructure(text);
  const modules = extractAllModules(text, curriculumStructure);
  // ... more processing
}
```

#### Key Functions:
- `extractTextFromPDF()` - PDF.js text extraction with position sorting
- `extractProgramInfo()` - Degree and program information
- `parseCurriculumStructure()` - Year-by-year curriculum breakdown
- `extractAllModules()` - Individual module parsing
- `parsePrerequisites()` - Prerequisite relationship extraction

### 🗺️ Interactive University Roadmap

Visual journey planner showing your complete university progression:

#### Features:
- **3-Year Timeline**: Visual representation of academic journey
- **Year-by-Year Breakdown**: Detailed view of each academic year
- **Module Organization**: Modules grouped by year and type
- **Milestone Tracking**: Key academic achievements and deadlines
- **Progress Visualization**: Animated progress bars and statistics
- **Second Major Support**: Handles dual major pathways

#### Interactive Elements:
- **Year Selector**: Switch between years with smooth animations
- **Module Cards**: Hover effects and progress indicators
- **Milestone Timeline**: Visual achievement tracking
- **Statistics Dashboard**: Comprehensive journey statistics

#### Technical Implementation:
```typescript
interface YearPlan {
  year: number;
  title: string;
  description: string;
  totalCredits: number;
  fundamentalCredits: number;
  coreCredits: number;
  electiveCredits: number;
  modules: Module[];
  milestones: Milestone[];
  focus: string[];
  color: string;
}
```

### 📊 Analytics Dashboard

Comprehensive analytics for academic performance:

- **Grade Trends**: Visual representation of academic performance over time
- **Module Distribution**: Breakdown of modules by type and status
- **Credit Progress**: Track credit accumulation toward graduation
- **Performance Metrics**: GPA, average grades, and completion rates
- **Predictive Analytics**: Forecast graduation timeline

### ✅ Task Management

Integrated task system with module associations:

- **Task Creation**: Create tasks linked to specific modules
- **Due Date Tracking**: Monitor assignment and test deadlines
- **Priority Management**: Organize tasks by importance and urgency
- **Completion Tracking**: Mark tasks as complete with progress updates
- **Module Integration**: Tasks automatically associated with module progress

### 💰 Financial Tracking

Monitor and manage university-related expenses:

- **Expense Tracking**: Record all university-related costs
- **Budget Management**: Set and monitor spending limits
- **Category Organization**: Categorize expenses (tuition, books, living, etc.)
- **Monthly Reports**: View spending trends and patterns
- **Financial Goals**: Set savings and budget targets

---

## 🛠️ Technology Stack

### Frontend Framework
- **Next.js 14.2.35** - React framework with App Router
- **React 18** - UI library with hooks and concurrent features
- **TypeScript 5.0+** - Type-safe JavaScript

### Styling & UI
- **Tailwind CSS 3.4.0** - Utility-first CSS framework
- **Lucide React** - Icon library
- **CSS-in-JS** - Component-specific styling

### Database & Backend
- **Supabase** - Backend as a Service (PostgreSQL)
- **PostgreSQL** - Primary database
- **Row Level Security (RLS)** - Data access control

### PDF Processing
- **PDF.js 3.11.174** - PDF text extraction
- **Advanced Regex Patterns** - Module and curriculum parsing

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Vercel** - Deployment platform

---

## 🎨 Design System

### Color Palette (Dark Theme)
```css
/* Primary Colors */
--primary-blue: #0A84FF;
--success-green: #30D158;
--warning-orange: #FF9F0A;
--error-red: #FF453A;

/* Neutral Colors */
--background-primary: #0A0A0A;
--background-secondary: #1C1C1C;
--background-tertiary: #38383A;
--text-primary: #FFFFFF;
--text-secondary: #EBEBF599;
--text-tertiary: #EBEBF566;
```

### Typography
- **Primary Font**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- **Headings**: Bold weight with tight letter spacing
- **Body Text**: Regular weight with optimal line height

### Component Design Principles
- **Apple-Inspired**: Clean, minimalist interface
- **High Contrast**: Excellent readability in dark mode
- **Smooth Animations**: Subtle transitions and micro-interactions
- **Responsive Design**: Mobile-first approach

---

## 📊 Database Schema

### Core Tables

#### Modules
```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  semester TEXT NOT NULL,
  current_grade DECIMAL(5,2),
  target_grade INTEGER DEFAULT 60,
  progress INTEGER DEFAULT 0,
  prerequisites TEXT[],
  corequisites TEXT[],
  description TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium',
  module_id UUID REFERENCES modules(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Assessments
```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  weight INTEGER NOT NULL,
  due_date TIMESTAMP,
  submitted BOOLEAN DEFAULT FALSE,
  graded BOOLEAN DEFAULT FALSE,
  type TEXT NOT NULL,
  module_id UUID REFERENCES modules(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 Configuration

### Environment Variables

#### Required Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Optional Variables
```env
# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_vercel_analytics_id

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_YEARBOOK_IMPORT=true
NEXT_PUBLIC_ENABLE_ROADMAP=true
```

### Supabase Setup

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Choose region closest to your users

2. **Database Schema**
   - Run the SQL from `database/schema.sql`
   - Set up Row Level Security policies
   - Create indexes for performance

3. **Authentication**
   - Enable email/password authentication
   - Configure OAuth providers if needed
   - Set up redirect URLs

4. **API Keys**
   - Copy URL and anon key to `.env.local`
   - Generate service role key for server operations

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and link project
   vercel login
   vercel link
   ```

2. **Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Ensure Supabase URLs are accessible

3. **Deploy**
   ```bash
   # Deploy to production
   vercel --prod
   
   # Or automatic deployment on git push
   git push origin main
   ```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t unilife .
docker run -p 3000:3000 unilife
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 🧪 Testing

### Unit Tests
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Tests
```bash
# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- roadmap.test.ts
```

### PDF Parser Testing
```bash
# Test PDF parsing with sample files
npm run test:pdf-parser

# Test specific yearbook format
npm run test:yearbook-parser -- --format=up
```

---

## 📖 API Documentation

### Academic Endpoints

#### Get Modules
```typescript
GET /api/modules
Response: Module[]
```

#### Create Module
```typescript
POST /api/modules
Body: CreateModuleRequest
Response: Module
```

#### Update Module Progress
```typescript
PATCH /api/modules/:id/progress
Body: { progress: number, grade?: number }
Response: Module
```

### Yearbook Import

#### Parse PDF
```typescript
POST /api/yearbook/parse
Body: FormData (PDF file)
Response: ExtractedYearbookData
```

#### Import Modules
```typescript
POST /api/yearbook/import
Body: ImportModulesRequest
Response: Module[]
```

### Task Management

#### Get Tasks
```typescript
GET /api/tasks?module_id=:id&completed=:boolean
Response: Task[]
```

#### Create Task
```typescript
POST /api/tasks
Body: CreateTaskRequest
Response: Task
```

---

## 🔌 Integrations

### Supabase Integration

The application uses Supabase for:

- **Database Operations**: CRUD operations for all data
- **Authentication**: User management and session handling
- **Real-time Updates**: Live data synchronization
- **File Storage**: PDF uploads and static assets

#### Example Usage:
```typescript
import { supabase } from '@/lib/supabase';

// Fetch modules
const { data: modules, error } = await supabase
  .from('modules')
  .select('*')
  .eq('user_id', userId);

// Create module
const { data, error } = await supabase
  .from('modules')
  .insert(moduleData)
  .select()
  .single();
```

### PDF.js Integration

Advanced PDF parsing with position-aware text extraction:

```typescript
import { extractTextFromPDF } from '@/lib/utils/advancedPdfParser';

// Extract text with position preservation
const text = await extractTextFromPDF(file);

// Parse modules and curriculum
const data = await extractYearbookData(file);
```

---

## 🎯 Performance Optimization

### Code Splitting
- **Route-based Splitting**: Automatic with Next.js App Router
- **Component Splitting**: Lazy loading for heavy components
- **PDF Processing**: Web Workers for large file parsing

### Database Optimization
- **Indexing**: Strategic indexes on frequently queried columns
- **Query Optimization**: Efficient Supabase queries
- **Caching**: React Query for client-side caching

### Bundle Optimization
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    domains: ['your-cdn-domain.com'],
  },
};
```

---

## 🛡️ Security

### Authentication & Authorization
- **Supabase Auth**: Secure user authentication
- **Row Level Security**: Data access control at database level
- **JWT Tokens**: Secure session management
- **OAuth Integration**: Social login options

### Data Protection
- **Input Validation**: Type-safe data handling
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: React's built-in protections
- **CSRF Protection**: SameSite cookie attributes

### Environment Security
```env
# Never commit sensitive data
# Use .env.local for local development
# Use Vercel environment variables for production
```

---

## 🤝 Contributing

### Development Workflow

1. **Fork Repository**
   ```bash
   git clone https://github.com/yourusername/unilife.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Changes**
   - Follow code style guidelines
   - Add tests for new features
   - Update documentation

4. **Submit Pull Request**
   ```bash
   git push origin feature/amazing-feature
   # Create PR on GitHub
   ```

### Code Style

#### TypeScript Guidelines
- Use strict TypeScript mode
- Provide explicit types for all functions
- Use interfaces for object shapes
- Prefer `const` over `let`

#### React Guidelines
- Use functional components with hooks
- Follow React naming conventions
- Implement proper error boundaries
- Use TypeScript for props

#### CSS Guidelines
- Use Tailwind utility classes
- Avoid inline styles
- Implement responsive design
- Follow mobile-first approach

### Commit Messages
```
feat: add roadmap page component
fix: resolve PDF parsing error
docs: update API documentation
style: improve component styling
refactor: optimize database queries
test: add unit tests for PDF parser
```

---

## 🐛 Troubleshooting

### Common Issues

#### PDF Parsing Errors
```bash
# Check PDF.js version
npm list pdfjs-dist

# Clear cache
rm -rf .next
npm run dev
```

#### Database Connection Issues
```bash
# Check Supabase credentials
echo $NEXT_PUBLIC_SUPABASE_URL

# Test connection
curl -I $NEXT_PUBLIC_SUPABASE_URL
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Performance Issues

#### Slow PDF Parsing
- Use PDF files under 50MB
- Implement progress indicators
- Consider server-side processing for large files

#### Database Performance
- Add indexes to frequently queried columns
- Use pagination for large datasets
- Implement caching strategies

---

## 📚 Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Learning Resources
- [React Best Practices](https://react.dev/learn)
- [Database Design Principles](https://www.postgresql.org/docs/)
- [PDF.js Guide](https://mozilla.github.io/pdf.js/)

### Community
- [GitHub Discussions](https://github.com/yourusername/unilife/discussions)
- [Discord Community](https://discord.gg/unilife)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/unilife)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 UniLife

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

### Technologies & Libraries
- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF Processing
- [Lucide](https://lucide.dev/) - Icon Library

### Inspiration
- University students worldwide who inspired this solution
- The open-source community for amazing tools and libraries
- Academic institutions for their complex curriculum structures

### Contributors
- [@yourusername](https://github.com/yourusername) - Creator & Lead Developer
- [@contributor1](https://github.com/contributor1) - PDF Parser Specialist
- [@contributor2](https://github.com/contributor2) - UI/UX Designer

---

## 📞 Support

### Get Help
- 📧 Email: support@unilife.app
- 💬 Discord: [Join our community](https://discord.gg/unilife)
- 🐛 Issues: [Report on GitHub](https://github.com/yourusername/unilife/issues)
- 📖 Docs: [View documentation](https://docs.unilife.app)

### FAQ

**Q: Can I import yearbooks from other universities?**
A: Currently optimized for University of Pretoria format, but the parser can be adapted for other institutions.

**Q: Is my data secure?**
A: Yes, all data is encrypted and stored in Supabase with Row Level Security.

**Q: Can I use this offline?**
A: The app requires internet connection for database operations, but some features work offline with caching.

**Q: How do I contribute?**
A: Check the Contributing section above or join our Discord community.

---

<div align="center">
  <p>Made with ❤️ for students worldwide</p>
  <p>© 2024 UniLife. All rights reserved.</p>
</div>
