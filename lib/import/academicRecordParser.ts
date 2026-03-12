/**
 * UP Academic Record PDF Parser
 * Extracts student grades, CWA, pass/fail history from UP academic record PDFs
 *
 * UP Academic Record format:
 * - Student info: number, name, degree, faculty
 * - Year sections: "2022", "2023", etc.
 * - Each year has semesters with module entries
 * - Module line: "COS 132  Imperative Programming  16  73  P"
 *   (code, name, credits, mark, result)
 * - Summary: CWA, total credits, academic status
 */

import { PDFExtractionResult } from './pdfExtractor';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AcademicRecordResult {
  student: {
    studentNumber: string;
    name: string;
    degree: string;
    faculty: string;
    campus: string;
  };
  years: AcademicYear[];
  summary: {
    cwa: number;
    totalCredits: number;
    totalCreditsPassed: number;
    academicStatus: string;
  };
  warnings: string[];
}

export interface AcademicYear {
  year: number;
  yearOfStudy: number; // 1st year, 2nd year...
  semesters: AcademicSemester[];
  yearCredits: number;
  yearAverage: number;
}

export interface AcademicSemester {
  semester: number; // 1 or 2
  modules: RecordModule[];
  semesterCredits: number;
  semesterAverage: number;
}

export interface RecordModule {
  code: string;
  name: string;
  credits: number;
  mark: number | null;   // null = no mark yet (current year)
  result: ModuleResult;
  supplementary: boolean;
  comment: string;
}

export type ModuleResult = 'P' | 'F' | 'DPR' | 'AB' | 'PP' | 'NC' | 'IP' | 'RW' | 'FM';
// P = Pass, F = Fail, DPR = Deregistered, AB = Absent
// PP = Pass with supplementary, NC = No Credit, IP = In Progress
// RW = Readmitted with warning, FM = Failed module

// ─── Parser ──────────────────────────────────────────────────────────────────

export function parseAcademicRecord(pdf: PDFExtractionResult): AcademicRecordResult {
  const text = pdf.fullText;
  const warnings: string[] = [];

  const student = extractStudentInfo(text, warnings);
  const years = extractAcademicYears(text, warnings);
  const summary = extractSummary(text, years);

  return { student, years, summary, warnings };
}

// ─── Student Info ────────────────────────────────────────────────────────────

function extractStudentInfo(text: string, warnings: string[]) {
  const studentNumMatch = text.match(/Student\s+(?:number|no|#)\s*[:.]?\s*(\d{7,10})/i) ||
                          text.match(/(\d{8})\s/);
  const studentNumber = studentNumMatch ? studentNumMatch[1] : '';

  if (!studentNumber) warnings.push('Could not detect student number');

  const nameMatch = text.match(/(?:Student|Name)\s*[:.]?\s*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,4})/i) ||
                    text.match(/(?:Surname|Initials)\s+(.+)/i);
  const name = nameMatch ? nameMatch[1].trim() : 'Unknown';

  const degreeMatch = text.match(/(?:Programme|Qualification|Degree)\s*[:.]?\s*(.+?)(?:\n|Faculty)/i);
  const degree = degreeMatch ? degreeMatch[1].trim() : 'Unknown';

  const facultyMatch = text.match(/Faculty\s*[:.]?\s*(.+?)(?:\n|Campus|Department)/i);
  const faculty = facultyMatch ? facultyMatch[1].trim() : 'Unknown';

  const campusMatch = text.match(/Campus\s*[:.]?\s*(.+?)(?:\n|$)/i);
  const campus = campusMatch ? campusMatch[1].trim() : 'Hatfield';

  return { studentNumber, name, degree, faculty, campus };
}

// ─── Academic Years ──────────────────────────────────────────────────────────

function extractAcademicYears(text: string, warnings: string[]): AcademicYear[] {
  const years: AcademicYear[] = [];
  const lines = text.split('\n');

  let currentYear: number | null = null;
  let currentSemester = 1;
  let currentModules: RecordModule[] = [];
  let yearModules: RecordModule[][] = [[], []]; // semester 1, semester 2

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect year header: standalone 4-digit year (2020-2030 range)
    const yearHeader = line.match(/^(20[2-3]\d)$/);
    if (yearHeader) {
      // Save previous year if exists
      if (currentYear !== null) {
        years.push(buildAcademicYear(currentYear, years.length + 1, yearModules));
      }
      currentYear = parseInt(yearHeader[1]);
      currentSemester = 1;
      yearModules = [[], []];
      continue;
    }

    // Detect semester
    const semMatch = line.match(/Semester\s+(\d)/i);
    if (semMatch) {
      currentSemester = parseInt(semMatch[1]);
      continue;
    }

    // Detect module line: CODE NNN  Module Name  Credits  Mark  Result
    const moduleLine = parseModuleLine(line);
    if (moduleLine && currentYear !== null) {
      const semIdx = Math.min(currentSemester - 1, 1);
      yearModules[semIdx].push(moduleLine);
    }
  }

  // Don't forget the last year
  if (currentYear !== null) {
    years.push(buildAcademicYear(currentYear, years.length + 1, yearModules));
  }

  if (years.length === 0) {
    warnings.push('No academic years detected — check record format');
  }

  return years;
}

function parseModuleLine(line: string): RecordModule | null {
  // Patterns for UP academic records:
  // "COS 132  Imperative Programming  16  73  P"
  // "WTW 114  Calculus  16  52  P"
  // "AIM 102  Academic Information Management  4  62  P"
  
  const patterns = [
    // Standard: CODE NNN  Name  Credits  Mark  Result
    /^([A-Z]{2,4})\s+(\d{3})\s+(.+?)\s+(\d{1,3})\s+(\d{1,3})\s+([A-Z]{1,3})\s*$/,
    // Without mark (current/IP): CODE NNN  Name  Credits  Result
    /^([A-Z]{2,4})\s+(\d{3})\s+(.+?)\s+(\d{1,3})\s+([A-Z]{1,3})\s*$/,
    // Compact: just code and other fields tab/space separated
    /^([A-Z]{2,4})\s*(\d{3})\s+(.+?)\s{2,}(\d{1,3})\s+(\d{1,3})\s+(\w{1,3})/,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (!match) continue;

    if (match.length === 7) {
      // Full: code prefix, code num, name, credits, mark, result
      return {
        code: `${match[1]} ${match[2]}`,
        name: match[3].trim(),
        credits: parseInt(match[4]),
        mark: parseInt(match[5]),
        result: match[6] as ModuleResult,
        supplementary: match[6] === 'PP',
        comment: '',
      };
    } else if (match.length === 6) {
      // Without mark
      return {
        code: `${match[1]} ${match[2]}`,
        name: match[3].trim(),
        credits: parseInt(match[4]),
        mark: null,
        result: match[5] as ModuleResult,
        supplementary: false,
        comment: '',
      };
    }
  }

  return null;
}

function buildAcademicYear(
  year: number,
  yearOfStudy: number,
  semesterModules: RecordModule[][]
): AcademicYear {
  const semesters: AcademicSemester[] = [];

  for (let s = 0; s < 2; s++) {
    const mods = semesterModules[s];
    if (mods.length === 0) continue;

    const totalCredits = mods.reduce((sum, m) => sum + m.credits, 0);
    const passedMods = mods.filter((m) => m.mark !== null && m.mark > 0);
    const weightedSum = passedMods.reduce((sum, m) => sum + (m.mark || 0) * m.credits, 0);
    const weightedCredits = passedMods.reduce((sum, m) => sum + m.credits, 0);

    semesters.push({
      semester: s + 1,
      modules: mods,
      semesterCredits: totalCredits,
      semesterAverage: weightedCredits > 0 ? Math.round((weightedSum / weightedCredits) * 10) / 10 : 0,
    });
  }

  const yearCredits = semesters.reduce((sum, s) => sum + s.semesterCredits, 0);
  const allMods = semesters.flatMap((s) => s.modules).filter((m) => m.mark !== null);
  const weightedSum = allMods.reduce((sum, m) => sum + (m.mark || 0) * m.credits, 0);
  const weightedCredits = allMods.reduce((sum, m) => sum + m.credits, 0);

  return {
    year,
    yearOfStudy,
    semesters,
    yearCredits,
    yearAverage: weightedCredits > 0 ? Math.round((weightedSum / weightedCredits) * 10) / 10 : 0,
  };
}

// ─── Summary ─────────────────────────────────────────────────────────────────

function extractSummary(text: string, years: AcademicYear[]) {
  // Try to find CWA in the record text
  const cwaMatch = text.match(/(?:CWA|Cumulative\s+Weighted\s+Average|Weighted\s+Average)\s*[:.]?\s*(\d+\.?\d*)/i);

  const allModules = years.flatMap((y) => y.semesters.flatMap((s) => s.modules));
  const passedModules = allModules.filter((m) => m.result === 'P' || m.result === 'PP');

  const totalCredits = allModules.reduce((sum, m) => sum + m.credits, 0);
  const totalCreditsPassed = passedModules.reduce((sum, m) => sum + m.credits, 0);

  // Calculate CWA from modules if not found in text
  const modsWithMarks = allModules.filter((m) => m.mark !== null && m.mark > 0);
  const weightedSum = modsWithMarks.reduce((sum, m) => sum + (m.mark || 0) * m.credits, 0);
  const weightedCredits = modsWithMarks.reduce((sum, m) => sum + m.credits, 0);
  const calculatedCWA = weightedCredits > 0 ? Math.round((weightedSum / weightedCredits) * 10) / 10 : 0;

  const cwa = cwaMatch ? parseFloat(cwaMatch[1]) : calculatedCWA;

  // Academic status
  const statusMatch = text.match(/(?:Academic\s+Status|Status)\s*[:.]?\s*(.+?)(?:\n|$)/i);
  const academicStatus = statusMatch ? statusMatch[1].trim() : (
    passedModules.length === allModules.length ? 'Good Standing' : 'See record'
  );

  return {
    cwa,
    totalCredits,
    totalCreditsPassed,
    academicStatus,
  };
}
