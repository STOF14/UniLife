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

  // Generate a unique user ID - ASYNC VERSION
  const getUserId = async (): Promise<string> => {
    try {
      // Try to get the actual Supabase authenticated user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }
      
      if (session?.user?.id) {
        console.log('Using authenticated user ID:', session.user.id);
        // Store it for consistency
        localStorage.setItem('unilife_user_id', session.user.id);
        return session.user.id;
      }
      
      // If no authenticated session, check if we have a fallback
      let fallbackId = localStorage.getItem('unilife_user_id');
      
      // If no stored ID or it's not a valid UUID, generate one
      if (!fallbackId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fallbackId)) {
        fallbackId = crypto.randomUUID();
        localStorage.setItem('unilife_user_id', fallbackId);
      }
      
      console.warn('No authenticated session, using fallback ID:', fallbackId);
      return fallbackId;
      
    } catch (error) {
      console.error('Error getting user ID:', error);
      // Ultimate fallback
      const ultimateFallback = localStorage.getItem('unilife_user_id') || crypto.randomUUID();
      localStorage.setItem('unilife_user_id', ultimateFallback);
      return ultimateFallback;
    }
  };

  // Load all data - UPDATED TO ASYNC
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      
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

  // Real-time subscriptions - UPDATED TO ASYNC
  useEffect(() => {
    let mounted = true;
    
    const setupSubscriptions = async () => {
      if (!mounted) return;
      
      const userId = await getUserId();
      
      const modulesSubscription = supabase
        .channel('modules-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'modules', filter: `user_id=eq.${userId}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
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
    };

    setupSubscriptions();

    return () => {
      mounted = false;
    };
  }, []);

  // --- SAVING FUNCTIONS (Updated to Async) ---

  const saveModule = async (module: Module) => {
    try {
      const userId = await getUserId();
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

        console.log('Attempting to save module:', dbData);

        const { data, error } = await supabase
          .from('modules')
          .insert([dbData])
          .select()
          .single();

        if (error) {
          console.error('Error saving module:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
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
        
        console.log('Attempting to update module:', dbData);
        
        const { error } = await supabase
          .from('modules')
          .update(dbData)
          .eq('id', module.id);

        if (error) {
          console.error('Error updating module:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          loadData(); // Revert safely
          return false;
        }
        return true;
      }
    } catch (error) {
      console.error('Authentication error in saveModule:', error);
      alert('Please log in to save modules');
      return false;
    }
  };

  const saveTask = async (task: Task) => {
    try {
      const userId = await getUserId();
      const isTempId = !task.id.includes('-');
      const taskWithUser = { ...task, userId };

      if (isTempId) {
        // INSERT
        setTasks(prev => [...prev, taskWithUser].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));

        const { id, ...dataToInsert } = taskWithUser;
        const dbData = toSnakeCase(dataToInsert);

        console.log('Attempting to save task:', dbData);

        const { data, error } = await supabase
          .from('tasks')
          .insert([dbData])
          .select()
          .single();

        if (error) {
          console.error('Error saving task:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
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
        
        console.log('Attempting to update task:', dbData);
        
        const { error } = await supabase
          .from('tasks')
          .update(dbData)
          .eq('id', task.id);

        if (error) {
          console.error('Error updating task:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          loadData();
          return false;
        }
        return true;
      }
    } catch (error) {
      console.error('Authentication error in saveTask:', error);
      alert('Please log in to save tasks');
      return false;
    }
  };

  const saveTransaction = async (transaction: Transaction) => {
    try {
      const userId = await getUserId();
      const isTempId = !transaction.id.includes('-');
      const transactionWithUser = { ...transaction, userId };

      if (isTempId) {
        // INSERT
        setTransactions(prev => [transactionWithUser, ...prev]);

        const { id, ...dataToInsert } = transactionWithUser;
        const dbData = toSnakeCase(dataToInsert);

        console.log('Attempting to save transaction:', dbData);

        const { data, error } = await supabase
          .from('transactions')
          .insert([dbData])
          .select()
          .single();

        if (error) {
          console.error('Error saving transaction:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
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
        
        console.log('Attempting to update transaction:', dbData);
        
        const { error } = await supabase
          .from('transactions')
          .update(dbData)
          .eq('id', transaction.id);

        if (error) {
          console.error('Error updating transaction:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          loadData();
          return false;
        }
        return true;
      }
    } catch (error) {
      console.error('Authentication error in saveTransaction:', error);
      alert('Please log in to save transactions');
      return false;
    }
  };

  const deleteModule = async (id: string) => {
    try {
      const backup = [...modules];
      setModules(prev => prev.filter(m => m.id !== id));
      
      const { error } = await supabase.from('modules').delete().eq('id', id);
      if (error) {
        console.error('Error deleting module:', error);
        setModules(backup);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error in deleteModule:', error);
      return false;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const backup = [...tasks];
      setTasks(prev => prev.filter(t => t.id !== id));
      
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        console.error('Error deleting task:', error);
        setTasks(backup);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error in deleteTask:', error);
      return false;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const backup = [...transactions];
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        console.error('Error deleting transaction:', error);
        setTransactions(backup);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error in deleteTransaction:', error);
      return false;
    }
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