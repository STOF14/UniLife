// Enhanced PDF Parser specifically optimized for UP Yearbook format
// Handles the complex hierarchical structure and module patterns

import { Module, Assessment } from '@/lib/types';

export interface ExtractedYearbookData {
  modules: Module[];
  academicYear: string;
  faculty: string;
  degree: string;
  degreeCode: string;
  department: string;
  minimumDuration: string;
  totalCredits: number;
  nqfLevel: string;
  admissionRequirements: AdmissionRequirements;
  prerequisites: Record<string, string[]>;
  coreModules: string[];
  electiveModules: string[];
  fundamentalModules: string[];
  curriculumStructure: CurriculumYear[];
  studyStreams: StudyStream[];
  promotionRequirements: PromotionRequirements;
}

export interface AdmissionRequirements {
  english: number;
  mathematics: number;
  physicalSciences?: number;
  aps: number;
  additionalRequirements?: string[];
}

export interface StudyStream {
  name: string;
  description: string;
  requiredModules: string[];
  totalCredits: number;
  yearDistribution?: {
    year1?: string[];
    year2?: string[];
    year3?: string[];
  };
}

export interface PromotionRequirements {
  creditsRequired: number;
  conditions: string[];
}

export interface CurriculumYear {
  year: number;
  minimumCredits: number;
  fundamental: number;
  core: number;
  elective: number;
  modules: ParsedModule[];
}

export interface ParsedModule {
  code: string;
  name: string;
  credits: number;
  nqfLevel: string;
  semester: string;
  year: number;
  prerequisites?: string[];
  corequisites?: string[];
  description?: string;
  contactTime?: string;
  department?: string;
  language?: string;
  assessmentBreakdown?: {
    type: string;
    weight: number;
    description?: string;
  }[];
  isCore: boolean;
  isFundamental: boolean;
  isElective: boolean;
  serviceModules?: string[];
}

// Main extraction function
export async function extractYearbookData(file: File): Promise<ExtractedYearbookData> {
  try {
    // Extract raw text with better structure preservation
    const text = await extractTextFromPDF(file);
    
    // Extract program information
    const programInfo = extractProgramInfo(text);
    
    // Extract admission requirements
    const admissionRequirements = extractAdmissionRequirements(text);
    
    // Parse curriculum structure (Year 1, 2, 3)
    const curriculumStructure = parseCurriculumStructure(text);
    
    // Extract all modules with full details
    const modules = extractAllModules(text, curriculumStructure);
    
    // Extract prerequisites and relationships
    const prerequisites = extractPrerequisites(text, modules);
    
    // Classify modules
    const { coreModules, electiveModules, fundamentalModules } = classifyModules(modules);
    
    // Extract study streams (second major options)
    const studyStreams = extractStudyStreams(text);
    
    // Extract promotion requirements
    const promotionRequirements = extractPromotionRequirements(text);
    
    return {
      modules: modules.map(convertToModule),
      academicYear: programInfo.academicYear,
      faculty: programInfo.faculty,
      degree: programInfo.degree,
      degreeCode: programInfo.degreeCode,
      department: programInfo.department,
      minimumDuration: programInfo.minimumDuration,
      totalCredits: programInfo.totalCredits,
      nqfLevel: programInfo.nqfLevel,
      admissionRequirements,
      prerequisites,
      coreModules,
      electiveModules,
      fundamentalModules,
      curriculumStructure,
      studyStreams,
      promotionRequirements
    };
  } catch (error) {
    console.error('Error extracting yearbook data:', error);
    throw new Error('Failed to extract data from yearbook PDF');
  }
}

// Extract text from PDF using PDF.js
async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdfjsLib = await loadPdfJs();
        
        const loadingTask = pdfjsLib.getDocument({ data: typedArray });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Preserve structure better by tracking position
          const items = textContent.items.sort((a: any, b: any) => {
            if (Math.abs(a.transform[5] - b.transform[5]) > 5) {
              return b.transform[5] - a.transform[5]; // Sort by Y position
            }
            return a.transform[4] - b.transform[4]; // Then by X position
          });
          
          let lastY = -1;
          items.forEach((item: any) => {
            const currentY = item.transform[5];
            
            // Add newline if on different line
            if (lastY !== -1 && Math.abs(currentY - lastY) > 5) {
              fullText += '\n';
            }
            
            fullText += item.str + ' ';
            lastY = currentY;
          });
          
          fullText += '\n\n'; // Page break
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

// Load PDF.js library
async function loadPdfJs(): Promise<any> {
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }
  
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  
  return new Promise((resolve, reject) => {
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Extract program information
function extractProgramInfo(text: string): {
  academicYear: string;
  faculty: string;
  degree: string;
  degreeCode: string;
  department: string;
  minimumDuration: string;
  totalCredits: number;
  nqfLevel: string;
} {
  // Extract year from "University of Pretoria Yearbook 2025"
  const yearMatch = text.match(/Yearbook\s+(\d{4})/i);
  const academicYear = yearMatch ? yearMatch[1] : '2025';
  
  // Extract degree name and code: "BSc in Physics (02133203)"
  const degreeMatch = text.match(/(B[A-Za-z]+)\s+in\s+([A-Za-z\s]+)\s*\((\d+)\)/i);
  const degree = degreeMatch ? `${degreeMatch[1]} in ${degreeMatch[2]}` : 'Unknown Degree';
  const degreeCode = degreeMatch ? degreeMatch[3] : '';
  
  // Extract department
  const deptMatch = text.match(/Department\s+([A-Za-z\s]+)(?=Minimum\s+duration|$)/i);
  const department = deptMatch ? deptMatch[1].trim() : 'Unknown Department';
  
  // Extract minimum duration
  const durationMatch = text.match(/Minimum\s+duration\s+of\s+study\s+(\d+\s+years?)/i);
  const minimumDuration = durationMatch ? durationMatch[1] : '3 years';
  
  // Extract faculty from "Faculty of ..."
  const facultyMatch = text.match(/Faculty\s+of\s+([A-Za-z\s]+)/i);
  const faculty = facultyMatch ? facultyMatch[1].trim() : 'Unknown Faculty';
  
  // Extract total credits
  const creditsMatch = text.match(/Total\s+credits\s+(\d+)/i);
  const totalCredits = creditsMatch ? parseInt(creditsMatch[1]) : 0;
  
  // Extract NQF level
  const nqfMatch = text.match(/NQF\s+level\s+(\d+)/i);
  const nqfLevel = nqfMatch ? nqfMatch[1] : '07';
  
  return { 
    academicYear, 
    faculty, 
    degree, 
    degreeCode, 
    department,
    minimumDuration,
    totalCredits,
    nqfLevel
  };
}

// Parse curriculum structure (Year 1, 2, 3)
function parseCurriculumStructure(text: string): CurriculumYear[] {
  const years: CurriculumYear[] = [];
  
  // Match curriculum sections: "Curriculum: Year 1" or "Curriculum: Final year"
  const yearSections = text.split(/Curriculum:\s+(Year\s+\d+|Final\s+year)/i);
  
  for (let i = 1; i < yearSections.length; i += 2) {
    const yearLabel = yearSections[i];
    const yearContent = yearSections[i + 1] || '';
    
    // Determine year number
    const yearNum = yearLabel.toLowerCase().includes('final') ? 3 : 
                    parseInt(yearLabel.match(/\d+/)?.[0] || '1');
    
    // Extract minimum credits
    const minCreditsMatch = yearContent.match(/Minimum\s+credits:\s*(\d+)/i);
    const minimumCredits = minCreditsMatch ? parseInt(minCreditsMatch[1]) : 0;
    
    // Extract credit breakdown
    const fundamentalMatch = yearContent.match(/Fundamental\s*=\s*(\d+)/i);
    const coreMatch = yearContent.match(/Core\s*=\s*(\d+)/i);
    const electiveMatch = yearContent.match(/Elective\s*=\s*(\d+)/i);
    
    years.push({
      year: yearNum,
      minimumCredits,
      fundamental: fundamentalMatch ? parseInt(fundamentalMatch[1]) : 0,
      core: coreMatch ? parseInt(coreMatch[1]) : 0,
      elective: electiveMatch ? parseInt(electiveMatch[1]) : 0,
      modules: []
    });
  }
  
  return years;
}

// Extract all modules with full details
function extractAllModules(text: string, curriculumStructure: CurriculumYear[]): ParsedModule[] {
  const modules: ParsedModule[] = [];
  const seen = new Set<string>();
  
  // Split text into module sections
  // Pattern: "Module name code (CODE 123)"
  const modulePattern = /^([A-Za-z][A-Za-z\s&,-]+?)\s+(\d{3})\s+\(([A-Z]{3})\s+(\d{3})\)/gm;
  
  let match;
  while ((match = modulePattern.exec(text)) !== null) {
    const fullName = match[1].trim();
    const code = `${match[3]}${match[4]}`;
    
    if (seen.has(code)) continue;
    seen.add(code);
    
    // Extract the full module section
    const startPos = match.index;
    const nextModuleMatch = modulePattern.exec(text);
    const endPos = nextModuleMatch ? nextModuleMatch.index : text.length;
    modulePattern.lastIndex = startPos + match[0].length; // Reset for next iteration
    
    const moduleSection = text.substring(startPos, endPos);
    
    // Parse module details
    const moduleData = parseModuleSection(code, fullName, moduleSection, curriculumStructure);
    if (moduleData) {
      modules.push(moduleData);
    }
  }
  
  return modules;
}

// Parse individual module section
function parseModuleSection(
  code: string, 
  fullName: string, 
  section: string,
  curriculumStructure: CurriculumYear[]
): ParsedModule | null {
  // Extract credits
  const creditsMatch = section.match(/Module\s+credits\s+([\d.]+)/i);
  const credits = creditsMatch ? parseFloat(creditsMatch[1]) : 0;
  
  // Extract NQF level
  const nqfMatch = section.match(/NQF\s+Level\s+(\d+)/i);
  const nqfLevel = nqfMatch ? nqfMatch[1] : '05';
  
  // Extract prerequisites
  const prereqMatch = section.match(/Prerequisites\s+(.+?)(?=Contact\s+time|Language|Department|$)/i);
  const prerequisites = prereqMatch ? parsePrerequisites(prereqMatch[1]) : [];
  
  // Extract contact time
  const contactMatch = section.match(/Contact\s+time\s+(.+?)(?=Language|Department|$)/i);
  const contactTime = contactMatch ? contactMatch[1].trim() : undefined;
  
  // Extract department
  const deptMatch = section.match(/Department\s+(.+?)(?=Period|Module\s+content|$)/i);
  const department = deptMatch ? deptMatch[1].trim() : undefined;
  
  // Extract period (semester)
  const periodMatch = section.match(/Period\s+of\s+presentation\s+(Semester\s+\d+|Year)/i);
  const semester = periodMatch ? periodMatch[1] : 'Unknown';
  
  // Extract module content (description)
  const contentMatch = section.match(/Module\s+content\s+(.+?)(?=^[A-Z][a-z]+\s+\d{3}|$)/m);
  const description = contentMatch ? contentMatch[1].trim().substring(0, 500) : undefined;
  
  // Determine year from code
  const codeNum = parseInt(code.replace(/[A-Z]/g, ''));
  const year = codeNum >= 300 ? 3 : codeNum >= 200 ? 2 : 1;
  
  // Check if it's in fundamental/core/elective sections
  const isFundamental = section.includes('Fundamental modules') || 
                        ['AIM111', 'AIM121', 'LST110', 'UPO102'].includes(code);
  const isCore = section.includes('Core modules') || (!isFundamental && year === 1);
  const isElective = !isFundamental && !isCore;
  
  return {
    code,
    name: fullName,
    credits,
    nqfLevel,
    semester,
    year,
    prerequisites,
    description,
    contactTime,
    department,
    isCore,
    isFundamental,
    isElective
  };
}

// Parse prerequisites from text
function parsePrerequisites(text: string): string[] {
  const prereqs: string[] = [];
  
  // Match module codes: ABC 123 or ABC123
  const codePattern = /([A-Z]{3})\s*(\d{3})/g;
  let match;
  
  while ((match = codePattern.exec(text)) !== null) {
    const code = `${match[1]}${match[2]}`;
    if (!prereqs.includes(code)) {
      prereqs.push(code);
    }
  }
  
  return prereqs;
}

// Extract prerequisites relationships
function extractPrerequisites(text: string, modules: ParsedModule[]): Record<string, string[]> {
  const prerequisites: Record<string, string[]> = {};
  
  modules.forEach(module => {
    if (module.prerequisites && module.prerequisites.length > 0) {
      prerequisites[module.code] = module.prerequisites;
    }
  });
  
  return prerequisites;
}

// Classify modules into categories
function classifyModules(modules: ParsedModule[]): {
  coreModules: string[];
  electiveModules: string[];
  fundamentalModules: string[];
} {
  const coreModules: string[] = [];
  const electiveModules: string[] = [];
  const fundamentalModules: string[] = [];
  
  modules.forEach(module => {
    if (module.isFundamental) {
      fundamentalModules.push(module.code);
    } else if (module.isCore) {
      coreModules.push(module.code);
    } else if (module.isElective) {
      electiveModules.push(module.code);
    }
  });
  
  return { coreModules, electiveModules, fundamentalModules };
}

// Extract admission requirements
function extractAdmissionRequirements(text: string): AdmissionRequirements {
  // Look for the admission requirements table
  const tableSection = text.match(/Admission requirements[\s\S]*?Minimum requirements[\s\S]*?English[^\d]*(\d+)[\s\S]*?Mathematics[^\d]*(\d+)[\s\S]*?Physical Sciences[^\d]*(\d+)[\s\S]*?APS[\s\S]*?(\d+)/i);
  
  if (tableSection) {
    return {
      english: parseInt(tableSection[1]),
      mathematics: parseInt(tableSection[2]),
      physicalSciences: parseInt(tableSection[3]),
      aps: parseInt(tableSection[4])
    };
  }
  
  // Fallback: look for individual requirements
  const englishMatch = text.match(/English[^\d]*(\d+)/i);
  const mathsMatch = text.match(/Mathematics[^\d]*(\d+)/i);
  const physicsMatch = text.match(/Physical Sciences[^\d]*(\d+)/i);
  const apsMatch = text.match(/APS[\s\S]*?(\d+)/i);
  
  return {
    english: englishMatch ? parseInt(englishMatch[1]) : 5,
    mathematics: mathsMatch ? parseInt(mathsMatch[1]) : 5,
    physicalSciences: physicsMatch ? parseInt(physicsMatch[1]) : 5,
    aps: apsMatch ? parseInt(apsMatch[1]) : 34
  };
}

// Extract study streams (second major options)
function extractStudyStreams(text: string): StudyStream[] {
  const streams: StudyStream[] = [];
  
  // Look for "Second major in X:" patterns
  const streamPattern = /Second\s+major\s+in\s+([^:]+):\s*([^(]+)\(([^)]+)\)/gi;
  let match;
  
  while ((match = streamPattern.exec(text)) !== null) {
    const streamName = match[1].trim();
    const description = match[2].trim();
    const modulesText = match[3];
    
    // Extract module codes from the stream
    const moduleCodes: string[] = [];
    const codePattern = /([A-Z]{3})\s*(\d{3})/g;
    let codeMatch;
    
    while ((codeMatch = codePattern.exec(modulesText)) !== null) {
      moduleCodes.push(`${codeMatch[1]}${codeMatch[2]}`);
    }
    
    streams.push({
      name: streamName,
      description,
      requiredModules: moduleCodes,
      totalCredits: moduleCodes.length * 8 // Approximate
    });
  }
  
  return streams;
}

// Extract promotion requirements
function extractPromotionRequirements(text: string): PromotionRequirements {
  const requirements: PromotionRequirements = {
    creditsRequired: 100,
    conditions: []
  };
  
  // Look for promotion requirements section
  const promotionSection = text.match(/Promotion\s+to\s+next\s+study\s+year[\s\S]*?(\d+)\s+credits/);
  
  if (promotionSection) {
    requirements.creditsRequired = parseInt(promotionSection[1]);
  }
  
  // Extract conditions
  const conditions = text.match(/A\s+student\s+will\s+be\s+promoted[\s\S]*?unless[\s\S]*?Dean[\s\S]*?recommendation[\s\S]*?head\s+of\s+department[\s\S]*?decides[\s\S]*?otherwise[\s\S]*?A\s+student\s+who\s+does\s+not\s+comply[\s\S]*?retains[\s\S]*?credit[\s\S]*?may\s+be\s+admitted[\s\S]*?Dean[\s\S]*?recommendation[\s\S]*?maximum\s+of\s+(\d+)\s+credits/);
  
  if (conditions) {
    requirements.conditions = [
      'Must pass required credits for promotion',
      'Failed students retain credits for passed modules',
      `May be admitted to following year modules up to ${conditions[1]} credits`,
      'Subject to timetable compatibility',
      'Requires Dean recommendation and head of department approval'
    ];
  }
  
  return requirements;
}

// Convert ParsedModule to Module type
function convertToModule(parsed: ParsedModule): Module {
  const now = new Date().toISOString();
  
  // Create default assessments based on typical UP structure
  const assessments: Assessment[] = [
    {
      id: `${parsed.code}-assignment`,
      name: 'Semester Assignments',
      weight: 40,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      submitted: false,
      graded: false,
      type: 'assignment',
      moduleId: `module-${parsed.code}`,
      userId: 'current-user',
      createdAt: now,
      updatedAt: now
    },
    {
      id: `${parsed.code}-exam`,
      name: 'Final Exam',
      weight: 60,
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      submitted: false,
      graded: false,
      type: 'exam',
      moduleId: `module-${parsed.code}`,
      userId: 'current-user',
      createdAt: now,
      updatedAt: now
    }
  ];
  
  return {
    id: `module-${parsed.code}`,
    code: parsed.code,
    name: parsed.name,
    credits: parsed.credits,
    semester: parsed.semester,
    currentGrade: 0,
    targetGrade: 60,
    progress: 0,
    assessments,
    prerequisites: parsed.prerequisites,
    corequisites: parsed.corequisites,
    description: parsed.description,
    userId: 'current-user',
    createdAt: now,
    updatedAt: now
  };
}