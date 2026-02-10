/**
 * UP Module Schedule / Timetable PDF Parser
 * Extracts weekly class schedule from UP module schedule PDFs
 *
 * UP Module Schedule format (typically from UP Portal / class timetable):
 * - Student info at top
 * - Semester indication
 * - Table with columns: Module, Type, Day, Start, End, Venue, Group
 * - Or grid format: Mon/Tue/Wed/Thu/Fri rows with time slots
 *
 * Output maps to ClassSchedule type for use in the timetable view
 */

import { PDFExtractionResult, PDFTextLine } from './pdfExtractor';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScheduleResult {
  semester: number;
  year: number;
  classes: ScheduleEntry[];
  warnings: string[];
}

export interface ScheduleEntry {
  moduleCode: string;
  moduleName: string;
  type: 'lecture' | 'tutorial' | 'practical' | 'seminar' | 'other';
  day: string;             // "Monday", "Tuesday", etc.
  startTime: string;       // "08:00"
  endTime: string;         // "09:50"
  venue: string;
  group: string;           // tutorial/practical group
  campus: string;
  periodicity: string;     // "Weekly", "Even weeks", "Odd weeks"
}

// ─── Parser ──────────────────────────────────────────────────────────────────

export function parseModuleSchedule(pdf: PDFExtractionResult): ScheduleResult {
  const text = pdf.fullText;
  const warnings: string[] = [];

  const semester = detectSemester(text);
  const year = detectYear(text);

  // Try table-format parsing first (most common)
  let classes = parseTableFormat(text, warnings);

  // If table format yields nothing, try grid format
  if (classes.length === 0) {
    classes = parseGridFormat(text, warnings);
  }

  // If still nothing, try line-by-line with structured page data
  if (classes.length === 0) {
    classes = parseStructuredLines(pdf.pages, warnings);
  }

  if (classes.length === 0) {
    warnings.push('No schedule entries found — the format may not match expected UP patterns');
  }

  return { semester, year, classes, warnings };
}

// ─── Semester & Year Detection ───────────────────────────────────────────────

function detectSemester(text: string): number {
  const semMatch = text.match(/Semester\s+(\d)/i);
  if (semMatch) return parseInt(semMatch[1]);

  // Infer from dates if possible
  const months = text.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)/gi);
  if (months) {
    const s1Months = ['January', 'February', 'March', 'April', 'May', 'June'];
    const isSem1 = months.some((m) => s1Months.includes(m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()));
    return isSem1 ? 1 : 2;
  }

  return 1;
}

function detectYear(text: string): number {
  const yearMatch = text.match(/\b(202[4-9]|203\d)\b/);
  return yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
}

// ─── Table Format Parser ─────────────────────────────────────────────────────

function parseTableFormat(text: string, warnings: string[]): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Pattern: "COS 212  Lecture  Monday  08:00  09:50  IT 4-4  Main"
    const tablePattern = /([A-Z]{2,4})\s+(\d{3})\s+(Lecture|Tutorial|Practical|Seminar|Lab|Prac)\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri)\s+(\d{1,2}[:h]\d{2})\s*[-–]?\s*(\d{1,2}[:h]\d{2})\s+(.+?)(?:\s+(Group\s*\w+|[A-Z]\d*))?$/i;

    const match = line.match(tablePattern);
    if (match) {
      entries.push({
        moduleCode: `${match[1]} ${match[2]}`,
        moduleName: '',
        type: normalizeType(match[3]),
        day: normalizeDay(match[4]),
        startTime: normalizeTime(match[5]),
        endTime: normalizeTime(match[6]),
        venue: match[7].trim(),
        group: match[8] ? match[8].trim() : '',
        campus: detectCampus(match[7]),
        periodicity: 'Weekly',
      });
      continue;
    }

    // Looser pattern: module code + day + times anywhere on the line
    const loosePattern = /([A-Z]{2,4})\s+(\d{3}).*?(Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri).*?(\d{1,2}[:h]\d{2})\s*[-–to]+\s*(\d{1,2}[:h]\d{2})/i;
    const looseMatch = line.match(loosePattern);
    if (looseMatch) {
      const venueMatch = line.match(/(?:venue|room|hall|building|IT|Engineering|Humanities|Natural\s+Sciences)\s*[\d-]+/i);
      entries.push({
        moduleCode: `${looseMatch[1]} ${looseMatch[2]}`,
        moduleName: '',
        type: detectTypeFromContext(line),
        day: normalizeDay(looseMatch[3]),
        startTime: normalizeTime(looseMatch[4]),
        endTime: normalizeTime(looseMatch[5]),
        venue: venueMatch ? venueMatch[0].trim() : '',
        group: '',
        campus: venueMatch ? detectCampus(venueMatch[0]) : 'Hatfield',
        periodicity: 'Weekly',
      });
    }
  }

  return entries;
}

// ─── Grid Format Parser ──────────────────────────────────────────────────────

function parseGridFormat(text: string, warnings: string[]): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  for (const day of days) {
    // Find sections starting with day name
    const dayPattern = new RegExp(`${day}[\\s\\S]*?(?=${days.filter((d) => d !== day).join('|')}|$)`, 'i');
    const daySection = text.match(dayPattern);
    if (!daySection) continue;

    // Extract time slots and module codes from this day's section
    const slotPattern = /(\d{1,2}[:h]\d{2})\s*[-–]\s*(\d{1,2}[:h]\d{2})\s*([A-Z]{2,4})\s+(\d{3})/g;
    let match;
    while ((match = slotPattern.exec(daySection[0])) !== null) {
      entries.push({
        moduleCode: `${match[3]} ${match[4]}`,
        moduleName: '',
        type: 'lecture',
        day,
        startTime: normalizeTime(match[1]),
        endTime: normalizeTime(match[2]),
        venue: '',
        group: '',
        campus: 'Hatfield',
        periodicity: 'Weekly',
      });
    }
  }

  return entries;
}

// ─── Structured Line Parser ─────────────────────────────────────────────────

function parseStructuredLines(
  pages: PDFExtractionResult['pages'],
  warnings: string[]
): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];

  for (const page of pages) {
    // Group lines that are near each other vertically (same row in a table)
    let currentModuleCode = '';

    for (const line of page.lines) {
      // Check if line contains a module code
      const codeMatch = line.text.match(/([A-Z]{2,4})\s+(\d{3})/);
      if (codeMatch) {
        currentModuleCode = `${codeMatch[1]} ${codeMatch[2]}`;
      }

      // Check for time pattern
      const timeMatch = line.text.match(/(\d{1,2}[:h]\d{2})\s*[-–]\s*(\d{1,2}[:h]\d{2})/);
      const dayMatch = line.text.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri)/i);

      if (currentModuleCode && timeMatch && dayMatch) {
        entries.push({
          moduleCode: currentModuleCode,
          moduleName: '',
          type: detectTypeFromContext(line.text),
          day: normalizeDay(dayMatch[1]),
          startTime: normalizeTime(timeMatch[1]),
          endTime: normalizeTime(timeMatch[2]),
          venue: extractVenue(line.text),
          group: '',
          campus: 'Hatfield',
          periodicity: 'Weekly',
        });
      }
    }
  }

  return entries;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeDay(day: string): string {
  const map: Record<string, string> = {
    mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
    thu: 'Thursday', fri: 'Friday',
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday',
  };
  return map[day.toLowerCase()] || day;
}

function normalizeTime(time: string): string {
  // "8h00" → "08:00", "14:30" → "14:30"
  return time
    .replace('h', ':')
    .replace(/^(\d):/, '0$1:')
    .replace(/^(\d{1,2}):(\d{2})$/, (_, h, m) => `${h.padStart(2, '0')}:${m}`);
}

function normalizeType(type: string): ScheduleEntry['type'] {
  const t = type.toLowerCase();
  if (t === 'lecture' || t === 'lec') return 'lecture';
  if (t === 'tutorial' || t === 'tut') return 'tutorial';
  if (t === 'practical' || t === 'prac' || t === 'lab') return 'practical';
  if (t === 'seminar' || t === 'sem') return 'seminar';
  return 'other';
}

function detectTypeFromContext(text: string): ScheduleEntry['type'] {
  const t = text.toLowerCase();
  if (/\b(tutorial|tut)\b/.test(t)) return 'tutorial';
  if (/\b(practical|prac|lab)\b/.test(t)) return 'practical';
  if (/\b(seminar|sem)\b/.test(t)) return 'seminar';
  return 'lecture';
}

function detectCampus(venue: string): string {
  const v = venue.toLowerCase();
  if (v.includes('groenkloof') || v.includes('gk')) return 'Groenkloof';
  if (v.includes('mamelodi')) return 'Mamelodi';
  if (v.includes('prinshof') || v.includes('health')) return 'Prinshof';
  if (v.includes('onderstepoort') || v.includes('vet')) return 'Onderstepoort';
  return 'Hatfield';
}

function extractVenue(text: string): string {
  // Common UP venue patterns
  const venuePatterns = [
    /(?:IT|Eng|Humanities|Natural Sciences|Law|Ekonomie|Merensky|Aula)\s*[\d-]+[A-Za-z]*/i,
    /(?:Room|Venue|Hall|Building)\s*[:.]?\s*([A-Za-z0-9\s-]+)/i,
    /\b([A-Z]{2,3}\s*\d{1,2}[-]\d{1,3})\b/,
  ];

  for (const pattern of venuePatterns) {
    const match = text.match(pattern);
    if (match) return (match[1] || match[0]).trim();
  }

  return '';
}
