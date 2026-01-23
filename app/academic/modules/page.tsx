// app/academic/modules/page.tsx
'use client';

import { useState } from 'react';
import { useAcademic } from '@/hooks/useAcademic';
import { ModuleList } from '@/components/academic/ModuleList';
import { ModuleForm } from '@/components/academic/ModuleForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { Module } from '@/lib/types';

export default function ModulesPage() {
  const { modules, loading: dbLoading, error: dbError } = useDatabase() as { 
  modules: Module[]; 
  loading: boolean; 
  error: Error | null 
};
  const { createModule, isLoading } = useAcademic();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateModule = async (data: any) => {
    try {
      await createModule({
        ...data,
        progress: 0,
        assessments: [],
        resources: [],
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create module:', err);
    }
  };

  if (dbLoading) {
    return <div>Loading...</div>;
  }

  if (dbError) {
    return <div>Error loading modules: {dbError.message}</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Academic Modules</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Module
        </Button>
      </div>

      <ModuleList 
        modules={modules} 
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Module"
      >
        <ModuleForm
          onSubmit={handleCreateModule}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={isLoading}
        />
      </Modal>
    </div>
  );
}