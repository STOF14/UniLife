// Task utility functions
import type { Task } from '@/lib/types';

export function getThisWeekTasks(tasks: Task[], moduleCode?: string) {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    const isInRange = taskDate >= today && taskDate <= nextWeek && !task.completed;
    const matchesModule = moduleCode ? task.moduleCode === moduleCode : true;
    return isInRange && matchesModule;
  });
}

export function getTasksForWeek(tasks: Task[]) {
  const today = new Date();
  const startOfWeek = new Date(today);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);
  
  return tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return taskDate >= startOfWeek && taskDate <= endOfWeek && !task.completed;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}
