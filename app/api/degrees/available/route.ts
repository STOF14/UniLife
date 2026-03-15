// API Route: Available Degrees
// Returns available degrees from authoritative catalog

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/adminClient';
import { DEV_DEGREES, DEV_UNIVERSITY } from '@/lib/devAcademicCatalog';

export const dynamic = 'force-dynamic';

const shouldUseDevCatalog =
  process.env.NEXT_PUBLIC_DEV_MODE === 'true' || process.env.NODE_ENV !== 'production';

export async function GET(request: NextRequest) {
  try {
    // Get University of Pretoria ID
    const { data: university, error: universityError } = await supabase
      .from('universities')
      .select('id')
      .eq('code', 'UP')
      .maybeSingle();

    if (universityError) {
      throw new Error(`Failed to fetch university: ${universityError.message}`);
    }

    if (!university) {
      if (shouldUseDevCatalog) {
        return NextResponse.json({
          degrees: DEV_DEGREES,
          university: DEV_UNIVERSITY,
        });
      }

      return NextResponse.json(
        {
          degrees: [],
          university: null,
        },
        { status: 200 }
      );
    }

    // Get available degrees
    const { data: degrees, error } = await supabase
      .from('degrees_catalog')
      .select(`
        id,
        code,
        name,
        faculty,
        level,
        duration_years,
        total_credits,
        nqf_level
      `)
      .eq('university_id', university.id)
      .order('faculty, level, name');

    if (error) {
      throw new Error(`Failed to fetch degrees: ${error.message}`);
    }

    return NextResponse.json({
      degrees: degrees || [],
      university: {
        id: university.id,
        name: 'University of Pretoria',
        code: 'UP'
      }
    });

  } catch (error) {
    console.error('Failed to fetch available degrees:', error);

    if (shouldUseDevCatalog) {
      return NextResponse.json({
        degrees: DEV_DEGREES,
        university: DEV_UNIVERSITY,
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch degrees' },
      { status: 500 }
    );
  }
}
