-- Phase 2: Realistic Data Migration Based on Actual Discovery
-- This migration is based on actual code analysis, not assumptions

-- ================================================================
-- CRITICAL: This migration assumes the following current structure:
-- modules table has: id, code, name, credits, currentGrade, userId, createdAt, updatedAt
-- tasks table has: id, title, moduleCode, dueDate, priority, status, completed, createdAt, userId
-- transactions table has: id, date, description, amount, category, createdAt, userId
-- ================================================================

-- Step 1: Create backup tables (simple approach)
CREATE TABLE IF NOT EXISTS modules_migration_backup AS 
SELECT * FROM modules WHERE userId IS NOT NULL;

CREATE TABLE IF NOT EXISTS tasks_migration_backup AS 
SELECT * FROM tasks WHERE userId IS NOT NULL;

CREATE TABLE IF NOT EXISTS transactions_migration_backup AS 
SELECT * FROM transactions WHERE userId IS NOT NULL;

-- Step 2: Insert University of Pretoria (if not exists)
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
-- Only for users who actually have modules/tasks/transactions
INSERT INTO student_profiles (id, user_id, university_id, degree_id, curriculum_version_id, start_year, binding_date, status, created_at, updated_at)
SELECT DISTINCT
  gen_random_uuid() as id,
  m.userId as user_id,
  u.id as university_id,
  NULL as degree_id, -- Will be set during onboarding
  NULL as curriculum_version_id, -- Will be set during onboarding
  EXTRACT(YEAR FROM m.createdAt) as start_year,
  m.createdAt as binding_date,
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM modules m
CROSS JOIN universities u ON u.code = 'UP'
WHERE m.userId IS NOT NULL
ON CONFLICT (user_id, degree_id, start_year) DO NOTHING;

-- Step 4: Migrate modules to student module instances
-- Convert currentGrade to status and calculate credits earned
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
  1 as attempt_count,
  CASE 
    WHEN m.currentGrade >= 50 THEN m.credits
    ELSE 0
  END as credits_earned,
  m.createdAt as created_at,
  m.updatedAt as updated_at
FROM modules m
JOIN student_profiles sp ON sp.user_id = m.userId
WHERE m.userId IS NOT NULL
ON CONFLICT (student_profile_id, module_code) DO NOTHING;

-- Step 5: Create academic events for migration audit
INSERT INTO academic_events (id, student_profile_id, event_type, old_value, new_value, reason, created_by, created_at)
SELECT 
  gen_random_uuid() as id,
  sp.id as student_profile_id,
  'module_added' as event_type,
  NULL as old_value,
  m.code as new_value,
  'Migrated from legacy modules table' as reason,
  m.userId as created_by,
  m.createdAt as created_at
FROM modules m
JOIN student_profiles sp ON sp.user_id = m.userId
WHERE m.userId IS NOT NULL;

-- Step 6: Handle tasks (convert to academic events or keep separate)
-- For now, we'll log tasks as academic events to preserve the data
INSERT INTO academic_events (id, student_profile_id, event_type, old_value, new_value, reason, created_by, created_at)
SELECT 
  gen_random_uuid() as id,
  sp.id as student_profile_id,
  'task_migrated' as event_type,
  NULL as old_value,
  json_build_object(
    'title', t.title,
    'moduleCode', t.moduleCode,
    'dueDate', t.dueDate,
    'priority', t.priority,
    'status', t.status,
    'completed', t.completed
  ) as new_value,
  'Migrated from legacy tasks table' as reason,
  t.userId as created_by,
  t.createdAt as created_at
FROM tasks t
JOIN student_profiles sp ON sp.user_id = t.userId
WHERE t.userId IS NOT NULL;

-- Step 7: Handle transactions (link to student profiles)
-- Create a simple mapping table for now
CREATE TABLE IF NOT EXISTS student_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  transaction_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO student_transactions (student_profile_id, transaction_data, created_at)
SELECT 
  sp.id as student_profile_id,
  json_build_object(
    'id', t.id,
    'date', t.date,
    'description', t.description,
    'amount', t.amount,
    'category', t.category
  ) as transaction_data,
  t.createdAt as created_at
FROM transactions t
JOIN student_profiles sp ON sp.user_id = t.userId
WHERE t.userId IS NOT NULL;

-- Step 8: Create migration summary view
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
FROM academic_events

UNION ALL

SELECT 
  'student_transactions' as table_name,
  COUNT(*) as migrated_count,
  0 as needs_onboarding
FROM student_transactions;

-- Step 9: Performance indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_university ON student_profiles(user_id, university_id);
CREATE INDEX IF NOT EXISTS idx_student_module_instances_status ON student_module_instances(status);
CREATE INDEX IF NOT EXISTS idx_academic_events_type ON academic_events(event_type);
CREATE INDEX IF NOT EXISTS idx_student_transactions_profile ON student_transactions(student_profile_id);

-- Step 10: Add comments for documentation
COMMENT ON TABLE student_profiles IS 'Migrated from legacy modules table - needs onboarding to complete degree assignment';
COMMENT ON TABLE student_module_instances IS 'Migrated from legacy modules table with grade-to-status conversion';
COMMENT ON TABLE academic_events IS 'Migration audit trail including converted tasks data';
COMMENT ON TABLE student_transactions IS 'Migrated financial data linked to student profiles';

-- Step 11: Data validation queries (for manual verification)
-- Verify all users with modules have student profiles
/*
SELECT 
  u.id as user_id,
  COUNT(DISTINCT m.id) as module_count,
  COUNT(DISTINCT sp.id) as profile_count,
  CASE WHEN COUNT(DISTINCT sp.id) = 0 THEN 'MISSING PROFILE' ELSE 'OK' END as status
FROM auth.users u
LEFT JOIN modules m ON m.userId = u.id AND m.userId IS NOT NULL
LEFT JOIN student_profiles sp ON sp.user_id = u.id
WHERE EXISTS (SELECT 1 FROM modules m2 WHERE m2.userId = u.id AND m2.userId IS NOT NULL)
GROUP BY u.id
HAVING COUNT(DISTINCT m.id) > COUNT(DISTINCT sp.id);
*/

-- Verify grade conversion logic
/*
SELECT 
  COUNT(*) as total_modules,
  COUNT(*) FILTER (WHERE currentGrade >= 50) as passed_modules,
  COUNT(*) FILTER (WHERE currentGrade < 50) as failed_modules,
  COUNT(*) FILTER (WHERE currentGrade IS NULL) as pending_modules,
  COUNT(*) FILTER (WHERE status = 'passed') as migrated_passed,
  COUNT(*) FILTER (WHERE status = 'failed') as migrated_failed,
  COUNT(*) FILTER (WHERE status = 'pending') as migrated_pending
FROM modules m
JOIN student_module_instances smi ON smi.module_code = m.code
WHERE m.userId IS NOT NULL;
*/
