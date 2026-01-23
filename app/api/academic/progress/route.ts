// API Route: Academic Progress
// Server-side progress calculations and analytics

import { NextRequest, NextResponse } from 'next/server';
import { AcademicBusinessLogic } from '@/lib/services/academicBusinessLogic';
import { ProgressAnalytics } from '@/lib/services/progressAnalytics';
import { CurriculumValidation } from '@/lib/services/curriculumValidation';
import { StudentProfileService } from '@/lib/services/studentProfile';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentProfileId = searchParams.get('studentProfileId');
    const type = searchParams.get('type') || 'basic';

    if (!studentProfileId) {
      return NextResponse.json(
        { error: 'Student profile ID required' },
        { status: 400 }
      );
    }

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

    switch (type) {
      case 'basic':
        result = await AcademicBusinessLogic.calculateAcademicProgress(studentProfileId);
        break;

      case 'metrics':
        result = await ProgressAnalytics.calculateProgressMetrics(studentProfileId);
        break;

      case 'credits':
        result = await ProgressAnalytics.calculateCreditMetrics(studentProfileId);
        break;

      case 'performance':
        result = await ProgressAnalytics.analyzeModulePerformance(studentProfileId);
        break;

      case 'trends':
        result = await ProgressAnalytics.calculateProgressTrends(studentProfileId);
        break;

      case 'projection':
        result = await ProgressAnalytics.generateGraduationProjection(studentProfileId);
        break;

      case 'curriculum':
        result = await CurriculumValidation.generateAcademicPath(studentProfileId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid progress type' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Academic progress error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate progress' },
      { status: 500 }
    );
  }
}
