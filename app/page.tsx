'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  BookOpen,
  TrendUp,
  Target,
  CheckSquare,
  CurrencyDollar,
  GearSix,
  X,
  FileText,
  List
} from 'phosphor-react';
import { useDatabase } from '@/hooks/useDatabase';
import { AnalyticsPage } from '@/components/pages/AnalyticsPage';
import { iPhoneInteractions } from '@/lib/utils/iphoneInteractions';

// Types
import type { Module, Task, Transaction, PageType } from '@/lib/types';

// Hooks
import { useStore } from '@/hooks/useStore';

// UI Components
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';

import { ModuleForm as AcademicModuleForm } from '@/components/academic/ModuleForm';
import { DocumentImport } from '@/components/academic/DocumentImport';
import { RoadmapPage } from '@/components/academic/RoadmapPage';
import { useAcademic } from '@/hooks/useAcademic';

// Pages
import { TasksPage } from '@/components/pages/TasksPage';
import { SettingsPage } from '@/components/pages/SettingsPage';
import { FinancesPage } from '@/components/pages/FinancesPage';
import { TimetablePage } from '@/components/pages/TimetablePage';
import { DashboardPage } from '@/components/pages/DashboardPage';
import { AcademicPage } from '@/components/pages/AcademicPage';
import { AcademicProgressPage } from '@/components/pages/AcademicProgressPage';

// Utilities
import type { ScheduleEntry } from '@/lib/import/scheduleParser';
import type { ExamEntry } from '@/lib/import/examScheduleParser';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { shouldRouteToOnboarding } from '@/lib/onboarding';

// Constants
const MOBILE_WIDTH_THRESHOLD = 428;

type NavItem = {
  id: PageType;
  icon: React.ElementType;
  label: string;
  chapter: string;
  index: string;
};

type AcademicModuleInput = {
  code: string;
  name: string;
  credits: number;
  semester: string;
  targetGrade: number;
  professor?: string;
  description?: string;
  color?: string;
};

const UniLife = () => {
  // ---  AUTH PROTECTION START ---
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const store = useStore();
  const db = useDatabase();
  const [isMobile, setIsMobile] = useState(false);

  // Academic state - Move ALL hooks here, before any conditional logic
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isDocumentImportOpen, setIsDocumentImportOpen] = useState(false);
  const {
    modules,
    isLoading: modulesLoading,
    createModule,
    fetchModules
  } = useAcademic();

  // Load modules on component mount
  useEffect(() => {
    fetchModules().catch(error => {
      console.error('Failed to load modules:', error);
    });
  }, [fetchModules]);

  const handleAddModule = async (moduleData: AcademicModuleInput) => {
    try {
      await createModule({
        ...moduleData,
        currentGrade: 0,
        progress: 0,
        assessments: [],
      });
      setIsModuleModalOpen(false);
    } catch (error) {
      console.error('Failed to add module:', error);
      alert(`Failed to add module: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDocumentImportModules = async (importedModules: Module[]) => {
    try {
      for (const moduleData of importedModules) {
        await createModule(moduleData);
      }
    } catch (error) {
      console.error('Failed to import modules:', error);
    }
  };

  const handleImportSchedule = (entries: ScheduleEntry[]) => {
    // TODO: Wire schedule entries to module ClassSchedule[] or timetable store
    console.log('Imported schedule entries:', entries);
  };

  const handleImportAssessments = (entries: ExamEntry[], moduleCode: string) => {
    // TODO: Wire exam entries to module assessments
    console.log('Imported assessments for', moduleCode, entries);
  };

  useEffect(() => {
    const checkMobile = () => {
      // Check for actual iPhone or mobile device
      const isIPhone = /iPhone/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isMobileDevice = isIPhone || isAndroid ||
                            (window.innerWidth <= MOBILE_WIDTH_THRESHOLD &&
                             'ontouchstart' in window);
      setIsMobile(prev => prev !== isMobileDevice ? isMobileDevice : prev);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize iPhone-specific optimizations
  useEffect(() => {
    iPhoneInteractions.initialize();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const shouldOpenImport = window.localStorage.getItem('unilife_open_import_on_load') === 'true';
    if (shouldOpenImport) {
      setIsDocumentImportOpen(true);
      window.localStorage.removeItem('unilife_open_import_on_load');
    }
  }, []);

  // Auth state listener with onboarding gate
  useEffect(() => {
    // Dev mode: skip auth entirely so local testing doesn't require a session.
    // Controlled by NEXT_PUBLIC_DEV_MODE=true in .env.local (never set in production).
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      setIsLoading(false);
      return;
    }

    const routeForSession = (session: { user: { id: string } } | null) => {
      if (!session) {
        router.push('/login');
        return;
      }

      if (shouldRouteToOnboarding(session.user.id)) {
        router.replace('/onboarding');
        return;
      }

      setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      routeForSession(session as { user: { id: string } } | null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      routeForSession(session as { user: { id: string } } | null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-8 h-[2px] bg-text-primary animate-pulse-subtle"></div>
          <p className="text-text-secondary text-label uppercase tracking-[0.12em]">Verifying access</p>
        </div>
      </div>
    );
  }

  const navigation: NavItem[] = [
    { id: 'dashboard', icon: Calendar, label: 'Dashboard', chapter: '(ima) Today', index: '01' },
    { id: 'academic', icon: BookOpen, label: 'Academic', chapter: '(keisei) Formation', index: '02' },
    { id: 'academic-progress', icon: TrendUp, label: 'Progress', chapter: '(kiseki) Trajectory', index: '03' },
    { id: 'timetable', icon: FileText, label: 'Timetable', chapter: '(rizumu) Rhythm', index: '04' },
    { id: 'analytics', icon: Target, label: 'Analytics', chapter: '(bunseki) Analysis', index: '05' },
    { id: 'roadmap', icon: Target, label: 'Roadmap', chapter: '(keikaku) Path', index: '06' },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks', chapter: '(yakusoku) Commitments', index: '07' },
    { id: 'finances', icon: CurrencyDollar, label: 'Finances', chapter: '(junkan) Sustainability', index: '08' },
    { id: 'settings', icon: GearSix, label: 'Settings', chapter: '(chosei) System', index: '09' },
  ];

  const activeNavigation = navigation.find(item => item.id === store.currentPage) || navigation[0];

  const bottomNavItems = navigation.slice(0, 5);

  const renderPage = () => {
    switch (store.currentPage) {
      case 'dashboard': return (
        <DashboardPage
          modules={modules}
          tasks={db.tasks}
          transactions={db.transactions}
          isLoading={db.loading}
          modulesLoading={modulesLoading}
          onOpenTaskModal={() => {
            store.setEditingTask(null);
            store.setShowModal('task');
          }}
          onNavigate={(page) => store.setCurrentPage(page)}
        />
      );
      case 'academic': return (
        <AcademicPage
          modules={modules}
          onImportYearbook={() => setIsDocumentImportOpen(true)}
        />
      );
      case 'academic-progress': return <AcademicProgressPage modules={db.modules} />;
      case 'roadmap': return <RoadmapPage modules={modules} major="Physics" secondMajor="Mathematics" />;
      case 'analytics': return <AnalyticsPage modules={db.modules} />;
      case 'timetable': return <TimetablePage />;
      case 'tasks':
        
        return (
          <TasksPage
            tasks={db.tasks}
            modules={db.modules}
            onAddTask={() => {
              store.setEditingTask(null);
              store.setShowModal('task');
            }}
            onEditTask={(task: Task) => {
              store.setEditingTask(task);
              store.setShowModal('task');
            }}
            onDeleteTask={(id: string) => {
              if (confirm('Are you sure you want to delete this task?')) {
                db.deleteTask(id);
              }
            }}
            onToggleComplete={async (id: string) => {
              const task = db.tasks.find((t: Task) => t.id === id);
              if (task) {
                await db.saveTask({ ...task, completed: !task.completed });
              }
            }}
            onSaveTask={db.saveTask}
          />
        );
      case 'finances': 
        return (
          <FinancesPage
            transactions={db.transactions}
            onAddTransaction={() => {
              store.setEditingTransaction(null);
              store.setShowModal('transaction');
            }}
            onEditTransaction={(transaction: Transaction) => {
              store.setEditingTransaction(transaction);
              store.setShowModal('transaction');
            }}
            onDeleteTransaction={(id: string) => {
              if (confirm('Are you sure you want to delete this transaction?')) {
                db.deleteTransaction(id);
              }
            }}
          />
        );
      case 'settings': return <SettingsPage />;
      default:
        return (
          <DashboardPage
            modules={modules}
            tasks={db.tasks}
            transactions={db.transactions}
            isLoading={db.loading}
            modulesLoading={modulesLoading}
            onOpenTaskModal={() => {
              store.setEditingTask(null);
              store.setShowModal('task');
            }}
            onNavigate={(page) => store.setCurrentPage(page)}
          />
        );
    }
  };

const TaskForm = () => {
  const [formState, setFormState] = useState<Partial<Task>>(store.editingTask || {
    title: '', moduleCode: '', dueDate: new Date().toISOString().split('T')[0], priority: 'medium', status: 'todo', completed: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const taskToSave: Task = {
        ...formState,
        id: store.editingTask?.id || Date.now().toString(),
        created_at: store.editingTask?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Task;
      
      const success = await db.saveTask(taskToSave);
      
      if (success) {
        store.setShowModal(null);
        store.setEditingTask(null);
      } else {
        alert('Failed to save task. Please try again.');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error saving task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input 
        label="Task Title" 
        value={formState.title || ''} 
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormState({...formState, title: e.target.value})} 
        placeholder="Complete assignment" 
        required 
      />
      <div className="grid grid-cols-2 gap-4">
        <Select 
          label="Module" 
          value={formState.moduleCode || ''} 
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormState({...formState, moduleCode: e.target.value})}
          options={[
            {value: '', label: 'None'}, 
            ...db.modules.map(m => ({value: m.code, label: `${m.code} - ${m.name.substring(0, 20)}${m.name.length > 20 ? '...' : ''}`}))
          ]} 
          required 
        />
        <Input 
          label="Due Date" 
          type="date" 
          value={formState.dueDate || ''} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormState({...formState, dueDate: e.target.value})} 
          placeholder="" 
          required 
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select 
          label="Priority" 
          value={formState.priority || 'medium'} 
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormState({...formState, priority: e.target.value as Task['priority']})}
          options={[
            {value: 'low', label: 'Low'}, 
            {value: 'medium', label: 'Medium'}, 
            {value: 'high', label: 'High'}
          ]} 
          required 
        />
        <Select 
          label="Status" 
          value={formState.status || 'todo'} 
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormState({...formState, status: e.target.value as Task['status']})}
          options={[
            {value: 'todo', label: 'To Do'}, 
            {value: 'inprogress', label: 'In Progress'}, 
            {value: 'done', label: 'Done'}
          ]} 
          required 
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="completed"
          checked={formState.completed || false}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormState({...formState, completed: e.target.checked})}
          className="w-4 h-4 border-border bg-background accent-text-primary"
        />
        <label htmlFor="completed" className="text-sm text-text-primary cursor-pointer">
          Mark as completed
        </label>
      </div>
      <div className="flex gap-3 justify-end pt-4">
        <Button 
          variant="secondary" 
          onClick={() => {
            store.setShowModal(null);
            store.setEditingTask(null);
          }}
          type="button"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 border-t border-background animate-spin"></div>
              Saving...
            </span>
          ) : (
            `${store.editingTask ? 'Update' : 'Add'} Task`
          )}
        </Button>
      </div>
    </form>
  );
};

const TransactionForm = () => {
  const [formState, setFormState] = useState<Partial<Transaction>>(store.editingTransaction || {
    date: new Date().toISOString().split('T')[0], 
    description: '', 
    amount: 0, 
    category: 'Food'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const transactionToSave: Transaction = {
        ...formState,
        id: store.editingTransaction?.id || Date.now().toString(),
        created_at: store.editingTransaction?.created_at || new Date().toISOString(),
      } as Transaction;
      
      const success = await db.saveTransaction(transactionToSave);
      
      if (success) {
        store.setShowModal(null);
        store.setEditingTransaction(null);
      } else {
        alert('Failed to save transaction. Please try again.');
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error saving transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmount = (value: string) => {
    const num = value.replace(/[^0-9.-]/g, '');
    return num === '' ? '0' : num;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input 
          label="Date" 
          type="date" 
          value={formState.date || ''} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormState({...formState, date: e.target.value})} 
          placeholder="" 
          required 
          max={new Date().toISOString().split('T')[0]}
        />
        <Select 
          label="Category" 
          value={formState.category || 'Food'} 
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormState({...formState, category: e.target.value})}
          options={[
            {value: 'Food', label: 'Food'}, 
            {value: 'Books', label: 'Books'}, 
            {value: 'Tuition', label: 'Tuition'}, 
            {value: 'Transport', label: 'Transport'}, 
            {value: 'Entertainment', label: 'Entertainment'},
            {value: 'Utilities', label: 'Utilities'},
            {value: 'Shopping', label: 'Shopping'},
            {value: 'Income', label: 'Income'},
            {value: 'Other', label: 'Other'}
          ]} 
          required
        />
      </div>
      <Input 
        label="Description" 
        value={formState.description || ''} 
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormState({...formState, description: e.target.value})} 
        placeholder="e.g., Lunch at cafeteria, Textbook purchase" 
        required 
      />
      <div className="relative">
        <label className="block text-xs font-medium uppercase tracking-wider text-text-secondary mb-2">
          Amount <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-tertiary font-mono">R</span>
          <input
            type="text"
            value={formState.amount === 0 ? '' : formState.amount?.toString()}
            onChange={e => {
              const formatted = formatAmount(e.target.value);
              setFormState({...formState, amount: parseFloat(formatted) || 0});
            }}
            placeholder="-25.50"
            required
            className="w-full bg-transparent border-b border-border pl-10 pr-4 py-2 text-text-primary font-mono focus:outline-none focus:border-text-primary transition-colors"
          />
        </div>
        <div className="flex gap-2 mt-2">
          <span className="text-xs text-text-tertiary uppercase tracking-wider">Quick add:</span>
          {[10, 20, 50, 100, 200].map(amt => (
            <button
              key={amt}
              type="button"
              onClick={() => setFormState({...formState, amount: -amt})}
              className="text-xs px-2 py-1 bg-surface hover:bg-border transition-colors text-text-secondary font-mono"
            >
              -R{amt}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFormState({...formState, amount: Math.abs(formState.amount || 0)})}
            className="text-xs px-2 py-1 bg-success/10 hover:bg-success/20 transition-colors text-success font-mono"
          >
            Make positive
          </button>
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-4">
        <Button 
          variant="secondary" 
          onClick={() => {
            store.setShowModal(null);
            store.setEditingTransaction(null);
          }}
          type="button"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 border-t border-background animate-spin"></div>
              Saving...
            </span>
          ) : (
            `${store.editingTransaction ? 'Update' : 'Add'} Transaction`
          )}
        </Button>
      </div>
    </form>
  );
};

  const handleStoreModuleSubmit = async (moduleData: AcademicModuleInput) => {
    const moduleToSave: Module = {
      ...(store.editingModule || {}),
      ...moduleData,
      id: store.editingModule?.id || Date.now().toString(),
      currentGrade: store.editingModule?.currentGrade ?? 0,
      progress: store.editingModule?.progress ?? 0,
      assessments: store.editingModule?.assessments || [],
      createdAt: store.editingModule?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: store.editingModule?.userId || '',
    } as Module;

    const success = await db.saveModule(moduleToSave);
    if (!success) {
      throw new Error('Failed to save module');
    }

    store.setShowModal(null);
    store.setEditingModule(null);
  };

  return (
  <div className="min-h-screen bg-background text-text-primary font-sans safe-area-top">
    {/* Desktop Sidebar */}
    {!isMobile && (
      <div 
        className={`fixed left-0 top-0 z-50 h-full border-r border-border/80 bg-surface/80 backdrop-blur-md transition-all duration-420 ease-contemplative ${
          store.sidebarExpanded ? 'w-60' : 'w-16'
        }`}
      >
        <div className="border-b border-border/80 px-4 py-4">
          {store.sidebarExpanded ? (
            <div className="space-y-1">
              <p className="chapter-label">EST 2026</p>
              <div className="font-display text-title-sm text-text-primary tracking-tight">UniLife</div>
              <p className="text-caption text-text-tertiary">Student Academic Manager</p>
            </div>
          ) : (
            <div className="font-display text-title-sm text-text-primary tracking-tight">UL</div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {navigation.map(item => {
            const Icon = item.icon;
            const isActive = store.currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => store.setCurrentPage(item.id)}
                data-testid={`nav-${item.id}`}
                className={`nav-indicator mb-1 w-full rounded-sm px-3 py-2.5 transition-all duration-300 ease-contemplative ${
                  isActive 
                    ? 'active border border-border-hover bg-surface-hover/70 text-text-primary shadow-surface-soft' 
                    : 'border border-transparent text-text-secondary hover:border-border/70 hover:bg-surface-hover/50 hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} className="shrink-0" />
                  {store.sidebarExpanded && (
                    <div className="min-w-0 text-left">
                      <div className="truncate text-body-sm font-medium">({item.index}) {item.label}</div>
                      <div className="truncate text-[10px] uppercase tracking-[0.12em] text-text-muted">{item.chapter}</div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-border/80 p-4">
          <button
            onClick={() => store.setSidebarExpanded(!store.sidebarExpanded)}
            className="flex w-full items-center justify-center gap-2 rounded-sm border border-border/80 px-3 py-2 text-text-secondary transition-all duration-300 ease-contemplative hover:border-border-hover hover:bg-surface-hover/60 hover:text-text-primary"
          >
            {store.sidebarExpanded ? <X size={18} /> : <List size={18} />}
          </button>
        </div>
      </div>
    )}

    {/* Desktop Menu Button */}
    {!isMobile && !store.sidebarExpanded && (
      <button
        onClick={() => store.setSidebarExpanded(true)}
        className="fixed left-4 top-4 z-50 rounded-sm border border-border/80 bg-surface/90 p-3 shadow-surface-soft transition-all duration-300 ease-contemplative hover:border-border-hover"
      >
        <List size={20} className="text-text-primary" />
      </button>
    )}

    {/* Mobile Bottom Navigation */}
    {isMobile && (
      <>
        <div className="pb-24 safe-area-bottom">
          <div className="scroll-container page-enter">
            {/* Mobile chapter context strip */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/40">
              <p className="text-overline uppercase tracking-[0.14em] text-text-muted">{activeNavigation.chapter}</p>
              <p className="text-overline font-mono text-text-muted">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
              </p>
            </div>
            <div className="px-3 pt-2">
              {renderPage()}
            </div>
          </div>
        </div>

        {/* Bottom Tab Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/70 bg-background/97 backdrop-blur-xl">
          <div className="max-w-mobile mx-auto flex items-stretch">
            {([...bottomNavItems, { id: 'settings' as PageType, icon: GearSix, label: 'System', chapter: '(chosei) System', index: '09' }] as NavItem[]).map((item) => {
              const Icon = item.icon;
              const isActive = store.currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    store.setCurrentPage(item.id);
                    if (iPhoneInteractions.supportsHaptic()) {
                      iPhoneInteractions.haptic('selection');
                    }
                  }}
                  onTouchStart={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    iPhoneInteractions.touchFeedback(target, 'light');
                  }}
                  data-testid={`nav-${item.id}`}
                  className={`relative flex flex-1 flex-col items-center justify-center pt-2 bottom-nav-safe-area no-select haptic-feedback transition-all duration-300 ease-contemplative ${
                    isActive ? 'text-text-primary' : 'text-text-muted'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-text-primary" />
                  )}
                  <div className={`flex items-center gap-1 transition-all duration-300 ease-contemplative rounded-full ${
                    isActive ? 'bg-text-primary/[0.08] px-2.5 py-1' : 'px-2.5 py-1'
                  }`}>
                    <Icon size={isActive ? 15 : 18} />
                    {isActive && (
                      <span className="text-[11px] font-semibold tracking-tight leading-none whitespace-nowrap">{item.label}</span>
                    )}
                  </div>
                  {/* Spacer keeps height consistent whether active label is shown or not */}
                  <span className="mt-0.5 text-[9px] leading-none select-none" style={{ opacity: 0 }}>·</span>
                </button>
              );
            })}
          </div>
        </div>
      </>
    )}

    {/* Desktop Content Area */}
    {!isMobile && (
      <div className={`transition-all duration-420 ease-contemplative ${store.sidebarExpanded ? 'ml-60' : 'ml-16'}`}>
        <div className="mx-auto max-w-wide p-6 desktop:p-12 page-enter">
          <div className="mb-6 border-b border-border/80 pb-3">
            <p className="chapter-label">({activeNavigation.index}) {activeNavigation.chapter}</p>
            <p className="text-body-sm text-text-tertiary">Academic continuity through deliberate progress.</p>
          </div>
          {renderPage()}
        </div>
      </div>
    )}

    <Modal 
      isOpen={store.showModal === 'module'} 
      onClose={() => { 
        store.setShowModal(null); 
        store.setEditingModule(null); 
      }}
      title={store.editingModule ? 'Edit Module' : 'Add New Module'}
      chapterLabel="(keisei) Formation"
    >
      <AcademicModuleForm
        module={store.editingModule || undefined}
        onSubmit={handleStoreModuleSubmit}
        onCancel={() => {
          store.setShowModal(null);
          store.setEditingModule(null);
        }}
        isSubmitting={false}
      />
    </Modal>

    <Modal 
      isOpen={store.showModal === 'task'} 
      onClose={() => { 
        store.setShowModal(null); 
        store.setEditingTask(null); 
      }}
      title={store.editingTask ? 'Edit Task' : 'Add New Task'}
      chapterLabel="(yakusoku) Commitments"
    >
      <TaskForm />
    </Modal>

    <Modal 
      isOpen={store.showModal === 'transaction'} 
      onClose={() => { 
        store.setShowModal(null); 
        store.setEditingTransaction(null); 
      }}
      title={store.editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
      chapterLabel="(junkan) Sustainability"
    >
      <TransactionForm />
    </Modal>

    {/* Legacy yearbook modal redirects to document import */}
    {store.showModal === 'yearbook' && (() => {
      store.setShowModal(null);
      setIsDocumentImportOpen(true);
      return null;
    })()}

    {/* Module Modal */}
    <Modal
      isOpen={isModuleModalOpen}
      onClose={() => setIsModuleModalOpen(false)}
      title="Add New Module"
      chapterLabel="(keisei) Formation"
    >
      <AcademicModuleForm 
        onSubmit={handleAddModule}
        onCancel={() => setIsModuleModalOpen(false)}
        isSubmitting={false}
      />
    </Modal>

    {/* Document Import Hub */}
    <DocumentImport
      isOpen={isDocumentImportOpen}
      onClose={() => setIsDocumentImportOpen(false)}
      onImportModules={handleDocumentImportModules}
      onImportSchedule={handleImportSchedule}
      onImportAssessments={handleImportAssessments}
      existingModules={modules}
    />
  </div>
);
};
export default UniLife;

