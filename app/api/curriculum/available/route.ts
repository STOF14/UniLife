// API Route: Available Curriculum Versions
// Returns available curriculum versions for a degree

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const degreeId = searchParams.get('degreeId');

    if (!degreeId) {
      return NextResponse.json(
        { error: 'Degree ID required' },
        { status: 400 }
      );
    }

    // Get available curriculum versions for the degree
    const { data: curricula, error } = await supabase
      .from('curriculum_versions')
      .select(`
        id,
        academic_year,
        version_hash,
        effective_date,
        is_active,
        created_at
      `)
      .eq('degree_id', degreeId)
      .order('academic_year DESC, effective_date DESC');

    if (error) {
      throw new Error(`Failed to fetch curricula: ${error.message}`);
    }

    // Count modules for each curriculum
    const curriculaWithCounts = await Promise.all(
      (curricula || []).map(async (curriculum) => {
        const { count } = await supabase
          .from('degree_modules')
          .select('*', { count: 'exact', head: true })
          .eq('curriculum_version_id', curriculum.id);

        return {
          ...curriculum,
          moduleCount: count || 0
        };
      })
    );

    return NextResponse.json({
      curricula: curriculaWithCounts
    });

  } catch (error) {
    console.error('Failed to fetch available curricula:', error);
    return NextResponse.json(
      { error: 'Failed to fetch curricula' },
      { status: 500 }
    );
  }
}
