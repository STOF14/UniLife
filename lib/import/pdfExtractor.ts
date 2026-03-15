/**
 * Core PDF text extractor using pdfjs-dist
 * Shared foundation for all document parsers
 */

type PdfJsModule = typeof import('pdfjs-dist');

let pdfjsLibPromise: Promise<PdfJsModule> | null = null;

async function getPdfJs() {
  if (typeof window === 'undefined') {
    throw new Error('PDF extraction is only available in the browser');
  }

  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist').then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      return pdfjsLib;
    });
  }

  return pdfjsLibPromise;
}

export interface PDFTextLine {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontName: string;
  isBold: boolean;
  page: number;
}

export interface PDFPageData {
  pageNumber: number;
  lines: PDFTextLine[];
  rawText: string;
  width: number;
  height: number;
}

export interface PDFExtractionResult {
  pages: PDFPageData[];
  fullText: string;
  totalPages: number;
  metadata: Record<string, string>;
}

/**
 * Extract structured text from a PDF file
 * Preserves position, font size, and line structure
 */
export async function extractPDFText(file: File): Promise<PDFExtractionResult> {
  const pdfjsLib = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);

  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
  const pages: PDFPageData[] = [];
  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    // Group text items by their Y position to form lines
    const items = textContent.items as Array<{
      str: string;
      transform: number[];
      fontName: string;
      height: number;
    }>;

    // Sort by Y (descending = top-to-bottom) then X (left-to-right)
    const sorted = [...items].sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 3) return yDiff;
      return a.transform[4] - b.transform[4];
    });

    // Group into lines (items within 3pt Y distance)
    const lines: PDFTextLine[] = [];
    let currentLineY = -Infinity;
    let currentLineText = '';
    let currentLineX = 0;
    let currentFontSize = 0;
    let currentFontName = '';
    let currentIsBold = false;

    for (const item of sorted) {
      if (!item.str.trim()) continue;

      const y = item.transform[5];
      const x = item.transform[4];
      const fontSize = item.height || Math.abs(item.transform[3]);
      const fontName = item.fontName || '';
      const isBold = fontName.toLowerCase().includes('bold');

      if (Math.abs(y - currentLineY) > 3 && currentLineText) {
        // New line — push current
        lines.push({
          text: currentLineText.trim(),
          x: currentLineX,
          y: currentLineY,
          fontSize: currentFontSize,
          fontName: currentFontName,
          isBold: currentIsBold,
          page: pageNum,
        });
        currentLineText = '';
      }

      if (!currentLineText) {
        currentLineX = x;
        currentFontSize = fontSize;
        currentFontName = fontName;
        currentIsBold = isBold;
      }

      currentLineY = y;
      currentLineText += (currentLineText ? ' ' : '') + item.str;
    }

    // Push last line
    if (currentLineText.trim()) {
      lines.push({
        text: currentLineText.trim(),
        x: currentLineX,
        y: currentLineY,
        fontSize: currentFontSize,
        fontName: currentFontName,
        isBold: currentIsBold,
        page: pageNum,
      });
    }

    const pageRawText = lines.map((l) => l.text).join('\n');
    fullText += pageRawText + '\n\n';

    pages.push({
      pageNumber: pageNum,
      lines,
      rawText: pageRawText,
      width: viewport.width,
      height: viewport.height,
    });
  }

  // Extract metadata
  const metaData = await pdf.getMetadata().catch(() => null);
  const metadata: Record<string, string> = {};
  if (metaData?.info) {
    const info = metaData.info as Record<string, unknown>;
    for (const [key, value] of Object.entries(info)) {
      if (typeof value === 'string') {
        metadata[key] = value;
      }
    }
  }

  return {
    pages,
    fullText,
    totalPages: pdf.numPages,
    metadata,
  };
}

/**
 * Detect the type of UP document based on content patterns
 */
export type UPDocumentType = 'yearbook' | 'academic-record' | 'module-schedule' | 'exam-schedule' | 'unknown';

export function detectDocumentType(result: PDFExtractionResult): UPDocumentType {
  const text = result.fullText.toLowerCase();

  // Yearbook: Contains "yearbook", curriculum info, degree descriptions
  if (
    text.includes('yearbook') &&
    (text.includes('curriculum') || text.includes('module credits'))
  ) {
    return 'yearbook';
  }

  // Academic record: Contains student number, academic record, GPA/marks
  if (
    (text.includes('academic record') || text.includes('student record')) &&
    (text.includes('student number') || text.includes('student no'))
  ) {
    return 'academic-record';
  }

  // Module schedule / timetable
  if (
    (text.includes('timetable') || text.includes('time table') || text.includes('schedule')) &&
    (text.includes('monday') || text.includes('tuesday') || text.includes('lecture'))
  ) {
    return 'module-schedule';
  }

  // Exam schedule
  if (
    (text.includes('examination') || text.includes('exam')) &&
    (text.includes('venue') || text.includes('session')) &&
    (text.includes('date') || text.includes('time'))
  ) {
    return 'exam-schedule';
  }

  return 'unknown';
}
