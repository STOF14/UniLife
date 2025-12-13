import React from 'react';
import { Plus, Edit, Trash2, Camera } from 'lucide-react';
import { Module, Task } from '@/types';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ProgressBar } from '@/components/ui/ProgressBar';

type AcademicPageProps = {
  modules: Module[];
  tasks: Task[];
  onAddModule: () => void;
  onEditModule: (module: Module) => void;
  onDeleteModule: (id: string) => void;
  onPhotoUpload: (moduleId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const AcademicPage = ({ 
  modules, 
  tasks, 
  onAddModule, 
  onEditModule, 
  onDeleteModule,
  onPhotoUpload 
}: AcademicPageProps) => {
  const getThisWeekTasks = (moduleCode: string) => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return tasks.filter(task => 
      task.moduleCode === moduleCode &&
      new Date(task.dueDate) >= today &&
      new Date(task.dueDate) <= nextWeek &&
      !task.completed
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Academic</h1>
        <Button onClick={onAddModule}>
          <Plus size={16} className="mr-1" />Add Module
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(module => {
          const thisWeekTasks = getThisWeekTasks(module.code);
          const targetDiff = module.currentGrade - module.targetGrade;
          
          return (
            <div 
              key={module.id} 
              className="bg-[#141414] border border-[#38383A] rounded-xl overflow-hidden transition-all duration-200 hover:border-[#0A84FF] hover:shadow-lg hover:-translate-y-1"
            >
              <div className="h-32 relative group cursor-pointer" style={{ 
                background: module.coverImage?.startsWith('data:') ? 'none' : module.coverImage || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundImage: module.coverImage?.startsWith('data:') ? `url(${module.coverImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <label className="p-2 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm transition-colors cursor-pointer">
                    <Camera size={16} className="text-white" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => onPhotoUpload(module.id, e)}
                    />
                  </label>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEditModule(module); }}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm transition-colors"
                  >
                    <Edit size={16} className="text-white" />
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (confirm(`Delete ${module.code}?`)) {
                        onDeleteModule(module.id);
                      }
                    }}
                    className="p-2 bg-black/50 hover:bg-[#FF453A]/70 rounded-lg backdrop-blur-sm transition-colors"
                  >
                    <Trash2 size={16} className="text-white" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <div className="text-xs text-[#EBEBF599] mb-1">{module.code} · {module.credits} credits</div>
                  <h3 className="text-base font-semibold text-white line-clamp-2">{module.name}</h3>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ProgressRing percentage={module.currentGrade} size={50} strokeWidth={5} />
                    <div>
                      <div className="text-xs text-[#EBEBF599]">Current</div>
                      <div className="text-sm font-mono text-white">{module.currentGrade}%</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#EBEBF599]">Target: {module.targetGrade}%</div>
                    <div className={`text-sm font-mono font-semibold ${
                      targetDiff >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'
                    }`}>
                      {targetDiff >= 0 ? '+' : ''}{targetDiff}%
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#EBEBF599] mb-1">
                    <span>Progress to target</span>
                    <span>{Math.min(Math.round((module.currentGrade / module.targetGrade) * 100), 100)}%</span>
                  </div>
                  <ProgressBar 
                    percentage={Math.min((module.currentGrade / module.targetGrade) * 100, 100)}
                    color={targetDiff >= 0 ? '#30D158' : '#FF9F0A'}
                  />
                </div>

                {thisWeekTasks.length > 0 && (
                  <div className="pt-3 border-t border-[#38383A]">
                    <div className="text-xs font-medium text-[#EBEBF599] mb-2">📋 This Week:</div>
                    <div className="space-y-1">
                      {thisWeekTasks.slice(0, 2).map(task => (
                        <div key={task.id} className="text-xs text-white flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            task.priority === 'high' ? 'bg-[#FF453A]' : 'bg-[#FF9F0A]'
                          }`} />
                          <span className="truncate">{task.title}</span>
                        </div>
                      ))}
                      {thisWeekTasks.length > 2 && (
                        <div className="text-xs text-[#EBEBF599]">+{thisWeekTasks.length - 2} more</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};