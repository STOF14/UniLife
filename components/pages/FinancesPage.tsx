import React from 'react';
import { Plus, Edit } from 'lucide-react';
import { Transaction } from '@/types';
import { Button } from '@/components/ui/Button';

type FinancesPageProps = {
  transactions: Transaction[];
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
};

export const FinancesPage = ({ transactions, onAddTransaction, onEditTransaction }: FinancesPageProps) => {
  const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0);
  const thisMonth = transactions.filter(t => t.date.startsWith('2024-12')).reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Finances</h1>
        <Button onClick={onAddTransaction}>
          <Plus size={16} className="mr-1" />Add Transaction
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-4">
          <h3 className="text-base font-semibold text-white mb-3">Total Balance</h3>
          <div className="text-3xl font-bold text-white mb-1">R{totalBalance.toFixed(2)}</div>
        </div>
        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-4">
          <h3 className="text-base font-semibold text-white mb-3">This Month</h3>
          <div className={`text-3xl font-bold mb-1 ${thisMonth < 0 ? 'text-[#FF453A]' : 'text-[#30D158]'}`}>
            R{thisMonth.toFixed(2)}
          </div>
        </div>
        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-4">
          <h3 className="text-base font-semibold text-white mb-3">Transactions</h3>
          <div className="text-3xl font-bold text-white">{transactions.length}</div>
        </div>
      </div>

      <div className="bg-[#141414] border border-[#38383A] rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          {transactions.slice().reverse().map((transaction, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-[#38383A]/50">
              <div className="flex-1">
                <div className="text-sm text-white">{transaction.description}</div>
                <div className="text-xs text-[#EBEBF599] font-mono">{transaction.date}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 bg-[#38383A]/30 rounded text-[#EBEBF599]">
                  {transaction.category}
                </span>
                <div className={`text-sm font-mono font-semibold ${transaction.amount > 0 ? 'text-[#30D158]' : 'text-white'}`}>
                  R{transaction.amount.toFixed(2)}
                </div>
                <button 
                  onClick={() => onEditTransaction(transaction)}
                  className="text-[#EBEBF54D] hover:text-white"
                >
                  <Edit size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};