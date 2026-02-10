import { UploadSimple, CheckCircle } from 'phosphor-react';
import { useEffect, useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { Module } from '@/lib/types';
//import { currentGrade } from '@/lib/types';

export const SettingsPage = () => {
  const db = useDatabase();
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [tabDemoOne, setTabDemoOne] = useState(0);
  const [tabDemoTwo, setTabDemoTwo] = useState(0);
  const [tabDemoThree, setTabDemoThree] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'auto'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('unilife_theme') as 'dark' | 'auto') || 'dark';
  });
  const [notifications, setNotifications] = useState(() => ({
    email: localStorage.getItem('unilife_notify_email') !== 'false',
    push: localStorage.getItem('unilife_notify_push') === 'true'
  }));
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    localStorage.setItem('unilife_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('unilife_notify_email', String(notifications.email));
    localStorage.setItem('unilife_notify_push', String(notifications.push));
  }, [notifications]);

  // Add index signature to departmentColors
  const departmentColors: { [key: string]: string } = {
    'AIM': 'bg-text-primary/10 text-text-primary',
    'COS': 'bg-success/10 text-success',
    'LST': 'bg-text-secondary/10 text-text-secondary',
    'PHY': 'bg-danger/10 text-danger',
    'WTW': 'bg-warning/10 text-warning'
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
        userId: 'current-user', // TODO: Get actual user ID from auth
        code: mod.code,
        name: mod.name,
        semester: mod.semester,
        credits: mod.credits,
        currentGrade: mod.grade, // Use grade from our typed module
        targetGrade: mod.grade,  // Set target grade same as current grade for imports
        targetMark: mod.grade,   // Set target mark same as current grade for imports
        progress: 100,           // Mark as completed
        assessments: [],
        specialCode: mod.specialCode,
        coverImage: getCoverImage(mod.code),
        createdAt: new Date(`${mod.semester}-01-01`).toISOString(),
        updatedAt: new Date().toISOString(),
        // Remove the grade property since it doesn't exist in Module type
        // grade: mod.grade // Remove this line
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

  const handleBackup = () => {
    const data = {
      modules: db.modules,
      tasks: db.tasks,
      transactions: db.transactions
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unilife-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleRestore = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const modules = parsed.modules || [];
    const tasks = parsed.tasks || [];
    const transactions = parsed.transactions || [];

    for (const module of modules) {
      await db.saveModule({ ...module, id: `${Date.now()}${Math.random()}` });
    }
    for (const task of tasks) {
      await db.saveTask({ ...task, id: `${Date.now()}${Math.random()}` });
    }
    for (const transaction of transactions) {
      await db.saveTransaction({ ...transaction, id: `${Date.now()}${Math.random()}` });
    }
  };

  const handleClearCache = () => {
    localStorage.removeItem('tasks_module_filter');
    localStorage.removeItem('tasks_sort_by');
    localStorage.removeItem('tasks_view');
    localStorage.removeItem('unilife_timetable_planner');
    localStorage.removeItem('finances_recurring_ids');
  };

  const validateProfile = () => {
    if (profileName.trim().length < 2) {
      setProfileError('Name must be at least 2 characters.');
      return;
    }
    if (profileEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail)) {
      setProfileError('Enter a valid email address.');
      return;
    }
    setProfileError('');
  };

  const totalCredits = pastModules.reduce((sum, m) => sum + (m.credits || 0), 0);
  const totalGP = pastModules.reduce((sum, m) => sum + ((m.credits || 0) * (m.grade || 0)), 0);
  const cwa = totalGP / totalCredits;
  const demoTabs = ['Dashboard', 'Academic', 'Tasks', 'Timetable'];

  return (
    <div className="bg-surface border border-border  p-6">
      <h3 className="text-xl font-semibold text-text-primary mb-4">Import Past Modules (2024-2025)</h3>
      
      <div className="bg-background border border-border  p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-sm text-text-tertiary mb-1">Total Modules</div>
            <div className="text-2xl font-bold text-text-primary">{pastModules.length}</div>
          </div>
          <div>
            <div className="text-sm text-text-tertiary mb-1">Total Credits</div>
            <div className="text-2xl font-bold text-text-primary">{totalCredits}</div>
          </div>
          <div>
            <div className="text-sm text-text-tertiary mb-1">Calculated CWA</div>
            <div className="text-2xl font-bold text-text-primary">{cwa.toFixed(2)}%</div>
          </div>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          <div className="text-xs font-semibold text-text-tertiary mb-2">Modules to Import:</div>
          {pastModules.map((mod, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 px-3 bg-surface">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 bg-border text-text-tertiary">
                  {mod.semester}
                </span>
                <span className="text-sm text-text-primary font-medium">{mod.code}</span>
                <span className="text-xs text-text-tertiary truncate max-w-xs">
                  {mod.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-tertiary">{mod.credits} cr</span>
                <span className={`text-sm font-bold ${
                  mod.grade >= 75 ? 'text-success' : 
                  mod.grade >= 50 ? 'text-text-primary' : 'text-danger'
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
          className={`flex items-center gap-2 px-6 py-3  font-medium transition-colors ${
            imported 
              ? 'bg-success/20 text-success cursor-not-allowed' 
              : importing
              ? 'bg-border text-text-tertiary cursor-wait'
              : 'bg-text-primary text-background hover:bg-text-primary/80'
          }`}
        >
          {imported ? (
            <>
              <CheckCircle size={20} />
              Already Imported
            </>
          ) : importing ? (
            <>
              <div className="animate-spin  h-5 w-5 border-t-2 border-b-2 border-white"></div>
              Importing...
            </>
          ) : (
            <>
              <UploadSimple size={20} />
              Import All Past Modules
            </>
          )}
        </button>

        {imported && (
          <span className="text-sm text-success inline-flex items-center gap-2">
            <CheckCircle size={16} />
            {pastModules.length} modules successfully imported!
          </span>
        )}
      </div>

      <div className="mt-4 p-3 bg-warning/10 border border-warning/30 ">
        <p className="text-xs text-warning">
          <strong>Note:</strong> This will import all your completed modules from 2024-2025 academic years. 
          These modules are marked as 100% complete and will automatically calculate your actual CWA.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background border border-border  p-4">
          <h4 className="text-text-primary font-semibold mb-3">Theme</h4>
          <div className="flex gap-2">
            {(['dark', 'auto'] as const).map(option => (
              <button
                key={option}
                onClick={() => setTheme(option)}
                className={`px-4 py-2  text-sm font-medium border ${
                  theme === option
                    ? 'bg-text-primary/20 text-text-primary border-text-primary/40'
                    : 'bg-surface text-text-tertiary border-border'
                }`}
              >
                {option === 'dark' ? 'Dark' : 'Auto'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-background border border-border  p-4">
          <h4 className="text-text-primary font-semibold mb-3">Notifications</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-text-tertiary">
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
              />
              Email updates
            </label>
            <label className="flex items-center gap-2 text-sm text-text-tertiary">
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={(e) => setNotifications(prev => ({ ...prev, push: e.target.checked }))}
              />
              Push reminders
            </label>
          </div>
        </div>

        <div className="bg-background border border-border  p-4">
          <h4 className="text-text-primary font-semibold mb-3">Backup & Restore</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleBackup}
              className="px-4 py-2  text-sm font-medium bg-surface text-text-primary border border-border hover:border-text-primary"
            >
              Download Backup
            </button>
            <label className="px-4 py-2  text-sm font-medium bg-surface text-text-primary border border-border hover:border-text-primary cursor-pointer">
              Restore
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleRestore(file);
                }}
              />
            </label>
          </div>
        </div>

        <div className="bg-background border border-border  p-4">
          <h4 className="text-text-primary font-semibold mb-3">Quick Fixes</h4>
          <button
            onClick={handleClearCache}
            className="px-4 py-2  text-sm font-medium bg-surface text-text-primary border border-border hover:border-danger"
          >
            Clear Cache
          </button>
        </div>
      </div>

      <div className="mt-8 bg-background border border-border  p-4">
        <h4 className="text-text-primary font-semibold mb-3">Profile</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Full name"
            className="px-3 py-2 bg-surface border border-border  text-text-primary text-sm"
          />
          <input
            value={profileEmail}
            onChange={(e) => setProfileEmail(e.target.value)}
            placeholder="Email (optional)"
            className="px-3 py-2 bg-surface border border-border  text-text-primary text-sm"
          />
        </div>
        {profileError && <div className="text-xs text-danger mt-2">{profileError}</div>}
        <button
          onClick={validateProfile}
          className="mt-3 px-4 py-2  text-sm font-medium bg-text-primary text-background"
        >
          Validate Profile
        </button>
      </div>

      <div className="mt-8 bg-background border border-border  p-4">
        <h4 className="text-text-primary font-semibold mb-3">Tab Morph Previews</h4>
        <p className="text-xs text-text-tertiary mb-4">
          Tap each tab to see the morphing behavior. These are temporary previews for testing.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Take 1: Frosted Slide Indicator */}
          <div className="bg-surface border border-border  p-3">
            <div className="text-xs text-text-tertiary mb-2">Take 1 — Frosted Slide</div>
            <div className="relative grid grid-cols-4 gap-1 p-1 bg-background border border-border  overflow-hidden">
              <div
                className="absolute top-1 bottom-1 left-1 w-[calc(25%-4px)]  bg-white/10 border border-white/20 backdrop-blur-md shadow-[0_0_16px_rgba(255,255,255,0.12)] transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${tabDemoOne * 100}%)` }}
              />
              {demoTabs.map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => setTabDemoOne(index)}
                  className={`relative z-10 py-2 text-[11px] font-medium  transition-colors ${
                    tabDemoOne === index ? 'text-text-primary' : 'text-text-tertiary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Take 2: Glass Layer Morph */}
          <div className="bg-surface border border-border  p-3">
            <div className="text-xs text-text-tertiary mb-2">Take 2 — Glass Layer</div>
            <div className="grid grid-cols-4 gap-1 p-1 bg-background border border-border ">
              {demoTabs.map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => setTabDemoTwo(index)}
                  className={`py-2 text-[11px] font-medium  transition-all duration-300 ${
                    tabDemoTwo === index
                      ? 'text-text-primary bg-white/10 border border-white/20 backdrop-blur-md shadow-[0_6px_18px_rgba(0,0,0,0.4)]'
                      : 'text-text-tertiary border border-transparent hover:border-border'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Take 3: Liquid Halo */}
          <div className="bg-surface border border-border  p-3">
            <div className="text-xs text-text-tertiary mb-2">Take 3 — Liquid Halo</div>
            <div className="relative grid grid-cols-4 gap-1 p-1 bg-background border border-border  overflow-hidden">
              <div
                className="absolute top-1 bottom-1 left-1 w-[calc(25%-4px)]  bg-gradient-to-r from-text-primary/35 via-text-secondary/30 to-success/25 blur-[10px] opacity-80 transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${tabDemoThree * 100}%)` }}
              />
              {demoTabs.map((tab, index) => (
                <button
                  key={tab}
                  onClick={() => setTabDemoThree(index)}
                  className={`relative z-10 py-2 text-[11px] font-medium  transition-colors ${
                    tabDemoThree === index ? 'text-text-primary' : 'text-text-tertiary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};