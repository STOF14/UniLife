/**
 * UP Yearbook PDF Parser
 * Extracts degree structure, modules, prerequisites, credits from UP yearbook PDFs
 * 
 * UP yearbook format:
 * - Degree name and code at top
 * - Faculty, department info
 * - Admission requirements table
 * - Curriculum sections: "Curriculum: Year 1/2/3"
 * - Each year has Fundamental/Core/Elective subsections
 * - Module entries: "Module name 123 (ABC 123)" followed by details
 */

import { PDFExtractionResult, PDFTextLine } from './pdfExtractor';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface YearbookResult {
  degree: {
    name: string;
    code: string;
    faculty: string;
    department: string;
    durationYears: number;
    totalCredits: number;
    nqfLevel: number;
  };
  modules: YearbookModule[];
  curriculumYears: CurriculumYear[];
  admissionRequirements: AdmissionRequirement[];
  warnings: string[];
}

export interface YearbookModule {
  code: string;           // e.g. "COS 212"
  name: string;           // e.g. "Data Structures and Algorithms"
  credits: number;        // e.g. 16
  nqfLevel: number;
  semester: string;       // "Semester 1", "Semester 2", "Year"
  yearLevel: number;      // 1, 2, 3
  type: 'core' | 'fundamental' | 'elective';
  prerequisites: string[];
  corequisites: string[];
  description: string;
  contactTime: string;
  department: string;
}

export interface CurriculumYear {
  year: number;
  minimumCredits: number;
  fundamentalCredits: number;
  coreCredits: number;
  electiveCredits: number;
  moduleCodes: string[];
}

export interface AdmissionRequirement {
  subject: string;
  level: number;
}

// ─── Parser ──────────────────────────────────────────────────────────────────

export function parseYearbook(pdf: PDFExtractionResult): YearbookResult {
  const text = pdf.fullText;
  const warnings: string[] = [];

  // 1. Extract degree info
  const degree = extractDegreeInfo(text, warnings);

  // 2. Extract admission requirements
  const admissionRequirements = extractAdmissions(text);

  // 3. Extract curriculum year structure
  const curriculumYears = extractCurriculumYears(text, warnings);

  // 4. Extract all modules
  const modules = extractModules(text, curriculumYears, warnings);

  return {
    degree,
    modules,
    curriculumYears,
    admissionRequirements,
    warnings,
  };
}

// ─── Degree Info ─────────────────────────────────────────────────────────────

function extractDegreeInfo(text: string, warnings: string[]) {
  // "BSc in Computer Science (02133203)" or "Bachelor of Science"
  const degreePatterns = [
    /(?:Programme|Degree)\s*[:.]?\s*(B[A-Za-z]+(?:\s+(?:in|of)\s+[A-Za-z\s&,]+)?)\s*\((\d+)\)/i,
    /(B[A-Za-z]+)\s+in\s+([A-Za-z\s&,]+?)\s*\((\d+)\)/i,
    /(Bachelor\s+of\s+[A-Za-z]+(?:\s+in\s+[A-Za-z\s&,]+)?)/i,
  ];

  let name = 'Unknown Degree';
  let code = '';

  for (const pattern of degreePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[3]) {
        name = `${match[1]} in ${match[2]}`.trim();
        code = match[3];
      } else if (match[2] && /^\d+$/.test(match[2])) {
        name = match[1].trim();
        code = match[2];
      } else {
        name = match[1].trim();
      }
      break;
    }
  }

  if (name === 'Unknown Degree') {
    warnings.push('Could not detect degree name — check yearbook format');
  }

  const facultyMatch = text.match(/Faculty\s+of\s+([A-Za-z\s&]+?)(?:\n|Department|Minimum)/i);
  const faculty = facultyMatch ? facultyMatch[1].trim() : 'Unknown';

  const deptMatch = text.match(/Department\s+(?:of\s+)?([A-Za-z\s&]+?)(?:\n|Minimum|Duration|Period)/i);
  const department = deptMatch ? deptMatch[1].trim() : 'Unknown';

  const durationMatch = text.match(/(?:Minimum\s+)?[Dd]uration\s+(?:of\s+study\s+)?(\d+)\s*year/i);
  const durationYears = durationMatch ? parseInt(durationMatch[1]) : 3;

  const creditsMatch = text.match(/Total\s+credits\s*[:.]?\s*(\d+)/i);
  const totalCredits = creditsMatch ? parseInt(creditsMatch[1]) : 0;

  const nqfMatch = text.match(/NQF\s+[Ll]evel\s*[:.]?\s*(\d+)/i);
  const nqfLevel = nqfMatch ? parseInt(nqfMatch[1]) : 7;

  return { name, code, faculty, department, durationYears, totalCredits, nqfLevel };
}

// ─── Admission Requirements ──────────────────────────────────────────────────

function extractAdmissions(text: string): AdmissionRequirement[] {
  const requirements: AdmissionRequirement[] = [];
  const subjects = [
    { pattern: /English[^\d]*?(\d)/i, name: 'English' },
    { pattern: /Mathematics[^\d]*?(\d)/i, name: 'Mathematics' },
    { pattern: /Physical\s+Sciences[^\d]*?(\d)/i, name: 'Physical Sciences' },
    { pattern: /Life\s+Sciences[^\d]*?(\d)/i, name: 'Life Sciences' },
    { pattern: /APS[^\d]*?(\d+)/i, name: 'APS' },
  ];

  for (const { pattern, name } of subjects) {
    const match = text.match(pattern);
    if (match) {
      requirements.push({ subject: name, level: parseInt(match[1]) });
    }
  }

  return requirements;
}

// ─── Curriculum Years ────────────────────────────────────────────────────────

function extractCurriculumYears(text: string, warnings: string[]): CurriculumYear[] {
  const years: CurriculumYear[] = [];

  // Split on "Curriculum: Year X" or "Curriculum: Final year"
  const sections = text.split(/(?=Curriculum\s*:\s*(?:Year\s+\d+|Final\s+year))/i);

  for (const section of sections) {
    const yearMatch = section.match(/Curriculum\s*:\s*(?:(Year\s+(\d+))|(Final\s+year))/i);
    if (!yearMatch) continue;

    const yearNum = yearMatch[3] ? 3 : parseInt(yearMatch[2] || '1');

    const minCredits = matchInt(section, /Minimum\s+credits\s*[:.]?\s*(\d+)/i, 0);
    const fundamentalCredits = matchInt(section, /Fundamental\s*=\s*(\d+)/i, 0);
    const coreCredits = matchInt(section, /Core\s*=\s*(\d+)/i, 0);
    const electiveCredits = matchInt(section, /Elective\s*=\s*(\d+)/i, 0);

    // Extract module codes from this section
    const codes: string[] = [];
    const codePattern = /\b([A-Z]{2,4})\s+(\d{3})\b/g;
    let codeMatch;
    while ((codeMatch = codePattern.exec(section)) !== null) {
      const code = `${codeMatch[1]} ${codeMatch[2]}`;
      if (!codes.includes(code)) codes.push(code);
    }

    years.push({
      year: yearNum,
      minimumCredits: minCredits,
      fundamentalCredits,
      coreCredits,
      electiveCredits,
      moduleCodes: codes,
    });
  }

  if (years.length === 0) {
    warnings.push('No curriculum year sections found — module year levels may be inferred from codes');
  }

  return years;
}

// ─── Module Extraction ───────────────────────────────────────────────────────

function extractModules(
  text: string,
  curriculumYears: CurriculumYear[],
  warnings: string[]
): YearbookModule[] {
  const modules: YearbookModule[] = [];
  const seen = new Set<string>();

  // Pattern 1: "Module name 123 (ABC 123)" format
  const pattern1 = /([A-Za-z][A-Za-z\s&,'-]+?)\s+(\d{3})\s+\(([A-Z]{2,4})\s+(\d{3})\)/g;
  let match;

  while ((match = pattern1.exec(text)) !== null) {
    const code = `${match[3]} ${match[4]}`;
    if (seen.has(code)) continue;
    seen.add(code);

    const name = cleanModuleName(match[1]);
    const sectionAfter = text.substring(match.index, match.index + 2000);

    const module = parseModuleDetails(code, name, sectionAfter, curriculumYears);
    if (module) modules.push(module);
  }

  // Pattern 2: Standalone "ABC 123" codes not caught by pattern 1
  const pattern2 = /\b([A-Z]{2,4})\s+(\d{3})\b/g;
  while ((match = pattern2.exec(text)) !== null) {
    const code = `${match[1]} ${match[2]}`;
    if (seen.has(code)) continue;
    // Only include if near "Module credits" or "credits" (likely a module definition)
    const nearby = text.substring(match.index, match.index + 500);
    if (nearby.match(/Module\s+credits\s+\d/i)) {
      seen.add(code);
      const module = parseModuleDetails(code, '', nearby, curriculumYears);
      if (module) modules.push(module);
    }
  }

  if (modules.length === 0) {
    warnings.push('No modules extracted — the yearbook format may not match expected patterns');
  }

  return modules;
}

function parseModuleDetails(
  code: string,
  name: string,
  section: string,
  curriculumYears: CurriculumYear[]
): YearbookModule | null {
  const credits = matchInt(section, /Module\s+credits\s*[:.]?\s*([\d.]+)/i, 0) ||
                  matchInt(section, /([\d.]+)\s*credits?/i, 0);

  if (credits === 0 && !name) return null; // Not a real module entry

  const nqfLevel = matchInt(section, /NQF\s+[Ll]evel\s*[:.]?\s*(\d+)/i, 5);

  // Semester
  const semMatch = section.match(/Period\s+of\s+presentation\s*[:.]?\s*(Semester\s+\d|Year)/i) ||
                   section.match(/(Semester\s+\d|Year\s+module)/i);
  const semester = semMatch ? semMatch[1].replace('module', '').trim() : 'Unknown';

  // Year level — from code number or curriculum year mapping
  const codeNum = parseInt(code.replace(/[A-Z\s]/g, ''));
  let yearLevel = codeNum >= 300 ? 3 : codeNum >= 200 ? 2 : 1;

  // Check curriculum years for more accurate placement
  for (const cy of curriculumYears) {
    if (cy.moduleCodes.includes(code)) {
      yearLevel = cy.year;
      break;
    }
  }

  // Module type from context
  const type = detectModuleType(code, section);

  // Prerequisites
  const prereqSection = section.match(/Prerequisites?\s*[:.]?\s*([\s\S]+?)(?=Co-?requisites?|Contact\s+time|Language|Department|Period|Module\s+content|$)/i);
  const prerequisites = prereqSection ? extractModuleCodes(prereqSection[1]) : [];

  // Corequisites
  const coreqSection = section.match(/Co-?requisites?\s*[:.]?\s*([\s\S]+?)(?=Contact\s+time|Language|Department|Period|Module\s+content|$)/i);
  const corequisites = coreqSection ? extractModuleCodes(coreqSection[1]) : [];

  // Description
  const descMatch = section.match(/Module\s+content\s*[:.]?\s*([\s\S]+?)(?=\n\n|\n[A-Z][a-z]+\s+\d{3}|$)/i);
  const description = descMatch ? descMatch[1].trim().substring(0, 500) : '';

  // Contact time
  const contactMatch = section.match(/Contact\s+time\s*[:.]?\s*(.+?)(?=\n|Language|Department|$)/i);
  const contactTime = contactMatch ? contactMatch[1].trim() : '';

  // Department
  const deptMatch = section.match(/Department\s*[:.]?\s*(.+?)(?=\n|Period|Module\s+content|$)/i);
  const department = deptMatch ? deptMatch[1].trim() : '';

  return {
    code,
    name: name || code,
    credits,
    nqfLevel,
    semester,
    yearLevel,
    type,
    prerequisites,
    corequisites,
    description,
    contactTime,
    department,
  };
}

function detectModuleType(code: string, context: string): 'core' | 'fundamental' | 'elective' {
  // Check surrounding text for section headers
  const before = context.substring(0, Math.min(500, context.indexOf(code) || 500));

  // Known UP fundamental module prefixes
  const fundamentalPrefixes = ['AIM', 'LST', 'UPO', 'ALL', 'ALC'];
  if (fundamentalPrefixes.some((p) => code.startsWith(p))) return 'fundamental';

  if (/Fundamental\s+modules/i.test(before)) return 'fundamental';
  if (/Elective\s+modules/i.test(before)) return 'elective';
  if (/Core\s+modules/i.test(before)) return 'core';

  return 'core'; // Default for UP
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function matchInt(text: string, pattern: RegExp, fallback: number): number {
  const match = text.match(pattern);
  if (!match) return fallback;
  const val = parseFloat(match[1]);
  return isNaN(val) ? fallback : Math.round(val);
}

function extractModuleCodes(text: string): string[] {
  const codes: string[] = [];
  const pattern = /([A-Z]{2,4})\s*(\d{3})/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const code = `${match[1]} ${match[2]}`;
    if (!codes.includes(code)) codes.push(code);
  }
  return codes;
}

function cleanModuleName(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();
}
