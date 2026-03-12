'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { PageType, Module, Task, Transaction } from '@/lib/types';

// --- 1. Define the Shape of your Store ---
export type AcademicProfile = {
  pastCredits: number;
  pastCWA: number;
  targetCWA: number;
};

interface StoreContextType {
  // UI State
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  currentPage: PageType | 'analytics'; // Added 'analytics' here to match your new page
  setCurrentPage: (page: PageType | 'analytics') => void;
  showModal: string | null;
  setShowModal: (modal: string | null) => void;
  
  // Data State
  selectedModule: Module | null;
  setSelectedModule: (module: Module | null) => void;
  editingModule: Module | null;
  setEditingModule: (module: Module | null) => void;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (transaction: Transaction | null) => void;
  
  // Filters
  taskFilterModuleId: string | 'all';
  setTaskFilterModuleId: (id: string | 'all') => void;

  // Academic Logic
  academicProfile: AcademicProfile;
  setAcademicProfile: (profile: AcademicProfile) => void;
}

// --- 2. Create the Context ---
const StoreContext = createContext<StoreContextType | undefined>(undefined);

// --- 3. The Provider Component ---
export const StoreProvider = ({ children }: { children: ReactNode }) => {
  // UI State
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageType | 'analytics'>('dashboard');
  const [showModal, setShowModal] = useState<string | null>(null);

  // Data Selection/Editing State
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Filters
  const [taskFilterModuleId, setTaskFilterModuleId] = useState<string | 'all'>('all');

  // Academic Profile State (Fixed: Now inside the component)
  const [academicProfile, setAcademicProfile] = useState<AcademicProfile>({
    pastCredits: 198, 
    pastCWA: 44.68,
    targetCWA: 60.0
  });

  return (
    <StoreContext.Provider value={{
      sidebarExpanded, setSidebarExpanded,
      currentPage, setCurrentPage,
      showModal, setShowModal,
      selectedModule, setSelectedModule,
      editingModule, setEditingModule,
      editingTask, setEditingTask,
      editingTransaction, setEditingTransaction,
      taskFilterModuleId, setTaskFilterModuleId,
      academicProfile, setAcademicProfile
    }}>
      {children}
    </StoreContext.Provider>
  );
};

// --- 4. The Hook to use the Store ---
export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};