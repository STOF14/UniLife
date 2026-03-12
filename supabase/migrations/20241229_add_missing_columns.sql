-- Add missing columns to modules table
ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing rows to have default values
UPDATE modules 
SET created_at = NOW(), updated_at = NOW() 
WHERE created_at IS NULL OR updated_at IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_modules_user_id ON modules(user_id);
CREATE INDEX IF NOT EXISTS idx_modules_created_at ON modules(created_at);
