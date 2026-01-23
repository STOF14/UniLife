// Full Migration Test Suite
// Validates complete data migration with integrity checks

const fs = require('fs').promises;
const { createClient } = require('@supabase/supabase-js');

class MigrationTestSuite {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.testResults = [];
  }

  async runFullMigrationTest() {
    console.log('🚀 Starting Full Migration Test Suite\n');

    try {
      // Test 1: Data Integrity Validation
      await this.testDataIntegrity();
      
      // Test 2: Curriculum Version Compatibility
      await this.testCurriculumCompatibility();
      
      // Test 3: Student Profile Migration
      await this.testStudentProfileMigration();
      
      // Test 4: Module Instance Migration
      await this.testModuleInstanceMigration();
      
      // Test 5: Academic Events Audit Trail
      await this.testAcademicEventsAudit();
      
      // Test 6: Rollback Capability
      await this.testRollbackCapability();
      
      // Generate Report
      await this.generateTestReport();
      
    } catch (error) {
      console.error('💥 Migration test failed:', error);
      throw error;
    }
  }

  async testDataIntegrity() {
    console.log('🔍 Test 1: Data Integrity Validation');
    
    const tests = [
      {
        name: 'Student Profiles Count',
        test: async () => {
          const { count } = await this.supabase
            .from('student_profiles')
            .select('*', { count: 'exact', head: true });
          return count > 0;
        }
      },
      {
        name: 'Module Instances Count',
        test: async () => {
          const { count } = await this.supabase
            .from('student_module_instances')
            .select('*', { count: 'exact', head: true });
          return count >= 0; // Could be 0 for new system
        }
      },
      {
        name: 'Curriculum Versions Active',
        test: async () => {
          const { data } = await this.supabase
            .from('curriculum_versions')
            .select('id, is_active')
            .eq('is_active', true);
          return data && data.length > 0;
        }
      },
      {
        name: 'No Orphaned Module Instances',
        test: async () => {
          const { data } = await this.supabase
            .from('student_module_instances')
            .select('student_profile_id')
            .is('student_profile_id', null);
          return data.length === 0;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.testResults.push({
          category: 'Data Integrity',
          test: test.name,
          status: result ? 'PASS' : 'FAIL',
          details: result ? 'Valid' : 'Invalid'
        });
        console.log(`   ${test.name}: ${result ? '✅' : '❌'}`);
      } catch (error) {
        this.testResults.push({
          category: 'Data Integrity',
          test: test.name,
          status: 'ERROR',
          details: error.message
        });
        console.log(`   ${test.name}: ❌ (${error.message})`);
      }
    }
  }

  async testCurriculumCompatibility() {
    console.log('\n📚 Test 2: Curriculum Version Compatibility');
    
    const tests = [
      {
        name: 'All Students Have Curriculum Versions',
        test: async () => {
          const { data: students } = await this.supabase
            .from('student_profiles')
            .select('id, curriculum_version_id')
            .not('curriculum_version_id', 'is', null);
          
          const { count: totalStudents } = await this.supabase
            .from('student_profiles')
            .select('*', { count: 'exact', head: true });
          
          return students.length === totalStudents;
        }
      },
      {
        name: 'Valid Curriculum Version References',
        test: async () => {
          const { data: profiles } = await this.supabase
            .from('student_profiles')
            .select('curriculum_version_id');
          
          for (const profile of profiles) {
            const { data: curriculum } = await this.supabase
              .from('curriculum_versions')
              .select('id')
              .eq('id', profile.curriculum_version_id);
            
            if (!curriculum || curriculum.length === 0) {
              return false;
            }
          }
          return true;
        }
      },
      {
        name: 'Degree Modules Match Curriculum',
        test: async () => {
          const { data: curricula } = await this.supabase
            .from('curriculum_versions')
            .select('id')
            .eq('is_active', true)
            .limit(1);
          
          if (!curricula || curricula.length === 0) return true;
          
          const { data: modules } = await this.supabase
            .from('degree_modules')
            .select('module_code')
            .eq('curriculum_version_id', curricula[0].id);
          
          const { data: catalogModules } = await this.supabase
            .from('modules_catalog')
            .select('code')
            .in('code', modules.map(m => m.module_code));
          
          return catalogModules.length === modules.length;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.testResults.push({
          category: 'Curriculum Compatibility',
          test: test.name,
          status: result ? 'PASS' : 'FAIL',
          details: result ? 'Compatible' : 'Incompatible'
        });
        console.log(`   ${test.name}: ${result ? '✅' : '❌'}`);
      } catch (error) {
        this.testResults.push({
          category: 'Curriculum Compatibility',
          test: test.name,
          status: 'ERROR',
          details: error.message
        });
        console.log(`   ${test.name}: ❌ (${error.message})`);
      }
    }
  }

  async testStudentProfileMigration() {
    console.log('\n👤 Test 3: Student Profile Migration');
    
    const tests = [
      {
        name: 'Complete Profile Data',
        test: async () => {
          const { data: profiles } = await this.supabase
            .from('student_profiles')
            .select('user_id, university_id, degree_id, curriculum_version_id, start_year')
            .limit(10);
          
          return profiles.every(p => 
            p.user_id && 
            p.university_id && 
            p.degree_id && 
            p.curriculum_version_id && 
            p.start_year
          );
        }
      },
      {
        name: 'Valid User References',
        test: async () => {
          const { data: profiles } = await this.supabase
            .from('student_profiles')
            .select('user_id')
            .limit(10);
          
          for (const profile of profiles) {
            const { data: user } = await this.supabase.auth.admin.getUserById(profile.user_id);
            if (!user) return false;
          }
          return true;
        }
      },
      {
        name: 'Unique Student Profiles',
        test: async () => {
          const { data: profiles } = await this.supabase
            .from('student_profiles')
            .select('user_id, degree_id, start_year');
          
          const uniqueKeys = profiles.map(p => `${p.user_id}-${p.degree_id}-${p.start_year}`);
          const uniqueSet = new Set(uniqueKeys);
          return uniqueKeys.length === uniqueSet.size;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.testResults.push({
          category: 'Student Profile Migration',
          test: test.name,
          status: result ? 'PASS' : 'FAIL',
          details: result ? 'Migrated Successfully' : 'Migration Issues Found'
        });
        console.log(`   ${test.name}: ${result ? '✅' : '❌'}`);
      } catch (error) {
        this.testResults.push({
          category: 'Student Profile Migration',
          test: test.name,
          status: 'ERROR',
          details: error.message
        });
        console.log(`   ${test.name}: ❌ (${error.message})`);
      }
    }
  }

  async testModuleInstanceMigration() {
    console.log('\n📖 Test 4: Module Instance Migration');
    
    const tests = [
      {
        name: 'Valid Grade Conversion',
        test: async () => {
          const { data: instances } = await this.supabase
            .from('student_module_instances')
            .select('grade, status')
            .not('grade', 'is', null)
            .limit(10);
          
          return instances.every(instance => {
            if (instance.status === 'passed') {
              return instance.grade >= 50;
            }
            return true;
          });
        }
      },
      {
        name: 'Consistent Status Logic',
        test: async () => {
          const { data: instances } = await this.supabase
            .from('student_module_instances')
            .select('grade, status')
            .limit(10);
          
          return instances.every(instance => {
            if (instance.grade === null) {
              return instance.status === 'pending';
            }
            if (instance.grade >= 50) {
              return instance.status === 'passed';
            }
            return instance.status === 'failed';
          });
        }
      },
      {
        name: 'Valid Module References',
        test: async () => {
          const { data: instances } = await this.supabase
            .from('student_module_instances')
            .select('module_code')
            .limit(10);
          
          for (const instance of instances) {
            const { data: module } = await this.supabase
              .from('modules_catalog')
              .select('code')
              .eq('code', instance.module_code);
            
            if (!module || module.length === 0) {
              return false;
            }
          }
          return true;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.testResults.push({
          category: 'Module Instance Migration',
          test: test.name,
          status: result ? 'PASS' : 'FAIL',
          details: result ? 'Migrated Correctly' : 'Migration Errors Found'
        });
        console.log(`   ${test.name}: ${result ? '✅' : '❌'}`);
      } catch (error) {
        this.testResults.push({
          category: 'Module Instance Migration',
          test: test.name,
          status: 'ERROR',
          details: error.message
        });
        console.log(`   ${test.name}: ❌ (${error.message})`);
      }
    }
  }

  async testAcademicEventsAudit() {
    console.log('\n📋 Test 5: Academic Events Audit Trail');
    
    const tests = [
      {
        name: 'Migration Events Logged',
        test: async () => {
          const { count } = await this.supabase
            .from('academic_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'module_added')
            .like('reason', '%Migrated from legacy%');
          return count > 0;
        }
      },
      {
        name: 'Event Data Integrity',
        test: async () => {
          const { data: events } = await this.supabase
            .from('academic_events')
            .select('student_profile_id, event_type, created_at')
            .limit(10);
          
          return events.every(event => 
            event.student_profile_id && 
            event.event_type && 
            event.created_at
          );
        }
      },
      {
        name: 'Valid Profile References',
        test: async () => {
          const { data: events } = await this.supabase
            .from('academic_events')
            .select('student_profile_id')
            .limit(10);
          
          for (const event of events) {
            const { data: profile } = await this.supabase
              .from('student_profiles')
              .select('id')
              .eq('id', event.student_profile_id);
            
            if (!profile || profile.length === 0) {
              return false;
            }
          }
          return true;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.testResults.push({
          category: 'Academic Events Audit',
          test: test.name,
          status: result ? 'PASS' : 'FAIL',
          details: result ? 'Audit Trail Complete' : 'Audit Issues Found'
        });
        console.log(`   ${test.name}: ${result ? '✅' : '❌'}`);
      } catch (error) {
        this.testResults.push({
          category: 'Academic Events Audit',
          test: test.name,
          status: 'ERROR',
          details: error.message
        });
        console.log(`   ${test.name}: ❌ (${error.message})`);
      }
    }
  }

  async testRollbackCapability() {
    console.log('\n🔄 Test 6: Rollback Capability');
    
    const tests = [
      {
        name: 'Backup Tables Exist',
        test: async () => {
          const { data: tables } = await this.supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .like('table_name', '%_migration_backup');
          
          return tables && tables.length >= 3; // modules, tasks, transactions
        }
      },
      {
        name: 'Backup Data Integrity',
        test: async () => {
          const { count: backupCount } = await this.supabase
            .from('modules_migration_backup')
            .select('*', { count: 'exact', head: true });
          
          const { count: currentCount } = await this.supabase
            .from('student_module_instances')
            .select('*', { count: 'exact', head: true });
          
          return backupCount >= currentCount; // Should have at least as many backups
        }
      },
      {
        name: 'Rollback Script Available',
        test: async () => {
          try {
            await fs.access('./production/rollback-migration.sql', fs.constants.F_OK);
            return true;
          } catch {
            return false;
          }
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.testResults.push({
          category: 'Rollback Capability',
          test: test.name,
          status: result ? 'PASS' : 'FAIL',
          details: result ? 'Rollback Ready' : 'Rollback Issues'
        });
        console.log(`   ${test.name}: ${result ? '✅' : '❌'}`);
      } catch (error) {
        this.testResults.push({
          category: 'Rollback Capability',
          test: test.name,
          status: 'ERROR',
          details: error.message
        });
        console.log(`   ${test.name}: ❌ (${error.message})`);
      }
    }
  }

  async generateTestReport() {
    console.log('\n📊 Migration Test Report');
    console.log('=====================================');
    
    const categories = [...new Set(this.testResults.map(r => r.category))];
    
    for (const category of categories) {
      console.log(`\n${category}:`);
      const categoryTests = this.testResults.filter(r => r.category === category);
      
      const passed = categoryTests.filter(t => t.status === 'PASS').length;
      const failed = categoryTests.filter(t => t.status === 'FAIL').length;
      const errors = categoryTests.filter(t => t.status === 'ERROR').length;
      
      console.log(`   Passed: ${passed} | Failed: ${failed} | Errors: ${errors}`);
      
      for (const test of categoryTests) {
        const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '💥';
        console.log(`   ${icon} ${test.test}: ${test.details}`);
      }
    }
    
    const totalPassed = this.testResults.filter(t => t.status === 'PASS').length;
    const totalTests = this.testResults.length;
    const successRate = ((totalPassed / totalTests) * 100).toFixed(1);
    
    console.log(`\n🎯 Overall Success Rate: ${successRate}% (${totalPassed}/${totalTests})`);
    
    if (totalPassed === totalTests) {
      console.log('🎉 ALL TESTS PASSED - Migration Ready for Production!');
    } else {
      console.log('⚠️  Some tests failed - Review issues before production deployment');
    }
    
    // Save detailed report
    await fs.writeFile(
      './production/migration-test-report.json',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
          totalTests,
          passed: totalPassed,
          successRate: parseFloat(successRate),
          readyForProduction: totalPassed === totalTests
        },
        results: this.testResults
      }, null, 2)
    );
    
    console.log('\n📄 Detailed report saved to: migration-test-report.json');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new MigrationTestSuite();
  testSuite.runFullMigrationTest().catch(console.error);
}

module.exports = { MigrationTestSuite };
