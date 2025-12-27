// PDF Parser utility for extracting modules from University yearbook PDFs
// Next.js compatible version - NO external dependencies needed!
// Optimized for University of Pretoria yearbook format with elective filtering

export interface ExtractedModule {
  code: string;
  name: string;
  credits: number;
  year: number; // 1, 2, or 3
  isCore: boolean; // true if core module, false if elective
}

/**
 * Extracts text from PDF using native browser PDF parsing
 */
async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        
        // Use PDF.js from CDN
        const pdfjsLib = await loadPdfJs();
        
        const loadingTask = pdfjsLib.getDocument({ data: typedArray });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        
        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n';
        }
        
        resolve(fullText);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Dynamically load PDF.js from CDN
 */
async function loadPdfJs(): Promise<any> {
  // Check if already loaded
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        reject(new Error('PDF.js failed to load'));
        return;
      }
      
      // Set worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      resolve(pdfjsLib);
    };
    
    script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
    
    document.head.appendChild(script);
  });
}

/**
 * Determines if a module is a core module based on context
 */
function isCoreModule(context: string, moduleCode: string): boolean {
  // Check if the context explicitly mentions "Core modules" or "Fundamental modules"
  const sectionBeforeModule = context.substring(0, context.indexOf(moduleCode));
  const last500Chars = sectionBeforeModule.slice(-500);
  
  if (last500Chars.match(/Core modules/i)) {
    return true;
  }
  
  if (last500Chars.match(/Fundamental modules/i)) {
    return true;
  }
  
  // If we find "Elective modules" before the module, it's elective
  if (last500Chars.match(/Elective modules/i)) {
    return false;
  }
  
  // Default to elective for safety (user can select what they want)
  return false;
}

/**
 * Extracts module information from a University of Pretoria yearbook PDF
 * Optimized to handle core vs elective modules
 */
export async function parseYearbookPDF(file: File): Promise<ExtractedModule[]> {
  const pageText = await extractTextFromPDF(file);
  const modules: ExtractedModule[] = [];
  
  // Pattern to match module codes (e.g., "PHY 114", "WTW 123", "COS 132")
  const moduleCodePattern = /\b([A-Z]{2,4})\s+(\d{3})\b/g;
  
  // Split by year sections
  const yearSections = pageText.split(/(?=Curriculum:\s*Year\s+[123]|Year\s+[123])/i);
  
  // Track current year for fallback
  let currentYear = 1;
  
  yearSections.forEach((section) => {
    // Try to extract year from section header
    const yearMatch = section.match(/(?:Curriculum:\s*)?Year\s+([123])/i);
    const sectionYear = yearMatch ? parseInt(yearMatch[1]) : currentYear;
    
    if (yearMatch) {
      currentYear = parseInt(yearMatch[1]);
    }
    
    // Detect if this section has core/fundamental vs elective subsections
    const hasCoreSection = section.match(/Core modules|Fundamental modules/i);
    const hasElectiveSection = section.match(/Elective modules/i);
    
    // Find all module codes in this section
    const codeMatches = [...section.matchAll(moduleCodePattern)];
    
    codeMatches.forEach((match) => {
      const code = `${match[1]} ${match[2]}`;
      const codeStart = match.index || 0;
      
      // Extract text around the module code (more context for core/elective detection)
      const contextStart = Math.max(0, codeStart - 200);
      const contextEnd = Math.min(section.length, codeStart + 300);
      const context = section.substring(contextStart, contextEnd);
      
      // Determine if module is core or elective
      const isCore = isCoreModule(section, code);
      
      // Try to find module name (usually after the code)
      let name = '';
      const afterCode = context.substring(context.indexOf(match[0]) + match[0].length);
      // Module name is usually on the same line or next line, before credits
      const nameMatch = afterCode.match(/^[:\s]*([^0-9\n]{10,100}?)(?:\s+\d|$|Module\s+credits|credits)/i);
      if (nameMatch) {
        name = nameMatch[1].trim();
        // Clean up common prefixes/suffixes
        name = name.replace(/^[:\s-]+|[:\s-]+$/g, '');
        // Remove any remaining "Module credits" text
        name = name.replace(/Module\s+credits.*$/i, '').trim();
      }
      
      // Try to find credits
      let credits = 16; // Default
      const creditsMatch = context.match(/Module\s+credits\s+(\d+(?:\.\d+)?)/i);
      if (creditsMatch) {
        const creditsValue = parseFloat(creditsMatch[1]);
        if (!isNaN(creditsValue)) {
          credits = Math.round(creditsValue);
        }
      } else {
        // Fallback: look for "credits" keyword
        const fallbackMatch = context.match(/(\d+(?:\.\d+)?)\s*(?:credits?|cr)/i);
        if (fallbackMatch) {
          const creditsValue = parseFloat(fallbackMatch[1]);
          if (!isNaN(creditsValue)) {
            credits = Math.round(creditsValue);
          }
        }
      }
      
      // Only add if we have a valid code and name
      if (code && name && name.length > 5) {
        // Check if module already exists in our list (avoid duplicates)
        const exists = modules.some(m => m.code === code && m.year === sectionYear);
        if (!exists) {
          modules.push({
            code: code.replace(/\s+/g, ''), // Remove spaces: "PHY 114" -> "PHY114"
            name: name,
            credits: credits,
            year: sectionYear,
            isCore: isCore
          });
        }
      }
    });
  });
  
  // If we didn't find year sections, try to extract from the whole document
  if (modules.length === 0) {
    const allCodeMatches = [...pageText.matchAll(moduleCodePattern)];
    allCodeMatches.forEach((match) => {
      const code = `${match[1]} ${match[2]}`;
      const codeStart = match.index || 0;
      const context = pageText.substring(Math.max(0, codeStart - 200), Math.min(pageText.length, codeStart + 300));
      
      const isCore = isCoreModule(pageText, code);
      
      let name = '';
      const afterCode = context.substring(context.indexOf(match[0]) + match[0].length);
      const nameMatch = afterCode.match(/^[:\s]*([^0-9\n]{10,100}?)(?:\s+\d|$|Module\s+credits|credits)/i);
      if (nameMatch) {
        name = nameMatch[1].trim().replace(/^[:\s-]+|[:\s-]+$/g, '');
        name = name.replace(/Module\s+credits.*$/i, '').trim();
      }
      
      let credits = 16;
      const creditsMatch = context.match(/Module\s+credits\s+(\d+(?:\.\d+)?)/i);
      if (creditsMatch) {
        const creditsValue = parseFloat(creditsMatch[1]);
        if (!isNaN(creditsValue)) {
          credits = Math.round(creditsValue);
        }
      }
      
      if (code && name && name.length > 5) {
        const exists = modules.some(m => m.code === code.replace(/\s+/g, ''));
        if (!exists) {
          modules.push({
            code: code.replace(/\s+/g, ''),
            name: name,
            credits: credits,
            year: 1, // Default to year 1 if we can't determine
            isCore: isCore
          });
        }
      }
    });
  }
  
  return modules;
}

/**
 * Maps extracted modules to semesters based on starting year
 */
export function mapModulesToSemesters(
  modules: ExtractedModule[],
  startingYear: number
): Array<ExtractedModule & { semester: string }> {
  return modules.map(module => {
    // Year 1 -> startingYear, Year 2 -> startingYear + 1, Year 3 -> startingYear + 2
    const semester = (startingYear + module.year - 1).toString();
    return {
      ...module,
      semester
    };
  });
}

/**
 * Filters modules to only include core modules (useful for initial import)
 */
export function getCoreModules(modules: ExtractedModule[]): ExtractedModule[] {
  return modules.filter(m => m.isCore);
}

/**
 * Filters modules to only include elective modules (user can select from these)
 */
export function getElectiveModules(modules: ExtractedModule[]): ExtractedModule[] {
  return modules.filter(m => !m.isCore);
}