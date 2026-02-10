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
  Plus,
  UploadSimple,
  X,
  CaretLeft,
  CaretRight,
  FileText,
  DownloadSimple,
  List
} from 'phosphor-react';
import { useDatabase } from '@/hooks/useDatabase';
import { AnalyticsPage } from '@/components/pages/AnalyticsPage';
import { iPhoneInteractions } from '@/lib/utils/iphoneInteractions';
import { getNextSession } from '@/lib/timetableData';

// Types
import type { Module, Task, Transaction, PageType } from '@/lib/types';

// Hooks
import { useStore } from '@/hooks/useStore';

// UI Components
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Modal } from '@/components/ui/Modal';

import { ModuleForm as AcademicModuleForm } from '@/components/academic/ModuleForm';
import { AcademicDashboard } from '@/components/academic/AcademicDashboard';
import { YearbookImport } from '@/components/academic/YearbookImport';
import { RoadmapPage } from '@/components/academic/RoadmapPage';
import { useAcademic } from '@/hooks/useAcademic';

// Pages
import { TasksPage } from '@/components/pages/TasksPage';
import { SettingsPage } from '@/components/pages/SettingsPage';
import { FinancesPage } from '@/components/pages/FinancesPage';
import { TimetablePage } from '@/components/pages/TimetablePage';

// Utilities
import { calculateCWA, calculateTermAverage } from '@/lib/utils/calculations';
import { parseYearbookPDF, mapModulesToSemesters, type ExtractedModule } from '@/lib/utils/pdfParser';

import { useRouter } from 'next/navigation'; 
import { supabase } from '@/lib/supabase/supabase';

// Constants
const MOBILE_WIDTH_THRESHOLD = 428;
const MOBILE_HEIGHT_THRESHOLD = 800;
const MAX_VISIBLE_TASKS_DASHBOARD = 5;
const MAX_VISIBLE_MODULES_DASHBOARD = 3;

const UniLife = () => {
  // ---  AUTH PROTECTION START ---
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const store = useStore();
  const db = useDatabase();
  const [isMobile, setIsMobile] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  
  // Academic state - Move ALL hooks here, before any conditional logic
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isYearbookImportOpen, setIsYearbookImportOpen] = useState(false);
  const { 
    modules, 
    isLoading: modulesLoading, 
    error: modulesError,
    createModule,
    fetchModules 
  } = useAcademic();

  // Load modules on component mount
  useEffect(() => {
    fetchModules().catch(error => {
      console.error('Failed to load modules:', error);
    });
  }, []); // Empty deps - fetchModules is stable from useAcademic hook

  const handleAddModule = async (moduleData: any) => {
    try {
      await createModule(moduleData);
      setIsModuleModalOpen(false);
    } catch (error) {
      console.error('Failed to add module:', error);
      alert(`Failed to add module: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleYearbookImport = async (importedModules: Module[]) => {
    try {
      // Create each imported module
      for (const moduleData of importedModules) {
        await createModule(moduleData);
      }
      setIsYearbookImportOpen(false);
    } catch (error) {
      console.error('Failed to import modules:', error);
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      // Check for actual iPhone or mobile device
      const isIPhone = /iPhone/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isMobileDevice = isIPhone || isAndroid || 
                            (window.innerWidth <= MOBILE_WIDTH_THRESHOLD && 
                             'ontouchstart' in window); // Has touch capability
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return (db.tasks || []).filter(task => task.dueDate === dateStr);
  };

  const exportData = () => {
    const data = {
      modules: db.modules,
      tasks: db.tasks,
      transactions: db.transactions,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unilife-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Page Components - moved inside to access required variables
  const DashboardPage = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentCalendarDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    const getTasksThisWeek = () => {
      const startOfWeek = new Date(today);
      startOfWeek.setHours(0, 0, 0, 0);
      // Roll back to Monday (1 = Monday)
      const dayOfWeek = startOfWeek.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return (db.tasks || []).filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate + 'T00:00:00');
        return taskDate >= startOfWeek && taskDate <= endOfWeek && !task.completed;
      }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    };

    const thisWeekTasks = getTasksThisWeek();
    const currentYear = new Date().getFullYear();
    const activeModules = (modules || []).filter(m => {
      const isCompleted = m.completed || m.currentGrade >= 100;
      const yearMatch = m.semester?.match(/\b20\d{2}\b/);
      const isPastYear = yearMatch ? parseInt(yearMatch[0], 10) < currentYear : false;
      return !isCompleted && !isPastYear;
    });
    const nextSession = getNextSession(new Date());
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayKey = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;
    const todayTasks = (db.tasks || []).filter(task => task.dueDate === todayKey && !task.completed).slice(0, 3);
    const streakDays = (() => {
      // Count consecutive days (backwards from today) with completed tasks
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(todayLocal);
        checkDate.setDate(checkDate.getDate() - i);
        const checkKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        const hasCompleted = (db.tasks || []).some(t => t.completed && t.dueDate === checkKey);
        if (hasCompleted) {
          streak++;
        } else if (i > 0) {
          break; // streak broken (skip today if nothing yet)
        }
      }
      return streak;
    })();

    // Finance snapshot
    const currentMonthTransactions = (db.transactions || []).filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const monthIncome = currentMonthTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const monthExpenses = currentMonthTransactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const monthBalance = monthIncome - monthExpenses;

    // Academic snapshot
    const cwaVal = modules.length > 0 ? calculateCWA(modules) : 0;
    const cwa = typeof cwaVal === 'string' ? parseFloat(cwaVal) || 0 : cwaVal;
    const completedCount = (modules || []).filter(m => m.completed || m.currentGrade >= 100).length;
    const totalTasks = (db.tasks || []).length;
    const completedTasks = (db.tasks || []).filter(t => t.completed).length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Overdue tasks
    const overdueTasks = (db.tasks || []).filter(task => {
      if (task.completed || !task.dueDate) return false;
      return new Date(task.dueDate + 'T00:00:00') < todayLocal;
    });

    if (db.loading || modulesLoading) {
      return (
        <div className="space-y-4 mx-2 pt-4">
          <div className="h-8 w-48 bg-surface animate-pulse rounded" />
          <div className="grid grid-cols-2 desktop:grid-cols-4 gap-[1px] bg-border">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-surface p-3">
                <div className="h-3 w-16 bg-surface-hover animate-pulse rounded mb-2" />
                <div className="h-6 w-10 bg-surface-hover animate-pulse rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 desktop:grid-cols-3 gap-[1px] bg-border">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-surface p-4">
                <div className="h-3 w-20 bg-surface-hover animate-pulse rounded mb-2" />
                <div className="h-5 w-24 bg-surface-hover animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 stagger-children">
        {/* Header */}
        <div className="flex items-baseline justify-between px-2 pt-2">
          <div>
            <h1 className="text-title-lg text-text-primary">Dashboard</h1>
            <p className="text-caption text-text-secondary mt-0.5">
              {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                store.setEditingTask(null);
                store.setShowModal('task');
              }}
              className="h-8 px-2"
            >
              <Plus size={14} />
            </Button>
            <Button variant="secondary" size="sm" onClick={exportData} className="h-8 px-2">
              <DownloadSimple size={14} />
            </Button>
          </div>
        </div>

        {/* Overview Stats — 4-column grid */}
        <div className="grid grid-cols-2 desktop:grid-cols-4 gap-[1px] bg-border mx-2">
          <div className="bg-surface p-3">
            <span className="text-[10px] uppercase tracking-[0.1em] text-text-tertiary block mb-1">Due this week</span>
            <div className="text-title-sm font-mono text-text-primary">{thisWeekTasks.length}</div>
          </div>
          <div className="bg-surface p-3">
            <span className="text-[10px] uppercase tracking-[0.1em] text-text-tertiary block mb-1">Overdue</span>
            <div className={`text-title-sm font-mono ${overdueTasks.length > 0 ? 'text-danger' : 'text-text-primary'}`}>{overdueTasks.length}</div>
          </div>
          <div className="bg-surface p-3">
            <span className="text-[10px] uppercase tracking-[0.1em] text-text-tertiary block mb-1">CWA</span>
            <div className="text-title-sm font-mono text-text-primary">{cwa > 0 ? cwa.toFixed(0) + '%' : '—'}</div>
          </div>
          <div className="bg-surface p-3">
            <span className="text-[10px] uppercase tracking-[0.1em] text-text-tertiary block mb-1">Balance</span>
            <div className={`text-title-sm font-mono ${monthBalance >= 0 ? 'text-success' : 'text-danger'}`}>
              {monthBalance >= 0 ? '+' : '-'}R{Math.abs(monthBalance).toFixed(0)}
            </div>
          </div>
        </div>

        {/* Info Cards Row */}
        <div className="grid grid-cols-1 desktop:grid-cols-3 gap-[1px] bg-border mx-2">
          <div className="bg-surface p-4">
            <div className="text-label uppercase tracking-[0.08em] text-text-secondary mb-1">Next class</div>
            {nextSession ? (
              <>
                <div className="text-body font-medium text-text-primary">{nextSession.module}</div>
                <div className="text-caption text-text-secondary">
                  {nextSession.day} · {nextSession.time}
                </div>
                <div className="text-caption text-text-tertiary">{nextSession.venue}</div>
              </>
            ) : (
              <div className="text-body text-text-tertiary">No upcoming class</div>
            )}
          </div>
          <div className="bg-surface p-4">
            <div className="text-label uppercase tracking-[0.08em] text-text-secondary mb-1">Today focus</div>
            {todayTasks.length > 0 ? (
              <div className="space-y-0.5">
                {todayTasks.map(task => (
                  <div key={task.id} className="text-body text-text-primary truncate">{task.title}</div>
                ))}
              </div>
            ) : (
              <div className="text-body text-text-tertiary">No tasks today</div>
            )}
          </div>
          <div className="bg-surface p-4">
            <div className="text-label uppercase tracking-[0.08em] text-text-secondary mb-1">Completion rate</div>
            <div className="text-title-lg font-mono text-text-primary">{taskCompletionRate}%</div>
            <div className="text-caption text-text-tertiary">{completedTasks}/{totalTasks} tasks done</div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-surface p-4 mx-2 border-t-2 border-t-text-primary">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title-sm text-text-primary">
              {monthNames[month]} {year}
            </h2>
            <div className="flex gap-0.5">
              <button 
                onClick={() => setCurrentCalendarDate(new Date(year, month - 1, 1))}
                className="p-2 hover:bg-surface-hover transition-colors duration-200"
              >
                <CaretLeft size={16} className="text-text-primary" />
              </button>
              <button 
                onClick={() => setCurrentCalendarDate(new Date())}
                className="px-3 py-2 hover:bg-surface-hover transition-colors duration-200 text-caption uppercase tracking-[0.08em] text-text-secondary"
              >
                Today
              </button>
              <button 
                onClick={() => setCurrentCalendarDate(new Date(year, month + 1, 1))}
                className="p-2 hover:bg-surface-hover transition-colors duration-200"
              >
                <CaretRight size={16} className="text-text-primary" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={`${day}-${i}`} className="text-center text-label uppercase tracking-[0.08em] text-text-tertiary py-2">
                {day}
              </div>
            ))}

            {/* Previous month trailing days */}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => {
              const prevMonthLastDay = new Date(year, month, 0).getDate();
              const day = prevMonthLastDay - startingDayOfWeek + 1 + i;
              return (
                <div key={`prev-${i}`} className="aspect-square border border-border p-1 opacity-30">
                  <div className="text-caption font-mono mb-0.5 text-text-tertiary">{day}</div>
                </div>
              );
            })}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const events = getEventsForDate(date);
              const isToday = isCurrentMonth && day === today.getDate();

              return (
                <div 
                  key={day}
                  className={`aspect-square border border-border p-1 hover:bg-surface-hover transition-all duration-200 cursor-pointer ${
                    isToday ? 'bg-surface-active border-text-primary' : ''
                  }`}
                >
                  <div className={`text-caption font-mono mb-0.5 ${isToday ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                    {day}
                  </div>
                  <div className="flex gap-0.5 flex-wrap">
                    {events.slice(0, 3).map(event => (
                      <div 
                        key={event.id}
                        className={`w-1 h-1 rounded-full ${
                          event.priority === 'high' ? 'bg-danger' :
                          event.priority === 'medium' ? 'bg-warning' :
                          'bg-success'
                        }`}
                        title={event.title}
                      />
                    ))}
                    {events.length > 3 && (
                      <div className="text-[7px] font-mono text-text-tertiary leading-none">+{events.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* This Week Tasks */}
        <div className="mx-2">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-title-sm text-text-primary">This Week</h3>
            <span className="text-label uppercase tracking-[0.08em] text-text-secondary">
              {thisWeekTasks.length} tasks
            </span>
          </div>
          <div className="space-y-0 border-t border-border">
            {thisWeekTasks.length > 0 ? (
              thisWeekTasks.slice(0, MAX_VISIBLE_TASKS_DASHBOARD).map(task => (
                <div key={task.id} className="data-row px-0 py-3 gap-3">
                  <div className={`w-1.5 h-1.5 shrink-0 ${
                    task.priority === 'high' ? 'bg-danger' : 
                    task.priority === 'medium' ? 'bg-warning' : 'bg-success'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-body text-text-primary truncate">{task.title}</div>
                    <div className="text-caption text-text-secondary mt-0.5">
                      {new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {task.moduleCode && <span className="ml-2 font-mono text-text-tertiary">{task.moduleCode}</span>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckSquare className="mx-auto h-6 w-6 text-text-tertiary" />
                <p className="mt-2 text-body text-text-secondary">No tasks this week</p>
              </div>
            )}
          </div>
          {thisWeekTasks.length > MAX_VISIBLE_TASKS_DASHBOARD && (
            <button 
              onClick={() => store.setCurrentPage('tasks')}
              className="w-full mt-2 py-2 text-caption uppercase tracking-[0.08em] text-text-secondary hover:text-text-primary transition-colors duration-200 btn-underline"
            >
              View all tasks
            </button>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-[1px] bg-border mx-2 mb-4">
          <button
            onClick={() => store.setCurrentPage('academic')}
            className="bg-surface p-3 text-center hover:bg-surface-hover transition-colors duration-200"
          >
            <BookOpen size={16} className="mx-auto text-text-secondary mb-1" />
            <span className="text-[10px] uppercase tracking-[0.1em] text-text-secondary">Academic</span>
            <div className="text-caption font-mono text-text-primary mt-0.5">{activeModules.length} active</div>
          </button>
          <button
            onClick={() => store.setCurrentPage('finances')}
            className="bg-surface p-3 text-center hover:bg-surface-hover transition-colors duration-200"
          >
            <CurrencyDollar size={16} className="mx-auto text-text-secondary mb-1" />
            <span className="text-[10px] uppercase tracking-[0.1em] text-text-secondary">Finances</span>
            <div className="text-caption font-mono text-text-primary mt-0.5">
              R{monthExpenses.toFixed(0)} spent
            </div>
          </button>
          <button
            onClick={() => store.setCurrentPage('timetable')}
            className="bg-surface p-3 text-center hover:bg-surface-hover transition-colors duration-200"
          >
            <Calendar size={16} className="mx-auto text-text-secondary mb-1" />
            <span className="text-[10px] uppercase tracking-[0.1em] text-text-secondary">Timetable</span>
            <div className="text-caption font-mono text-text-primary mt-0.5">{streakDays}d streak</div>
          </button>
        </div>
      </div>
    );
  };

  // Auth state listener with session refresh
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes (logout, token refresh, etc)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setIsLoading(false);
      }
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

  const navigation = [
  { id: 'dashboard' as PageType, icon: Calendar, label: 'Dashboard' },
  { id: 'academic' as PageType, icon: BookOpen, label: 'Academic' },
  { id: 'academic-progress' as PageType, icon: TrendUp, label: 'Progress' },
  { id: 'timetable' as PageType, icon: FileText, label: 'Timetable' },
  { id: 'analytics' as PageType, icon: Target, label: 'Analytics' },
  { id: 'roadmap' as PageType, icon: Target, label: 'Roadmap' },
  { id: 'tasks' as PageType, icon: CheckSquare, label: 'Tasks' },
  { id: 'finances' as PageType, icon: CurrencyDollar, label: 'Finances' },
  { id: 'settings' as PageType, icon: GearSix, label: 'Settings' },
];

  const bottomNavItems = navigation.slice(0, 5);
  const activeBottomIndexRaw = bottomNavItems.findIndex(item => item.id === store.currentPage);
  const activeBottomIndex = activeBottomIndexRaw === -1 ? 0 : activeBottomIndexRaw;

  const renderPage = () => {
    switch (store.currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'academic': return <AcademicPage />;
      case 'academic-progress': return <AcademicProgressPage />;
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
      default: return <DashboardPage />;
    }
  };

  // Calculate on each render (simpler, no hook issues)
  const cwa = calculateCWA(db.modules || []);
  const term2024 = calculateTermAverage(db.modules || [], '2024');
  const term2025 = calculateTermAverage(db.modules || [], '2025');

  const getThisWeekTasks = (moduleCode: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    nextWeek.setHours(23, 59, 59, 999);
    
    return (db.tasks || []).filter(task => 
      task.moduleCode === moduleCode &&
      task.dueDate &&
      new Date(task.dueDate) >= today &&
      new Date(task.dueDate) <= nextWeek &&
      !task.completed
    );
  };

const ModuleForm = () => {
  const [formState, setFormState] = useState<Partial<Module>>(store.editingModule || {
    code: '', name: '', semester: '2025', credits: 16, currentGrade: 0, targetGrade: 60, progress: 0, assessments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const moduleToSave: Module = {
        ...formState,
        credits: formState.credits ?? 16,
        currentGrade: formState.currentGrade ?? 0,
        targetGrade: formState.targetGrade ?? 60,
        progress: formState.progress ?? 0,
        id: store.editingModule?.id || Date.now().toString(),
        assessments: store.editingModule?.assessments || [],
        coverImage: store.editingModule?.coverImage || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        created_at: store.editingModule?.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Module;
      
      const success = await db.saveModule(moduleToSave);
      
      if (success) {
        store.setShowModal(null);
        store.setEditingModule(null);
      } else {
        alert('Failed to save module. Please try again.');
      }
    } catch (error) {
      console.error('Error saving module:', error);
      alert('Error saving module. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input 
          label="Module Code" 
          value={formState.code || ''} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormState({...formState, code: e.target.value})} 
          placeholder="PHY114" 
          required
          data-testid="module-code-input"
        />
        <Input 
          label="Module Name" 
          value={formState.name || ''} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormState({...formState, name: e.target.value})} 
          placeholder="Physics 114" 
          required
          data-testid="module-name-input"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input 
          label="Credits" 
          type="text" 
          inputMode="numeric"
          value={formState.credits === undefined || formState.credits === null ? '' : String(formState.credits)} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            if (val === '') {
              setFormState({...formState, credits: undefined as any});
            } else {
              const num = parseInt(val);
              if (!isNaN(num)) {
                setFormState({...formState, credits: num});
              }
            }
          }} 
          placeholder="16" 
          required 
          min="1"
          max="32"
          data-testid="module-credits-input"
        />
        <Input 
          label="Current Grade" 
          type="text" 
          inputMode="numeric"
          value={formState.currentGrade === undefined || formState.currentGrade === null ? '' : String(formState.currentGrade)} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            if (val === '') {
              setFormState({...formState, currentGrade: undefined as any});
            } else {
              const num = parseInt(val);
              if (!isNaN(num)) {
                setFormState({...formState, currentGrade: num});
              }
            }
          }} 
          placeholder="75" 
          min="0"
          max="100"
          data-testid="module-current-grade-input"
        />
        <Input 
          label="Target Grade" 
          type="text" 
          inputMode="numeric"
          value={formState.targetGrade === undefined || formState.targetGrade === null ? '' : String(formState.targetGrade)} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            if (val === '') {
              setFormState({...formState, targetGrade: undefined as any});
            } else {
              const num = parseInt(val);
              if (!isNaN(num)) {
                setFormState({...formState, targetGrade: num});
              }
            }
          }} 
          placeholder="80" 
          min="0"
          max="100"
          data-testid="module-target-grade-input"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select 
          label="Semester" 
          value={formState.semester || '2025'} 
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormState({...formState, semester: e.target.value})}
          options={[
            {value: '2024', label: '2024'},
            {value: '2025', label: '2025'},
            {value: '2026', label: '2026'},
            {value: '2027', label: '2027'},
          ]} 
          required
          data-testid="module-semester-select"
        />
        <Input 
          label="Progress (%)" 
          type="text" 
          inputMode="numeric"
          value={formState.progress === undefined || formState.progress === null ? '' : String(formState.progress)} 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            if (val === '') {
              setFormState({...formState, progress: undefined as any});
            } else {
              const num = parseInt(val);
              if (!isNaN(num)) {
                setFormState({...formState, progress: num});
              }
            }
          }} 
          placeholder="75" 
          min="0"
          max="100"
          data-testid="module-progress-input"
        />
      </div>
      <div className="flex gap-3 justify-end pt-4">
        <Button 
          variant="secondary" 
          onClick={() => {
            store.setShowModal(null);
            store.setEditingModule(null);
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
          data-testid="module-submit-btn"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 border-t border-background animate-spin"></div>
              Saving...
            </span>
          ) : (
            `${store.editingModule ? 'Update' : 'Add'} Module`
          )}
        </Button>
      </div>
    </form>
  );
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

const YearbookUploadForm = () => {
  const db = useDatabase();
  const [file, setFile] = useState<File | null>(null);
  const [startingYear, setStartingYear] = useState<number>(new Date().getFullYear());
  const [extractedModules, setExtractedModules] = useState<Array<ExtractedModule & { semester: string }>>([]);
  const [originalModules, setOriginalModules] = useState<ExtractedModule[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const getCoverImage = (code: string) => {
    const prefix = code.substring(0, 3);
    const coverImages: Record<string, string> = {
      'AIM': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'COS': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      'LST': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'PHY': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'WTW': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'STK': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'WST': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    };
    return coverImages[prefix] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setParseError('Please select a PDF file');
      return;
    }

    setFile(selectedFile);
    setParseError(null);
    setIsParsing(true);

    try {
      const modules = await parseYearbookPDF(selectedFile);
      setOriginalModules(modules);
      const mappedModules = mapModulesToSemesters(modules, startingYear);
      setExtractedModules(mappedModules);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      setParseError('Failed to parse PDF. Please make sure it is a valid University yearbook PDF.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleYearChange = (year: number) => {
    setStartingYear(year);
    if (originalModules.length > 0) {
      // Re-map modules with new starting year
      const mappedModules = mapModulesToSemesters(originalModules, year);
      setExtractedModules(mappedModules);
    }
  };

const handleImport = async (extractedModules: Array<ExtractedModule & { semester: string }>) => {
  setIsImporting(true);
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Refresh modules list before checking duplicates
    await fetchModules();
    
    let successCount = 0;
    let skippedCount = 0;
    for (const mod of extractedModules) {
        // Check if module already exists (by code and semester)
        const alreadyExists = db.modules.some(
          m => m.code === mod.code && m.semester === mod.semester
        );

        if (alreadyExists) {
          skippedCount++;
          console.warn(`Skipped duplicate module: ${mod.code} (${mod.semester})`);
          continue;
        }

        // Create new module with proper UUID
        const module: Module = {
        id: crypto.randomUUID(),
        code: mod.code,
        name: mod.name,
        semester: mod.semester,
        credits: mod.credits,
        currentGrade: 0,
        targetGrade: 60,
        progress: 0,
        assessments: [],
        coverImage: getCoverImage(mod.code),
        userId: user.id,  // Add the user ID here
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const success = await db.saveModule(module);
      if (success) successCount++;
    }
    console.log(`Import complete: ${successCount} imported, ${skippedCount} skipped`);
    setIsYearbookImportOpen(false);
    // Refresh modules after import
    await fetchModules();
  } catch (error) {
    console.error('Failed to import modules:', error);
    alert('Failed to import modules. Please try again.');
  } finally {
    setIsImporting(false);
  }
};

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-text-secondary mb-2">
          Upload Yearbook PDF <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="yearbook-upload"
            disabled={isParsing || isImporting}
          />
          <label
            htmlFor="yearbook-upload"
            className={`flex items-center justify-center gap-2 px-4 py-3 border border-dashed cursor-pointer transition-all duration-300 ${
              isParsing || isImporting
                ? 'border-border bg-background cursor-not-allowed'
                : 'border-border bg-background hover:border-text-primary hover:bg-surface'
            }`}
          >
            {isParsing ? (
              <>
                <div className="h-4 w-4 border-t border-text-primary animate-spin"></div>
                <span className="text-xs uppercase tracking-wider text-text-tertiary">Parsing PDF...</span>
              </>
            ) : file ? (
              <>
                <FileText size={16} className="text-text-primary" />
                <span className="text-sm text-text-primary font-mono">{file.name}</span>
              </>
            ) : (
              <>
                <UploadSimple size={16} className="text-text-tertiary" />
                <span className="text-xs uppercase tracking-wider text-text-tertiary">Click to upload yearbook PDF</span>
              </>
            )}
          </label>
        </div>
        {parseError && (
          <p className="mt-2 text-xs text-danger">{parseError}</p>
        )}
      </div>

      {extractedModules.length > 0 && (
        <>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-text-secondary mb-2">
              Starting Year
            </label>
            <Input
              label=""
              type="text"
              inputMode="numeric"
              value={startingYear.toString()}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const year = parseInt(e.target.value);
                if (!isNaN(year) && year >= 2020 && year <= 2030) {
                  handleYearChange(year);
                }
              }}
              placeholder="2025"
            />
            <p className="mt-1 text-xs text-text-tertiary">
              Year 1 modules will be assigned to {startingYear}, Year 2 to {startingYear + 1}, Year 3 to {startingYear + 2}
            </p>
          </div>

          <div className="bg-background border-t border-border p-4 max-h-96 overflow-y-auto">
            <div className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-3">
              Found {extractedModules.length} modules:
            </div>
            <div className="space-y-0">
              {extractedModules.map((mod, idx) => {
                const alreadyExists = db.modules.some(
                  m => m.code === mod.code && m.semester === mod.semester
                );
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between py-2 px-3 border-b border-border transition-colors hover:bg-surface ${
                      alreadyExists ? 'bg-warning/5 border-l-2 border-l-warning' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xs font-mono px-2 py-0.5 bg-surface text-text-tertiary shrink-0">
                        {mod.semester}
                      </span>
                      <span className="text-sm text-text-primary font-medium shrink-0">{mod.code}</span>
                      <span className="text-xs text-text-tertiary truncate">{mod.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono text-text-tertiary">{mod.credits} cr</span>
                      {alreadyExists && (
                        <span className="text-xs text-warning uppercase tracking-wider">Exists</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3 justify-end pt-4">
        <Button
          variant="secondary"
          onClick={() => {
            store.setShowModal(null);
            setFile(null);
            setExtractedModules([]);
            setParseError(null);
          }}
          type="button"
          disabled={isImporting}
        >
          Cancel
        </Button>
        <Button
          onClick={() => handleImport(extractedModules)}
          disabled={extractedModules.length === 0 || isImporting}
          className="min-w-[120px]"
        >
          {isImporting ? (
            <span className="flex items-center justify-center">
              <div className="h-4 w-4 border-t border-text-primary animate-spin mr-2"></div>
              Importing...
            </span>
          ) : (
            `Import ${extractedModules.length} Modules`
          )}
        </Button>
      </div>
    </div>
  );
};

  const AcademicProgressPage = () => {
    const currentYear = new Date().getFullYear().toString();
    const currentYearModules = (db.modules || []).filter((m: Module) => m.semester === currentYear);
    const currentYearAverage = calculateTermAverage(db.modules || [], currentYear);
    const years = [...new Set((db.modules || []).map((m: Module) => m.semester))].sort() as string[];
    const cwa = calculateCWA(db.modules || []);

  return (
    <div className="space-y-6 page-enter">
      <h1 className="text-display-sm font-semibold text-text-primary pt-2 tracking-tight">Academic Progress</h1>

    <div className="grid grid-cols-1 gap-[1px] bg-border">
      <div className="bg-surface border-t-2 border-text-primary p-6">
        <div className="text-center mb-8">
          <div className="text-xs uppercase tracking-wider text-text-tertiary mb-2">Cumulative Weighted Average</div>
          <div className="text-6xl font-mono font-bold text-text-primary mb-2">{cwa}%</div>
          <div className="text-xs text-text-tertiary font-mono">
            Based on {db.modules.reduce((sum: number, m: Module) => sum + m.credits, 0)} total credits
          </div>
        </div>

        <div className="space-y-6">
          {years.map((year: string) => {
            const yearModules = db.modules.filter((m: Module) => m.semester === year);
            const yearAverage = calculateTermAverage(db.modules, year);
            const yearCredits = yearModules.reduce((sum: number, m: Module) => sum + m.credits, 0);

            return (
              <div key={year} className="space-y-0">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="text-sm uppercase tracking-wider text-text-secondary">Term {year}</h3>
                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-text-primary">{yearAverage}%</div>
                    <div className="text-xs font-mono text-text-tertiary">{yearCredits} credits</div>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {yearModules.map((module: Module) => (
                    <div 
                      key={module.id} 
                      className="flex items-center justify-between py-3 px-2 hover:bg-surface/50 transition-colors data-row"
                    >
                      <div className="flex-1">
                        <div className="text-sm text-text-primary font-medium font-mono">{module.code}</div>
                        <div className="text-xs text-text-tertiary">{module.credits} credits</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-mono font-semibold text-text-primary">{module.currentGrade}%</div>
                        </div>
                        <div className="w-16 text-right">
                          <div className="text-sm font-mono text-text-secondary">
                            {(module.currentGrade * module.credits).toFixed(0)}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-text-tertiary">weighted</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 border-t border-border">
          <div className="text-xs uppercase tracking-wider text-text-tertiary mb-2">Formula</div>
          <div className="text-xs font-mono text-text-secondary">
            CWA = Σ(credits × grade) / Σ(total credits)
          </div>
        </div>
      </div>

      <div className="bg-surface border-t-2 border-success p-6">
        <div className="text-center mb-8">
          <div className="text-xs uppercase tracking-wider text-text-tertiary mb-2">Current Year Average</div>
          <div className="text-6xl font-mono font-bold text-success mb-2">{currentYearAverage}%</div>
          <div className="text-xs text-text-tertiary font-mono">
            Term {currentYear} · {currentYearModules.reduce((sum: number, m: Module) => sum + m.credits, 0)} credits
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-wider text-text-secondary mb-4">Module Performance</h3>
          
          {currentYearModules.map((module: Module) => {
            const targetDiff = module.currentGrade - module.targetGrade;
            const progressToTarget = Math.min((module.currentGrade / module.targetGrade) * 100, 100);

            return (
              <div 
                key={module.id} 
                className="p-4 bg-background hover:bg-surface/50 transition-all duration-300 border-t border-border hover:border-text-primary"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-text-primary font-mono">{module.code}</div>
                    <div className="text-xs text-text-tertiary line-clamp-1">{module.name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProgressRing percentage={module.currentGrade ?? 0} size={45} strokeWidth={4} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-[1px] bg-border mb-3">
                  <div className="text-center p-2 bg-surface">
                    <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Current</div>
                    <div className="text-sm font-mono font-semibold text-text-primary">{module.currentGrade}%</div>
                  </div>
                  <div className="text-center p-2 bg-surface">
                    <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Target</div>
                    <div className="text-sm font-mono font-semibold text-text-primary">{module.targetGrade}%</div>
                  </div>
                  <div className="text-center p-2 bg-surface">
                    <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Diff</div>
                    <div className={`text-sm font-mono font-semibold ${
                      targetDiff >= 0 ? 'text-success' : 'text-danger'
                    }`}>
                      {targetDiff >= 0 ? '+' : ''}{targetDiff}%
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] uppercase tracking-wider text-text-tertiary mb-1">
                    <span>Progress to target</span>
                    <span className="font-mono">{Math.round(progressToTarget)}%</span>
                  </div>
                  <ProgressBar 
                    percentage={progressToTarget}
                    color={targetDiff >= 0 ? '#34C759' : '#FF9F0A'}
                    height={6}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Modules Above Target</div>
              <div className="text-2xl font-mono font-bold text-success">
                {currentYearModules.filter(m => m.currentGrade >= m.targetGrade).length}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Average Progress</div>
              <div className="text-2xl font-mono font-bold text-success">
                {Math.round(currentYearModules.reduce((sum, m) => sum + m.progress, 0) / currentYearModules.length)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

const AcademicPage = () => {
    return (
      <AcademicDashboard 
        modules={modules}
        onImportYearbook={() => setIsYearbookImportOpen(true)}
      />
    );
  };

  return (
  <div className="min-h-screen bg-background text-text-primary font-sans safe-area-top">
    {/* Desktop Sidebar */}
    {!isMobile && (
      <div 
        className={`fixed left-0 top-0 h-full bg-surface border-r border-border transition-all duration-300 ease-swiss z-50 ${
          store.sidebarExpanded ? 'w-60' : 'w-16'
        }`}
      >
        <div className="p-4 border-b border-border">
          <div className="text-title-sm font-semibold text-text-primary tracking-tight">{store.sidebarExpanded ? 'UniLife' : 'UL'}</div>
        </div>
        <nav className="p-2 flex-1 overflow-y-auto">
          {navigation.map(item => {
            const Icon = item.icon;
            const isActive = store.currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => store.setCurrentPage(item.id)}
                data-testid={`nav-${item.id}`}
                className={`w-full flex items-center gap-3 px-3 py-3 mb-0.5 transition-all duration-200 ease-swiss nav-indicator ${
                  isActive 
                    ? 'active text-text-primary bg-surface-hover border-l-2 border-text-primary' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {store.sidebarExpanded && <span className="text-body-sm font-medium truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <button
            onClick={() => store.setSidebarExpanded(!store.sidebarExpanded)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-200"
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
        className="fixed top-4 left-4 z-50 p-3 bg-surface border border-border hover:border-text-tertiary transition-colors duration-200"
      >
        <List size={20} className="text-text-primary" />
      </button>
    )}

    {/* Mobile Bottom Navigation */}
    {isMobile && (
      <>
        <div className="pb-20 safe-area-bottom">
          <div className="p-3 scroll-container page-enter">
            {renderPage()}
          </div>
        </div>

        {/* Bottom Tab Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border bottom-nav-safe-area z-50">
          <div className="max-w-mobile mx-auto">
            <div className="relative grid grid-cols-5 gap-0 p-1 safe-area-bottom">
              {/* Active indicator — minimal underline */}
              <div
                className="absolute bottom-1 left-1 w-[calc(20%-4px)] flex justify-center transition-transform duration-300 ease-swiss pointer-events-none"
                style={{ transform: `translateX(${activeBottomIndex * 100}%)` }}
              >
                <div className="w-4 h-[2px] bg-text-primary" />
              </div>
              {bottomNavItems.map(item => {
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
                    className={`relative z-10 flex flex-col items-center justify-center py-2 px-2 transition-all duration-200 ease-swiss no-select haptic-feedback ${
                      isActive 
                        ? 'text-text-primary' 
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                  >
                    <Icon size={20} className="mb-0.5" />
                    <span className="text-overline leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* More Options */}
            <div className="flex justify-center pb-1">
              <button
                onClick={() => {
                  store.setCurrentPage('settings');
                  if (iPhoneInteractions.supportsHaptic()) {
                    iPhoneInteractions.haptic('medium');
                  }
                }}
                onTouchStart={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  iPhoneInteractions.touchFeedback(target, 'light');
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-text-tertiary hover:text-text-primary transition-all duration-200 no-select haptic-feedback"
              >
                <GearSix size={16} />
                <span className="text-label uppercase tracking-[0.08em]">More</span>
              </button>
            </div>
          </div>
        </div>
      </>
    )}

    {/* Desktop Content Area */}
    {!isMobile && (
      <div className={`transition-all duration-300 ease-swiss ${store.sidebarExpanded ? 'ml-60' : 'ml-16'}`}>
        <div className="max-w-wide mx-auto p-6 desktop:p-12 page-enter">{renderPage()}</div>
      </div>
    )}

    <Modal 
      isOpen={store.showModal === 'module'} 
      onClose={() => { 
        store.setShowModal(null); 
        store.setEditingModule(null); 
      }}
      title={store.editingModule ? 'Edit Module' : 'Add New Module'}
    >
      <ModuleForm />
    </Modal>

    <Modal 
      isOpen={store.showModal === 'task'} 
      onClose={() => { 
        store.setShowModal(null); 
        store.setEditingTask(null); 
      }}
      title={store.editingTask ? 'Edit Task' : 'Add New Task'}
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
    >
      <TransactionForm />
    </Modal>

    <Modal 
      isOpen={store.showModal === 'yearbook'} 
      onClose={() => { 
        store.setShowModal(null); 
      }}
      title="Upload Yearbook PDF"
    >
      <YearbookUploadForm />
    </Modal>

    {/* Module Modal */}
    <Modal
      isOpen={isModuleModalOpen}
      onClose={() => setIsModuleModalOpen(false)}
      title="Add New Module"
    >
      <AcademicModuleForm 
        onSubmit={handleAddModule}
        onCancel={() => setIsModuleModalOpen(false)}
        isSubmitting={false}
      />
    </Modal>

    {/* Yearbook Import Modal */}
    <YearbookImport
      isOpen={isYearbookImportOpen}
      onClose={() => setIsYearbookImportOpen(false)}
      onImport={handleYearbookImport}
    />
  </div>
);
};
export default UniLife;

