// Data Validation Layer for UP Ingestion
// Validates transformed data before database ingestion

import { AcademicValidator, ValidationResult } from '../../validation/academic';
import { StandardizedDegree, StandardizedModule, StandardizedCurriculum } from './types';

export class UPDataValidator {
  // Validate a single degree
  static validateDegree(degree: StandardizedDegree): ValidationResult {
    return AcademicValidator.validateDegree({
      code: degree.code,
      name: degree.name,
      faculty: degree.faculty,
      level: degree.level,
      durationYears: degree.durationYears,
      totalCredits: degree.totalCredits,
      nqfLevel: degree.nqfLevel
    });
  }

  // Validate a single module
  static validateModule(module: StandardizedModule): ValidationResult {
    return AcademicValidator.validateModule({
      code: module.code,
      name: module.name,
      credits: module.credits,
      nqfLevel: module.nqfLevel,
      prerequisites: module.prerequisites
    });
  }

  // Validate curriculum
  static validateCurriculum(curriculum: StandardizedCurriculum): ValidationResult {
    return AcademicValidator.validateCurriculum(
      curriculum.degreeId,
      curriculum.academicYear,
      curriculum.modules
    );
  }

  // Batch validate degrees
  static validateDegrees(degrees: StandardizedDegree[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const degree of degrees) {
      const validation = this.validateDegree(degree);
      if (!validation.valid) {
        errors.push(`Degree ${degree.code}: ${validation.error}`);
      }
      if (validation.warnings) {
        warnings.push(...validation.warnings.map((w: string) => `Degree ${degree.code}: ${w}`));
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Batch validate modules
  static validateModules(modules: StandardizedModule[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const module of modules) {
      const validation = this.validateModule(module);
      if (!validation.valid) {
        errors.push(`Module ${module.code}: ${validation.error}`);
      }
      if (validation.warnings) {
        warnings.push(...validation.warnings.map((w: string) => `Module ${module.code}: ${w}`));
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate complete curriculum package
  static validateCurriculumPackage(curriculum: StandardizedCurriculum): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate curriculum structure
    const curriculumValidation = this.validateCurriculum(curriculum);
    if (!curriculumValidation.valid) {
      errors.push(curriculumValidation.error!);
    }
    if (curriculumValidation.warnings) {
      warnings.push(...curriculumValidation.warnings);
    }

    // Validate version hash
    const expectedHash = AcademicValidator.generateVersionHash({
      degreeId: curriculum.degreeId,
      academicYear: curriculum.academicYear,
      modules: curriculum.modules
    });

    if (curriculum.versionHash !== expectedHash) {
      errors.push(`Version hash mismatch. Expected: ${expectedHash}, Got: ${curriculum.versionHash}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Cross-validate data consistency
  static validateDataConsistency(
    degrees: StandardizedDegree[],
    modules: StandardizedModule[],
    curricula: StandardizedCurriculum[]
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for orphaned modules in curricula
    const moduleCodes = new Set(modules.map(m => m.code));
    
    for (const curriculum of curricula) {
      for (const curriculumModule of curriculum.modules) {
        if (!moduleCodes.has(curriculumModule.moduleCode)) {
          errors.push(`Curriculum references unknown module: ${curriculumModule.moduleCode}`);
        }
      }
    }

    // Check for orphaned degree references
    const degreeIds = new Set(degrees.map(d => d.universityId)); // Use universityId since id doesn't exist
    
    for (const curriculum of curricula) {
      if (!degreeIds.has(curriculum.degreeId)) {
        errors.push(`Curriculum references unknown degree: ${curriculum.degreeId}`);
      }
    }

    // Check for duplicate degree codes
    const degreeCodes = degrees.map(d => d.code);
    const uniqueDegreeCodes = new Set(degreeCodes);
    if (degreeCodes.length !== uniqueDegreeCodes.size) {
      const duplicates = degreeCodes.filter((code, index) => degreeCodes.indexOf(code) !== index);
      errors.push(`Duplicate degree codes found: ${duplicates.join(', ')}`);
    }

    // Check for duplicate module codes
    const moduleCodeList = modules.map(m => m.code);
    const uniqueModuleCodes = new Set(moduleCodeList);
    if (moduleCodeList.length !== uniqueModuleCodes.size) {
      const duplicates = moduleCodeList.filter((code, index) => moduleCodeList.indexOf(code) !== index);
      errors.push(`Duplicate module codes found: ${duplicates.join(', ')}`);
    }

    // Check for reasonable credit distributions
    for (const curriculum of curricula) {
      const totalCredits = curriculum.modules.reduce((sum, m) => {
        const module = modules.find(mod => mod.code === m.moduleCode);
        return sum + (module?.credits || 0);
      }, 0);

      if (totalCredits > 2000) {
        warnings.push(`Curriculum ${curriculum.degreeId} has unusually high total credits: ${totalCredits}`);
      }

      if (totalCredits < 100) {
        warnings.push(`Curriculum ${curriculum.degreeId} has unusually low total credits: ${totalCredits}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
