import React, { useState } from 'react';
import { Transaction } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

type TransactionFormProps = {
  editingTransaction: Transaction | null;
  onSave: (transaction: Transaction) => Promise<boolean>;
  onClose: () => void;
};

export const TransactionForm = ({ editingTransaction, onSave, onClose }: TransactionFormProps) => {
  const [formState, setFormState] = useState<Partial<Transaction>>(editingTransaction || {
    date: new Date().toISOString().split('T')[0], 
    description: '', 
    amount: 0, 
    category: 'Food'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const transactionToSave: Transaction = {
        ...formState,
        id: editingTransaction?.id || Date.now().toString(),
        created_at: editingTransaction?.created_at || new Date().toISOString(),
      } as Transaction;
      
      const success = await onSave(transactionToSave);
      
      if (success) {
        onClose();
      } else {
        alert('Failed to save transaction. Please try again.');
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error saving transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmount = (value: string) => {
    const num = value.replace(/[^0-9.-]/g, '');
    return num === '' ? '0' : num;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input 
          data-testid="transaction-date-input" // ✅ Added ID
          label="Date" 
          type="date" 
          value={formState.date || ''} 
          onChange={e => setFormState({...formState, date: e.target.value})} 
          placeholder="" 
          required 
          max={new Date().toISOString().split('T')[0]}
        />
        <Select 
          data-testid="transaction-category-select" // ✅ Added ID
          label="Category" 
          value={formState.category || 'Food'} 
          onChange={e => setFormState({...formState, category: e.target.value})}
          options={[
            {value: 'Food', label: 'Food'}, 
            {value: 'Books', label: 'Books'}, 
            {value: 'Tuition', label: 'Tuition'}, 
            {value: 'Transport', label: 'Transport'}, 
            {value: 'Entertainment', label: 'Entertainment'},
            {value: 'Utilities', label: 'Utilities'},
            {value: 'Shopping', label: 'Shopping'},
            {value: 'Income', label: 'Income'},
            {value: 'Other', label: 'Other'}
          ]} 
          required
        />
      </div>
      <Input 
        data-testid="transaction-description-input" // ✅ Added ID
        label="Description" 
        value={formState.description || ''} 
        onChange={e => setFormState({...formState, description: e.target.value})} 
        placeholder="e.g., Lunch at cafeteria, Textbook purchase" 
        required 
      />
      <div className="relative">
        <label className="block text-sm font-medium text-white mb-2">
          Amount <span className="text-[#FF453A]">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#EBEBF599]">R</span>
          <input
            data-testid="transaction-amount-input" // ✅ Added ID
            type="text"
            value={formState.amount === 0 ? '' : formState.amount?.toString()}
            onChange={e => {
              const formatted = formatAmount(e.target.value);
              setFormState({...formState, amount: parseFloat(formatted) || 0});
            }}
            placeholder="-25.50"
            required
            className="w-full bg-[#0A0A0A] border border-[#38383A] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#0A84FF]"
          />
        </div>
        {/* ... (buttons remain same) ... */}
      </div>
      <div className="flex gap-3 justify-end pt-4">
        <Button variant="secondary" onClick={onClose} type="button" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          data-testid="transaction-submit-btn" // ✅ Added ID
          type="submit" 
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Saving...' : `${editingTransaction ? 'Update' : 'Add'} Transaction`}
        </Button>
      </div>
    </form>
  );
};