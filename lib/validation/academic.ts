// Academic Data Validation Layer
// Ensures data integrity before ingestion into authoritative tables

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

export interface ModuleValidation {
  code: string;
  name: string;
  credits: number;
  nqfLevel?: number;
  prerequisites?: string;
}

export interface DegreeValidation {
  code: string;
  name: string;
  faculty: string;
  level: string;
  durationYears?: number;
  totalCredits?: number;
  nqfLevel?: number;
}

export class AcademicValidator {
  // University validation
  static validateUniversity(name: string, code: string): ValidationResult {
    const warnings: string[] = [];

    if (!name || name.trim().length < 3) {
      return { valid: false, error: 'University name must be at least 3 characters' };
    }

    if (!code || code.trim().length < 2) {
      return { valid: false, error: 'University code must be at least 2 characters' };
    }

    // Check for common issues
    if (name.toLowerCase().includes('university') && !name.toLowerCase().includes('of')) {
      warnings.push('University name might be missing "of"');
    }

    return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
  }

  // Module code validation (UP format: ABC 123)
  static validateModuleCode(code: string): ValidationResult {
    if (!code || typeof code !== 'string') {
      return { valid: false, error: 'Module code is required' };
    }

    const cleanCode = code.trim().toUpperCase();
    
    // Standard UP format: 3 letters + space + 3 digits
    const upPattern = /^[A-Z]{3}\s*\d{3}$/;
    
    if (!upPattern.test(cleanCode)) {
      return { 
        valid: false, 
        error: `Invalid module code format: "${code}". Expected format: "ABC 123" (3 letters, 3 digits)` 
      };
    }

    return { valid: true };
  }

  // Module validation
  static validateModule(module: ModuleValidation): ValidationResult {
    const warnings: string[] = [];

    // Validate code
    const codeValidation = this.validateModuleCode(module.code);
    if (!codeValidation.valid) {
      return codeValidation;
    }

    // Validate name
    if (!module.name || module.name.trim().length < 3) {
      return { valid: false, error: 'Module name must be at least 3 characters' };
    }

    // Validate credits
    if (!module.credits || module.credits <= 0 || module.credits > 50) {
      return { valid: false, error: `Invalid credits: ${module.credits}. Must be between 1 and 50` };
    }

    // Validate NQF level
    if (module.nqfLevel && (module.nqfLevel < 4 || module.nqfLevel > 10)) {
      warnings.push(`Unusual NQF level: ${module.nqfLevel}. Expected range: 4-10`);
    }

    // Validate prerequisites format
    if (module.prerequisites) {
      const prereqCodes = module.prerequisites.split(',').map(c => c.trim());
      for (const prereqCode of prereqCodes) {
        const prereqValidation = this.validateModuleCode(prereqCode);
        if (!prereqValidation.valid) {
          return { 
            valid: false, 
            error: `Invalid prerequisite code: "${prereqCode}"` 
          };
        }
      }
    }

    return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
  }

  // Degree validation
  static validateDegree(degree: DegreeValidation): ValidationResult {
    const warnings: string[] = [];

    // Validate code (8 digits for UP)
    if (!degree.code || !/^\d{8}$/.test(degree.code.trim())) {
      return { 
        valid: false, 
        error: `Invalid degree code: "${degree.code}". Expected 8 digits` 
      };
    }

    // Validate name
    if (!degree.name || degree.name.trim().length < 5) {
      return { valid: false, error: 'Degree name must be at least 5 characters' };
    }

    // Validate faculty
    if (!degree.faculty || degree.faculty.trim().length < 3) {
      return { valid: false, error: 'Faculty name must be at least 3 characters' };
    }

    // Validate level
    const validLevels = ['Undergraduate', 'Honours', 'Masters', 'Doctorate'];
    if (!degree.level || !validLevels.includes(degree.level)) {
      return { 
        valid: false, 
        error: `Invalid level: "${degree.level}". Must be one of: ${validLevels.join(', ')}` 
      };
    }

    // Validate duration
    if (degree.durationYears && (degree.durationYears < 1 || degree.durationYears > 10)) {
      warnings.push(`Unusual duration: ${degree.durationYears} years. Expected range: 1-10`);
    }

    // Validate total credits
    if (degree.totalCredits && (degree.totalCredits < 120 || degree.totalCredits > 1000)) {
      warnings.push(`Unusual total credits: ${degree.totalCredits}. Expected range: 120-1000`);
    }

    // Validate NQF level consistency
    if (degree.nqfLevel && degree.level) {
      const expectedNQF = {
        'Undergraduate': [5, 6, 7],
        'Honours': [7, 8],
        'Masters': [8, 9],
        'Doctorate': [9, 10]
      };

      const validNQF = expectedNQF[degree.level as keyof typeof expectedNQF];
      if (!validNQF.includes(degree.nqfLevel)) {
        warnings.push(`NQF level ${degree.nqfLevel} may not match degree level ${degree.level}`);
      }
    }

    return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
  }

  // Curriculum validation
  static validateCurriculum(
    degreeId: string, 
    academicYear: number, 
    modules: any[]
  ): ValidationResult {
    const warnings: string[] = [];

    // Validate academic year
    const currentYear = new Date().getFullYear();
    if (academicYear < 2020 || academicYear > currentYear + 2) {
      return { 
        valid: false, 
        error: `Invalid academic year: ${academicYear}. Expected range: 2020-${currentYear + 2}` 
      };
    }

    // Validate modules list
    if (!modules || modules.length === 0) {
      return { valid: false, error: 'Curriculum must include at least one module' };
    }

    // Check for duplicate modules
    const moduleCodes = modules.map((m: any) => m.moduleCode).filter(Boolean);
    const uniqueCodes = new Set(moduleCodes);
    if (moduleCodes.length !== uniqueCodes.size) {
      return { valid: false, error: 'Duplicate modules found in curriculum' };
    }

    // Validate each module
    for (const currModule of modules) {
      if (!currModule.moduleCode) {
        return { valid: false, error: 'All modules must have a module code' };
      }

      const codeValidation = this.validateModuleCode(currModule.moduleCode);
      if (!codeValidation.valid) {
        return codeValidation;
      }

      // Validate year level
      if (!module.yearLevel || module.yearLevel < 1 || module.yearLevel > 6) {
        return { 
          valid: false, 
          error: `Invalid year level: ${module.yearLevel} for module ${module.moduleCode}` 
        };
      }

      // Validate semester
      if (module.semester && !['First', 'Second', 'Year'].includes(module.semester)) {
        return { 
          valid: false, 
          error: `Invalid semester: ${module.semester} for module ${module.moduleCode}` 
        };
      }

      // Validate module type
      if (module.moduleType && !['core', 'fundamental', 'elective'].includes(module.moduleType)) {
        return { 
          valid: false, 
          error: `Invalid module type: ${module.moduleType} for module ${module.moduleCode}` 
        };
      }
    }

    // Check for reasonable progression
    const yearGroups: { [key: number]: any[] } = modules.reduce((groups, module) => {
      const year = module.yearLevel;
      if (!groups[year]) groups[year] = [];
      groups[year].push(module);
      return groups;
    }, {});

    const years = Object.keys(yearGroups).map(Number).sort();
    if (years.length > 6) {
      warnings.push('Curriculum spans more than 6 years - unusual for most degrees');
    }

    // Check for missing years in progression
    for (let i = 1; i < Math.max(...years); i++) {
      if (!yearGroups[i]) {
        warnings.push(`No modules found for year ${i}`);
      }
    }

    return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
  }

  // Generate version hash for curriculum
  static generateVersionHash(curriculumData: any): string {
    const crypto = require('crypto');
    const dataString = JSON.stringify(curriculumData, Object.keys(curriculumData).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex').substring(0, 16);
  }

  // Validate student profile binding
  static validateStudentBinding(
    userId: string,
    degreeId: string,
    curriculumVersionId: string,
    startYear: number
  ): ValidationResult {
    const warnings: string[] = [];

    // Validate start year
    const currentYear = new Date().getFullYear();
    if (startYear < 2020 || startYear > currentYear + 1) {
      return { 
        valid: false, 
        error: `Invalid start year: ${startYear}. Expected range: 2020-${currentYear + 1}` 
      };
    }

    // Validate UUIDs
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidPattern.test(userId)) {
      return { valid: false, error: 'Invalid user ID format' };
    }

    if (!uuidPattern.test(degreeId)) {
      return { valid: false, error: 'Invalid degree ID format' };
    }

    if (!uuidPattern.test(curriculumVersionId)) {
      return { valid: false, error: 'Invalid curriculum version ID format' };
    }

    return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
  }
}
