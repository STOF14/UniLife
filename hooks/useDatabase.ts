// hooks/useDatabase.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { Module, Task, Transaction } from '@/types';

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
      
      if (modulesData) setModules(modulesData);

      // Load tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });
      
      if (tasksData) setTasks(tasksData);

      // Load transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (transactionsData) setTransactions(transactionsData);
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
            setModules(prev => [payload.new as Module, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setModules(prev => prev.map(m => m.id === payload.new.id ? payload.new as Module : m));
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
            setTasks(prev => [...prev, payload.new as Task]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Task : t));
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
    const { error } = await supabase
      .from('modules')
      .upsert({ ...module, user_id: userId, updated_at: new Date().toISOString() });
    
    if (error) console.error('Error saving module:', error);
    return !error;
  };

  const saveTask = async (task: Task) => {
    const userId = getUserId();
    const { error } = await supabase
      .from('tasks')
      .upsert({ ...task, user_id: userId });
    
    if (error) console.error('Error saving task:', error);
    return !error;
  };

  const saveTransaction = async (transaction: Transaction) => {
    const userId = getUserId();
    const { error } = await supabase
      .from('transactions')
      .insert({ ...transaction, user_id: userId });
    
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