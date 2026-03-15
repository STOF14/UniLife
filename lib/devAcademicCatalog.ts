type DevDegree = {
  id: string;
  code: string;
  name: string;
  faculty: string;
  level: string;
  duration_years: number;
  total_credits: number;
  nqf_level: number;
};

type DevCurriculum = {
  id: string;
  degree_id: string;
  academic_year: number;
  version_hash: string;
  effective_date: string;
  is_active: boolean;
  created_at: string;
  moduleCount: number;
};

export const DEV_UNIVERSITY = {
  id: 'dev-up-university',
  name: 'University of Pretoria',
  code: 'UP',
};

export const DEV_DEGREES: DevDegree[] = [
  {
    id: 'dev-bscit',
    code: 'BSCIT',
    name: 'BSc Information Technology',
    faculty: 'Engineering, Built Environment and Information Technology',
    level: 'Undergraduate',
    duration_years: 3,
    total_credits: 428,
    nqf_level: 7,
  },
  {
    id: 'dev-bcominformatics',
    code: 'BCOMINF',
    name: 'BCom Informatics',
    faculty: 'Economic and Management Sciences',
    level: 'Undergraduate',
    duration_years: 3,
    total_credits: 420,
    nqf_level: 7,
  },
  {
    id: 'dev-bengindustrial',
    code: 'BENGIND',
    name: 'BEng Industrial Engineering',
    faculty: 'Engineering, Built Environment and Information Technology',
    level: 'Undergraduate',
    duration_years: 4,
    total_credits: 560,
    nqf_level: 8,
  },
  {
    id: 'dev-bcomaccounting',
    code: 'BCOMACC',
    name: 'BCom Accounting Sciences',
    faculty: 'Economic and Management Sciences',
    level: 'Undergraduate',
    duration_years: 3,
    total_credits: 432,
    nqf_level: 7,
  },
  {
    id: 'dev-llb',
    code: 'LLB',
    name: 'Bachelor of Laws',
    faculty: 'Law',
    level: 'Undergraduate',
    duration_years: 4,
    total_credits: 480,
    nqf_level: 8,
  },
  {
    id: 'dev-bscbiological',
    code: 'BSCBIO',
    name: 'BSc Biological Sciences',
    faculty: 'Natural and Agricultural Sciences',
    level: 'Undergraduate',
    duration_years: 3,
    total_credits: 410,
    nqf_level: 7,
  },
];

export const DEV_CURRICULA: DevCurriculum[] = [
  {
    id: 'dev-bscit-2026',
    degree_id: 'dev-bscit',
    academic_year: 2026,
    version_hash: 'bscit-2026-v1',
    effective_date: '2026-01-01',
    is_active: true,
    created_at: '2025-10-01T00:00:00.000Z',
    moduleCount: 30,
  },
  {
    id: 'dev-bscit-2025',
    degree_id: 'dev-bscit',
    academic_year: 2025,
    version_hash: 'bscit-2025-v1',
    effective_date: '2025-01-01',
    is_active: false,
    created_at: '2024-10-01T00:00:00.000Z',
    moduleCount: 30,
  },
  {
    id: 'dev-bcominformatics-2026',
    degree_id: 'dev-bcominformatics',
    academic_year: 2026,
    version_hash: 'bcominformatics-2026-v1',
    effective_date: '2026-01-01',
    is_active: true,
    created_at: '2025-10-01T00:00:00.000Z',
    moduleCount: 28,
  },
  {
    id: 'dev-bengindustrial-2026',
    degree_id: 'dev-bengindustrial',
    academic_year: 2026,
    version_hash: 'bengindustrial-2026-v1',
    effective_date: '2026-01-01',
    is_active: true,
    created_at: '2025-10-01T00:00:00.000Z',
    moduleCount: 42,
  },
  {
    id: 'dev-bcomaccounting-2026',
    degree_id: 'dev-bcomaccounting',
    academic_year: 2026,
    version_hash: 'bcomaccounting-2026-v1',
    effective_date: '2026-01-01',
    is_active: true,
    created_at: '2025-10-01T00:00:00.000Z',
    moduleCount: 31,
  },
  {
    id: 'dev-llb-2026',
    degree_id: 'dev-llb',
    academic_year: 2026,
    version_hash: 'llb-2026-v1',
    effective_date: '2026-01-01',
    is_active: true,
    created_at: '2025-10-01T00:00:00.000Z',
    moduleCount: 36,
  },
  {
    id: 'dev-bscbiological-2026',
    degree_id: 'dev-bscbiological',
    academic_year: 2026,
    version_hash: 'bscbiological-2026-v1',
    effective_date: '2026-01-01',
    is_active: true,
    created_at: '2025-10-01T00:00:00.000Z',
    moduleCount: 29,
  },
];

export const getDevCurriculaForDegree = (degreeId: string) =>
  DEV_CURRICULA.filter((curriculum) => curriculum.degree_id === degreeId).sort(
    (left, right) => right.academic_year - left.academic_year
  );
