'use client';

import { useState } from 'react';
import {
  Calendar,
  BookOpen,
  CheckSquare,
  CurrencyDollar,
  CaretLeft,
  CaretRight,
  Plus,
  DownloadSimple,
} from 'phosphor-react';
import { calculateCWA } from '@/lib/utils/calculations';
import { getNextSession } from '@/lib/timetableData';
import { getAcademicEventDotClass, getUpAcademicEventsForDate2026 } from '@/lib/academicCalendar2026';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Module, Task, Transaction, PageType } from '@/lib/types';

const MAX_VISIBLE_TASKS = 5;

type DashboardPageProps = {
  modules: Module[];
  tasks: Task[];
  transactions: Transaction[];
  isLoading: boolean;
  modulesLoading: boolean;
  onOpenTaskModal: () => void;
  onNavigate: (page: PageType) => void;
};

export const DashboardPage = ({
  modules,
  tasks,
  transactions,
  isLoading,
  modulesLoading,
  onOpenTaskModal,
  onNavigate,
}: DashboardPageProps) => {
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);

  type CalendarDotEvent = {
    id: string;
    title: string;
    dotClassName: string;
  };

  const toDateKey = (date: Date) => {
    const yearValue = date.getFullYear();
    const monthValue = String(date.getMonth() + 1).padStart(2, '0');
    const dayValue = String(date.getDate()).padStart(2, '0');
    return `${yearValue}-${monthValue}-${dayValue}`;
  };

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
    const dateStr = toDateKey(date);
    const taskEvents: CalendarDotEvent[] = (tasks || [])
      .filter(task => task.dueDate === dateStr)
      .map(task => ({
        id: `task-${task.id}`,
        title: task.title,
        dotClassName:
          task.priority === 'high'
            ? 'bg-danger'
            : task.priority === 'medium'
              ? 'bg-warning'
              : 'bg-success',
      }));

    const academicEvents: CalendarDotEvent[] = getUpAcademicEventsForDate2026(date).map(event => ({
      id: event.id,
      title: event.title,
      dotClassName: getAcademicEventDotClass(event.category),
    }));

    return [...taskEvents, ...academicEvents];
  };

  const getSelectedDateDetails = (date: Date) => {
    const dateKey = toDateKey(date);
    const selectedTasks = (tasks || [])
      .filter(task => task.dueDate === dateKey)
      .sort((a, b) => {
        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const aPriority = priorityOrder[a.priority] ?? 3;
        const bPriority = priorityOrder[b.priority] ?? 3;
        return aPriority - bPriority;
      });

    const selectedAcademicEvents = getUpAcademicEventsForDate2026(date);

    return {
      selectedTasks,
      selectedAcademicEvents,
    };
  };

  const getAcademicCategoryLabel = (category: string) => {
    switch (category) {
      case 'public-holiday':
        return 'Public Holiday';
      case 'orientation':
        return 'Orientation';
      case 'registration':
        return 'Registration';
      case 'lecture-period':
        return 'Lecture Period';
      case 'test-week':
        return 'Test Week';
      case 'recess':
        return 'Recess';
      case 'exam':
        return 'Examination';
      case 'supplementary-exam':
        return 'Supplementary';
      case 'cooling-off':
        return 'Cooling-Off';
      case 'deadline':
        return 'Deadline';
      case 'event':
        return 'Campus Event';
      case 'timetable-override':
        return 'Timetable Override';
      default:
        return 'Academic';
    }
  };

  const getAcademicCategoryBadge = (category: string) => {
    switch (category) {
      case 'public-holiday':
      case 'exam':
      case 'supplementary-exam':
        return 'bg-danger/15 text-danger border-danger/40';
      case 'test-week':
      case 'deadline':
      case 'registration':
        return 'bg-warning/15 text-warning border-warning/40';
      case 'recess':
      case 'cooling-off':
        return 'bg-info/15 text-info border-info/40';
      case 'orientation':
      case 'event':
        return 'bg-success/15 text-success border-success/40';
      default:
        return 'bg-surface-hover text-text-secondary border-border/80';
    }
  };

  const exportData = () => {
    const data = {
      modules,
      tasks,
      transactions,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unilife-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentCalendarDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  const isSelectedToday = toDateKey(selectedDate) === toDateKey(today);
  const { selectedTasks, selectedAcademicEvents } = getSelectedDateDetails(selectedDate);
  const selectedOpenTasks = selectedTasks.filter(task => !task.completed);
  const selectedCompletedTasks = selectedTasks.filter(task => task.completed);

  const getTasksThisWeek = () => {
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    const dayOfWeek = startOfWeek.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return (tasks || []).filter(task => {
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
  const todayTasks = (tasks || []).filter(task => task.dueDate === todayKey && !task.completed).slice(0, 3);
  const streakDays = (() => {
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(todayLocal);
      checkDate.setDate(checkDate.getDate() - i);
      const checkKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      const hasCompleted = (tasks || []).some(t => t.completed && t.dueDate === checkKey);
      if (hasCompleted) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  })();

  const currentMonthTransactions = (transactions || []).filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });
  const monthIncome = currentMonthTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const monthExpenses = currentMonthTransactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const monthBalance = monthIncome - monthExpenses;

  const cwaVal = modules.length > 0 ? calculateCWA(modules) : 0;
  const cwa = typeof cwaVal === 'string' ? parseFloat(cwaVal) || 0 : cwaVal;
  const totalTasks = (tasks || []).length;
  const completedTasks = (tasks || []).filter(t => t.completed).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const overdueTasks = (tasks || []).filter(task => {
    if (task.completed || !task.dueDate) return false;
    return new Date(task.dueDate + 'T00:00:00') < todayLocal;
  });

  if (isLoading || modulesLoading) {
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
          <p className="text-overline uppercase tracking-[0.1em] text-text-muted mb-0.5">
            {(() => { const h = today.getHours(); return h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night'; })()}
          </p>
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
              onOpenTaskModal();
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
            const isSelected = toDateKey(date) === toDateKey(selectedDate);
            return (
              <div
                key={day}
                onClick={() => {
                  setSelectedDate(date);
                  setIsDayDetailOpen(true);
                }}
                className={`aspect-square border border-border p-1 hover:bg-surface-hover transition-all duration-200 cursor-pointer ${
                  isToday ? 'bg-surface-active border-text-primary' : ''
                } ${
                  isSelected ? 'ring-1 ring-text-primary/60' : ''
                }`}
              >
                <div className={`text-caption font-mono mb-0.5 ${isToday ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                  {day}
                </div>
                <div className="flex gap-0.5 flex-wrap">
                  {events.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`w-1 h-1 rounded-full ${event.dotClassName}`}
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

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Tasks / Events
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            Test / Deadlines
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-danger" />
            Holidays / Exams
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-info" />
            Recess / Cooling-Off
          </span>
        </div>
      </div>

      <Modal
        isOpen={isDayDetailOpen}
        onClose={() => setIsDayDetailOpen(false)}
        chapterLabel={isSelectedToday ? '(kyou) Today' : '(hi) Day Focus'}
        title={selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 desktop:grid-cols-4 gap-[1px] bg-border">
            <div className="bg-surface px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">Open Tasks</p>
              <p className="text-title-sm font-mono text-text-primary">{selectedOpenTasks.length}</p>
            </div>
            <div className="bg-surface px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">Completed</p>
              <p className="text-title-sm font-mono text-success">{selectedCompletedTasks.length}</p>
            </div>
            <div className="bg-surface px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">Academic</p>
              <p className="text-title-sm font-mono text-text-primary">{selectedAcademicEvents.length}</p>
            </div>
            <div className="bg-surface px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.08em] text-text-tertiary">Total Items</p>
              <p className="text-title-sm font-mono text-text-primary">{selectedTasks.length + selectedAcademicEvents.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 desktop:grid-cols-2 gap-4">
            <div className="border border-border/70 bg-background/70 p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-label uppercase tracking-[0.08em] text-text-secondary">Tasks</h4>
                <button
                  onClick={() => {
                    setIsDayDetailOpen(false);
                    onOpenTaskModal();
                  }}
                  className="text-caption uppercase tracking-[0.08em] text-text-secondary hover:text-text-primary transition-colors"
                >
                  Add
                </button>
              </div>

              {selectedTasks.length === 0 ? (
                <p className="text-caption text-text-tertiary py-3">No tasks tied to this date.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedTasks.map(task => (
                    <div key={task.id} className="border border-border/70 bg-surface px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`text-body-sm truncate ${task.completed ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
                            {task.title}
                          </p>
                          <p className="text-caption text-text-muted mt-0.5">{task.moduleCode || 'General'}</p>
                        </div>
                        <span className={`text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 border ${
                          task.priority === 'high'
                            ? 'border-danger/40 text-danger bg-danger/10'
                            : task.priority === 'medium'
                              ? 'border-warning/40 text-warning bg-warning/10'
                              : 'border-success/40 text-success bg-success/10'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-border/70 bg-background/70 p-3">
              <h4 className="text-label uppercase tracking-[0.08em] text-text-secondary mb-2">Academic Calendar</h4>

              {selectedAcademicEvents.length === 0 ? (
                <p className="text-caption text-text-tertiary py-3">No tests, holidays, deadlines, or UP events on this date.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedAcademicEvents.map(event => (
                    <div key={event.id} className="border border-border/70 bg-surface px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-body-sm text-text-primary">{event.title}</p>
                        <span className={`shrink-0 text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 border ${getAcademicCategoryBadge(event.category)}`}>
                          {getAcademicCategoryLabel(event.category)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setIsDayDetailOpen(false);
                onNavigate('tasks');
              }}
              className="rounded-sm border border-border/80 bg-surface px-3 py-1.5 text-caption uppercase tracking-[0.08em] text-text-primary hover:border-border-hover transition-colors"
            >
              Open Tasks Board
            </button>
            <button
              onClick={() => {
                setIsDayDetailOpen(false);
                onNavigate('timetable');
              }}
              className="rounded-sm border border-border/80 bg-surface px-3 py-1.5 text-caption uppercase tracking-[0.08em] text-text-primary hover:border-border-hover transition-colors"
            >
              Open Timetable
            </button>
          </div>
        </div>
      </Modal>

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
            thisWeekTasks.slice(0, MAX_VISIBLE_TASKS).map(task => (
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
        {thisWeekTasks.length > MAX_VISIBLE_TASKS && (
          <button
            onClick={() => onNavigate('tasks')}
            className="w-full mt-2 py-2 text-caption uppercase tracking-[0.08em] text-text-secondary hover:text-text-primary transition-colors duration-200 btn-underline"
          >
            View all tasks
          </button>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-[1px] bg-border mx-2 mb-4">
        <button
          onClick={() => onNavigate('academic')}
          className="bg-surface p-3 text-center hover:bg-surface-hover transition-colors duration-200"
        >
          <BookOpen size={16} className="mx-auto text-text-secondary mb-1" />
          <span className="text-[10px] uppercase tracking-[0.1em] text-text-secondary">Academic</span>
          <div className="text-caption font-mono text-text-primary mt-0.5">{activeModules.length} active</div>
        </button>
        <button
          onClick={() => onNavigate('finances')}
          className="bg-surface p-3 text-center hover:bg-surface-hover transition-colors duration-200"
        >
          <CurrencyDollar size={16} className="mx-auto text-text-secondary mb-1" />
          <span className="text-[10px] uppercase tracking-[0.1em] text-text-secondary">Finances</span>
          <div className="text-caption font-mono text-text-primary mt-0.5">
            R{monthExpenses.toFixed(0)} spent
          </div>
        </button>
        <button
          onClick={() => onNavigate('timetable')}
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
