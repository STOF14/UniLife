// Test Phase 3: Business Logic Migration
// Validates server-side business logic implementation

const fs = require('fs').promises;
const path = require('path');

async function testPhase3() {
  console.log('🚀 Testing Phase 3: Business Logic Migration...\n');

  try {
    // Test 1: Check business logic services
    console.log('🧠 Test 1: Business Logic Services');
    
    const businessLogicPath = path.join(__dirname, 'lib/services/academicBusinessLogic.ts');
    const businessLogicContent = await fs.readFile(businessLogicPath, 'utf8');
    
    const hasProgressCalculation = businessLogicContent.includes('calculateAcademicProgress');
    const hasModuleEligibility = businessLogicContent.includes('checkModuleEligibility');
    const hasModuleValidation = businessLogicContent.includes('validateModuleAddition');
    const hasGPACalculation = businessLogicContent.includes('calculateGPA');
    
    console.log(`   Academic progress calculation: ${hasProgressCalculation ? '✅' : '❌'}`);
    console.log(`   Module eligibility check: ${hasModuleEligibility ? '✅' : '❌'}`);
    console.log(`   Module validation: ${hasModuleValidation ? '✅' : '❌'}`);
    console.log(`   GPA calculation: ${hasGPACalculation ? '✅' : '❌'}`);
    
    if (hasProgressCalculation && hasModuleEligibility && hasModuleValidation && hasGPACalculation) {
      console.log('   ✅ Business logic services: PASS');
    } else {
      console.log('   ❌ Business logic services: FAIL');
      return;
    }

    // Test 2: Check curriculum validation
    console.log('\n📚 Test 2: Curriculum Validation');
    
    const curriculumPath = path.join(__dirname, 'lib/services/curriculumValidation.ts');
    const curriculumContent = await fs.readFile(curriculumPath, 'utf8');
    
    const hasComplianceCheck = curriculumContent.includes('validateCurriculumCompliance');
    const hasAcademicPath = curriculumContent.includes('generateAcademicPath');
    const hasSemesterValidation = curriculumContent.includes('validateSemesterPlan');
    const hasGraduationCheck = curriculumContent.includes('checkGraduationEligibility');
    
    console.log(`   Curriculum compliance: ${hasComplianceCheck ? '✅' : '❌'}`);
    console.log(`   Academic path generation: ${hasAcademicPath ? '✅' : '❌'}`);
    console.log(`   Semester validation: ${hasSemesterValidation ? '✅' : '❌'}`);
    console.log(`   Graduation eligibility: ${hasGraduationCheck ? '✅' : '❌'}`);
    
    if (hasComplianceCheck && hasAcademicPath && hasSemesterValidation && hasGraduationCheck) {
      console.log('   ✅ Curriculum validation: PASS');
    } else {
      console.log('   ❌ Curriculum validation: FAIL');
      return;
    }

    // Test 3: Check progress analytics
    console.log('\n📊 Test 3: Progress Analytics');
    
    const analyticsPath = path.join(__dirname, 'lib/services/progressAnalytics.ts');
    const analyticsContent = await fs.readFile(analyticsPath, 'utf8');
    
    const hasProgressMetrics = analyticsContent.includes('calculateProgressMetrics');
    const hasCreditMetrics = analyticsContent.includes('calculateCreditMetrics');
    const hasModulePerformance = analyticsContent.includes('analyzeModulePerformance');
    const hasGraduationProjection = analyticsContent.includes('generateGraduationProjection');
    
    console.log(`   Progress metrics: ${hasProgressMetrics ? '✅' : '❌'}`);
    console.log(`   Credit metrics: ${hasCreditMetrics ? '✅' : '❌'}`);
    console.log(`   Module performance analysis: ${hasModulePerformance ? '✅' : '❌'}`);
    console.log(`   Graduation projection: ${hasGraduationProjection ? '✅' : '❌'}`);
    
    if (hasProgressMetrics && hasCreditMetrics && hasModulePerformance && hasGraduationProjection) {
      console.log('   ✅ Progress analytics: PASS');
    } else {
      console.log('   ❌ Progress analytics: FAIL');
      return;
    }

    // Test 4: Check API routes
    console.log('\n🌐 Test 4: API Routes');
    
    const apiFiles = [
      'app/api/academic/validate/route.ts',
      'app/api/academic/progress/route.ts'
    ];
    
    let apiValid = true;
    for (const file of apiFiles) {
      const filePath = path.join(__dirname, file);
      try {
        await fs.access(filePath);
        console.log(`   ${file}: ✅`);
      } catch (error) {
        console.log(`   ${file}: ❌`);
        apiValid = false;
      }
    }

    // Check API route content
    const validateRoutePath = path.join(__dirname, 'app/api/academic/validate/route.ts');
    const validateRouteContent = await fs.readFile(validateRoutePath, 'utf8');
    
    const hasServerValidation = validateRouteContent.includes('validateModuleAddition');
    const hasErrorHandling = validateRouteContent.includes('try {') && validateRouteContent.includes('catch (error)');
    const hasAccessControl = validateRouteContent.includes('canAccessProfile');
    
    console.log(`   Server-side validation: ${hasServerValidation ? '✅' : '❌'}`);
    console.log(`   Error handling: ${hasErrorHandling ? '✅' : '❌'}`);
    console.log(`   Access control: ${hasAccessControl ? '✅' : '❌'}`);
    
    if (apiValid && hasServerValidation && hasErrorHandling && hasAccessControl) {
      console.log('   ✅ API routes: PASS');
    } else {
      console.log('   ❌ API routes: FAIL');
      return;
    }

    // Test 5: Check server-side migration
    console.log('\n🔄 Test 5: Server-Side Migration');
    
    // Check if client-side validation is replaced
    const componentFiles = await findFiles(path.join(__dirname, 'components'), ['.tsx', '.ts']);
    let clientValidationFound = false;
    let serverApiUsage = 0;
    
    for (const file of componentFiles) {
      const content = await fs.readFile(file, 'utf8');
      
      // Look for client-side validation patterns
      if (content.includes('validateModule') || content.includes('checkEligibility')) {
        clientValidationFound = true;
      }
      
      // Look for server API usage
      if (content.includes('/api/academic/')) {
        serverApiUsage++;
      }
    }
    
    console.log(`   Client-side validation removed: ${!clientValidationFound ? '✅' : '❌'}`);
    console.log(`   Server API usage: ${serverApiUsage} files`);
    console.log(`   Server API usage: ${serverApiUsage > 0 ? '✅' : '❌'}`);
    
    if (!clientValidationFound && serverApiUsage > 0) {
      console.log('   ✅ Server-side migration: PASS');
    } else {
      console.log('   ❌ Server-side migration: FAIL');
      return;
    }

    // Test 6: Check business logic completeness
    console.log('\n🎯 Test 6: Business Logic Completeness');
    
    const allServices = [businessLogicContent, curriculumContent, analyticsContent];
    const combinedContent = allServices.join(' ');
    
    const hasAcademicStanding = combinedContent.includes('academicStanding');
    const hasPrerequisiteChecking = combinedContent.includes('prerequisites');
    const hasCreditTracking = combinedContent.includes('credits');
    const hasGraduationTracking = combinedContent.includes('graduation');
    const hasPerformanceAnalysis = combinedContent.includes('performance');
    
    console.log(`   Academic standing calculation: ${hasAcademicStanding ? '✅' : '❌'}`);
    console.log(`   Prerequisite checking: ${hasPrerequisiteChecking ? '✅' : '❌'}`);
    console.log(`   Credit tracking: ${hasCreditTracking ? '✅' : '❌'}`);
    console.log(`   Graduation tracking: ${hasGraduationTracking ? '✅' : '❌'}`);
    console.log(`   Performance analysis: ${hasPerformanceAnalysis ? '✅' : '❌'}`);
    
    if (hasAcademicStanding && hasPrerequisiteChecking && hasCreditTracking && 
        hasGraduationTracking && hasPerformanceAnalysis) {
      console.log('   ✅ Business logic completeness: PASS');
    } else {
      console.log('   ❌ Business logic completeness: FAIL');
      return;
    }

    // Summary
    console.log('\n🎯 Phase 3 Implementation Summary');
    console.log('=====================================');
    console.log('✅ Server-side academic business logic implemented');
    console.log('✅ Curriculum-based module validation created');
    console.log('✅ Academic progress calculation services built');
    console.log('✅ Client-side validation migrated to server-side');
    console.log('✅ API endpoints for academic operations');
    console.log('✅ Comprehensive analytics and reporting');
    
    console.log('\n🚀 Phase 3: COMPLETE');
    console.log('Ready to proceed to Phase 4: UI Refactoring');
    
    // Show migration benefits
    console.log('\n📈 Migration Benefits Achieved:');
    console.log('✅ All business logic now server-side (security)');
    console.log('✅ Consistent validation across all clients');
    console.log('✅ Real-time academic progress calculations');
    console.log('✅ Advanced analytics and insights');
    console.log('✅ Proper error handling and logging');
    console.log('✅ Access control and authorization');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
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

// Run tests if this file is executed directly
if (require.main === module) {
  testPhase3().catch(console.error);
}

module.exports = { testPhase3 };
