import React, { useState, useMemo, useEffect } from 'react';
import { Plus, PencilSimple, Trash, TrendUp, TrendDown, CurrencyDollar, Calendar, Funnel, DownloadSimple, ChartPieSlice, ChartBar, CreditCard, Wallet, ShoppingCartSimple, Receipt, WarningCircle, BookOpen, GraduationCap, Car, GameController, Lightbulb, Package, ForkKnife, Star } from 'phosphor-react';
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
  const [monthFilter, setMonthFilter] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showRecurringOnly, setShowRecurringOnly] = useState(false);
  const [recurringIds, setRecurringIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('finances_recurring_ids');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('finances_recurring_ids', JSON.stringify(recurringIds));
    }
  }, [recurringIds]);

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

    if (monthFilter) {
      filtered = filtered.filter(t => t.date.startsWith(monthFilter));
    }

    if (showRecurringOnly) {
      filtered = filtered.filter(t => recurringIds.includes(t.id));
    }

    return filtered;
  }, [transactions, timeFilter, categoryFilter, monthFilter, showRecurringOnly, recurringIds]);

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

  const months = useMemo(() => {
    const monthSet = new Set(transactions.map(t => t.date.slice(0, 7)));
    return Array.from(monthSet).sort().reverse();
  }, [transactions]);

  const totalBudget = useMemo(() => Object.values(budgets).reduce((sum, value) => sum + value, 0), [budgets]);
  const totalSpent = useMemo(() => Object.values(stats.categoryBreakdown).reduce((sum, value) => sum + value, 0), [stats.categoryBreakdown]);
  const totalBudgetPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

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

  const toggleRecurring = (id: string) => {
    setRecurringIds(prev => (
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    ));
  };

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
    const icons: Record<string, React.ReactNode> = {
      Food: <ForkKnife size={20} />,
      Books: <BookOpen size={20} />,
      Tuition: <GraduationCap size={20} />,
      Transport: <Car size={20} />,
      Entertainment: <GameController size={20} />,
      Utilities: <Lightbulb size={20} />,
      Shopping: <ShoppingCartSimple size={20} />,
      Income: <CurrencyDollar size={20} />,
      Other: <Package size={20} />,
    };
    return icons[category] || <Package size={20} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-6 border-b border-border">
        <div>
          <p className="chapter-label mb-2">(junkan) Sustainability</p>
          <h1 className="chapter-title">Finances</h1>
          <p className="chapter-subtitle">Track income, expenses, and budget health</p>
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="secondary" onClick={exportToCSV}>
            <DownloadSimple size={16} className="mr-1" />Export CSV
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
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors duration-300 ease-contemplative ${
                timeFilter === filter
                  ? 'bg-text-primary text-background'
                  : 'bg-surface text-text-tertiary hover:bg-surface/50 border border-border'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-surface border border-border  text-text-primary text-sm focus:outline-none focus:border-text-primary"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-4 py-2 bg-surface border border-border  text-text-primary text-sm focus:outline-none focus:border-text-primary"
        >
          {months.map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
        <button
          onClick={() => setShowRecurringOnly(!showRecurringOnly)}
          className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors duration-300 ease-contemplative ${
            showRecurringOnly ? 'bg-text-primary text-background' : 'bg-surface text-text-tertiary hover:bg-surface/50 border border-border'
          }`}
        >
          Recurring
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.slice(0, 6).map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className="px-3 py-1.5 rounded-sm text-xs border border-border text-text-primary hover:border-text-primary transition-colors duration-300 ease-contemplative"
          >
            {cat}
          </button>
        ))}
        <button
          onClick={() => setCategoryFilter('all')}
          className="px-3 py-1.5 rounded-sm text-xs border border-border text-text-tertiary hover:text-text-primary transition-colors duration-300 ease-contemplative"
        >
          Clear
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-tertiary">Income</h3>
            <div className="p-2 bg-success/10 ">
              <TrendUp size={16} className="text-success" />
            </div>
          </div>
          <div className="text-3xl font-bold text-success">R{stats.income.toFixed(2)}</div>
          <div className="text-xs text-text-tertiary mt-1">{stats.transactionCount} transactions</div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-tertiary">Expenses</h3>
            <div className="p-2 bg-danger/10 ">
              <TrendDown size={16} className="text-danger" />
            </div>
          </div>
          <div className="text-3xl font-bold text-danger">R{stats.expenses.toFixed(2)}</div>
          <div className="text-xs text-text-tertiary mt-1">Daily avg: R{stats.dailyAverage.toFixed(2)}</div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-tertiary">Net Balance</h3>
            <div className="p-2 bg-text-primary/10 ">
              <Wallet size={16} className="text-text-primary" />
            </div>
          </div>
          <div className={`text-3xl font-bold ${stats.balance >= 0 ? 'text-success' : 'text-danger'}`}>
            R{stats.balance.toFixed(2)}
          </div>
          <div className="text-xs text-text-tertiary mt-1">
            {stats.balance >= 0 ? 'Surplus' : 'Deficit'}
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-tertiary">Savings Rate</h3>
            <div className="p-2 bg-warning/10 ">
              <ChartPieSlice size={16} className="text-warning" />
            </div>
          </div>
          <div className="text-3xl font-bold text-warning">
            {stats.income > 0 ? ((stats.balance / stats.income) * 100).toFixed(1) : '0.0'}%
          </div>
          <div className="text-xs text-text-tertiary mt-1">Of income saved</div>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-tertiary">Budget Used</h3>
            <div className="p-2 bg-text-primary/10 ">
              <ChartBar size={16} className="text-text-primary" />
            </div>
          </div>
          <div className="text-3xl font-bold text-text-primary">{totalBudgetPercent.toFixed(1)}%</div>
          <div className="text-xs text-text-tertiary mt-1">R{totalSpent.toFixed(0)} / R{totalBudget.toFixed(0)}</div>
          <div className="mt-3 h-2 bg-background  overflow-hidden">
            <div className="h-full bg-text-primary" style={{ width: `${Math.min(totalBudgetPercent, 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Tracking */}
        <div className="lg:col-span-2 space-y-6">
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">Budget Overview</h2>
              <span className="text-sm text-text-tertiary">{timeFilter === 'month' ? 'This Month' : timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}</span>
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
                        <span className="text-sm font-medium text-text-primary">{category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-text-tertiary">
                          R{data.spent.toFixed(2)} / R{data.budget.toFixed(2)}
                        </span>
                        {isOverBudget && <WarningCircle size={16} className="text-danger" />}
                      </div>
                    </div>
                    <div className="relative h-2 bg-background  overflow-hidden">
                      <div
                        className={`h-full  transition-all ${
                          isOverBudget ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${Math.min(data.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={`font-medium ${
                        isOverBudget ? 'text-danger' : isWarning ? 'text-warning' : 'text-success'
                      }`}>
                        {data.percentage.toFixed(1)}% used
                      </span>
                      <span className="text-text-tertiary">
                        R{(data.budget - data.spent).toFixed(2)} remaining
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="surface-card p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Transactions</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredTransactions.length > 0 ? (
                filteredTransactions
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`flex items-center justify-between p-4 bg-background rounded-sm hover:bg-surface/50 transition-colors duration-300 ease-contemplative group`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-2xl">{getCategoryIcon(transaction.category)}</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-text-primary">{transaction.description}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-text-tertiary">{transaction.date}</span>
                            <span className="text-xs px-2 py-0.5 bg-border/30 text-text-tertiary">
                              {transaction.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`text-lg font-mono font-semibold ${
                            transaction.amount > 0 ? 'text-success' : 'text-text-primary'
                          }`}
                        >
                          {transaction.amount > 0 ? '+' : ''}R{transaction.amount.toFixed(2)}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleRecurring(transaction.id)}
                            className="p-2 hover:bg-border transition-colors"
                            title="Toggle recurring"
                          >
                            <span className={recurringIds.includes(transaction.id) ? 'text-warning' : 'text-text-tertiary'}>★</span>
                          </button>
                          <button
                            onClick={() => onEditTransaction(transaction)}
                            className="p-2 hover:bg-border transition-colors"
                          >
                            <PencilSimple size={14} className="text-text-tertiary" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this transaction?')) {
                                onDeleteTransaction(transaction.id);
                              }
                            }}
                            className="p-2 hover:bg-danger/20 transition-colors"
                          >
                            <Trash size={14} className="text-danger" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-12 text-text-tertiary">
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
          <div className="surface-card p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Spending by Category</h2>
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
                          <span className="text-sm text-text-primary">{category}</span>
                        </div>
                        <span className="text-sm font-mono text-text-primary">R{amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-background  overflow-hidden">
                          <div
                            className="h-full bg-text-primary "
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-tertiary w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="surface-card p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Lightbulb size={20} className="text-warning" />
              Insights
            </h2>
            <div className="space-y-3">
              {stats.balance < 0 && (
                <div className="p-3 bg-danger/10 border border-danger/30 ">
                  <div className="flex items-start gap-2">
                    <WarningCircle size={16} className="text-danger mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-danger">Budget Alert</div>
                      <div className="text-xs text-text-tertiary mt-1">
                        You&apos;re spending more than you earn this {timeFilter}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {Object.entries(budgetStatus).some(([_, data]) => data.percentage > 100) && (
                <div className="p-3 bg-warning/10 border border-warning/30 ">
                  <div className="flex items-start gap-2">
                    <WarningCircle size={16} className="text-warning mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-warning">Over Budget</div>
                      <div className="text-xs text-text-tertiary mt-1">
                        {Object.entries(budgetStatus).filter(([_, data]) => data.percentage > 100).length} categories over budget
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {stats.balance >= 0 && stats.income > 0 && (stats.balance / stats.income) * 100 > 30 && (
                <div className="p-3 bg-success/10 border border-success/30 ">
                  <div className="flex items-start gap-2">
                    <TrendUp size={16} className="text-success mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-success">Great Saving!</div>
                      <div className="text-xs text-text-tertiary mt-1">
                        <span className="inline-flex items-center gap-2">
                          <Star size={16} className="text-text-primary" />
                          You&apos;re saving over 30% of your income
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-text-primary/10 border border-text-primary/30 ">
                <div className="text-sm font-medium text-text-primary mb-2">Top Spending</div>
                <div className="text-xs text-text-tertiary">
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