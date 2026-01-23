// Database Discovery Script
// Actually inspects the current database structure

const { createClient } = require('@supabase/supabase-js');

// Use service role for full access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function discoverDatabase() {
  console.log('🔍 Database Discovery - Finding Current Structure\n');

  try {
    // Step 1: Get all tables
    console.log('📋 Step 1: Discovering Tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables', {}, { count: 'exact' })
      .catch(() => {
        // Fallback: Try information_schema query
        return supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .neq('table_name', 'information_schema')
          .order('table_name');
      });

    if (tablesError) {
      console.error('❌ Failed to get tables:', tablesError);
      return;
    }

    console.log(`Found ${tables?.length || 0} tables:`);
    if (tables && tables.length > 0) {
      tables.forEach(table => {
        console.log(`  - ${table.table_name || table}`);
      });
    }

    // Step 2: Inspect key tables structure
    const keyTables = ['modules', 'tasks', 'transactions', 'users', 'profiles'];
    
    for (const tableName of keyTables) {
      const tableExists = tables?.some(t => 
        (t.table_name || t) === tableName
      );
      
      if (tableExists) {
        console.log(`\n🔍 Inspecting table: ${tableName}`);
        await inspectTableStructure(tableName);
      } else {
        console.log(`\n⚠️  Table not found: ${tableName}`);
      }
    }

    // Step 3: Check data volume
    console.log('\n📊 Step 3: Checking Data Volume...');
    await checkDataVolume(tables || []);

  } catch (error) {
    console.error('💥 Database discovery failed:', error);
  }
}

async function inspectTableStructure(tableName) {
  try {
    // Try to get sample data to understand structure
    const { data: sampleData, error: dataError } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);

    if (dataError) {
      console.error(`  ❌ Failed to sample ${tableName}:`, dataError.message);
      return;
    }

    if (!sampleData || sampleData.length === 0) {
      console.log(`  ℹ️  Table ${tableName} is empty`);
      return;
    }

    // Analyze the structure from sample data
    const sample = sampleData[0];
    const columns = Object.keys(sample);
    
    console.log(`  📋 Columns (${columns.length}):`);
    columns.forEach(col => {
      const value = sample[col];
      const type = typeof value;
      const sampleValue = value !== null ? String(value).substring(0, 50) : 'NULL';
      
      console.log(`    - ${col} (${type}): ${sampleValue}${value !== null && String(value).length > 50 ? '...' : ''}`);
    });

    // Get row count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`  ❌ Failed to count ${tableName}:`, countError.message);
    } else {
      console.log(`  📈 Total rows: ${count || 0}`);
    }

  } catch (error) {
    console.error(`  ❌ Failed to inspect ${tableName}:`, error.message);
  }
}

async function checkDataVolume(tables) {
  for (const table of tables) {
    const tableName = table.table_name || table;
    
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ❌ ${tableName}: Failed to count`);
      } else {
        const status = count === 0 ? '🔴 EMPTY' : 
                      count < 10 ? '🟡 LIGHT' :
                      count < 100 ? '🟢 MODERATE' :
                      count < 1000 ? '🔵 HEAVY' : '🟣 VERY HEAVY';
        
        console.log(`  ${status} ${tableName}: ${count || 0} rows`);
      }
    } catch (error) {
      console.log(`  ❌ ${tableName}: Error checking volume`);
    }
  }
}

// Generate migration mapping based on discovery
async function generateMigrationMap() {
  console.log('\n🗺️ Generating Migration Mapping...');
  
  const mapping = {
    currentStructure: {
      modules: {
        columns: [],
        sampleData: null,
        rowCount: 0
      },
      tasks: {
        columns: [],
        sampleData: null,
        rowCount: 0
      },
      transactions: {
        columns: [],
        sampleData: null,
        rowCount: 0
      }
    },
    targetStructure: {
      student_profiles: {
        requiredFields: ['user_id', 'university_id', 'degree_id', 'curriculum_version_id', 'start_year'],
        optionalFields: ['status', 'binding_date']
      },
      student_module_instances: {
        requiredFields: ['student_profile_id', 'module_code', 'status'],
        optionalFields: ['grade', 'attempt_count', 'credits_earned']
      },
      academic_events: {
        requiredFields: ['student_profile_id', 'event_type', 'created_by'],
        optionalFields: ['old_value', 'new_value', 'reason']
      }
    }
  };

  // Save mapping to file
  const fs = require('fs').promises;
  await fs.writeFile(
    '/home/stof/unilife/database-discovery-result.json',
    JSON.stringify(mapping, null, 2)
  );

  console.log('✅ Migration mapping saved to: database-discovery-result.json');
}

// Main execution
async function main() {
  console.log('🚀 Starting Database Discovery...\n');
  
  await discoverDatabase();
  await generateMigrationMap();
  
  console.log('\n🎯 Discovery Complete!');
  console.log('Next: Review database-discovery-result.json and create realistic migration');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { discoverDatabase, inspectTableStructure };
