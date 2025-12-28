// hooks/useAcademic.ts
import { useState, useCallback } from 'react';
import { Module, Assessment } from '@/lib/types';
import { supabase } from '@/lib/supabase/supabase';
import { v4 as uuidv4 } from 'uuid';
type UseAcademicReturn = {
  isLoading: boolean;
  error: string | null;
  modules: Module[];
  createModule: (moduleData: Omit<Module, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<Module>;
  updateModule: (moduleId: string, updates: Partial<Module>) => Promise<boolean>;
  deleteModule: (moduleId: string) => Promise<boolean>;
  addAssessment: (moduleId: string, assessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'moduleId'>) => Promise<Assessment>;
  fetchModules: () => Promise<void>;
};
export function useAcademic(): UseAcademicReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const fetchModules = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('modules')
        .select('*')
        .order('createdAt', { ascending: false });
      if (fetchError) throw fetchError;
      setModules(data || []);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch modules');
      throw error;
    }
  }, []);
  const createModule = useCallback(async (moduleData: Omit<Module, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const newModule: Module = {
        ...moduleData,
        id: uuidv4(),
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progress: moduleData.progress || 0,
        currentGrade: moduleData.currentGrade || 0,
        assessments: moduleData.assessments || [],
      };
      const { error } = await supabase
        .from('modules')
        .insert(newModule);
      if (error) throw error;
      setModules(prev => [newModule, ...prev]);
      return newModule;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to create module');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateModule = useCallback(async (moduleId: string, updates: Partial<Module>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('modules')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', moduleId);

      if (error) throw error;

      return true;
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Failed to update module');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteModule = useCallback(async (moduleId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      return true;
    } catch (err) {
        const error = err as Error;
      setError(error.message || 'Failed to delete module');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addAssessment = useCallback(async (moduleId: string, assessment: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'moduleId'>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newAssessment: Assessment = {
        ...assessment,
        id: uuidv4(),
        moduleId,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to assessments table
      const { error: assessmentError } = await supabase
        .from('assessments')
        .insert(newAssessment);

      if (assessmentError) throw assessmentError;

      // Update module's assessments array
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('assessments')
        .eq('id', moduleId)
        .single();

      if (moduleError) throw moduleError;

      const updatedAssessments = [...(moduleData.assessments || []), newAssessment];

      const { error: updateError } = await supabase
        .from('modules')
        .update({ 
          assessments: updatedAssessments,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', moduleId);

      if (updateError) throw updateError;

      return newAssessment;
    } catch (err) {
        const error = err as Error;
      setError(error.message || 'Failed to add assessment');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    modules,
    createModule,
    updateModule,
    deleteModule,
    addAssessment,
    fetchModules,
  };
}