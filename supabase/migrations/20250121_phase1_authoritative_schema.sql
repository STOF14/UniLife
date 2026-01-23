-- Phase 1: Authoritative Academic Schema
-- These tables are read-only and populated only by ingestion pipelines

-- Universities table
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL DEFAULT 'South Africa',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Degrees Catalog (authoritative, read-only)
CREATE TABLE IF NOT EXISTS degrees_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  faculty TEXT NOT NULL,
  faculty_code TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Undergraduate', 'Honours', 'Masters', 'Doctorate')),
  duration_years INTEGER,
  total_credits INTEGER,
  nqf_level INTEGER,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(university_id, code)
);

-- Modules Catalog (authoritative, read-only)
CREATE TABLE IF NOT EXISTS modules_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  nqf_level INTEGER,
  prerequisites TEXT,
  description TEXT,
  contact_time TEXT,
  language TEXT DEFAULT 'English',
  presentation_period TEXT,
  module_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(university_id, code)
);

-- Curriculum Versions (immutable, versioned academic requirements)
CREATE TABLE IF NOT EXISTS curriculum_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  degree_id UUID NOT NULL REFERENCES degrees_catalog(id),
  academic_year INTEGER NOT NULL,
  version_hash TEXT NOT NULL UNIQUE,
  effective_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(degree_id, academic_year)
);

-- Degree Modules (immutable curriculum definitions)
CREATE TABLE IF NOT EXISTS degree_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_version_id UUID NOT NULL REFERENCES curriculum_versions(id),
  module_code TEXT NOT NULL,
  year_level INTEGER NOT NULL CHECK (year_level BETWEEN 1 AND 6),
  semester TEXT CHECK (semester IN ('First', 'Second', 'Year')),
  is_compulsory BOOLEAN DEFAULT TRUE,
  module_type TEXT CHECK (module_type IN ('core', 'fundamental', 'elective')),
  credits_override INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(curriculum_version_id, module_code)
);

-- Student Execution Layer (user-owned data)

-- Student Profiles (immutable binding to curriculum version)
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  university_id UUID NOT NULL REFERENCES universities(id),
  degree_id UUID NOT NULL REFERENCES degrees_catalog(id),
  curriculum_version_id UUID NOT NULL REFERENCES curriculum_versions(id),
  start_year INTEGER NOT NULL,
  binding_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'transferred', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, degree_id, start_year)
);

-- Student Module Instances (user's personal module progress)
CREATE TABLE IF NOT EXISTS student_module_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES student_profiles(id),
  module_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'passed', 'failed', 'exempted')),
  grade DECIMAL(5,2),
  attempt_count INTEGER DEFAULT 1 CHECK (attempt_count > 0),
  attempt_date DATE,
  completion_date DATE,
  credits_earned INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_profile_id, module_code)
);

-- Academic Events (audit log for all changes)
CREATE TABLE IF NOT EXISTS academic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES student_profiles(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('grade_change', 'status_change', 'module_added', 'module_removed', 'degree_change')),
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Critical Constraints
ALTER TABLE student_profiles ADD CONSTRAINT IF NOT EXISTS check_start_year_valid 
  CHECK (start_year >= 2020 AND start_year <= EXTRACT(YEAR FROM NOW()) + 1);
ALTER TABLE student_module_instances ADD CONSTRAINT IF NOT EXISTS check_grade_range 
  CHECK (grade IS NULL OR (grade >= 0 AND grade <= 100));
ALTER TABLE degree_modules ADD CONSTRAINT IF NOT EXISTS check_credits_override 
  CHECK (credits_override IS NULL OR credits_override > 0);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_module_instances_profile_id ON student_module_instances(student_profile_id);
CREATE INDEX IF NOT EXISTS idx_degree_modules_curriculum_version ON degree_modules(curriculum_version_id);
CREATE INDEX IF NOT EXISTS idx_academic_events_student_profile ON academic_events(student_profile_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_versions_degree_year ON curriculum_versions(degree_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_degrees_catalog_university ON degrees_catalog(university_id);
CREATE INDEX IF NOT EXISTS idx_modules_catalog_university ON modules_catalog(university_id);

-- Row Level Security (RLS) for student data
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_module_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only see their own data
CREATE POLICY "Users can view own student profile" ON student_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own student profile" ON student_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own module instances" ON student_module_instances
  FOR SELECT USING (
    student_profile_id IN (
      SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own module instances" ON student_module_instances
  FOR UPDATE USING (
    student_profile_id IN (
      SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own academic events" ON academic_events
  FOR SELECT USING (
    student_profile_id IN (
      SELECT id FROM student_profiles WHERE user_id = auth.uid()
    )
  );

-- Authoritative tables are read-only for all users (no RLS policies needed)
-- They can only be modified by service roles through ingestion pipelines
