// Data Transformation Layer
// Converts raw UP scraper data to standardized format

import { 
  RawUPDegree, 
  RawUPModule, 
  RawUPCurriculum,
  StandardizedDegree,
  StandardizedModule,
  StandardizedCurriculum,
  CurriculumModule
} from './types';
import { AcademicValidator } from '../../validation/academic';

export class UPDataTransformer {
  // Transform raw degree data to standardized format
  static transformDegree(rawDegree: RawUPDegree, universityId: string): StandardizedDegree {
    return {
      universityId,
      code: rawDegree.code.trim(),
      name: rawDegree.name.trim(),
      faculty: rawDegree.faculty.trim(),
      facultyCode: rawDegree.faculty_code.trim(),
      level: this.standardizeLevel(rawDegree.level),
      durationYears: rawDegree.duration_years,
      totalCredits: rawDegree.total_credits,
      nqfLevel: rawDegree.nqf_level,
      url: rawDegree.url
    };
  }

  // Transform raw module data to standardized format
  static transformModule(rawModule: RawUPModule, universityId: string): StandardizedModule {
    return {
      universityId,
      code: this.standardizeModuleCode(rawModule.code),
      name: rawModule.name.trim(),
      credits: rawModule.credits,
      nqfLevel: rawModule.nqf_level,
      prerequisites: rawModule.prerequisites?.trim() || undefined,
      description: rawModule.description?.trim() || undefined,
      contactTime: rawModule.contact_time?.trim() || undefined,
      language: rawModule.language?.trim() || 'English',
      presentationPeriod: rawModule.presentation_period?.trim() || undefined,
      moduleType: rawModule.module_type?.trim() || undefined
    };
  }

  // Transform raw curriculum data to standardized format
  static transformCurriculum(
    rawCurriculum: RawUPCurriculum[],
    degreeId: string,
    academicYear: number
  ): StandardizedCurriculum {
    const modules: CurriculumModule[] = rawCurriculum.map(item => ({
      moduleCode: this.standardizeModuleCode(item.module_code),
      yearLevel: item.year_level,
      semester: item.semester ? this.standardizeSemester(item.semester) : undefined,
      isCompulsory: Boolean(item.is_compulsory),
      moduleType: item.module_type ? this.standardizeModuleType(item.module_type) : undefined
    }));

    // Generate version hash
    const versionHash = AcademicValidator.generateVersionHash({
      degreeId,
      academicYear,
      modules
    });

    return {
      degreeId,
      academicYear,
      versionHash,
      effectiveDate: new Date(academicYear, 0, 1).toISOString().split('T')[0],
      modules
    };
  }

  // Standardize degree level names
  private static standardizeLevel(level: string): string {
    const levelMap: { [key: string]: string } = {
      'undergraduate': 'Undergraduate',
      'undergrad': 'Undergraduate',
      'ug': 'Undergraduate',
      'honours': 'Honours',
      'hons': 'Honours',
      'masters': 'Masters',
      'master': 'Masters',
      'm': 'Masters',
      'doctorate': 'Doctorate',
      'phd': 'Doctorate',
      'doctoral': 'Doctorate'
    };

    const normalized = level.toLowerCase().trim();
    return levelMap[normalized] || level;
  }

  // Standardize module code format (ABC 123)
  private static standardizeModuleCode(code: string): string {
    const cleanCode = code.trim().toUpperCase();
    
    // Add space between letters and numbers if missing
    const match = cleanCode.match(/^([A-Z]{3})(\d{3})$/);
    if (match) {
      return `${match[1]} ${match[2]}`;
    }
    
    return cleanCode;
  }

  // Standardize semester names
  private static standardizeSemester(semester: string): string {
    const semesterMap: { [key: string]: string } = {
      'first': 'First',
      '1st': 'First',
      '1': 'First',
      'second': 'Second',
      '2nd': 'Second',
      '2': 'Second',
      'year': 'Year',
      'annual': 'Year',
      'full year': 'Year'
    };

    const normalized = semester.toLowerCase().trim();
    return semesterMap[normalized] || semester;
  }

  // Standardize module type names
  private static standardizeModuleType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'core': 'core',
      'compulsory': 'core',
      'required': 'core',
      'fundamental': 'fundamental',
      'foundation': 'fundamental',
      'elective': 'elective',
      'option': 'elective',
      'optional': 'elective'
    };

    const normalized = type.toLowerCase().trim();
    return typeMap[normalized] || type;
  }

  // Batch transform degrees
  static transformDegrees(rawDegrees: RawUPDegree[], universityId: string): StandardizedDegree[] {
    const transformed: StandardizedDegree[] = [];
    const errors: string[] = [];

    for (const rawDegree of rawDegrees) {
      try {
        const transformedDegree = this.transformDegree(rawDegree, universityId);
        
        // Validate transformation
        const validation = AcademicValidator.validateDegree({
          code: transformedDegree.code,
          name: transformedDegree.name,
          faculty: transformedDegree.faculty,
          level: transformedDegree.level,
          durationYears: transformedDegree.durationYears,
          totalCredits: transformedDegree.totalCredits,
          nqfLevel: transformedDegree.nqfLevel
        });

        if (validation.valid) {
          transformed.push(transformedDegree);
        } else {
          errors.push(`Degree ${rawDegree.code}: ${validation.error}`);
        }
      } catch (error) {
        errors.push(`Degree ${rawDegree.code}: ${error}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Transformation errors:\n${errors.join('\n')}`);
    }

    return transformed;
  }

  // Batch transform modules
  static transformModules(rawModules: RawUPModule[], universityId: string): StandardizedModule[] {
    const transformed: StandardizedModule[] = [];
    const errors: string[] = [];

    for (const rawModule of rawModules) {
      try {
        const transformedModule = this.transformModule(rawModule, universityId);
        
        // Validate transformation
        const validation = AcademicValidator.validateModule({
          code: transformedModule.code,
          name: transformedModule.name,
          credits: transformedModule.credits,
          nqfLevel: transformedModule.nqfLevel,
          prerequisites: transformedModule.prerequisites
        });

        if (validation.valid) {
          transformed.push(transformedModule);
        } else {
          errors.push(`Module ${rawModule.code}: ${validation.error}`);
        }
      } catch (error) {
        errors.push(`Module ${rawModule.code}: ${error}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Transformation errors:\n${errors.join('\n')}`);
    }

    return transformed;
  }

  // Batch transform curricula
  static transformCurricula(
    rawCurricula: RawUPCurriculum[],
    degreeId: string,
    academicYear: number
  ): StandardizedCurriculum {
    try {
      const transformedCurriculum = this.transformCurriculum(rawCurricula, degreeId, academicYear);
      
      // Validate transformation
      const validation = AcademicValidator.validateCurriculum(
        degreeId,
        academicYear,
        transformedCurriculum.modules
      );

      if (!validation.valid) {
        throw new Error(`Curriculum validation failed: ${validation.error}`);
      }

      return transformedCurriculum;
    } catch (error) {
      throw new Error(`Curriculum transformation failed: ${error}`);
    }
  }
}
