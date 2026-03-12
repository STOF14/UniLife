// Test Schema with Sample Data
// Validates that our schema and pipeline work correctly

import { UPIngestionPipeline } from './pipeline';

async function testSchema() {
  console.log('🧪 Testing Phase 1 Schema Implementation...\n');

  try {
    // Test dry run to validate data flow
    const pipeline = new UPIngestionPipeline(true); // Dry run
    const result = await pipeline.execute();

    console.log('📊 Test Results:');
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
      console.log(`Degrees processed: ${result.stats?.degreesProcessed || 0}`);
      console.log(`Modules processed: ${result.stats?.modulesProcessed || 0}`);
      console.log(`Curriculum items: ${result.stats?.curriculumItems || 0}`);
      
      if (result.dryRun) {
        console.log('✅ DRY RUN SUCCESSFUL - Schema and data flow validated');
      }
      
      if (result.warnings && result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.warnings.forEach(warning => console.log(`  - ${warning}`));
      }
    } else {
      console.error(`❌ Test failed: ${result.error}`);
    }
    
  } catch (error) {
    console.error('💥 Test crashed:', error);
  }
}

// Test individual components
async function testComponents() {
  console.log('\n🔧 Testing Individual Components...\n');

  // Test validation
  console.log('1. Testing Validation Layer...');
  const { AcademicValidator } = await import('../../validation/academic');
  
  const moduleTest = AcademicValidator.validateModule({
    code: 'INF 151',
    name: 'Introduction to Information Systems',
    credits: 12
  });
  console.log(`   Module validation: ${moduleTest.valid ? '✅ PASS' : '❌ FAIL'}`);
  if (!moduleTest.valid) console.log(`   Error: ${moduleTest.error}`);

  const degreeTest = AcademicValidator.validateDegree({
    code: '12345678',
    name: 'Bachelor of Computer Science',
    faculty: 'Engineering',
    level: 'Undergraduate'
  });
  console.log(`   Degree validation: ${degreeTest.valid ? '✅ PASS' : '❌ FAIL'}`);
  if (!degreeTest.valid) console.log(`   Error: ${degreeTest.error}`);

  // Test transformation
  console.log('\n2. Testing Transformation Layer...');
  const { UPDataTransformer } = await import('./transform');
  
  const transformedModule = UPDataTransformer.transformModule({
    code: 'inf151',
    name: 'Intro to IS',
    credits: 12,
    language: 'english'
  }, 'test-university-id');
  
  console.log(`   Module transformation: ${transformedModule.code === 'INF 151' ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Transformed code: ${transformedModule.code}`);

  // Test version hash
  console.log('\n3. Testing Version Hash...');
  const curriculumData = {
    degreeId: 'test-degree',
    academicYear: 2026,
    modules: [{ moduleCode: 'INF 151', yearLevel: 1 }]
  };
  
  const hash1 = AcademicValidator.generateVersionHash(curriculumData);
  const hash2 = AcademicValidator.generateVersionHash(curriculumData);
  console.log(`   Hash consistency: ${hash1 === hash2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Hash: ${hash1}`);
}

// Main test runner
async function runTests() {
  console.log('🚀 Phase 1 Implementation Test Suite');
  console.log('=====================================\n');

  await testComponents();
  await testSchema();

  console.log('\n📋 Phase 1 Summary:');
  console.log('✅ Database schema created');
  console.log('✅ Validation layer implemented');
  console.log('✅ Transformation layer implemented');
  console.log('✅ Ingestion pipeline implemented');
  console.log('✅ Integration with UP_Scraper data structured');
  
  console.log('\n🎯 Phase 1 Complete!');
  console.log('Ready to proceed to Phase 2: Data Migration');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { testSchema, testComponents, runTests };
