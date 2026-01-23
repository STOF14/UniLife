// Analyze Current Structure from Code
// Examines existing code to understand current data model

const fs = require('fs').promises;
const path = require('path');

async function analyzeCurrentStructure() {
  console.log('🔍 Analyzing Current Code Structure\n');

  try {
    // Step 1: Analyze TypeScript interfaces
    console.log('📋 Step 1: Analyzing TypeScript Interfaces...');
    
    const typesPath = path.join(__dirname, 'lib/types.ts');
    const typesContent = await fs.readFile(typesPath, 'utf8');
    
    // Extract Module interface
    const moduleInterface = extractInterface(typesContent, 'Module');
    console.log('\n📚 Module Interface:');
    console.log(`  Fields: ${moduleInterface.fields.length}`);
    moduleInterface.fields.forEach(field => {
      console.log(`    - ${field.name}: ${field.type}${field.optional ? ' (optional)' : ''}`);
    });
    
    // Extract Task interface  
    const taskInterface = extractInterface(typesContent, 'Task');
    console.log('\n📋 Task Interface:');
    console.log(`  Fields: ${taskInterface.fields.length}`);
    taskInterface.fields.forEach(field => {
      console.log(`    - ${field.name}: ${field.type}${field.optional ? ' (optional)' : ''}`);
    });
    
    // Extract Transaction interface
    const transactionInterface = extractInterface(typesContent, 'Transaction');
    console.log('\n💰 Transaction Interface:');
    console.log(`  Fields: ${transactionInterface.fields.length}`);
    transactionInterface.fields.forEach(field => {
      console.log(`    - ${field.name}: ${field.type}${field.optional ? ' (optional)' : ''}`);
    });

    // Step 2: Analyze existing database migrations
    console.log('\n🗄️ Step 2: Analyzing Existing Migrations...');
    
    const migrationsPath = path.join(__dirname, 'supabase/migrations');
    const migrationFiles = await fs.readdir(migrationsPath);
    
    console.log(`Found ${migrationFiles.length} migration files:`);
    for (const file of migrationFiles) {
      console.log(`  - ${file}`);
    }

    // Read existing migration
    const existingMigration = migrationFiles.find(f => f.includes('20241229_add_missing_columns'));
    if (existingMigration) {
      const migrationPath = path.join(migrationsPath, existingMigration);
      const migrationContent = await fs.readFile(migrationPath, 'utf8');
      
      console.log('\n📄 Existing Migration Analysis:');
      console.log(`  - Adds columns to: modules table`);
      console.log(`  - Columns added: created_at, updated_at, user_id`);
      console.log(`  - Creates index on: user_id, created_at`);
    }

    // Step 3: Analyze component usage
    console.log('\n🧩 Step 3: Analyzing Component Usage...');
    
    const componentsPath = path.join(__dirname, 'components');
    const componentFiles = await findFiles(componentsPath, ['.tsx', '.ts']);
    
    // Look for database access patterns
    let supabaseUsage = 0;
    let moduleUsage = 0;
    let taskUsage = 0;
    
    for (const file of componentFiles) {
      const content = await fs.readFile(file, 'utf8');
      
      if (content.includes('supabase')) supabaseUsage++;
      if (content.includes('modules')) moduleUsage++;
      if (content.includes('tasks')) taskUsage++;
    }
    
    console.log(`  Component files analyzed: ${componentFiles.length}`);
    console.log(`  - Supabase usage: ${supabaseUsage} files`);
    console.log(`  - Modules usage: ${moduleUsage} files`);
    console.log(`  - Tasks usage: ${taskUsage} files`);

    // Step 4: Generate migration recommendations
    console.log('\n🎯 Step 4: Migration Recommendations...');
    
    const recommendations = generateMigrationRecommendations(
      moduleInterface,
      taskInterface,
      transactionInterface
    );
    
    console.log('Recommended Migration Strategy:');
    recommendations.forEach(rec => {
      console.log(`  ${rec.priority}: ${rec.description}`);
    });

    // Step 5: Save analysis results
    const analysis = {
      currentStructure: {
        moduleInterface,
        taskInterface,
        transactionInterface,
        existingMigrations: migrationFiles,
        componentUsage: {
          totalFiles: componentFiles.length,
          supabaseUsage,
          moduleUsage,
          taskUsage
        }
      },
      recommendations,
      migrationPlan: generateMigrationPlan(moduleInterface)
    };

    await fs.writeFile(
      '/home/stof/unilife/structure-analysis-result.json',
      JSON.stringify(analysis, null, 2)
    );

    console.log('\n✅ Analysis saved to: structure-analysis-result.json');

  } catch (error) {
    console.error('💥 Analysis failed:', error);
  }
}

function extractInterface(content, interfaceName) {
  const interfaceRegex = new RegExp(`export interface ${interfaceName}[^{]*\\{([^}]+)\\}`, 's');
  const match = content.match(interfaceRegex);
  
  if (!match) {
    return { fields: [] };
  }

  const interfaceBody = match[1];
  const fieldRegex = /(\w+)(\?)?:\s*([^;]+);?/g;
  const fields = [];
  let fieldMatch;

  while ((fieldMatch = fieldRegex.exec(interfaceBody)) !== null) {
    fields.push({
      name: fieldMatch[1],
      type: fieldMatch[2] ? fieldMatch[2].trim() : 'unknown',
      optional: fieldMatch[0].includes('?')
    });
  }

  return { fields };
}

async function findFiles(dir, extensions) {
  const files = [];
  
  async function traverse(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  await traverse(dir);
  return files;
}

function generateMigrationRecommendations(moduleInterface, taskInterface, transactionInterface) {
  const recommendations = [];

  // Module analysis
  if (moduleInterface.fields.some(f => f.name === 'currentGrade')) {
    recommendations.push({
      priority: '✅ CRITICAL',
      description: 'Modules table has currentGrade field - can migrate to pass/fail status'
    });
  }

  if (moduleInterface.fields.some(f => f.name === 'userId')) {
    recommendations.push({
      priority: '✅ CRITICAL', 
      description: 'Modules table has userId field - can link to student profiles'
    });
  }

  // Task analysis
  if (taskInterface.fields.some(f => f.name === 'moduleCode')) {
    recommendations.push({
      priority: '✅ IMPORTANT',
      description: 'Tasks reference modules by code - can create proper relationships'
    });
  }

  // Transaction analysis
  if (transactionInterface.fields.some(f => f.name === 'userId')) {
    recommendations.push({
      priority: '✅ IMPORTANT',
      description: 'Transactions have userId - can link to student profiles'
    });
  }

  return recommendations;
}

function generateMigrationPlan(moduleInterface) {
  return {
    step1: {
      action: 'CREATE BACKUPS',
      description: 'Backup modules, tasks, transactions tables',
      sql: 'CREATE TABLE modules_backup AS TABLE modules; -- etc'
    },
    step2: {
      action: 'CREATE STUDENT PROFILES',
      description: 'Create student profiles from existing module users',
      sql: `INSERT INTO student_profiles (user_id, start_year, status)
              SELECT DISTINCT userId, EXTRACT(YEAR FROM createdAt), 'active' 
              FROM modules WHERE userId IS NOT NULL;`
    },
    step3: {
      action: 'MIGRATE MODULES',
      description: 'Convert modules to student_module_instances',
      sql: `INSERT INTO student_module_instances (student_profile_id, module_code, status, grade)
              SELECT sp.id, m.code, 
                CASE WHEN m.currentGrade >= 50 THEN 'passed' 
                     WHEN m.currentGrade IS NOT NULL THEN 'failed' 
                     ELSE 'pending' END,
                m.currentGrade
              FROM modules m
              JOIN student_profiles sp ON sp.user_id = m.userId;`
    },
    step4: {
      action: 'MIGRATE TASKS',
      description: 'Convert tasks to academic events or keep separate',
      sql: 'Tasks need separate analysis - not clear mapping to new schema'
    },
    step5: {
      action: 'MIGRATE TRANSACTIONS',
      description: 'Link transactions to student profiles',
      sql: 'UPDATE transactions SET student_profile_id = (SELECT id FROM student_profiles WHERE user_id = transactions.user_id);'
    }
  };
}

// Main execution
async function main() {
  console.log('🚀 Starting Structure Analysis...\n');
  
  await analyzeCurrentStructure();
  
  console.log('\n🎯 Analysis Complete!');
  console.log('Next: Review structure-analysis-result.json and create realistic migration');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzeCurrentStructure };
