import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Download, PieChart as PieChartIcon, BarChart3, CreditCard, Wallet, ShoppingCart, Receipt, AlertCircle } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/Button';

interface FinancesPageProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

type TimeFilter = 'all' | 'week' | 'month' | 'semester' | 'year';
type CategoryFilter = string | 'all';

export const FinancesPage: React.FC<FinancesPageProps> = ({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  // Category budgets (you can make this editable later)
  const [budgets, setBudgets] = useState<Record<string, number>>({
    Food: 2000,
    Transport: 1000,
    Entertainment: 500,
    Books: 1000,
    Shopping: 800,
    Utilities: 500,
    Other: 500,
  });

  // Filter transactions by time
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let filtered = transactions;

    switch (timeFilter) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = transactions.filter(t => new Date(t.date) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = transactions.filter(t => new Date(t.date) >= monthAgo);
        break;
      case 'semester':
        const semesterStart = now.getMonth() < 6 
          ? new Date(now.getFullYear(), 0, 1) 
          : new Date(now.getFullYear(), 6, 1);
        filtered = transactions.filter(t => new Date(t.date) >= semesterStart);
        break;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        filtered = transactions.filter(t => new Date(t.date) >= yearStart);
        break;
      default:
        filtered = transactions;
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }

    return filtered;
  }, [transactions, timeFilter, categoryFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const balance = income - expenses;
    
    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + Math.abs(t.amount);
      });

    // Daily average spending
    const dates = filteredTransactions.map(t => new Date(t.date).getTime());
    const oldestDate = dates.length > 0 ? Math.min(...dates) : Date.now();
    const daysDiff = Math.max(1, Math.ceil((Date.now() - oldestDate) / (1000 * 60 * 60 * 24)));
    const dailyAverage = expenses / daysDiff;

    return {
      income,
      expenses,
      balance,
      categoryBreakdown,
      dailyAverage,
      transactionCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  // Budget tracking
  const budgetStatus = useMemo(() => {
    const status: Record<string, { spent: number; budget: number; percentage: number }> = {};
    
    Object.keys(budgets).forEach(category => {
      const spent = stats.categoryBreakdown[category] || 0;
      const budget = budgets[category];
      const percentage = (spent / budget) * 100;
      
      status[category] = { spent, budget, percentage };
    });

    return status;
  }, [stats.categoryBreakdown, budgets]);

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Amount'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.description,
      t.category,
      t.amount.toFixed(2)
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      Food: '🍔',
      Books: '📚',
      Tuition: '🎓',
      Transport: '🚗',
      Entertainment: '🎮',
      Utilities: '💡',
      Shopping: '🛍️',
      Income: '💰',
      Other: '📦',
    };
    return icons[category] || '📦';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Finances</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportToCSV}>
            <Download size={16} className="mr-1" />Export CSV
          </Button>
          <Button onClick={onAddTransaction}>
            <Plus size={16} className="mr-1" />Add Transaction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          {(['week', 'month', 'semester', 'year', 'all'] as TimeFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeFilter === filter
                  ? 'bg-[#0A84FF] text-white'
                  : 'bg-[#141414] text-[#EBEBF599] hover:bg-[#1C1C1C] border border-[#38383A]'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-[#141414] border border-[#38383A] rounded-lg text-white text-sm focus:outline-none focus:border-[#0A84FF]"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#EBEBF599]">Income</h3>
            <div className="p-2 bg-[#30D158]/10 rounded-lg">
              <TrendingUp size={16} className="text-[#30D158]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#30D158]">R{stats.income.toFixed(2)}</div>
          <div className="text-xs text-[#EBEBF599] mt-1">{stats.transactionCount} transactions</div>
        </div>

        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#EBEBF599]">Expenses</h3>
            <div className="p-2 bg-[#FF453A]/10 rounded-lg">
              <TrendingDown size={16} className="text-[#FF453A]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#FF453A]">R{stats.expenses.toFixed(2)}</div>
          <div className="text-xs text-[#EBEBF599] mt-1">Daily avg: R{stats.dailyAverage.toFixed(2)}</div>
        </div>

        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#EBEBF599]">Net Balance</h3>
            <div className="p-2 bg-[#0A84FF]/10 rounded-lg">
              <Wallet size={16} className="text-[#0A84FF]" />
            </div>
          </div>
          <div className={`text-3xl font-bold ${stats.balance >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>
            R{stats.balance.toFixed(2)}
          </div>
          <div className="text-xs text-[#EBEBF599] mt-1">
            {stats.balance >= 0 ? 'Surplus' : 'Deficit'}
          </div>
        </div>

        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#EBEBF599]">Savings Rate</h3>
            <div className="p-2 bg-[#FF9F0A]/10 rounded-lg">
              <PieChartIcon size={16} className="text-[#FF9F0A]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#FF9F0A]">
            {stats.income > 0 ? ((stats.balance / stats.income) * 100).toFixed(1) : '0.0'}%
          </div>
          <div className="text-xs text-[#EBEBF599] mt-1">Of income saved</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Tracking */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#141414] border border-[#38383A] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Budget Overview</h2>
              <span className="text-sm text-[#EBEBF599]">{timeFilter === 'month' ? 'This Month' : timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}</span>
            </div>

            <div className="space-y-4">
              {Object.entries(budgetStatus).map(([category, data]) => {
                const isOverBudget = data.percentage > 100;
                const isWarning = data.percentage > 80 && data.percentage <= 100;

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getCategoryIcon(category)}</span>
                        <span className="text-sm font-medium text-white">{category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-[#EBEBF599]">
                          R{data.spent.toFixed(2)} / R{data.budget.toFixed(2)}
                        </span>
                        {isOverBudget && <AlertCircle size={16} className="text-[#FF453A]" />}
                      </div>
                    </div>
                    <div className="relative h-2 bg-[#0A0A0A] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverBudget ? 'bg-[#FF453A]' : isWarning ? 'bg-[#FF9F0A]' : 'bg-[#30D158]'
                        }`}
                        style={{ width: `${Math.min(data.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={`font-medium ${
                        isOverBudget ? 'text-[#FF453A]' : isWarning ? 'text-[#FF9F0A]' : 'text-[#30D158]'
                      }`}>
                        {data.percentage.toFixed(1)}% used
                      </span>
                      <span className="text-[#EBEBF599]">
                        R{(data.budget - data.spent).toFixed(2)} remaining
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-[#141414] border border-[#38383A] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Transactions</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredTransactions.length > 0 ? (
                filteredTransactions
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg hover:bg-[#1C1C1C] transition-colors group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-2xl">{getCategoryIcon(transaction.category)}</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">{transaction.description}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#EBEBF599]">{transaction.date}</span>
                            <span className="text-xs px-2 py-0.5 bg-[#38383A]/30 rounded text-[#EBEBF599]">
                              {transaction.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`text-lg font-mono font-semibold ${
                            transaction.amount > 0 ? 'text-[#30D158]' : 'text-white'
                          }`}
                        >
                          {transaction.amount > 0 ? '+' : ''}R{transaction.amount.toFixed(2)}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditTransaction(transaction)}
                            className="p-2 hover:bg-[#38383A] rounded transition-colors"
                          >
                            <Edit size={14} className="text-[#EBEBF599]" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this transaction?')) {
                                onDeleteTransaction(transaction.id);
                              }
                            }}
                            className="p-2 hover:bg-[#FF453A]/20 rounded transition-colors"
                          >
                            <Trash2 size={14} className="text-[#FF453A]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-12 text-[#EBEBF599]">
                  <Receipt size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No transactions found</p>
                  <p className="text-xs mt-1">Add your first transaction to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-6">
          <div className="bg-[#141414] border border-[#38383A] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Spending by Category</h2>
            <div className="space-y-3">
              {Object.entries(stats.categoryBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => {
                  const percentage = (amount / stats.expenses) * 100;
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(category)}</span>
                          <span className="text-sm text-white">{category}</span>
                        </div>
                        <span className="text-sm font-mono text-white">R{amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#0A0A0A] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0A84FF] rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#EBEBF599] w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-[#141414] border border-[#38383A] rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">💡 Insights</h2>
            <div className="space-y-3">
              {stats.balance < 0 && (
                <div className="p-3 bg-[#FF453A]/10 border border-[#FF453A]/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-[#FF453A] mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-[#FF453A]">Budget Alert</div>
                      <div className="text-xs text-[#EBEBF599] mt-1">
                        You're spending more than you earn this {timeFilter}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {Object.entries(budgetStatus).some(([_, data]) => data.percentage > 100) && (
                <div className="p-3 bg-[#FF9F0A]/10 border border-[#FF9F0A]/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-[#FF9F0A] mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-[#FF9F0A]">Over Budget</div>
                      <div className="text-xs text-[#EBEBF599] mt-1">
                        {Object.entries(budgetStatus).filter(([_, data]) => data.percentage > 100).length} categories over budget
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {stats.balance >= 0 && stats.income > 0 && (stats.balance / stats.income) * 100 > 30 && (
                <div className="p-3 bg-[#30D158]/10 border border-[#30D158]/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <TrendingUp size={16} className="text-[#30D158] mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-[#30D158]">Great Saving!</div>
                      <div className="text-xs text-[#EBEBF599] mt-1">
                        You're saving over 30% of your income 🎉
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-[#0A84FF]/10 border border-[#0A84FF]/30 rounded-lg">
                <div className="text-sm font-medium text-[#0A84FF] mb-2">Top Spending</div>
                <div className="text-xs text-[#EBEBF599]">
                  {Object.entries(stats.categoryBreakdown)
                    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'} is your biggest expense
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};