import React, { useState } from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Module, Task } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';

type DashboardPageProps = {
  modules: Module[];
  tasks: Task[];
  cwa: string;
  onExport: () => void;
};

export const DashboardPage = ({ modules, tasks, cwa, onExport }: DashboardPageProps) => {
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

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
    return tasks.filter(task => task.dueDate === dateStr);
  };

  const getTasksThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate >= startOfWeek && taskDate <= endOfWeek && !task.completed;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentCalendarDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  const thisWeekTasks = getTasksThisWeek();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
        <Button variant="secondary" onClick={onExport}>
          <Download size={16} className="mr-2" />Export
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#141414] border border-[#38383A] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">
              {monthNames[month]} {year}
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentCalendarDate(new Date(year, month - 1, 1))}
                className="p-2 hover:bg-[#38383A] rounded-lg transition-colors"
              >
                <ChevronLeft size={20} className="text-white" />
              </button>
              <button 
                onClick={() => setCurrentCalendarDate(new Date())}
                className="px-4 py-2 hover:bg-[#38383A] rounded-lg transition-colors text-sm text-white"
              >
                Today
              </button>
              <button 
                onClick={() => setCurrentCalendarDate(new Date(year, month + 1, 1))}
                className="p-2 hover:bg-[#38383A] rounded-lg transition-colors"
              >
                <ChevronRight size={20} className="text-white" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-[#EBEBF599] py-2">
                {day}
              </div>
            ))}

            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const events = getEventsForDate(date);
              const isToday = isCurrentMonth && day === today.getDate();

              return (
                <div 
                  key={day}
                  className={`aspect-square border border-[#38383A] rounded-lg p-2 hover:border-[#0A84FF] transition-all cursor-pointer ${
                    isToday ? 'bg-[#0A84FF]/20 border-[#0A84FF]' : 'bg-[#0A0A0A]'
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-[#0A84FF]' : 'text-white'}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {events.slice(0, 2).map(event => (
                      <div 
                        key={event.id}
                        className={`text-[10px] px-1 py-0.5 rounded truncate ${
                          event.priority === 'high' ? 'bg-[#FF453A]/20 text-[#FF453A]' :
                          event.priority === 'medium' ? 'bg-[#FF9F0A]/20 text-[#FF9F0A]' :
                          'bg-[#30D158]/20 text-[#30D158]'
                        }`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <div className="text-[9px] text-[#EBEBF599] px-1">
                        +{events.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#141414] border border-[#38383A] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">This Week</h3>
              <span className="text-xs px-2 py-1 bg-[#FF453A]/20 text-[#FF453A] rounded-full">
                {thisWeekTasks.length} tasks
              </span>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {thisWeekTasks.length > 0 ? (
                thisWeekTasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-3 bg-[#0A0A0A] rounded-lg hover:bg-[#1C1C1C] transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      task.priority === 'high' ? 'bg-[#FF453A]' : 
                      task.priority === 'medium' ? 'bg-[#FF9F0A]' : 'bg-[#30D158]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium">{task.title}</div>
                      <div className="text-xs text-[#EBEBF599] mt-1">
                        {task.moduleCode} · {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#EBEBF599] text-sm">
                  No tasks this week! 🎉
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#141414] border border-[#38383A] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#EBEBF599]">Current CWA</span>
                  <span className="text-2xl font-bold font-mono text-[#0A84FF]">{cwa}%</span>
                </div>
              </div>
              <div className="h-px bg-[#38383A]" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#EBEBF599]">Active Modules</span>
                  <span className="text-lg font-bold text-white">{modules.length}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#EBEBF599]">Tasks Completed</span>
                  <span className="text-lg font-bold text-white">
                    {tasks.filter(t => t.completed).length}/{tasks.length}
                  </span>
                </div>
                <ProgressBar percentage={(tasks.filter(t => t.completed).length / tasks.length) * 100} height={3} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#EBEBF599]">Avg Progress</span>
                  <span className="text-lg font-bold text-white">
                    {Math.round(modules.reduce((sum, m) => sum + m.progress, 0) / modules.length)}%
                  </span>
                </div>
                <ProgressBar percentage={modules.reduce((sum, m) => sum + m.progress, 0) / modules.length} height={3} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};