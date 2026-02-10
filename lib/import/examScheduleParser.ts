/**
 * UP Exam / Test Schedule PDF Parser
 * Extracts exam and test dates, times, venues from UP exam timetable PDFs
 *
 * UP Exam Schedule formats:
 * 1. Official exam timetable (from UP Portal):
 *    - Date | Session | Module Code | Module Name | Venue | Duration
 *    - Sessions: AM (08:30), PM (12:30), EVE (17:00)
 * 2. Departmental test schedule:
 *    - Module | Test # | Date | Time | Venue | Coverage
 * 3. Class test schedule per module:
 *    - Assessment | Date | Weight | Topic
 *
 * Output maps to Assessment type for use in academic tracking
 */

import { PDFExtractionResult } from './pdfExtractor';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExamScheduleResult {
  period: string;         // "May/June 2025", "Semester Test 1", etc.
  assessments: ExamEntry[];
  warnings: string[];
}

export interface ExamEntry {
  moduleCode: string;
  moduleName: string;
  type: 'exam' | 'test' | 'semester-test' | 'class-test' | 'practical-exam';
  date: string;           // "2025-06-02" ISO date
  startTime: string;      // "08:30"
  endTime: string;        // "11:30"
  duration: number;       // minutes
  venue: string;
  session: string;        // "AM", "PM", "EVE" or custom
  weight: number;         // percentage weight (0-100), 0 if unknown
  coverage: string;       // what the exam covers
  seatNumber: string;     // if assigned
}

// ─── Parser ──────────────────────────────────────────────────────────────────

export function parseExamSchedule(pdf: PDFExtractionResult): ExamScheduleResult {
  const text = pdf.fullText;
  const warnings: string[] = [];

  const period = detectPeriod(text);

  // Try official exam timetable format first
  let assessments = parseOfficialExamFormat(text, warnings);

  // Try departmental test format
  if (assessments.length === 0) {
    assessments = parseDepartmentalTestFormat(text, warnings);
  }

  // Try general date+module extraction
  if (assessments.length === 0) {
    assessments = parseGeneralFormat(text, warnings);
  }

  if (assessments.length === 0) {
    warnings.push('No exam/test entries found — the format may not match expected UP patterns');
  }

  // Sort by date
  assessments.sort((a, b) => a.date.localeCompare(b.date));

  return { period, assessments, warnings };
}

// ─── Period Detection ────────────────────────────────────────────────────────

function detectPeriod(text: string): string {
  // "May/June 2025 Examination Timetable"
  const examPeriod = text.match(/((?:January|February|March|May|June|July|August|October|November|December)(?:\s*\/\s*(?:January|February|March|May|June|July|August|October|November|December))?)\s+(20\d{2})/i);
  if (examPeriod) return `${examPeriod[1]} ${examPeriod[2]}`;

  // "Semester Test 1" or "Semester Test 2"
  const semTest = text.match(/Semester\s+Test\s+(\d)/i);
  if (semTest) return `Semester Test ${semTest[1]}`;

  // "2025 Semester 1"
  const sem = text.match(/(20\d{2})\s+Semester\s+(\d)/i);
  if (sem) return `${sem[1]} Semester ${sem[2]}`;

  return 'Unknown Period';
}

// ─── Official Exam Format ────────────────────────────────────────────────────

function parseOfficialExamFormat(text: string, warnings: string[]): ExamEntry[] {
  const entries: ExamEntry[] = [];
  const lines = text.split('\n');

  let currentDate = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect date line: "Monday, 2 June 2025" or "02/06/2025" or "2025-06-02"
    const dateLine = parseDate(trimmed);
    if (dateLine && !trimmed.match(/[A-Z]{2,4}\s+\d{3}/)) {
      currentDate = dateLine;
      continue;
    }

    // Official exam pattern:
    // "AM  COS 212  Data Structures and Algorithms  IT Building  180 min"
    // or "08:30  COS 212  Data Structures  Exam Venue  3h"
    const examPatterns = [
      // Session  Code  Name  Venue  Duration
      /(AM|PM|EVE|08:30|12:30|17:00)\s+([A-Z]{2,4})\s+(\d{3})\s+(.+?)\s{2,}(.+?)\s+(\d+)\s*(?:min|minutes|hrs?|hours?)/i,
      // Code  Session  Venue  Duration
      /([A-Z]{2,4})\s+(\d{3})\s+(.+?)\s+(AM|PM|EVE)\s+(.+?)\s+(\d+)\s*(?:min|minutes)/i,
      // Simple: Code  Date  Time
      /([A-Z]{2,4})\s+(\d{3})\s+(.+?)\s+(\d{1,2}[:h]\d{2})\s*[-–]\s*(\d{1,2}[:h]\d{2})/i,
    ];

    for (const pattern of examPatterns) {
      const match = trimmed.match(pattern);
      if (!match) continue;

      if (pattern === examPatterns[0]) {
        const session = normalizeSession(match[1]);
        entries.push({
          moduleCode: `${match[2]} ${match[3]}`,
          moduleName: match[4].trim(),
          type: 'exam',
          date: currentDate || '',
          startTime: sessionToTime(session),
          endTime: calculateEndTime(sessionToTime(session), parseInt(match[6])),
          duration: parseInt(match[6]),
          venue: match[5].trim(),
          session,
          weight: 0,
          coverage: '',
          seatNumber: '',
        });
      } else if (pattern === examPatterns[1]) {
        entries.push({
          moduleCode: `${match[1]} ${match[2]}`,
          moduleName: match[3].trim(),
          type: 'exam',
          date: currentDate || '',
          startTime: sessionToTime(normalizeSession(match[4])),
          endTime: calculateEndTime(sessionToTime(normalizeSession(match[4])), parseInt(match[6])),
          duration: parseInt(match[6]),
          venue: match[5].trim(),
          session: normalizeSession(match[4]),
          weight: 0,
          coverage: '',
          seatNumber: '',
        });
      } else if (pattern === examPatterns[2]) {
        const startTime = normalizeTime(match[4]);
        const endTime = normalizeTime(match[5]);
        entries.push({
          moduleCode: `${match[1]} ${match[2]}`,
          moduleName: match[3].trim(),
          type: 'exam',
          date: currentDate || '',
          startTime,
          endTime,
          duration: timeDiffMinutes(startTime, endTime),
          venue: '',
          session: timeToSession(startTime),
          weight: 0,
          coverage: '',
          seatNumber: '',
        });
      }
      break;
    }
  }

  return entries;
}

// ─── Departmental Test Format ────────────────────────────────────────────────

function parseDepartmentalTestFormat(text: string, warnings: string[]): ExamEntry[] {
  const entries: ExamEntry[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Pattern: "COS 212  Test 1  15 March 2025  08:00-10:00  IT 4-4  Ch1-3  20%"
    const testPattern = /([A-Z]{2,4})\s+(\d{3})\s+((?:Test|Semester\s+Test|Class\s+Test|ST)\s*\d*)\s+(\d{1,2}\s+\w+\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}[:h]\d{2})\s*[-–]\s*(\d{1,2}[:h]\d{2})\s*(.*?)(?:\s+(\d+)%)?$/i;

    const match = trimmed.match(testPattern);
    if (match) {
      const startTime = normalizeTime(match[5]);
      const endTime = normalizeTime(match[6]);
      const testType = match[3].toLowerCase().includes('semester') ? 'semester-test' :
                       match[3].toLowerCase().includes('class') ? 'class-test' : 'test';

      entries.push({
        moduleCode: `${match[1]} ${match[2]}`,
        moduleName: '',
        type: testType,
        date: parseDate(match[4]) || match[4],
        startTime,
        endTime,
        duration: timeDiffMinutes(startTime, endTime),
        venue: match[7] ? match[7].trim().replace(/\s+\d+%$/, '') : '',
        session: timeToSession(startTime),
        weight: match[8] ? parseInt(match[8]) : 0,
        coverage: '',
        seatNumber: '',
      });
      continue;
    }

    // Simpler pattern: module code + date somewhere
    const simplePattern = /([A-Z]{2,4})\s+(\d{3}).*?(Test|Exam|ST|Assessment)\s*(\d*).*?(\d{1,2}\s+\w+\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i;
    const simpleMatch = trimmed.match(simplePattern);
    if (simpleMatch) {
      const timeMatch = trimmed.match(/(\d{1,2}[:h]\d{2})\s*[-–]\s*(\d{1,2}[:h]\d{2})/);
      const weightMatch = trimmed.match(/(\d+)\s*%/);

      entries.push({
        moduleCode: `${simpleMatch[1]} ${simpleMatch[2]}`,
        moduleName: '',
        type: simpleMatch[3].toLowerCase().includes('exam') ? 'exam' : 'test',
        date: parseDate(simpleMatch[5]) || simpleMatch[5],
        startTime: timeMatch ? normalizeTime(timeMatch[1]) : '',
        endTime: timeMatch ? normalizeTime(timeMatch[2]) : '',
        duration: timeMatch ? timeDiffMinutes(normalizeTime(timeMatch[1]), normalizeTime(timeMatch[2])) : 0,
        venue: '',
        session: '',
        weight: weightMatch ? parseInt(weightMatch[1]) : 0,
        coverage: '',
        seatNumber: '',
      });
    }
  }

  return entries;
}

// ─── General Format ──────────────────────────────────────────────────────────

function parseGeneralFormat(text: string, warnings: string[]): ExamEntry[] {
  const entries: ExamEntry[] = [];

  // Find all occurrences of module codes near dates
  const pattern = /([A-Z]{2,4})\s+(\d{3})/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Look at surrounding context (200 chars before and after)
    const start = Math.max(0, match.index - 200);
    const end = Math.min(text.length, match.index + 200);
    const context = text.substring(start, end);

    // Find date in context
    const dateMatch = context.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i) ||
                      context.match(/(\d{1,2})\/(\d{1,2})\/(20\d{2})/);

    if (!dateMatch) continue;

    const date = parseDate(dateMatch[0]) || '';
    if (!date) continue;

    // Find time in context
    const timeMatch = context.match(/(\d{1,2}[:h]\d{2})\s*[-–]\s*(\d{1,2}[:h]\d{2})/);
    const weightMatch = context.match(/(\d+)\s*%/);

    // Determine type from context
    const isExam = /exam/i.test(context);
    const type = isExam ? 'exam' as const : 'test' as const;

    entries.push({
      moduleCode: `${match[1]} ${match[2]}`,
      moduleName: '',
      type,
      date,
      startTime: timeMatch ? normalizeTime(timeMatch[1]) : '',
      endTime: timeMatch ? normalizeTime(timeMatch[2]) : '',
      duration: timeMatch ? timeDiffMinutes(normalizeTime(timeMatch[1]), normalizeTime(timeMatch[2])) : 0,
      venue: '',
      session: '',
      weight: weightMatch ? parseInt(weightMatch[1]) : 0,
      coverage: '',
      seatNumber: '',
    });
  }

  // Deduplicate by module+date
  const seen = new Set<string>();
  return entries.filter((e) => {
    const key = `${e.moduleCode}-${e.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDate(text: string): string | null {
  // "2 June 2025" → "2025-06-02"
  const longDate = text.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i);
  if (longDate) {
    const months: Record<string, string> = {
      january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
      july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
    };
    const d = longDate[1].padStart(2, '0');
    const m = months[longDate[2].toLowerCase()];
    return `${longDate[3]}-${m}-${d}`;
  }

  // "02/06/2025" → "2025-06-02" (DD/MM/YYYY - South African format)
  const shortDate = text.match(/(\d{1,2})\/(\d{1,2})\/(20\d{2})/);
  if (shortDate) {
    return `${shortDate[3]}-${shortDate[2].padStart(2, '0')}-${shortDate[1].padStart(2, '0')}`;
  }

  // "2025-06-02" already ISO
  const isoDate = text.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (isoDate) return isoDate[0];

  return null;
}

function normalizeTime(time: string): string {
  return time
    .replace('h', ':')
    .replace(/^(\d):/, '0$1:')
    .replace(/^(\d{1,2}):(\d{2})$/, (_, h, m) => `${h.padStart(2, '0')}:${m}`);
}

function normalizeSession(session: string): string {
  if (/AM|08:30/i.test(session)) return 'AM';
  if (/PM|12:30/i.test(session)) return 'PM';
  if (/EVE|17:00/i.test(session)) return 'EVE';
  return session;
}

function sessionToTime(session: string): string {
  switch (session) {
    case 'AM': return '08:30';
    case 'PM': return '12:30';
    case 'EVE': return '17:00';
    default: return '08:30';
  }
}

function timeToSession(time: string): string {
  const hour = parseInt(time.split(':')[0]);
  if (hour < 12) return 'AM';
  if (hour < 16) return 'PM';
  return 'EVE';
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

function timeDiffMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}
