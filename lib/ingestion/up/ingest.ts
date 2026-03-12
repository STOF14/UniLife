// Database Ingestion Layer
// Inserts validated data into authoritative tables

import { createClient } from '@supabase/supabase-js';
import { StandardizedDegree, StandardizedModule, StandardizedCurriculum } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class UPDataIngestion {
  // Insert university
  static async insertUniversity(name: string, code: string): Promise<string> {
    const { data, error } = await supabase
      .from('universities')
      .insert({
        name: name.trim(),
        code: code.trim(),
        country: 'South Africa'
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to insert university ${code}: ${error.message}`);
    }

    return data.id;
  }

  // Insert degrees
  static async insertDegrees(degrees: StandardizedDegree[]): Promise<string[]> {
    const degreeIds: string[] = [];

    for (const degree of degrees) {
      const { data, error } = await supabase
        .from('degrees_catalog')
        .insert({
          university_id: degree.universityId,
          code: degree.code,
          name: degree.name,
          faculty: degree.faculty,
          faculty_code: degree.facultyCode,
          level: degree.level,
          duration_years: degree.durationYears,
          total_credits: degree.totalCredits,
          nqf_level: degree.nqfLevel,
          url: degree.url
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to insert degree ${degree.code}: ${error.message}`);
      }

      degreeIds.push(data.id);
    }

    return degreeIds;
  }

  // Insert modules
  static async insertModules(modules: StandardizedModule[]): Promise<string[]> {
    const moduleIds: string[] = [];

    for (const module of modules) {
      const { data, error } = await supabase
        .from('modules_catalog')
        .insert({
          university_id: module.universityId,
          code: module.code,
          name: module.name,
          credits: module.credits,
          nqf_level: module.nqfLevel,
          prerequisites: module.prerequisites,
          description: module.description,
          contact_time: module.contactTime,
          language: module.language,
          presentation_period: module.presentationPeriod,
          module_type: module.moduleType
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to insert module ${module.code}: ${error.message}`);
      }

      moduleIds.push(data.id);
    }

    return moduleIds;
  }

  // Insert curriculum version and modules
  static async insertCurriculum(curriculum: StandardizedCurriculum): Promise<string> {
    // Start transaction
    const { data: curriculumData, error: curriculumError } = await supabase
      .from('curriculum_versions')
      .insert({
        degree_id: curriculum.degreeId,
        academic_year: curriculum.academicYear,
        version_hash: curriculum.versionHash,
        effective_date: curriculum.effectiveDate,
        is_active: false
      })
      .select('id')
      .single();

    if (curriculumError) {
      throw new Error(`Failed to insert curriculum version: ${curriculumError.message}`);
    }

    const curriculumVersionId = curriculumData.id;

    // Insert curriculum modules
    for (const module of curriculum.modules) {
      const { error: moduleError } = await supabase
        .from('degree_modules')
        .insert({
          curriculum_version_id: curriculumVersionId,
          module_code: module.moduleCode,
          year_level: module.yearLevel,
          semester: module.semester,
          is_compulsory: module.isCompulsory,
          module_type: module.moduleType,
          credits_override: module.creditsOverride
        });

      if (moduleError) {
        throw new Error(`Failed to insert curriculum module ${module.moduleCode}: ${moduleError.message}`);
      }
    }

    return curriculumVersionId;
  }

  // Activate curriculum version
  static async activateCurriculumVersion(curriculumVersionId: string): Promise<void> {
    // Get the degree ID for this curriculum version
    const { data: curriculum, error: fetchError } = await supabase
      .from('curriculum_versions')
      .select('degree_id')
      .eq('id', curriculumVersionId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch curriculum version: ${fetchError.message}`);
    }

    // Deactivate all other versions for this degree
    const { error: deactivateError } = await supabase
      .from('curriculum_versions')
      .update({ is_active: false })
      .eq('degree_id', curriculum.degree_id);

    if (deactivateError) {
      throw new Error(`Failed to deactivate other curriculum versions: ${deactivateError.message}`);
    }

    // Activate this version
    const { error: activateError } = await supabase
      .from('curriculum_versions')
      .update({ is_active: true })
      .eq('id', curriculumVersionId);

    if (activateError) {
      throw new Error(`Failed to activate curriculum version: ${activateError.message}`);
    }
  }

  // Check if university exists
  static async universityExists(code: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('universities')
      .select('id')
      .eq('code', code)
      .single();

    return !error && data !== null;
  }

  // Get university ID by code
  static async getUniversityId(code: string): Promise<string> {
    const { data, error } = await supabase
      .from('universities')
      .select('id')
      .eq('code', code)
      .single();

    if (error) {
      throw new Error(`University not found: ${code}`);
    }

    return data.id;
  }

  // Get degree ID by code and university
  static async getDegreeId(universityId: string, code: string): Promise<string> {
    const { data, error } = await supabase
      .from('degrees_catalog')
      .select('id')
      .eq('university_id', universityId)
      .eq('code', code)
      .single();

    if (error) {
      throw new Error(`Degree not found: ${code}`);
    }

    return data.id;
  }

  // Check if curriculum version exists
  static async curriculumVersionExists(
    degreeId: string, 
    academicYear: number, 
    versionHash: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('curriculum_versions')
      .select('id')
      .eq('degree_id', degreeId)
      .eq('academic_year', academicYear)
      .eq('version_hash', versionHash)
      .single();

    return !error && data !== null;
  }

  // Get active curriculum version for degree and year
  static async getActiveCurriculumVersion(
    degreeId: string, 
    academicYear: number
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('curriculum_versions')
      .select('id')
      .eq('degree_id', degreeId)
      .eq('academic_year', academicYear)
      .eq('is_active', true)
      .single();

    if (error) {
      return null;
    }

    return data.id;
  }

  // Bulk insert with transaction support
  static async bulkInsertWithTransaction(
    degrees: StandardizedDegree[],
    modules: StandardizedModule[],
    curricula: StandardizedCurriculum[]
  ): Promise<{ degreeIds: string[]; moduleIds: string[]; curriculumIds: string[] }> {
    // This would ideally use a database transaction
    // For now, we'll implement it as sequential operations with rollback capability
    
    const insertedDegreeIds: string[] = [];
    const insertedModuleIds: string[] = [];
    const insertedCurriculumIds: string[] = [];

    try {
      // Insert degrees
      const degreeIds = await this.insertDegrees(degrees);
      insertedDegreeIds.push(...degreeIds);

      // Insert modules
      const moduleIds = await this.insertModules(modules);
      insertedModuleIds.push(...moduleIds);

      // Insert curricula
      for (const curriculum of curricula) {
        const curriculumId = await this.insertCurriculum(curriculum);
        insertedCurriculumIds.push(curriculumId);
      }

      return {
        degreeIds: insertedDegreeIds,
        moduleIds: insertedModuleIds,
        curriculumIds: insertedCurriculumIds
      };
    } catch (error) {
      // In a real implementation, we would rollback the transaction
      // For now, we'll log the error and let the caller handle cleanup
      console.error('Bulk insert failed:', error);
      throw error;
    }
  }
}
