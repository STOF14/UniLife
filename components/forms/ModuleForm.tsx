import React, { useState } from 'react';
import { Module } from '@/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

type ModuleFormProps = {
  editingModule: Module | null;
  onSave: (module: Module) => Promise<boolean>;
  onClose: () => void;
};

export const ModuleForm = ({ editingModule, onSave, onClose }: ModuleFormProps) => {
  const [formState, setFormState] = useState<Partial<Module>>(editingModule || {
    code: '', name: '', semester: '2025', credits: 16, currentGrade: 0, targetGrade: 60, progress: 0, assessments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const moduleToSave: Module = {
        ...formState,
        id: editingModule?.id || Date.now().toString(),
        assessments: editingModule?.assessments || [],
        coverImage: editingModule?.coverImage || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        created_at: editingModule?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Module;
      
      const success = await onSave(moduleToSave);
      
      if (success) {
        onClose();
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
          onChange={e => setFormState({...formState, code: e.target.value})} 
          placeholder="PHY114" 
          required 
        />
        <Input 
          label="Module Name" 
          value={formState.name || ''} 
          onChange={e => setFormState({...formState, name: e.target.value})} 
          placeholder="Physics 114" 
          required 
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input 
          label="Credits" 
          type="number" 
          value={formState.credits || 16} 
          onChange={e => setFormState({...formState, credits: parseInt(e.target.value)})} 
          placeholder="16" 
          required 
          min="1"
          max="32"
        />
        <Input 
          label="Current Grade" 
          type="number" 
          value={formState.currentGrade || 0} 
          onChange={e => setFormState({...formState, currentGrade: parseInt(e.target.value)})} 
          placeholder="75" 
          min="0"
          max="100"
        />
        <Input 
          label="Target Grade" 
          type="number" 
          value={formState.targetGrade || 60} 
          onChange={e => setFormState({...formState, targetGrade: parseInt(e.target.value)})} 
          placeholder="80" 
          min="0"
          max="100"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select 
          label="Semester" 
          value={formState.semester || '2025'} 
          onChange={e => setFormState({...formState, semester: e.target.value})}
          options={[
            {value: '2024', label: '2024'},
            {value: '2025', label: '2025'},
            {value: '2026', label: '2026'},
            {value: '2027', label: '2027'},
          ]} 
          required 
        />
        <Input 
          label="Progress (%)" 
          type="number" 
          value={formState.progress || 0} 
          onChange={e => setFormState({...formState, progress: parseInt(e.target.value)})} 
          placeholder="75" 
          min="0"
          max="100"
        />
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
          type="submit" 
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            `${editingModule ? 'Update' : 'Add'} Module`
          )}
        </Button>
      </div>
    </form>
  );
};