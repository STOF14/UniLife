// API Route: Academic Validation
// Server-side validation for academic operations

import { NextRequest, NextResponse } from 'next/server';
import { AcademicBusinessLogic } from '@/lib/services/academicBusinessLogic';
import { CurriculumValidation } from '@/lib/services/curriculumValidation';
import { StudentProfileService } from '@/lib/services/studentProfile';

export async function POST(request: NextRequest) {
  try {
    const { action, studentProfileId, data } = await request.json();

    // Validate user has access to this profile
    const hasAccess = await StudentProfileService.canAccessProfile(
      request.headers.get('x-user-id') || '',
      studentProfileId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    let result;

    switch (action) {
      case 'validateModuleAddition':
        result = await AcademicBusinessLogic.validateModuleAddition(
          studentProfileId,
          data.moduleCode
        );
        break;

      case 'checkModuleEligibility':
        result = await AcademicBusinessLogic.checkModuleEligibility(
          studentProfileId,
          data.moduleCode
        );
        break;

      case 'validateSemesterPlan':
        result = await CurriculumValidation.validateSemesterPlan(
          studentProfileId,
          data.semesterModules
        );
        break;

      case 'checkCurriculumCompliance':
        result = await CurriculumValidation.validateCurriculumCompliance(
          studentProfileId
        );
        break;

      case 'checkGraduationEligibility':
        result = await CurriculumValidation.checkGraduationEligibility(
          studentProfileId
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid validation action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Academic validation error:', error);
    return NextResponse.json(
      { error: 'Validation failed due to system error' },
      { status: 500 }
    );
  }
}
