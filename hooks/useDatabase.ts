// hooks/useDatabase.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/supabase';
import type { Module, Task, Transaction } from '@/lib/types';

// Convert camelCase to snake_case for database
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (obj === null || typeof obj !== 'object') return obj;
  
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {} as any);
};

// Convert snake_case to camelCase from database
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj === null || typeof obj !== 'object') return obj;
  
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = toCamelCase(obj[key]);
    return acc;
  }, {} as any);
};

export const useDatabase = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate a unique user ID (for now - add proper auth later)
  const getUserId = () => {
    if (typeof window === 'undefined') return 'anonymous';
    
    let userId = localStorage.getItem('unilife_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('unilife_user_id', userId);
    }
    return userId;
  };

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    const userId = getUserId();
    
    try {
      // Load modules
      const { data: modulesData } = await supabase
        .from('modules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (modulesData) setModules(modulesData.map(toCamelCase));

      // Load tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });
      
      if (tasksData) setTasks(tasksData.map(toCamelCase));

      // Load transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (transactionsData) setTransactions(transactionsData.map(toCamelCase));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscriptions
  useEffect(() => {
    const userId = getUserId();
    
    // Subscribe to modules changes
    const modulesSubscription = supabase
      .channel('modules-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'modules', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setModules(prev => [toCamelCase(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setModules(prev => prev.map(m => m.id === payload.new.id ? toCamelCase(payload.new) : m));
          } else if (payload.eventType === 'DELETE') {
            setModules(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to tasks changes
    const tasksSubscription = supabase
      .channel('tasks-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, toCamelCase(payload.new)]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? toCamelCase(payload.new) : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      modulesSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
    };
  }, []);

  // Save functions
  const saveModule = async (module: Module) => {
    const userId = getUserId();
    const dbData = toSnakeCase({ ...module, user_id: userId, updated_at: new Date().toISOString() });
    const { error } = await supabase
      .from('modules')
      .upsert(dbData);
    
    if (error) console.error('Error saving module:', error);
    return !error;
  };

  const saveTask = async (task: Task) => {
    const userId = getUserId();
    const dbData = toSnakeCase({ ...task, user_id: userId });
    const { error } = await supabase
      .from('tasks')
      .upsert(dbData);
    
    if (error) console.error('Error saving task:', error);
    return !error;
  };

  const saveTransaction = async (transaction: Transaction) => {
    const userId = getUserId();
    const dbData = toSnakeCase({ ...transaction, user_id: userId });
    const { error } = await supabase
      .from('transactions')
      .insert(dbData);
    
    if (error) console.error('Error saving transaction:', error);
    return !error;
  };

  const deleteModule = async (id: string) => {
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', id);
    
    if (error) console.error('Error deleting module:', error);
    return !error;
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) console.error('Error deleting task:', error);
    return !error;
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) console.error('Error deleting transaction:', error);
    return !error;
  };

  return {
    modules,
    tasks,
    transactions,
    loading,
    saveModule,
    saveTask,
    saveTransaction,
    deleteModule,
    deleteTask,
    deleteTransaction,
    refreshData: loadData
  };
};