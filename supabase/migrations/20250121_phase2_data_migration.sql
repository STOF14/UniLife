-- Phase 2: Data Migration from Old Schema to New Authoritative Schema
-- This migration safely transforms existing user data to the new structure

-- Step 1: Create backup of existing critical tables
CREATE TABLE IF NOT EXISTS modules_backup AS TABLE modules;
CREATE TABLE IF NOT EXISTS tasks_backup AS TABLE tasks;
CREATE TABLE IF NOT EXISTS transactions_backup AS TABLE transactions;

-- Step 2: Insert University of Pretoria if not exists
INSERT INTO universities (id, name, code, country, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'University of Pretoria',
  'UP',
  'South Africa',
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Step 3: Create student profiles for existing users
-- This creates a student profile for each user who has modules
INSERT INTO student_profiles (id, user_id, university_id, degree_id, curriculum_version_id, start_year, binding_date, status, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  m.user_id,
  u.id as university_id,
  NULL as degree_id, -- Will be set during onboarding
  NULL as curriculum_version_id, -- Will be set during onboarding
  EXTRACT(YEAR FROM m.created_at) as start_year,
  m.created_at as binding_date,
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM modules m
CROSS JOIN universities u ON u.code = 'UP'
WHERE m.user_id IS NOT NULL
GROUP BY m.user_id, u.id, m.created_at
ON CONFLICT (user_id, degree_id, start_year) DO NOTHING;

-- Step 4: Migrate existing modules to student module instances
-- Transform user-created modules to instances linked to student profiles
INSERT INTO student_module_instances (id, student_profile_id, module_code, status, grade, attempt_count, credits_earned, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  sp.id as student_profile_id,
  m.code as module_code,
  CASE 
    WHEN m.currentGrade >= 50 THEN 'passed'
    WHEN m.currentGrade IS NOT NULL AND m.currentGrade < 50 THEN 'failed'
    ELSE 'pending'
  END as status,
  m.currentGrade as grade,
  CASE 
    WHEN m.currentGrade IS NOT NULL THEN 1
    ELSE 1
  END as attempt_count,
  CASE 
    WHEN m.currentGrade >= 50 THEN m.credits
    ELSE 0
  END as credits_earned,
  m.created_at as created_at,
  m.updated_at as updated_at
FROM modules m
JOIN student_profiles sp ON sp.user_id = m.user_id
WHERE m.user_id IS NOT NULL
ON CONFLICT (student_profile_id, module_code) DO NOTHING;

-- Step 5: Create academic events for migration audit
INSERT INTO academic_events (id, student_profile_id, event_type, old_value, new_value, reason, created_by, created_at)
SELECT 
  gen_random_uuid() as id,
  sp.id as student_profile_id,
  'module_added' as event_type,
  NULL as old_value,
  m.code as new_value,
  'Migrated from legacy system' as reason,
  m.user_id as created_by,
  m.created_at as created_at
FROM modules m
JOIN student_profiles sp ON sp.user_id = m.user_id
WHERE m.user_id IS NOT NULL;

-- Step 6: Create migration summary view
CREATE OR REPLACE VIEW migration_summary AS
SELECT 
  'student_profiles' as table_name,
  COUNT(*) as migrated_count,
  COUNT(*) FILTER (WHERE degree_id IS NULL) as needs_onboarding
FROM student_profiles

UNION ALL

SELECT 
  'student_module_instances' as table_name,
  COUNT(*) as migrated_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count
FROM student_module_instances

UNION ALL

SELECT 
  'academic_events' as table_name,
  COUNT(*) as migrated_count,
  0 as needs_onboarding
FROM academic_events;

-- Step 7: Add foreign key constraints for data integrity
ALTER TABLE student_profiles 
ADD CONSTRAINT fk_student_profiles_university 
FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE RESTRICT;

ALTER TABLE student_profiles 
ADD CONSTRAINT fk_student_profiles_degree 
FOREIGN KEY (degree_id) REFERENCES degrees_catalog(id) ON DELETE RESTRICT;

ALTER TABLE student_profiles 
ADD CONSTRAINT fk_student_profiles_curriculum 
FOREIGN KEY (curriculum_version_id) REFERENCES curriculum_versions(id) ON DELETE RESTRICT;

ALTER TABLE student_module_instances 
ADD CONSTRAINT fk_student_module_instances_profile 
FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE;

ALTER TABLE academic_events 
ADD CONSTRAINT fk_academic_events_profile 
FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE;

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_university ON student_profiles(user_id, university_id);
CREATE INDEX IF NOT EXISTS idx_student_module_instances_status ON student_module_instances(status);
CREATE INDEX IF NOT EXISTS idx_academic_events_type ON academic_events(event_type);

-- Step 8: Add comments for documentation
COMMENT ON TABLE student_profiles IS 'Migrated user academic profiles - needs onboarding to complete setup';
COMMENT ON TABLE student_module_instances IS 'Migrated user modules - linked to new authoritative system';
COMMENT ON TABLE academic_events IS 'Audit trail of all academic changes and migrations';

-- Migration validation queries (for manual verification)
-- 1. Check all users with modules have student profiles:
-- SELECT COUNT(*) FROM auth.users u 
-- LEFT JOIN student_profiles sp ON u.id = sp.user_id 
-- WHERE EXISTS (SELECT 1 FROM modules m WHERE m.user_id = u.id) AND sp.user_id IS NULL;

-- 2. Check data integrity:
-- SELECT COUNT(*) FROM student_module_instances smi 
-- JOIN student_profiles sp ON smi.student_profile_id = sp.id 
-- WHERE smi.grade IS NOT NULL AND smi.credits_earned = 0;
