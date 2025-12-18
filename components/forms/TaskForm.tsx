import React, { useState } from 'react';
import { Task, Module } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

type TaskFormProps = {
  editingTask: Task | null;
  modules: Module[];
  onSave: (task: Task) => Promise<boolean>;
  onClose: () => void;
};

export const TaskForm = ({ editingTask, modules, onSave, onClose }: TaskFormProps) => {
  const [formState, setFormState] = useState<Partial<Task>>(editingTask || {
    title: '', moduleCode: '', dueDate: new Date().toISOString().split('T')[0], priority: 'medium', status: 'todo', completed: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const taskToSave: Task = {
        ...formState,
        id: editingTask?.id || Date.now().toString(),
        created_at: editingTask?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Task;
      
      const success = await onSave(taskToSave);
      
      if (success) {
        onClose();
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
        data-testid="task-title-input" // ✅ Added ID
        label="Task Title" 
        value={formState.title || ''} 
        onChange={e => setFormState({...formState, title: e.target.value})} 
        placeholder="Complete assignment" 
        required 
      />
      <div className="grid grid-cols-2 gap-4">
        <Select 
          data-testid="task-module-select" // ✅ Added ID
          label="Module" 
          value={formState.moduleCode || ''} 
          onChange={e => setFormState({...formState, moduleCode: e.target.value})}
          options={[
            {value: '', label: 'None'}, 
            ...modules.map(m => ({value: m.code, label: `${m.code} - ${m.name.substring(0, 20)}${m.name.length > 20 ? '...' : ''}`}))
          ]} 
          required 
        />
        <Input 
          data-testid="task-due-date-input" // ✅ Added ID
          label="Due Date" 
          type="date" 
          value={formState.dueDate || ''} 
          onChange={e => setFormState({...formState, dueDate: e.target.value})} 
          placeholder="" 
          required 
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select 
          data-testid="task-priority-select" // ✅ Added ID
          label="Priority" 
          value={formState.priority || 'medium'} 
          onChange={e => setFormState({...formState, priority: e.target.value as Task['priority']})}
          options={[
            {value: 'low', label: 'Low'}, 
            {value: 'medium', label: 'Medium'}, 
            {value: 'high', label: 'High'}
          ]} 
          required 
        />
        <Select 
          data-testid="task-status-select" // ✅ Added ID
          label="Status" 
          value={formState.status || 'todo'} 
          onChange={e => setFormState({...formState, status: e.target.value as Task['status']})}
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
          onChange={e => setFormState({...formState, completed: e.target.checked})}
          className="w-4 h-4 rounded border-[#38383A] bg-[#0A0A0A]"
        />
        <label htmlFor="completed" className="text-sm text-white cursor-pointer">
          Mark as completed
        </label>
      </div>
      <div className="flex gap-3 justify-end pt-4">
        <Button 
          variant="secondary" 
          onClick={onClose}
          type="button"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          data-testid="task-submit-btn" // ✅ Added ID
          type="submit" 
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Saving...' : `${editingTask ? 'Update' : 'Add'} Task`}
        </Button>
      </div>
    </form>
  );
};