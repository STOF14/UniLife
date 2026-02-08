// Data export utilities
import type { Module, Task, Transaction } from '@/lib/types';

export function exportData(
  modules: Module[],
  tasks: Task[],
  transactions: Transaction[]
) {
  const data = {
    modules,
    tasks,
    transactions,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `unilife-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
