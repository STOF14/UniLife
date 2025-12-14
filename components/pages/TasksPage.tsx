import React, { useState, useMemo, useEffect } from 'react';
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
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'created'>('priority');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  const TASKS_PER_PAGE = 20;

  const colorOptions = [
    { value: 'blue', class: 'border-blue-500/30 text-blue-400 bg-blue-500/10' },
    { value: 'green', class: 'border-green-500/30 text-green-400 bg-green-500/10' },
    { value: 'purple', class: 'border-purple-500/30 text-purple-400 bg-purple-500/10' },
    { value: 'pink', class: 'border-pink-500/30 text-pink-400 bg-pink-500/10' },
    { value: 'orange', class: 'border-orange-500/30 text-orange-400 bg-orange-500/10' },
    { value: 'red', class: 'border-red-500/30 text-red-400 bg-red-500/10' },
    { value: 'yellow', class: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' },
    { value: 'indigo', class: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10' },
    { value: 'teal', class: 'border-teal-500/30 text-teal-400 bg-teal-500/10' },
    { value: 'gray', class: 'border-gray-500/30 text-gray-400 bg-gray-500/10' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', indicator: '○', color: 'text-gray-400 bg-gray-500/10 border-gray-500/30' },
    { value: 'medium', label: 'Medium', indicator: '◐', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
    { value: 'high', label: 'High', indicator: '●', color: 'text-red-400 bg-red-500/10 border-red-500/30' }
  ];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedModuleFilter, searchQuery, sortBy, activeTab]);

  // Stats calculation
  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length
  }), [tasks]);

  // Filtering and sorting
  const sortTasks = (tasksToSort: Task[]) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    switch(sortBy) {
      case 'priority':
        return [...tasksToSort].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
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
      ? tasks
      : tasks.filter(task => task.moduleCode === selectedModuleFilter);

    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return sortTasks(filtered);
  }, [tasks, selectedModuleFilter, searchQuery, sortBy]);

  // Pagination
  const indexOfLastTask = currentPage * TASKS_PER_PAGE;
  const indexOfFirstTask = indexOfLastTask - TASKS_PER_PAGE;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);

  // Module stats
  const getModuleStats = (moduleCode: string) => {
    const moduleTasks = tasks.filter(t => t.moduleCode === moduleCode);
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

  const getModuleColor = (moduleCode: string) => {
    const module = modules.find(m => m.code === moduleCode);
    // Use a simple hash to consistently map module codes to colors
    const colorIndex = moduleCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colorOptions.length;
    return colorOptions[colorIndex];
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-white mb-1">Study</h1>
          <p className="text-[#EBEBF599] text-sm">Keep track of your learning</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 border-b border-[#38383A]">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'border-b-2 border-[#0A84FF] text-white'
                : 'text-[#EBEBF599] hover:text-white'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'modules'
                ? 'border-b-2 border-[#0A84FF] text-white'
                : 'text-[#EBEBF599] hover:text-white'
            }`}
          >
            Modules
          </button>
        </div>

        {activeTab === 'tasks' ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-[#141414] border border-[#38383A] rounded-lg p-4">
                <div className="text-2xl font-light text-white">{stats.total}</div>
                <div className="text-[#EBEBF599] text-xs mt-1">Total</div>
              </div>
              <div className="bg-[#141414] border border-[#38383A] rounded-lg p-4">
                <div className="text-2xl font-light text-white">{stats.completed}</div>
                <div className="text-[#EBEBF599] text-xs mt-1">Done</div>
              </div>
              <div className="bg-[#141414] border border-[#38383A] rounded-lg p-4">
                <div className="text-2xl font-light text-white">{stats.pending}</div>
                <div className="text-[#EBEBF599] text-xs mt-1">Pending</div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6 flex-wrap">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedModuleFilter('all')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                    selectedModuleFilter === 'all'
                      ? 'bg-[#0A84FF] text-white border-[#0A84FF]'
                      : 'bg-[#141414] text-[#EBEBF599] border-[#38383A] hover:border-[#0A84FF]'
                  }`}
                >
                  All
                </button>
                {modules.map(mod => (
                  <button
                    key={mod.id}
                    onClick={() => setSelectedModuleFilter(mod.code)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                      selectedModuleFilter === mod.code
                        ? 'bg-[#0A84FF] text-white border-[#0A84FF]'
                        : 'bg-[#141414] text-[#EBEBF599] border-[#38383A] hover:border-[#0A84FF]'
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
                  className="px-3 py-1.5 rounded border border-[#38383A] bg-[#141414] text-white text-sm focus:outline-none focus:border-[#0A84FF] placeholder-[#EBEBF54D]"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 rounded border border-[#38383A] bg-[#141414] text-white text-sm focus:outline-none focus:border-[#0A84FF]"
                >
                  <option value="priority" className="bg-[#141414]">Sort: Priority</option>
                  <option value="dueDate" className="bg-[#141414]">Sort: Due Date</option>
                  <option value="created" className="bg-[#141414]">Sort: Recent</option>
                </select>
              </div>
            </div>

            {/* Add Task Button */}
            <div className="bg-[#141414] border border-[#38383A] rounded-lg p-5 mb-6">
              <button
                onClick={onAddTask}
                className="w-full px-0 py-2 border-0 border-b border-[#38383A] text-[#EBEBF599] text-left text-sm hover:text-white hover:border-[#0A84FF] transition-colors"
              >
                Add a new task...
              </button>
            </div>

            {/* Task List */}
            <div className="space-y-2">
              {currentTasks.length === 0 ? (
                <div className="text-center py-16 text-[#EBEBF599]">
                  <p className="text-sm">No tasks found</p>
                </div>
              ) : (
                currentTasks.map(task => {
                  const moduleColor = getModuleColor(task.moduleCode);
                  const priority = priorities.find(p => p.value === task.priority);
                  
                  return (
                    <div
                      key={task.id}
                      className={`bg-[#141414] border border-[#38383A] rounded-lg p-4 transition-all hover:border-[#0A84FF] ${
                        task.completed ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => onToggleComplete(task.id)}
                          className="mt-0.5 text-[#EBEBF599] hover:text-white transition-colors"
                        >
                          {task.completed ? (
                            <span className="text-lg">✓</span>
                          ) : (
                            <span className="text-lg">○</span>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {editingTaskId === task.id ? (
                              <select
                                value={task.moduleCode}
                                onChange={(e) => updateTaskModule(task.id, e.target.value)}
                                className="px-2.5 py-0.5 rounded border border-[#38383A] bg-[#0A0A0A] text-white text-xs font-medium focus:outline-none focus:border-[#0A84FF]"
                              >
                                {modules.map(mod => (
                                  <option key={mod.id} value={mod.code} className="bg-[#141414]">{mod.code}</option>
                                ))}
                              </select>
                            ) : (
                              <span 
                                onClick={() => setEditingTaskId(task.id)}
                                className={`px-2.5 py-0.5 rounded border text-xs font-medium cursor-pointer hover:opacity-80 ${moduleColor?.class}`}
                              >
                                {task.moduleCode}
                              </span>
                            )}
                            
                            <select
                              value={task.priority}
                              onChange={(e) => updateTaskPriority(task.id, e.target.value as Task['priority'])}
                              className={`px-2.5 py-0.5 rounded border text-xs font-medium focus:outline-none cursor-pointer ${priority?.color}`}
                            >
                              {priorities.map(p => (
                                <option key={p.value} value={p.value} className="bg-[#141414]">
                                  {p.indicator} {p.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <p className={`text-white text-sm break-words ${task.completed ? 'line-through' : ''}`}>
                            {task.title}
                          </p>
                          {task.dueDate && (
                            <div className="flex items-center gap-1 mt-2 text-[#EBEBF599] text-xs">
                              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="text-[#EBEBF54D] hover:text-[#FF453A] transition-colors text-sm"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {filteredTasks.length > TASKS_PER_PAGE && (
              <div className="flex justify-center items-center gap-4 mt-6 pb-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm rounded border ${
                    currentPage === 1 
                      ? 'bg-[#141414] text-[#EBEBF54D] border-[#38383A] cursor-not-allowed' 
                      : 'bg-[#141414] text-white border-[#38383A] hover:bg-[#1C1C1C] hover:border-[#0A84FF]'
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-[#EBEBF599]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 text-sm rounded border ${
                    currentPage === totalPages 
                      ? 'bg-[#141414] text-[#EBEBF54D] border-[#38383A] cursor-not-allowed' 
                      : 'bg-[#141414] text-white border-[#38383A] hover:bg-[#1C1C1C] hover:border-[#0A84FF]'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Modules Tab */}
            <div className="space-y-3">
              <h2 className="text-lg font-medium text-white mb-4">Your Modules</h2>
              {modules.length === 0 ? (
                <div className="text-center py-16 text-[#EBEBF599]">
                  <p className="text-sm">No modules yet. Add one in the Academic section!</p>
                </div>
              ) : (
                modules.map(mod => {
                  const color = getModuleColor(mod.code);
                  const modStats = getModuleStats(mod.code);
                  
                  return (
                    <div key={mod.id} className="bg-[#141414] border border-[#38383A] rounded-lg p-4 flex items-center justify-between group hover:border-[#0A84FF] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${color?.class.split(' ')[2] || 'bg-gray-500/30'}`}></div>
                        <div>
                          <h3 className="font-medium text-white">{mod.code} - {mod.name}</h3>
                          <p className="text-xs text-[#EBEBF599]">{modStats.completed}/{modStats.total} tasks completed</p>
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
    </div>
  );
};