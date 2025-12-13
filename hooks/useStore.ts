'use client';

import { useState } from 'react';
import type { PageType, Module, Task, Transaction } from '@/lib/types';

export const useStore = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  return {
    sidebarExpanded, setSidebarExpanded,
    currentPage, setCurrentPage,
    selectedModule, setSelectedModule,
    showModal, setShowModal,
    editingModule, setEditingModule,
    editingTask, setEditingTask,
    editingTransaction, setEditingTransaction
  };
};