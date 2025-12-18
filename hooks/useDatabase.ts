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
// Generate a unique user ID that looks like a real UUID
  const getUserId = () => {
    if (typeof window === 'undefined') return '00000000-0000-0000-0000-000000000000';
    
    let userId = localStorage.getItem('unilife_user_id');
    
    // Check if we have an ID and if it matches UUID format (8-4-4-4-12)
    const isValidUUID = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    if (!isValidUUID) {
      // Generate a compliant UUID v4
      userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem('unilife_user_id', userId!);
    }
    return userId!;
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
    
    const modulesSubscription = supabase
      .channel('modules-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'modules', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Only add if we don't already have it (prevents double add from optimistic update)
            setModules(prev => prev.some(m => m.id === payload.new.id) ? prev : [toCamelCase(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setModules(prev => prev.map(m => m.id === payload.new.id ? toCamelCase(payload.new) : m));
          } else if (payload.eventType === 'DELETE') {
            setModules(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const tasksSubscription = supabase
      .channel('tasks-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
             setTasks(prev => prev.some(t => t.id === payload.new.id) ? prev : [...prev, toCamelCase(payload.new)].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? toCamelCase(payload.new) : t));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const transactionsSubscription = supabase
      .channel('transactions-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTransactions(prev => prev.some(t => t.id === payload.new.id) ? prev : [toCamelCase(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTransactions(prev => prev.map(t => t.id === payload.new.id ? toCamelCase(payload.new) : t));
          } else if (payload.eventType === 'DELETE') {
            setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      modulesSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
      transactionsSubscription.unsubscribe();
    };
  }, []);

  // --- SAVING FUNCTIONS (With ID Fix) ---

  const saveModule = async (module: Module) => {
    const userId = getUserId();
    // Check if ID is a temp timestamp (no hyphens) or a real UUID
    const isTempId = !module.id.includes('-');
    const moduleWithUser = { ...module, userId, updatedAt: new Date().toISOString() };

    if (isTempId) {
      // 1. INSERT (New Item)
      // Optimistic Update
      setModules(prev => [moduleWithUser, ...prev]);

      // Strip the temp ID and any client-only fields so Supabase generates a real UUID
      const { id, targetMark, ...dataToInsert } = moduleWithUser as any;
      const dbData = toSnakeCase(dataToInsert);

      const { data, error } = await supabase
        .from('modules')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('Error saving module:', error);
        setModules(prev => prev.filter(m => m.id !== module.id)); // Revert
        return false;
      }

      // Replace temp ID with real ID in state
      if (data) {
        const realModule = toCamelCase(data);
        setModules(prev => prev.map(m => m.id === module.id ? realModule : m));
      }
      return true;

    } else {
      // 2. UPDATE (Existing Item)
      setModules(prev => prev.map(m => m.id === module.id ? moduleWithUser : m));
      
      const { targetMark, ...dataToUpdate } = moduleWithUser as any;
      const dbData = toSnakeCase(dataToUpdate);
      const { error } = await supabase
        .from('modules')
        .update(dbData)
        .eq('id', module.id);

      if (error) {
        console.error('Error updating module:', error);
        loadData(); // Revert safely
        return false;
      }
      return true;
    }
  };

  const saveTask = async (task: Task) => {
    const userId = getUserId();
    const isTempId = !task.id.includes('-');
    const taskWithUser = { ...task, userId };

    if (isTempId) {
      // INSERT
      setTasks(prev => [...prev, taskWithUser].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));

      const { id, ...dataToInsert } = taskWithUser;
      const dbData = toSnakeCase(dataToInsert);

      const { data, error } = await supabase
        .from('tasks')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('Error saving task:', error);
        setTasks(prev => prev.filter(t => t.id !== task.id));
        return false;
      }

      if (data) {
        const realTask = toCamelCase(data);
        setTasks(prev => prev.map(t => t.id === task.id ? realTask : t));
      }
      return true;

    } else {
      // UPDATE
      setTasks(prev => prev.map(t => t.id === task.id ? taskWithUser : t));
      
      const dbData = toSnakeCase(taskWithUser);
      const { error } = await supabase
        .from('tasks')
        .update(dbData)
        .eq('id', task.id);

      if (error) {
        console.error('Error updating task:', error);
        loadData();
        return false;
      }
      return true;
    }
  };

  const saveTransaction = async (transaction: Transaction) => {
    const userId = getUserId();
    const isTempId = !transaction.id.includes('-');
    const transactionWithUser = { ...transaction, userId };

    if (isTempId) {
      // INSERT
      setTransactions(prev => [transactionWithUser, ...prev]);

      const { id, ...dataToInsert } = transactionWithUser;
      const dbData = toSnakeCase(dataToInsert);

      const { data, error } = await supabase
        .from('transactions')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('Error saving transaction:', error);
        setTransactions(prev => prev.filter(t => t.id !== transaction.id));
        return false;
      }

      if (data) {
        const realTransaction = toCamelCase(data);
        setTransactions(prev => prev.map(t => t.id === transaction.id ? realTransaction : t));
      }
      return true;

    } else {
      // UPDATE
      setTransactions(prev => prev.map(t => t.id === transaction.id ? transactionWithUser : t));
      
      const dbData = toSnakeCase(transactionWithUser);
      const { error } = await supabase
        .from('transactions')
        .update(dbData)
        .eq('id', transaction.id);

      if (error) {
        console.error('Error updating transaction:', error);
        loadData();
        return false;
      }
      return true;
    }
  };

  const deleteModule = async (id: string) => {
    const backup = [...modules];
    setModules(prev => prev.filter(m => m.id !== id));
    
    const { error } = await supabase.from('modules').delete().eq('id', id);
    if (error) {
      console.error('Error deleting module:', error);
      setModules(backup);
      return false;
    }
    return true;
  };

  const deleteTask = async (id: string) => {
    const backup = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));
    
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('Error deleting task:', error);
      setTasks(backup);
      return false;
    }
    return true;
  };

  const deleteTransaction = async (id: string) => {
    const backup = [...transactions];
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      console.error('Error deleting transaction:', error);
      setTransactions(backup);
      return false;
    }
    return true;
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