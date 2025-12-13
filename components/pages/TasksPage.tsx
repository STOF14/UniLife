import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Task } from '@/types';
import { Button } from '@/components/ui/Button';

type TasksPageProps = {
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string) => void;
};

export const TasksPage = ({ 
  tasks, 
  onAddTask, 
  onEditTask, 
  onDeleteTask, 
  onToggleComplete 
}: TasksPageProps) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-semibold text-white">Tasks</h1>
      <Button onClick={onAddTask}>
        <Plus size={16} className="mr-1" />Add Task
      </Button>
    </div>

    <div className="bg-[#141414] border border-[#38383A] rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-[#0A0A0A]">
          <tr>
            <th className="text-left text-sm font-medium text-[#EBEBF599] px-6 py-4">Task</th>
            <th className="text-left text-sm font-medium text-[#EBEBF599] px-6 py-4">Module</th>
            <th className="text-left text-sm font-medium text-[#EBEBF599] px-6 py-4">Due</th>
            <th className="text-left text-sm font-medium text-[#EBEBF599] px-6 py-4">Priority</th>
            <th className="text-left text-sm font-medium text-[#EBEBF599] px-6 py-4"></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, i) => (
            <tr key={task.id} className={`border-b border-[#38383A]/50 hover:bg-[#1C1C1C] ${i % 2 === 0 ? 'bg-[#0A0A0A]' : 'bg-[#000000]'}`}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={task.completed}
                    onChange={() => onToggleComplete(task.id)}
                    className="w-4 h-4 rounded border-[#38383A]" 
                  />
                  <span className={`text-sm ${task.completed ? 'line-through text-[#EBEBF599]' : 'text-white'}`}>
                    {task.title}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-[#EBEBF599]">{task.moduleCode}</td>
              <td className="px-6 py-4 text-sm font-mono text-[#EBEBF599]">{task.dueDate}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  task.priority === 'high' ? 'bg-[#FF453A]/20 text-[#FF453A]' :
                  task.priority === 'medium' ? 'bg-[#FF9F0A]/20 text-[#FF9F0A]' : 
                  'bg-[#30D158]/20 text-[#30D158]'
                }`}>
                  {task.priority}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => onEditTask(task)}
                    className="text-[#EBEBF54D] hover:text-white"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => onDeleteTask(task.id)}
                    className="text-[#EBEBF54D] hover:text-[#FF453A]"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);