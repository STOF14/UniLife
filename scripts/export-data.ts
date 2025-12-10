import { supabase, USER_ID } from '@/lib/supabase/supabase/client'
import fs from 'fs'

async function exportData() {
  const { data: modules } = await supabase.from('modules').select('*').eq('user_id', USER_ID)
  const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', USER_ID)
  // ... export all tables
  
  const backup = {
    timestamp: new Date().toISOString(),
    modules,
    tasks,
    // ... other data
  }
  
  fs.writeFileSync('backup.json', JSON.stringify(backup, null, 2))
  console.log('Backup complete!')
}

exportData()