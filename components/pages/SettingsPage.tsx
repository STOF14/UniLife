import { Upload, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { Module } from '@/lib/types';
//import { currentGrade } from '@/lib/types';

export const ImportPastModulesSection = () => {
  const db = useDatabase();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  // Add index signature to departmentColors
  const departmentColors: { [key: string]: string } = {
    'AIM': 'bg-blue-100 text-blue-800',
    'COS': 'bg-green-100 text-green-800',
    'LST': 'bg-purple-100 text-purple-800',
    'PHY': 'bg-red-100 text-red-800',
    'WTW': 'bg-yellow-100 text-yellow-800'
  };

  // Define pastModules with Partial<Module> type
  // Update the pastModules type to ensure grade is always defined
const pastModules: Array<{
  code: string;
  name: string;
  semester: string;
  credits: number;
  grade: number;  // Make grade required
  specialCode?: number;
}> = [
  // 2024 Modules
  { code: 'AIM111', name: 'Academic Information Management 111', semester: '2024', credits: 4, grade: 79 },
  { code: 'AIM121', name: 'Academic Information Management 121', semester: '2024', credits: 4, grade: 83 },
  { code: 'COS122', name: 'Operating Systems 122', semester: '2024', credits: 16, grade: 63 },
  { code: 'COS132', name: 'Imperative Programming 132', semester: '2024', credits: 16, grade: 56 },
  { code: 'COS151', name: 'Introduction to Computer Science 151', semester: '2024', credits: 8, grade: 37 },
  { code: 'LST110', name: 'Language and Study Skills 110', semester: '2024', credits: 6, grade: 61 },
  { code: 'PHY114', name: 'First Course in Physics 114', semester: '2024', credits: 16, grade: 51 },
  { code: 'PHY124', name: 'First Course in Physics 124', semester: '2024', credits: 16, grade: 50 },
  { code: 'SWK122', name: 'Statics 122', semester: '2024', credits: 16, grade: 0, specialCode: 988 },
  { code: 'UPO102', name: 'Academic Orientation 102', semester: '2024', credits: 0, grade: 0, specialCode: 997 },
  { code: 'WTW114', name: 'Calculus 114', semester: '2024', credits: 16, grade: 50 },
  { code: 'WTW115', name: 'Discrete Structures 115', semester: '2024', credits: 8, grade: 39 },
  { code: 'WTW124', name: 'Mathematics 124', semester: '2024', credits: 16, grade: 0, specialCode: 988 },
  { code: 'WTW152', name: 'Mathematical Modelling 152', semester: '2024', credits: 8, grade: 0, specialCode: 998 },
  // 2025 Modules
  { code: 'COS110', name: 'Program Design: Introduction 110', semester: '2025', credits: 16, grade: 61 },
  { code: 'COS151', name: 'Introduction to Computer Science 151 (Retake)', semester: '2025', credits: 8, grade: 86 },
  { code: 'WTW123', name: 'Numerical Analysis 123', semester: '2025', credits: 8, grade: 55 },
  { code: 'WTW124', name: 'Mathematics 124', semester: '2025', credits: 16, grade: 50 },
];

  const coverImages: Record<string, string> = {
    'AIM': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'COS': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    'LST': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'PHY': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'WTW': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  };

  const getCoverImage = (code: string) => {
    const prefix = code.substring(0, 3);
    return coverImages[prefix] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  const handleImport = async () => {
    if (!confirm(`This will import ${pastModules.length} completed modules from 2024-2025. Continue?`)) {
      return;
    }

    setImporting(true);
    
    try {
      let successCount = 0;
      
      for (const mod of pastModules) {
        // Skip if this module already exists in the database (avoid duplicates on re-import)
        const alreadyExists = db.modules.some(
          m => m.code === mod.code && m.semester === mod.semester && m.credits === mod.credits && m.currentGrade === mod.grade
        );
        if (alreadyExists) {
          continue;
        }

        // Use a "temp" ID without hyphens so saveModule treats this as a new record (INSERT)
        const tempId = `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
        
        const module: Module = {
          id: tempId,
          code: mod.code,
          name: mod.name,
          semester: mod.semester,
          credits: mod.credits,
          currentGrade: mod.grade, // Use grade from our typed module
          targetGrade: mod.grade,  // Set target grade same as current grade for imports
          targetMark: mod.grade,   // Set target mark same as current grade for imports
          progress: 100,           // Mark as completed
          assessments: [],
          specialCode: mod.specialCode, // No need for type assertion anymore
          coverImage: getCoverImage(mod.code),
          created_at: new Date(`${mod.semester}-01-01`).toISOString(),
          updated_at: new Date().toISOString(),
          grade: mod.grade // Keep for backward compatibility
        };

        const success = await db.saveModule(module);
        if (success) successCount++;
      }

      setImported(true);
      alert(`Successfully imported ${successCount} out of ${pastModules.length} modules!`);
      
      // Calculate and display CWA
      const totalCredits = pastModules.reduce((sum, m) => sum + (m.credits || 0), 0);
      const totalGP = pastModules.reduce((sum, m) => sum + ((m.credits || 0) * (m.grade || 0)), 0);
      const cwa = totalGP / totalCredits;
      alert(`CWA: ${cwa.toFixed(2)}`);
    } finally {
      setImporting(false);
    }
  };

  const totalCredits = pastModules.reduce((sum, m) => sum + (m.credits || 0), 0);
  const totalGP = pastModules.reduce((sum, m) => sum + ((m.credits || 0) * (m.grade || 0)), 0);
  const cwa = totalGP / totalCredits;

  return (
    <div className="bg-[#141414] border border-[#38383A] rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Import Past Modules (2024-2025)</h3>
      
      <div className="bg-[#0A0A0A] border border-[#38383A] rounded-lg p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-sm text-[#EBEBF599] mb-1">Total Modules</div>
            <div className="text-2xl font-bold text-white">{pastModules.length}</div>
          </div>
          <div>
            <div className="text-sm text-[#EBEBF599] mb-1">Total Credits</div>
            <div className="text-2xl font-bold text-white">{totalCredits}</div>
          </div>
          <div>
            <div className="text-sm text-[#EBEBF599] mb-1">Calculated CWA</div>
            <div className="text-2xl font-bold text-[#0A84FF]">{cwa.toFixed(2)}%</div>
          </div>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          <div className="text-xs font-semibold text-[#EBEBF599] mb-2">Modules to Import:</div>
          {pastModules.map((mod, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 px-3 bg-[#141414] rounded">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 bg-[#38383A] rounded text-[#EBEBF599]">
                  {mod.semester}
                </span>
                <span className="text-sm text-white font-medium">{mod.code}</span>
                <span className="text-xs text-[#EBEBF599] truncate max-w-xs">
                  {mod.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#EBEBF599]">{mod.credits} cr</span>
                <span className={`text-sm font-bold ${
                  mod.grade >= 75 ? 'text-[#30D158]' : 
                  mod.grade >= 50 ? 'text-[#0A84FF]' : 'text-[#FF453A]'
                }`}>
                  {mod.grade}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleImport}
          disabled={importing || imported}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            imported 
              ? 'bg-[#30D158]/20 text-[#30D158] cursor-not-allowed' 
              : importing
              ? 'bg-[#38383A] text-[#EBEBF599] cursor-wait'
              : 'bg-[#0A84FF] text-white hover:bg-[#0A84FF]/80'
          }`}
        >
          {imported ? (
            <>
              <CheckCircle size={20} />
              Already Imported
            </>
          ) : importing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              Importing...
            </>
          ) : (
            <>
              <Upload size={20} />
              Import All Past Modules
            </>
          )}
        </button>

        {imported && (
          <span className="text-sm text-[#30D158]">
            ✓ {pastModules.length} modules successfully imported!
          </span>
        )}
      </div>

      <div className="mt-4 p-3 bg-[#FF9F0A]/10 border border-[#FF9F0A]/30 rounded-lg">
        <p className="text-xs text-[#FF9F0A]">
          <strong>Note:</strong> This will import all your completed modules from 2024-2025 academic years. 
          These modules are marked as 100% complete and will automatically calculate your actual CWA.
        </p>
      </div>
    </div>
  );
};