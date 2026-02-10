// API Route: Available Degrees
// Returns available degrees from authoritative catalog

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase/adminClient';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get University of Pretoria ID
    const { data: university } = await supabase
      .from('universities')
      .select('id')
      .eq('code', 'UP')
      .single();

    if (!university) {
      return NextResponse.json(
        { error: 'University of Pretoria not found' },
        { status: 404 }
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
    return NextResponse.json(
      { error: 'Failed to fetch degrees' },
      { status: 500 }
    );
  }
}
