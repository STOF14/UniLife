import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircle, Circle } from 'phosphor-react';
import { Task, Module } from '@/lib/types';
import { Button } from '@/components/ui/Button';

type TasksPageProps = {
  tasks: Task[];
  modules: Module[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onSaveTask: (task: Task) => Promise<boolean>;
};

// --- Type definition for PriorityOption to fix implicit 'any' ---
type PriorityValue = 'low' | 'medium' | 'high';
type PriorityOption = { 
    value: PriorityValue; 
    label: string; 
    indicator: string; 
    color: string 
};

// Helper component to render a single task item (extracted for reuse)
const TaskItem = ({ 
    task, 
    moduleColor, 
    priority, 
    editingTaskId, 
    setEditingTaskId, 
    modules, 
    updateTaskModule, 
    updateTaskPriority, 
    updateTaskDueDate,
    onToggleComplete, 
    onDeleteTask, 
    priorities // <--- ADDED PROP
}: {
    task: Task;
    moduleColor: { value: string; class: string } | undefined;
    priority: PriorityOption | undefined;
    editingTaskId: string | null;
    setEditingTaskId: (id: string | null) => void;
    modules: Module[];
    updateTaskModule: (taskId: string, newModuleCode: string) => Promise<void>;
    updateTaskPriority: (taskId: string, newPriority: PriorityValue) => Promise<void>;
    updateTaskDueDate: (taskId: string, newDueDate: string) => Promise<void>;
    onToggleComplete: (id: string) => void;
    onDeleteTask: (id: string) => void;
    priorities: PriorityOption[]; // <--- TYPED PROP
}) => {
    return (
        <div
            key={task.id}
            className={`bg-surface border-t border-border p-4 transition-all duration-300 ease-contemplative hover:border-t-border-hover ${
                task.completed ? 'opacity-40' : ''
            }`}
        >
            <div className="flex items-start gap-3">
                <button
                    onClick={() => onToggleComplete(task.id)}
                    className="mt-0.5 text-text-tertiary hover:text-text-primary transition-colors"
                >
                    {task.completed ? (
                        <CheckCircle size={18} className="text-success" />
                    ) : (
                        <Circle size={18} className="text-text-tertiary" />
                    )}
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {editingTaskId === task.id ? (
                            <select
                                value={task.moduleCode}
                                onChange={(e) => updateTaskModule(task.id, e.target.value)}
                                className="px-2 py-0.5 border-b border-border bg-transparent text-text-primary text-xs font-mono focus:outline-none focus:border-text-primary"
                            >
                                {modules.map((mod: Module) => (
                                    <option key={mod.id} value={mod.code} className="bg-surface">{mod.code}</option>
                                ))}
                            </select>
                        ) : (
                            <span 
                                onClick={() => setEditingTaskId(task.id)}
                                className={`px-2 py-0.5 text-xs font-mono cursor-pointer hover:opacity-80 ${moduleColor?.class}`}
                            >
                                {task.moduleCode}
                            </span>
                        )}
                        
                        <select
                            value={task.priority}
                            onChange={(e) => updateTaskPriority(task.id, e.target.value as PriorityValue)}
                            className={`px-2 py-0.5 text-xs font-medium focus:outline-none cursor-pointer ${priority?.color}`}
                        >
                            {priorities.map(p => (
                                <option key={p.value} value={p.value} className="bg-surface">
                                    {p.indicator} {p.label}
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center gap-1">
                            {(['low', 'medium', 'high'] as PriorityValue[]).map(level => (
                                <button
                                    key={level}
                                    onClick={() => updateTaskPriority(task.id, level)}
                                    className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                                        task.priority === level
                                            ? 'border-text-primary text-text-primary'
                                            : 'border-border text-text-tertiary hover:text-text-primary'
                                    }`}
                                >
                                    {level === 'low' ? 'L' : level === 'medium' ? 'M' : 'H'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className={`text-text-primary text-sm break-words ${task.completed ? 'line-through' : ''}`}>
                        {task.title}
                    </p>
                    {task.dueDate && (
                        <div className="flex items-center gap-1 mt-2 text-text-tertiary text-xs font-mono">
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    )}
                    <div className="mt-2">
                        <input
                            type="date"
                            value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                            onChange={(e) => updateTaskDueDate(task.id, e.target.value)}
                            className="px-2 py-1 border-b border-border bg-transparent text-text-primary text-xs font-mono focus:outline-none focus:border-text-primary"
                        />
                    </div>
                </div>
                <button
                    onClick={() => onDeleteTask(task.id)}
                    className="text-text-tertiary hover:text-danger transition-colors text-sm"
                >
                    ×
                </button>
            </div>
        </div>
    );
};


export const TasksPage = ({ 
  tasks, 
  modules,
  onAddTask, 
  onEditTask, 
  onDeleteTask, 
  onToggleComplete,
  onSaveTask
}: TasksPageProps) => {
    const [activeTab, setActiveTab] = useState<'tasks' | 'modules'>('tasks');
    const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>(() => {
        if (typeof window === 'undefined') return 'all';
        return localStorage.getItem('tasks_module_filter') || 'all';
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'created'>(() => {
        if (typeof window === 'undefined') return 'priority';
        return (localStorage.getItem('tasks_sort_by') as 'priority' | 'dueDate' | 'created') || 'priority';
    });
    const [taskView, setTaskView] = useState<'today' | 'week'>(() => {
        if (typeof window === 'undefined') return 'week';
        return (localStorage.getItem('tasks_view') as 'today' | 'week') || 'week';
    });
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  const TASKS_PER_PAGE = 20;
    const currentYear = new Date().getFullYear();

    const isPastYearModule = (module: Module) => {
        const match = module.semester?.match(/\b20\d{2}\b/);
        if (!match) return false;
        return parseInt(match[0], 10) < currentYear;
    };

    const activeModules = modules.filter(
        (m) => !(m.completed || m.currentGrade >= 100) && !isPastYearModule(m)
    );
    const activeModuleCodes = new Set(activeModules.map((m) => m.code));
    const completedModulesCount = modules.filter(
        (m) => (m.completed || m.currentGrade >= 100) || isPastYearModule(m)
    ).length;

  const colorOptions = [
    { value: 'blue', class: 'border-text-primary/30 text-text-secondary bg-text-primary/10' },
    { value: 'green', class: 'border-success/30 text-success bg-success/10' },
    { value: 'purple', class: 'border-text-secondary/30 text-text-secondary bg-text-secondary/10' },
    { value: 'pink', class: 'border-pink-500/30 text-pink-400 bg-pink-500/10' },
    { value: 'orange', class: 'border-warning/30 text-warning bg-warning/10' },
    { value: 'red', class: 'border-danger/30 text-danger bg-danger/10' },
    { value: 'yellow', class: 'border-yellow-500/30 text-yellow-400 bg-warning/10' },
    { value: 'indigo', class: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10' },
    { value: 'teal', class: 'border-teal-500/30 text-teal-400 bg-teal-500/10' },
    { value: 'gray', class: 'border-gray-500/30 text-gray-400 bg-surface0/10' }
  ];

  const priorities: PriorityOption[] = [ // <--- EXPLICITLY TYPED
    { value: 'low', label: 'Low', indicator: '○', color: 'text-gray-400 bg-surface0/10 border-gray-500/30' },
    { value: 'medium', label: 'Medium', indicator: '◐', color: 'text-yellow-400 bg-warning/10 border-yellow-500/30' },
    { value: 'high', label: 'High', indicator: '●', color: 'text-danger bg-danger/10 border-danger/30' }
  ];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedModuleFilter, searchQuery, sortBy, activeTab]);

    useEffect(() => {
        localStorage.setItem('tasks_module_filter', selectedModuleFilter);
        localStorage.setItem('tasks_sort_by', sortBy);
        localStorage.setItem('tasks_view', taskView);
    }, [selectedModuleFilter, sortBy, taskView]);

    // Stats calculation (active modules only)
    const activeTasks = tasks.filter((t) => activeModuleCodes.has(t.moduleCode));
    const stats = useMemo(() => ({
        total: activeTasks.length,
        completed: activeTasks.filter(t => t.completed).length,
        pending: activeTasks.filter(t => !t.completed).length
    }), [activeTasks]);

  // Filtering and sorting
  const sortTasks = (tasksToSort: Task[]) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    switch(sortBy) {
      case 'priority':
        return [...tasksToSort].sort((a, b) => priorityOrder[a.priority as PriorityValue] - priorityOrder[b.priority as PriorityValue]);
      case 'dueDate':
        return [...tasksToSort].sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
      case 'created':
        return [...tasksToSort].sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
      default:
        return tasksToSort;
    }
  };

    const filteredTasks = useMemo(() => {
        let filtered = selectedModuleFilter === 'all'
            ? activeTasks
            : activeTasks.filter(task => task.moduleCode === selectedModuleFilter);

        if (taskView === 'today') {
            const todayKey = new Date().toISOString().split('T')[0];
            filtered = filtered.filter(task => task.dueDate === todayKey);
        } else if (taskView === 'week') {
            const now = new Date();
            const weekEnd = new Date();
            weekEnd.setDate(now.getDate() + 7);
            filtered = filtered.filter(task => {
                const due = new Date(task.dueDate);
                return due >= now && due <= weekEnd;
            });
        }

    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return sortTasks(filtered);
    }, [activeTasks, selectedModuleFilter, searchQuery, sortBy, taskView]);

// --- TASK STATUS BREAKDOWN (FIX FOR TEST 7.1) ---
  const { upcomingTasks, completedTasks } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    const upcoming = filteredTasks
      .filter(task => !task.completed) // Must not be completed
      .filter(task => {
          // Task must have a dueDate AND that date must be today or later
          if (!task.dueDate) return true; // Tasks without due dates are always considered 'upcoming' if not completed
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          // Check if due date is today or in the future (based on assumption from your date validation)
          return dueDate >= today; 
      });
      
    const completed = filteredTasks.filter(task => task.completed);
    
    return {
      upcomingTasks: upcoming,
      completedTasks: completed,
    };
  }, [filteredTasks]); // Recalculate only when filteredTasks changes

// --- PAGINATION TARGETS (FIX FOR TEST 7.1) ---
  // Pagination targets upcomingTasks (the list of incomplete tasks)
  const tasksToPage = upcomingTasks; 
  
  const indexOfLastTask = currentPage * TASKS_PER_PAGE;
  const indexOfFirstTask = indexOfLastTask - TASKS_PER_PAGE;
  const currentTasks = tasksToPage.slice(indexOfFirstTask, indexOfLastTask); 
  const totalPages = Math.ceil(tasksToPage.length / TASKS_PER_PAGE); 
  
  // Module stats
    const getModuleStats = (moduleCode: string) => {
        const moduleTasks = activeTasks.filter(t => t.moduleCode === moduleCode);
    return {
      total: moduleTasks.length,
      completed: moduleTasks.filter(t => t.completed).length
    };
  };

  const updateTaskModule = async (taskId: string, newModuleCode: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await onSaveTask({ ...task, moduleCode: newModuleCode });
      setEditingTaskId(null);
    }
  };

  const updateTaskPriority = async (taskId: string, newPriority: Task['priority']) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await onSaveTask({ ...task, priority: newPriority });
    }
  };

    const updateTaskDueDate = async (taskId: string, newDueDate: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            await onSaveTask({ ...task, dueDate: newDueDate });
        }
    };

    const getModuleColor = (moduleCode: string) => {
        const module = modules.find(m => m.code === moduleCode);
        // Use a simple hash to consistently map module codes to colors
        const colorIndex = moduleCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colorOptions.length;
        return colorOptions[colorIndex];
    };

    const taskTemplates = [
        { title: 'Review lecture notes', priority: 'low' as PriorityValue },
        { title: 'Complete tutorial set', priority: 'medium' as PriorityValue },
        { title: 'Start assignment draft', priority: 'high' as PriorityValue }
    ];

    const createQuickTask = async (title: string, priority: PriorityValue) => {
        const moduleCode = selectedModuleFilter !== 'all'
            ? selectedModuleFilter
            : activeModules[0]?.code;

        if (!moduleCode) return;

        const tempId = `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
        const newTask: Task = {
            id: tempId,
            title,
            moduleCode,
            dueDate: new Date().toISOString().split('T')[0],
            priority,
            status: 'todo',
            completed: false
        };

        await onSaveTask(newTask);
    };

  return (
    <div className="min-h-screen bg-background p-8 page-enter">
      <div className="max-w-4xl mx-auto">
        <div className="pb-6 border-b border-border mb-2">
          <p className="chapter-label mb-2">(yakusoku) Commitments</p>
          <h1 className="chapter-title">Study Tasks</h1>
          <p className="chapter-subtitle">Keep track of your learning</p>
        </div>

        {/* Tab Navigation */}

        {completedModulesCount > 0 && (
          <div className="mb-6 border-l-2 border-success bg-success/5 p-3">
            <p className="text-xs text-text-secondary">
                            <span className="inline-flex items-center gap-2">
                                <CheckCircle size={14} className="text-success" />
                                {completedModulesCount} completed module{completedModulesCount !== 1 ? 's' : ''} hidden from view
                            </span>
            </p>
          </div>
        )}
        <div className="flex gap-0 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-3 text-xs uppercase tracking-wider font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'border-b-2 border-text-primary text-text-primary'
                : 'text-text-tertiary hover:text-text-primary'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-6 py-3 text-xs uppercase tracking-wider font-medium transition-colors ${
              activeTab === 'modules'
                ? 'border-b-2 border-text-primary text-text-primary'
                : 'text-text-tertiary hover:text-text-primary'
            }`}
          >
            Modules
          </button>
        </div>

        {activeTab === 'tasks' ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-[1px] bg-border mb-8">
              <div className="bg-surface p-4">
                <div className="text-2xl font-mono text-text-primary">{stats.total}</div>
                <div className="text-text-tertiary text-[10px] uppercase tracking-wider mt-1">Total</div>
              </div>
              <div className="bg-surface p-4">
                <div className="text-2xl font-mono text-text-primary">{stats.completed}</div>
                <div className="text-text-tertiary text-[10px] uppercase tracking-wider mt-1">Done</div>
              </div>
              <div className="bg-surface p-4">
                <div className="text-2xl font-mono text-text-primary">{stats.pending}</div>
                <div className="text-text-tertiary text-[10px] uppercase tracking-wider mt-1">Pending</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex gap-0">
                    <button
                        onClick={() => setTaskView('today')}
                        className={`px-4 py-2 text-xs uppercase tracking-wider font-medium transition-colors border ${
                            taskView === 'today'
                                ? 'bg-text-primary text-background border-text-primary'
                                : 'bg-transparent text-text-tertiary hover:text-text-primary border-border'
                        }`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setTaskView('week')}
                        className={`px-4 py-2 text-xs uppercase tracking-wider font-medium transition-colors border border-l-0 ${
                            taskView === 'week'
                                ? 'bg-text-primary text-background border-text-primary'
                                : 'bg-transparent text-text-tertiary hover:text-text-primary border-border'
                        }`}
                    >
                        This Week
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {taskTemplates.map(template => (
                        <button
                            key={template.title}
                            onClick={() => createQuickTask(template.title, template.priority)}
                            className="px-3 py-2 text-xs font-medium border border-border text-text-secondary hover:border-text-primary hover:text-text-primary transition-colors"
                        >
                            + {template.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedModuleFilter('all')}
                  className={`px-4 py-1.5  text-sm font-medium transition-all whitespace-nowrap border ${
                    selectedModuleFilter === 'all'
                      ? 'bg-text-primary text-background border-text-primary'
                      : 'bg-surface text-text-tertiary border-border hover:border-text-primary'
                  }`}
                >
                  All
                </button>
                                {activeModules.map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedModuleFilter(mod.code)}
                    className={`px-4 py-1.5  text-sm font-medium transition-all whitespace-nowrap border ${
                      selectedModuleFilter === mod.code
                        ? 'bg-text-primary text-background border-text-primary'
                        : 'bg-surface text-text-tertiary border-border hover:border-text-primary'
                    }`}
                  >
                    {mod.code}
                  </button>
                                ))}
              </div>
              
              <div className="flex gap-2 ml-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="px-3 py-1.5 border border-border bg-surface text-text-primary text-sm focus:outline-none focus:border-text-primary placeholder-text-tertiary"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 border border-border bg-surface text-text-primary text-sm focus:outline-none focus:border-text-primary"
                >
                  <option value="priority" className="bg-surface">Sort: Priority</option>
                  <option value="dueDate" className="bg-surface">Sort: Due Date</option>
                  <option value="created" className="bg-surface">Sort: Recent</option>
                </select>
              </div>
            </div>

            {/* Add Task Button */}
            <div className="surface-card p-5 mb-6">
              <button
                onClick={onAddTask}
                className="w-full px-0 py-2 border-0 border-b border-border text-text-tertiary text-left text-sm hover:text-text-primary hover:border-text-primary transition-colors"
              >
                Add a new task...
              </button>
            </div>
            
            {/* === UPCOMING TASKS LIST (Paginated) === */}
            <h2 className="text-xl font-medium text-text-primary mb-4">Upcoming Tasks ({tasksToPage.length})</h2>

            <div className="space-y-2">
              {currentTasks.length === 0 ? (
                <div className="text-center py-16 text-text-tertiary">
                  <p className="text-sm">No upcoming tasks found. Time to relax!</p>
                </div>
              ) : (
                currentTasks.map(task => {
                  const moduleColor = getModuleColor(task.moduleCode);
                  const priority = priorities.find(p => p.value === task.priority);
                  
                  return (
                        <TaskItem 
                            key={task.id}
                            task={task}
                            moduleColor={moduleColor}
                            priority={priority}
                            editingTaskId={editingTaskId}
                            setEditingTaskId={setEditingTaskId}
                            modules={activeModules}
                            updateTaskModule={updateTaskModule}
                            updateTaskPriority={updateTaskPriority}
                            updateTaskDueDate={updateTaskDueDate}
                            onToggleComplete={onToggleComplete}
                            onDeleteTask={onDeleteTask}
                            priorities={priorities} // <--- PASSING THE PROP HERE
                        />
                  );
                })
              )}
            </div>

            {/* Pagination Controls (Uses tasksToPage length) */}
            {tasksToPage.length > TASKS_PER_PAGE && (
              <div className="flex justify-center items-center gap-4 mt-6 pb-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm border ${
                    currentPage === 1 
                      ? 'bg-surface text-text-tertiary border-border cursor-not-allowed' 
                      : 'bg-surface text-text-primary border-border hover:bg-surface/50 hover:border-text-primary'
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-text-tertiary">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 text-sm border ${
                    currentPage === totalPages 
                      ? 'bg-surface text-text-tertiary border-border cursor-not-allowed' 
                      : 'bg-surface text-text-primary border-border hover:bg-surface/50 hover:border-text-primary'
                  }`}
                >
                  Next
                </button>
              </div>
            )}

            {/* === COMPLETED TASKS LIST (Non-Paginated) === */}
            {completedTasks.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border">
                    <h2 className="text-xl font-medium text-text-primary mb-4">Completed Tasks ({completedTasks.length})</h2>
                    <div className="space-y-2">
                        {completedTasks.map(task => {
                            const moduleColor = getModuleColor(task.moduleCode);
                            const priority = priorities.find(p => p.value === task.priority);
                            
                            return (
                                <TaskItem 
                                    key={task.id}
                                    task={task}
                                    moduleColor={moduleColor}
                                    priority={priority}
                                    editingTaskId={editingTaskId}
                                    setEditingTaskId={setEditingTaskId}
                                    modules={activeModules}
                                    updateTaskModule={updateTaskModule}
                                    updateTaskPriority={updateTaskPriority}
                                    updateTaskDueDate={updateTaskDueDate}
                                    onToggleComplete={onToggleComplete}
                                    onDeleteTask={onDeleteTask}
                                    priorities={priorities} // <--- PASSING THE PROP HERE
                                />
                            );
                        })}
                    </div>
                </div>
            )}
          </>
        ) : (
          <>
            {/* Modules Tab */}
            <div className="space-y-3">
              <h2 className="text-lg font-medium text-text-primary mb-4">Your Modules</h2>
                {activeModules.length === 0 ? (
                <div className="text-center py-16 text-text-tertiary">
                        <p className="text-sm">No active modules. Completed modules are in Analytics.</p>
                </div>
                            ) : (
                    activeModules.map(mod => {
                  const color = getModuleColor(mod.code);
                  const modStats = getModuleStats(mod.code);
                  
                  return (
                    <div key={mod.id} className="surface-card p-4 flex items-center justify-between group hover:border-border-hover transition-colors duration-300 ease-contemplative">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3  ${color?.class.split(' ')[2] || 'bg-surface0/30'}`}></div>
                        <div>
                          <h3 className="font-medium text-text-primary">{mod.code} - {mod.name}</h3>
                          <p className="text-xs text-text-tertiary">{modStats.completed}/{modStats.total} tasks completed</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
      {/* The Button component from your original file was imported but not used. I've left the import intact. */}
    </div>
  );
};