// Student Profile Service
// Manages student profile creation and academic binding

import { supabaseAdmin as supabase } from '@/lib/supabase/adminClient';
import { AcademicValidator } from '../validation/academic';

export interface StudentProfileData {
  userId: string;
  universityId: string;
  degreeId: string;
  curriculumVersionId: string;
  startYear: number;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  university_id: string;
  degree_id: string;
  curriculum_version_id: string;
  start_year: number;
  binding_date: string;
  status: 'active' | 'completed' | 'transferred' | 'suspended';
  created_at: string;
  updated_at: string;
}

export class StudentProfileService {
  // Create new student profile with validation
  static async createStudentProfile(data: StudentProfileData): Promise<StudentProfile> {
    // Validate the binding
    const validation = AcademicValidator.validateStudentBinding(
      data.userId,
      data.degreeId,
      data.curriculumVersionId,
      data.startYear
    );

    if (!validation.valid) {
      throw new Error(`Invalid student binding: ${validation.error}`);
    }

    // Check if user already has an active profile for this degree
    const existingProfile = await this.getActiveProfile(data.userId);
    if (existingProfile) {
      throw new Error('User already has an active student profile');
    }

    // Create the student profile
    const { data: profile, error } = await supabase
      .from('student_profiles')
      .insert({
        user_id: data.userId,
        university_id: data.universityId,
        degree_id: data.degreeId,
        curriculum_version_id: data.curriculumVersionId,
        start_year: data.startYear,
        binding_date: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create student profile: ${error.message}`);
    }

    // Log the creation event
    await this.logAcademicEvent(
      profile.id,
      'degree_change',
      null,
      JSON.stringify({
        degreeId: data.degreeId,
        curriculumVersionId: data.curriculumVersionId,
        startYear: data.startYear
      }),
      'Student profile created',
      data.userId
    );

    return profile;
  }

  // Get active student profile for user
  static async getActiveProfile(userId: string): Promise<StudentProfile | null> {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to get student profile: ${error.message}`);
    }

    return data;
  }

  // Get all student profiles for user
  static async getAllProfiles(userId: string): Promise<StudentProfile[]> {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get student profiles: ${error.message}`);
    }

    return data || [];
  }

  // Update student profile status
  static async updateStatus(
    profileId: string, 
    status: 'active' | 'completed' | 'transferred' | 'suspended',
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('student_profiles')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);

    if (error) {
      throw new Error(`Failed to update student profile status: ${error.message}`);
    }

    // Log the status change
    await this.logAcademicEvent(
      profileId,
      'status_change',
      null,
      status,
      `Status updated to ${status}`,
      userId
    );
  }

  // Check if user needs onboarding
  static async needsOnboarding(userId: string): Promise<boolean> {
    const profile = await this.getActiveProfile(userId);
    
    // User needs onboarding if they have no profile or have incomplete profile
    if (!profile) {
      return true;
    }

    // Check if profile has degree and curriculum assigned
    return !profile.degree_id || !profile.curriculum_version_id;
  }

  // Get student profile with related data
  static async getProfileWithDetails(profileId: string): Promise<any> {
    const { data, error } = await supabase
      .from('student_profiles')
      .select(`
        *,
        universities(name, code),
        degrees_catalog(name, code, faculty, level),
        curriculum_versions(academic_year, version_hash, is_active)
      `)
      .eq('id', profileId)
      .single();

    if (error) {
      throw new Error(`Failed to get student profile details: ${error.message}`);
    }

    return data;
  }

  // Create student profile for migrated users
  static async createMigratedProfile(
    userId: string,
    universityId: string,
    startYear: number
  ): Promise<StudentProfile> {
    const { data: profile, error } = await supabase
      .from('student_profiles')
      .insert({
        user_id: userId,
        university_id: universityId,
        degree_id: null, // Will be set during onboarding
        curriculum_version_id: null, // Will be set during onboarding
        start_year: startYear,
        binding_date: new Date().toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create migrated student profile: ${error.message}`);
    }

    return profile;
  }

  // Log academic events
  private static async logAcademicEvent(
    studentProfileId: string,
    eventType: string,
    oldValue: string | null,
    newValue: string | null,
    reason: string,
    createdBy: string
  ): Promise<void> {
    const { error } = await supabase
      .from('academic_events')
      .insert({
        student_profile_id: studentProfileId,
        event_type: eventType,
        old_value: oldValue,
        new_value: newValue,
        reason,
        created_by: createdBy
      });

    if (error) {
      console.error('Failed to log academic event:', error);
    }
  }

  // Get academic history for student
  static async getAcademicHistory(profileId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('academic_events')
      .select('*')
      .eq('student_profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get academic history: ${error.message}`);
    }

    return data || [];
  }

  // Validate student can access profile
  static async canAccessProfile(userId: string, profileId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('id', profileId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to validate profile access: ${error.message}`);
    }

    return data !== null;
  }

  // Get migration status
  static async getMigrationStatus(): Promise<{
    totalUsers: number;
    migratedProfiles: number;
    needsOnboarding: number;
  }> {
    // Get total users with modules
    const { count: totalUsers } = await supabase
      .from('modules')
      .select('user_id', { count: 'exact', head: true })
      .not('is', 'user_id', null);

    // Get migrated profiles
    const { count: migratedProfiles } = await supabase
      .from('student_profiles')
      .select('id', { count: 'exact', head: true });

    // Get profiles needing onboarding
    const { count: needsOnboarding } = await supabase
      .from('student_profiles')
      .select('id', { count: 'exact', head: true })
      .is('degree_id', null);

    return {
      totalUsers: totalUsers || 0,
      migratedProfiles: migratedProfiles || 0,
      needsOnboarding: needsOnboarding || 0
    };
  }
}
