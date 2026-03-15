import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDatabase } from '@/hooks/useDatabase';
import { supabase } from '@/lib/supabase/client';

type TaskSort = 'priority' | 'dueDate' | 'created';
type TaskView = 'today' | 'week';
type WeekStart = 'monday' | 'sunday';
type TextScale = 'small' | 'medium' | 'large';

const getStoredBoolean = (key: string, defaultValue: boolean) => {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  if (stored === null) return defaultValue;
  return stored === 'true';
};

export const SettingsPage = () => {
  const db = useDatabase();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'auto'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem('unilife_theme') as 'dark' | 'auto') || 'dark';
  });
  const [textScale, setTextScale] = useState<TextScale>(() => {
    if (typeof window === 'undefined') return 'medium';
    return (localStorage.getItem('unilife_text_scale') as TextScale) || 'medium';
  });
  const [reducedMotion, setReducedMotion] = useState(() => getStoredBoolean('unilife_reduced_motion', false));
  const [highContrast, setHighContrast] = useState(() => getStoredBoolean('unilife_high_contrast', false));
  const [notifications, setNotifications] = useState(() => ({
    email: localStorage.getItem('unilife_notify_email') !== 'false',
    push: localStorage.getItem('unilife_notify_push') === 'true'
  }));
  const [profileName, setProfileName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('unilife_profile_name') || '';
  });
  const [profileEmail, setProfileEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('unilife_profile_email') || '';
  });
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [taskSortDefault, setTaskSortDefault] = useState<TaskSort>(() => {
    if (typeof window === 'undefined') return 'priority';
    return (localStorage.getItem('tasks_sort_by') as TaskSort) || 'priority';
  });
  const [taskViewDefault, setTaskViewDefault] = useState<TaskView>(() => {
    if (typeof window === 'undefined') return 'week';
    return (localStorage.getItem('tasks_view') as TaskView) || 'week';
  });
  const [weekStart, setWeekStart] = useState<WeekStart>(() => {
    if (typeof window === 'undefined') return 'monday';
    return (localStorage.getItem('unilife_week_start') as WeekStart) || 'monday';
  });
  const [defaultSemester, setDefaultSemester] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('unilife_default_semester') || '';
  });
  const [telemetryEnabled, setTelemetryEnabled] = useState(() => getStoredBoolean('unilife_telemetry_opt_in', true));
  const [usageReportsEnabled, setUsageReportsEnabled] = useState(() => getStoredBoolean('unilife_usage_reports', false));

  useEffect(() => {
    localStorage.setItem('unilife_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('unilife_notify_email', String(notifications.email));
    localStorage.setItem('unilife_notify_push', String(notifications.push));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('tasks_sort_by', taskSortDefault);
  }, [taskSortDefault]);

  useEffect(() => {
    localStorage.setItem('tasks_view', taskViewDefault);
  }, [taskViewDefault]);

  useEffect(() => {
    localStorage.setItem('unilife_week_start', weekStart);
  }, [weekStart]);

  useEffect(() => {
    localStorage.setItem('unilife_default_semester', defaultSemester);
  }, [defaultSemester]);

  useEffect(() => {
    localStorage.setItem('unilife_text_scale', textScale);
    const sizeByScale: Record<TextScale, string> = {
      small: '15px',
      medium: '16px',
      large: '17px'
    };
    document.documentElement.style.fontSize = sizeByScale[textScale];
  }, [textScale]);

  useEffect(() => {
    localStorage.setItem('unilife_reduced_motion', String(reducedMotion));
    document.documentElement.setAttribute('data-reduced-motion', String(reducedMotion));
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem('unilife_high_contrast', String(highContrast));
    document.documentElement.setAttribute('data-high-contrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('unilife_telemetry_opt_in', String(telemetryEnabled));
  }, [telemetryEnabled]);

  useEffect(() => {
    localStorage.setItem('unilife_usage_reports', String(usageReportsEnabled));
  }, [usageReportsEnabled]);

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

    for (const moduleRecord of modules) {
      await db.saveModule({ ...moduleRecord, id: `${Date.now()}${Math.random()}` });
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

  const relaunchOnboarding = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    if (userId) {
      localStorage.removeItem(`unilife_onboarding_status:${userId}`);
      localStorage.removeItem(`unilife_onboarding_draft:${userId}`);
    }

    router.push('/onboarding');
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Failed to sign out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleResetAllLocalData = () => {
    const confirmation = prompt('Type RESET to clear local settings and cached preferences.');
    if (confirmation !== 'RESET') return;

    const keysToClear = [
      'unilife_theme',
      'unilife_notify_email',
      'unilife_notify_push',
      'unilife_profile_name',
      'unilife_profile_email',
      'unilife_text_scale',
      'unilife_reduced_motion',
      'unilife_high_contrast',
      'unilife_default_semester',
      'unilife_week_start',
      'unilife_telemetry_opt_in',
      'unilife_usage_reports',
      'tasks_module_filter',
      'tasks_sort_by',
      'tasks_view',
      'unilife_timetable_planner',
      'finances_recurring_ids'
    ];

    keysToClear.forEach((key) => localStorage.removeItem(key));

    setTheme('dark');
    setNotifications({ email: true, push: false });
    setProfileName('');
    setProfileEmail('');
    setProfileError('');
    setProfileSaved(false);
    setTextScale('medium');
    setReducedMotion(false);
    setHighContrast(false);
    setTaskSortDefault('priority');
    setTaskViewDefault('week');
    setWeekStart('monday');
    setDefaultSemester('');
    setTelemetryEnabled(true);
    setUsageReportsEnabled(false);
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

  const saveProfile = () => {
    validateProfile();
    if (profileName.trim().length < 2) return;
    if (profileEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail)) return;

    localStorage.setItem('unilife_profile_name', profileName.trim());
    localStorage.setItem('unilife_profile_email', profileEmail.trim());
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 1800);
  };

  const resetProfile = () => {
    setProfileName('');
    setProfileEmail('');
    setProfileError('');
    setProfileSaved(false);
    localStorage.removeItem('unilife_profile_name');
    localStorage.removeItem('unilife_profile_email');
  };

  return (
    <div className="surface-card p-6 desktop:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-md border border-border/80 bg-background/70 p-4">
          <h4 className="mb-3 font-display text-title-sm text-text-primary">Theme</h4>
          <div className="flex gap-2">
            {(['dark', 'auto'] as const).map(option => (
              <button
                key={option}
                onClick={() => setTheme(option)}
                className={`rounded-sm border px-4 py-2 text-body-sm font-medium uppercase tracking-[0.08em] transition-all duration-300 ease-contemplative ${
                  theme === option
                    ? 'bg-text-primary/10 text-text-primary border-text-primary/40'
                    : 'bg-surface text-text-tertiary border-border/80 hover:border-border-hover'
                }`}
              >
                {option === 'dark' ? 'Dark' : 'Auto'}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-border/80 bg-background/70 p-4">
          <h4 className="mb-3 font-display text-title-sm text-text-primary">Notifications</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-body-sm text-text-tertiary">
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
              />
              Email updates
            </label>
            <label className="flex items-center gap-2 text-body-sm text-text-tertiary">
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={(e) => setNotifications(prev => ({ ...prev, push: e.target.checked }))}
              />
              Push reminders
            </label>
          </div>
        </div>

        <div className="rounded-md border border-border/80 bg-background/70 p-4">
          <h4 className="mb-3 font-display text-title-sm text-text-primary">Appearance & Accessibility</h4>
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-caption uppercase tracking-[0.08em] text-text-muted">Text Scale</div>
              <div className="flex flex-wrap gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setTextScale(size)}
                    className={`rounded-sm border px-3 py-1.5 text-caption uppercase tracking-[0.08em] transition-all duration-300 ease-contemplative ${
                      textScale === size
                        ? 'bg-text-primary/10 text-text-primary border-text-primary/40'
                        : 'bg-surface text-text-tertiary border-border/80 hover:border-border-hover'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-body-sm text-text-tertiary">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
              />
              Reduce motion effects
            </label>
            <label className="flex items-center gap-2 text-body-sm text-text-tertiary">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
              />
              High contrast mode
            </label>
          </div>
        </div>

        <div className="rounded-md border border-border/80 bg-background/70 p-4">
          <h4 className="mb-3 font-display text-title-sm text-text-primary">Productivity Defaults</h4>
          <div className="grid grid-cols-1 gap-3 text-body-sm text-text-tertiary">
            <label className="grid gap-1">
              <span className="text-caption uppercase tracking-[0.08em] text-text-muted">Task Sort</span>
              <select
                value={taskSortDefault}
                onChange={(e) => setTaskSortDefault(e.target.value as TaskSort)}
                className="rounded-sm border border-border/80 bg-surface px-3 py-2 text-body-sm text-text-primary"
              >
                <option value="priority">Priority</option>
                <option value="dueDate">Due Date</option>
                <option value="created">Created Date</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-caption uppercase tracking-[0.08em] text-text-muted">Task View</span>
              <select
                value={taskViewDefault}
                onChange={(e) => setTaskViewDefault(e.target.value as TaskView)}
                className="rounded-sm border border-border/80 bg-surface px-3 py-2 text-body-sm text-text-primary"
              >
                <option value="today">Today</option>
                <option value="week">Week</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-caption uppercase tracking-[0.08em] text-text-muted">Week Starts On</span>
              <select
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value as WeekStart)}
                className="rounded-sm border border-border/80 bg-surface px-3 py-2 text-body-sm text-text-primary"
              >
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-caption uppercase tracking-[0.08em] text-text-muted">Default Semester</span>
              <input
                value={defaultSemester}
                onChange={(e) => setDefaultSemester(e.target.value)}
                placeholder="e.g. 2026 - Semester 1"
                className="rounded-sm border border-border/80 bg-surface px-3 py-2 text-body-sm text-text-primary placeholder:text-text-muted"
              />
            </label>
          </div>
        </div>

        <div className="rounded-md border border-border/80 bg-background/70 p-4">
          <h4 className="mb-3 font-display text-title-sm text-text-primary">Backup & Restore</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleBackup}
              className="rounded-sm border border-border/80 bg-surface px-4 py-2 text-body-sm font-medium uppercase tracking-[0.08em] text-text-primary transition-all duration-300 ease-contemplative hover:border-border-hover"
            >
              Download Backup
            </button>
            <label className="cursor-pointer rounded-sm border border-border/80 bg-surface px-4 py-2 text-body-sm font-medium uppercase tracking-[0.08em] text-text-primary transition-all duration-300 ease-contemplative hover:border-border-hover">
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

        <div className="rounded-md border border-border/80 bg-background/70 p-4">
          <h4 className="mb-3 font-display text-title-sm text-text-primary">Quick Fixes</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleClearCache}
              className="rounded-sm border border-border/80 bg-surface px-4 py-2 text-body-sm font-medium uppercase tracking-[0.08em] text-text-primary transition-all duration-300 ease-contemplative hover:border-danger"
            >
              Clear Cache
            </button>
            <button
              onClick={relaunchOnboarding}
              className="rounded-sm border border-border/80 bg-surface px-4 py-2 text-body-sm font-medium uppercase tracking-[0.08em] text-text-primary transition-all duration-300 ease-contemplative hover:border-border-hover"
            >
              Relaunch Onboarding
            </button>
            <button
              onClick={handleResetAllLocalData}
              className="rounded-sm border border-danger/40 bg-danger/10 px-4 py-2 text-body-sm font-medium uppercase tracking-[0.08em] text-danger transition-all duration-300 ease-contemplative hover:border-danger"
            >
              Reset Local Data
            </button>
          </div>
          <p className="mt-2 text-caption text-text-muted">
            Reset Local Data clears settings and local preferences, but does not delete cloud records.
          </p>
        </div>

        <div className="rounded-md border border-border/80 bg-background/70 p-4">
          <h4 className="mb-3 font-display text-title-sm text-text-primary">Privacy & Security</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-body-sm text-text-tertiary">
              <input
                type="checkbox"
                checked={telemetryEnabled}
                onChange={(e) => setTelemetryEnabled(e.target.checked)}
              />
              Share anonymous telemetry
            </label>
            <label className="flex items-center gap-2 text-body-sm text-text-tertiary">
              <input
                type="checkbox"
                checked={usageReportsEnabled}
                onChange={(e) => setUsageReportsEnabled(e.target.checked)}
              />
              Include usage reports in backups
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-sm border border-border/80 bg-surface px-4 py-2 text-body-sm font-medium uppercase tracking-[0.08em] text-text-primary transition-all duration-300 ease-contemplative hover:border-border-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
          <p className="mt-3 text-caption text-text-muted">
            Local preferences stay on this device unless you export or sync your data.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-md border border-border/80 bg-background/70 p-4">
        <h4 className="mb-3 font-display text-title-sm text-text-primary">Profile</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Full name"
            className="border-b border-border bg-transparent px-1 py-2.5 text-body text-text-primary placeholder:text-text-muted focus:border-text-secondary focus:outline-none"
          />
          <input
            value={profileEmail}
            onChange={(e) => setProfileEmail(e.target.value)}
            placeholder="Email (optional)"
            className="border-b border-border bg-transparent px-1 py-2.5 text-body text-text-primary placeholder:text-text-muted focus:border-text-secondary focus:outline-none"
          />
        </div>
        {profileError && <div className="mt-2 text-caption text-danger">{profileError}</div>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={saveProfile}
            className="rounded-sm border border-text-primary bg-text-primary px-4 py-2 text-body-sm font-medium uppercase tracking-[0.08em] text-background transition-all duration-300 ease-contemplative hover:bg-accent-hover"
          >
            Save Profile
          </button>
          <button
            onClick={resetProfile}
            className="rounded-sm border border-border/80 bg-surface px-4 py-2 text-body-sm font-medium uppercase tracking-[0.08em] text-text-primary transition-all duration-300 ease-contemplative hover:border-border-hover"
          >
            Reset
          </button>
          {profileSaved && <span className="text-caption text-success">Profile saved</span>}
        </div>
      </div>
    </div>
  );
};