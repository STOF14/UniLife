import React from 'react';
import { Plus, PencilSimple, Trash, Camera, CheckCircle, Star } from 'phosphor-react';
import { Module, Task } from '@/lib/types';
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
      !task.completed
    );
  };

  const currentYear = new Date().getFullYear();

  // Filter out completed and past-year modules from active view
  const activeModules = modules.filter(module => {
    const isCompleted = module.completed || module.currentGrade >= 100;
    const yearMatch = module.semester?.match(/\b20\d{2}\b/);
    const isPastYear = yearMatch ? parseInt(yearMatch[0], 10) < currentYear : false;
    return !isCompleted && !isPastYear;
  });
  
  const completedModules = modules.filter(module => 
    module.completed || module.currentGrade >= 100
  );

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-border mb-2 flex items-start justify-between">
        <div>
          <p className="chapter-label mb-2">(keisei) Formation</p>
          <h1 className="chapter-title">Academic</h1>
          <p className="chapter-subtitle">Module tracking and grade management</p>
        </div>
        <Button onClick={onAddModule} className="mt-2">
          <Plus size={16} className="mr-1" />Add Module
        </Button>
      </div>

      {completedModules.length > 0 && (
        <div className="surface-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10  bg-success/20 flex items-center justify-center">
                <CheckCircle size={20} className="text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {completedModules.length} module{completedModules.length !== 1 ? 's' : ''} completed
                </p>
                <p className="text-xs text-text-tertiary">
                  View in Analytics to see your achievements
                </p>
              </div>
            </div>
            <div className="text-2xl">
              <Star size={22} className="text-text-primary" />
            </div>
          </div>
        </div>
      )}

      {activeModules.length === 0 && modules.length > 0 && (
        <div className="text-center py-12 surface-card">
          <p className="text-text-tertiary text-sm inline-flex items-center gap-2">
            <Star size={14} className="text-text-primary" />
            All modules completed!
          </p>
          <p className="text-text-tertiary text-xs mt-2">View your achievements in Analytics</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeModules.map(module => {
          const thisWeekTasks = getThisWeekTasks(module.code);
          const targetDiff = module.currentGrade - module.targetGrade;
          
          return (
            <div 
              key={module.id} 
              className="surface-card overflow-hidden transition-all duration-300 ease-contemplative hover:border-border-hover hover:-translate-y-1"
            >
              <div className="h-32 relative group cursor-pointer" style={{ 
                background: module.coverImage?.startsWith('data:') ? 'none' : module.coverImage || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundImage: module.coverImage?.startsWith('data:') ? `url(${module.coverImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <label className="p-2 rounded-sm bg-background/50 hover:bg-background/70 backdrop-blur-sm transition-colors duration-300 ease-contemplative cursor-pointer">
                    <Camera size={16} className="text-text-primary" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => onPhotoUpload(module.id, e)}
                    />
                  </label>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEditModule(module); }}
                    className="p-2 rounded-sm bg-background/50 hover:bg-background/70 backdrop-blur-sm transition-colors duration-300 ease-contemplative"
                  >
                    <PencilSimple size={16} className="text-text-primary" />
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (confirm(`Delete ${module.code}?`)) {
                        onDeleteModule(module.id);
                      }
                    }}
                    className="p-2 rounded-sm bg-background/50 hover:bg-danger/70 backdrop-blur-sm transition-colors duration-300 ease-contemplative"
                  >
                    <Trash size={16} className="text-text-primary" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <div className="text-xs text-text-tertiary mb-1">{module.code} · {module.credits} credits</div>
                  <h3 className="text-base font-semibold text-text-primary line-clamp-2">{module.name}</h3>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ProgressRing percentage={module.currentGrade} size={50} strokeWidth={5} />
                    <div>
                      <div className="text-xs text-text-tertiary">Current</div>
                      <div className="text-sm font-mono text-text-primary">{module.currentGrade}%</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-tertiary">Target: {module.targetGrade}%</div>
                    <div className={`text-sm font-mono font-semibold ${
                      targetDiff >= 0 ? 'text-success' : 'text-danger'
                    }`}>
                      {targetDiff >= 0 ? '+' : ''}{targetDiff}%
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-text-tertiary mb-1">
                    <span>Progress to target</span>
                    <span>{Math.min(Math.round((module.currentGrade / module.targetGrade) * 100), 100)}%</span>
                  </div>
                  <ProgressBar 
                    percentage={Math.min((module.currentGrade / module.targetGrade) * 100, 100)}
                    color={targetDiff >= 0 ? '#567045' : '#9B7A3C'}
                  />
                </div>

                {thisWeekTasks.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <div className="text-xs font-medium text-text-tertiary mb-2">📋 This Week:</div>
                    <div className="space-y-1">
                      {thisWeekTasks.slice(0, 2).map(task => (
                        <div key={task.id} className="text-xs text-text-primary flex items-center gap-2">
                          <div className={`w-1.5 h-1.5  ${
                            task.priority === 'high' ? 'bg-danger' : 'bg-warning'
                          }`} />
                          <span className="truncate">{task.title}</span>
                        </div>
                      ))}
                      {thisWeekTasks.length > 2 && (
                        <div className="text-xs text-text-tertiary">+{thisWeekTasks.length - 2} more</div>
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