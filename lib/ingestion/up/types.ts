// UP Scraper Ingestion Types
// Standardized data structures for UP academic data

export interface RawUPDegree {
  code: string;
  name: string;
  faculty: string;
  faculty_code: string;
  level: string;
  duration_years?: number;
  total_credits?: number;
  nqf_level?: number;
  url: string;
}

export interface RawUPModule {
  code: string;
  name: string;
  credits: number;
  nqf_level?: number;
  prerequisites?: string;
  description?: string;
  contact_time?: string;
  language?: string;
  presentation_period?: string;
  module_type?: string;
}

export interface RawUPCurriculum {
  degree_code: string;
  module_code: string;
  year_level: number;
  semester?: string;
  is_compulsory: boolean;
  module_type?: string;
}

// Standardized format for database ingestion
export interface StandardizedDegree {
  universityId: string;
  code: string;
  name: string;
  faculty: string;
  facultyCode: string;
  level: string;
  durationYears?: number;
  totalCredits?: number;
  nqfLevel?: number;
  url: string;
}

export interface StandardizedModule {
  universityId: string;
  code: string;
  name: string;
  credits: number;
  nqfLevel?: number;
  prerequisites?: string;
  description?: string;
  contactTime?: string;
  language?: string;
  presentationPeriod?: string;
  moduleType?: string;
}

export interface StandardizedCurriculum {
  degreeId: string;
  academicYear: number;
  versionHash: string;
  effectiveDate: string;
  modules: CurriculumModule[];
}

export interface CurriculumModule {
  moduleCode: string;
  yearLevel: number;
  semester?: string;
  isCompulsory: boolean;
  moduleType?: string;
  creditsOverride?: number;
}

export interface IngestionResult {
  success: boolean;
  curriculumVersionId?: string;
  error?: string;
  warnings?: string[];
  stats?: {
    degreesProcessed: number;
    modulesProcessed: number;
    curriculumItems: number;
  };
  dryRun?: boolean;
}
