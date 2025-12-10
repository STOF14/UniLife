'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, CheckSquare, DollarSign, Settings, User, Menu, X, Plus, Edit, Trash2, ArrowLeft, Download, Upload, Upload as UploadIcon, Camera, Target as TargetIcon, TrendingUp, Info, ChevronLeft, ChevronRight } from 'lucide-react';

// Type Definitions
type ProgressRingProps = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
};

type ProgressBarProps = {
  percentage: number;
  height?: number;
  color?: string;
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
};

type InputProps = {
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  step?: string;
};

type SelectProps = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
};

type Assessment = {
  id: string;
  name: string;
  type: 'assignment' | 'test' | 'exam';
  dueDate: string;
  weight?: number;
};

type Module = {
  id: string;
  code: string;
  name: string;
  semester: string;
  credits: number;
  currentGrade: number;
  targetGrade: number;
  progress: number;
  coverImage?: string;
  assessments: Assessment[];
  specialCode?: number;
};

type Task = {
  id: string;
  title: string;
  moduleCode: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'inprogress' | 'done';
  completed: boolean;
};

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
};

const useDatabase = () => {
  const [modules, setModules] = useState<Module[]>([
    {
      id: '1',
      code: 'PHY114',
      name: 'First course in physics 114',
      semester: '2024',
      credits: 16,
      currentGrade: 51,
      targetGrade: 60,
      progress: 100,
      coverImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      assessments: []
    },
    {
      id: '2',
      code: 'PHY124',
      name: 'First course in physics 124',
      semester: '2024',
      credits: 16,
      currentGrade: 50,
      targetGrade: 60,
      progress: 100,
      coverImage: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      assessments: []
    },
    {
      id: '3',
      code: 'WTW114',
      name: 'Calculus 114',
      semester: '2024',
      credits: 16,
      currentGrade: 50,
      targetGrade: 65,
      progress: 100,
      coverImage: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      assessments: []
    },
    {
      id: '4',
      code: 'COS132',
      name: 'Imperative programming 132',
      semester: '2024',
      credits: 16,
      currentGrade: 56,
      targetGrade: 65,
      progress: 100,
      coverImage: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      assessments: []
    },
    {
      id: '5',
      code: 'COS122',
      name: 'Operating systems 122',
      semester: '2024',
      credits: 16,
      currentGrade: 63,
      targetGrade: 70,
      progress: 100,
      coverImage: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      assessments: []
    },
    {
      id: '6',
      code: 'COS110',
      name: 'Program design: Introduction 110',
      semester: '2025',
      credits: 16,
      currentGrade: 61,
      targetGrade: 70,
      progress: 80,
      coverImage: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      assessments: [
        { id: 'a1', name: 'Assignment 3', type: 'assignment', dueDate: '2025-12-13' },
        { id: 'a2', name: 'Final Project', type: 'exam', dueDate: '2025-12-15' }
      ]
    },
    {
      id: '7',
      code: 'COS151',
      name: 'Introduction to computer science 151',
      semester: '2025',
      credits: 8,
      currentGrade: 86,
      targetGrade: 85,
      progress: 90,
      coverImage: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      assessments: [
        { id: 'a3', name: 'Quiz 4', type: 'test', dueDate: '2025-12-12' }
      ]
    },
    {
      id: '8',
      code: 'WTW124',
      name: 'Mathematics 124',
      semester: '2025',
      credits: 16,
      currentGrade: 50,
      targetGrade: 60,
      progress: 85,
      coverImage: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      assessments: []
    },
    {
      id: '9',
      code: 'WTW123',
      name: 'Numerical analysis 123',
      semester: '2025',
      credits: 8,
      currentGrade: 55,
      targetGrade: 65,
      progress: 75,
      coverImage: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      assessments: [
        { id: 'a4', name: 'Practical Test', type: 'test', dueDate: '2025-12-14' }
      ]
    }
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'COS110 Assignment 3', moduleCode: 'COS110', dueDate: '2025-12-13', priority: 'high', status: 'todo', completed: false },
    { id: '2', title: 'COS151 Quiz 4 Study', moduleCode: 'COS151', dueDate: '2025-12-12', priority: 'high', status: 'inprogress', completed: false },
    { id: '3', title: 'WTW123 Practical Prep', moduleCode: 'WTW123', dueDate: '2025-12-14', priority: 'medium', status: 'todo', completed: false },
    { id: '4', title: 'COS110 Final Project', moduleCode: 'COS110', dueDate: '2025-12-15', priority: 'high', status: 'todo', completed: false }
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', date: '2024-12-09', description: 'Textbooks', amount: -120.00, category: 'Books' },
    { id: '2', date: '2024-12-08', description: 'Groceries', amount: -45.50, category: 'Food' },
    { id: '3', date: '2024-12-07', description: 'Tuition Payment', amount: -1500.00, category: 'Tuition' },
    { id: '4', date: '2024-12-05', description: 'Part-time Job', amount: 300.00, category: 'Income' }
  ]);

  return { modules, setModules, tasks, setTasks, transactions, setTransactions };
};

type PageType = 'dashboard' | 'academic' | 'academic-progress' | 'tasks' | 'finances' | 'settings';

const useStore = () => {
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

const calculateCWA = (modules: Module[]) => {
  let totalWeightedScore = 0;
  let totalCredits = 0;

  modules.forEach(module => {
    totalCredits += module.credits;
    
    if (module.specialCode && [988, 997, 998].includes(module.specialCode)) {
      totalWeightedScore += 0;
    } else {
      totalWeightedScore += module.currentGrade * module.credits;
    }
  });

  return totalCredits > 0 ? (totalWeightedScore / totalCredits).toFixed(2) : '0.00';
};

const calculateTermAverage = (modules: Module[], term: string) => {
  const termModules = modules.filter(m => m.semester === term);
  return calculateCWA(termModules);
};

const ProgressRing = ({ percentage, size = 80, strokeWidth = 8 }: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#38383A" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#0A84FF" strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <span className="absolute text-lg font-mono font-semibold text-white">{percentage}%</span>
    </div>
  );
};

const ProgressBar = ({ percentage, height = 4, color = '#0A84FF' }: ProgressBarProps) => (
  <div className="w-full bg-[#38383A] rounded-full overflow-hidden" style={{ height: `${height}px` }}>
    <div className="h-full rounded-full transition-all duration-800 ease-out" 
      style={{ width: `${percentage}%`, backgroundColor: color }} />
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#141414] border border-[#38383A] rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-[#EBEBF599] hover:text-white">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  className = '', 
  disabled = false,
  type = 'button'
}: ButtonProps) => {
  const variants = {
    primary: 'bg-[#0A84FF] hover:bg-[#409CFF] text-white',
    secondary: 'bg-[#141414] border border-[#38383A] text-[#EBEBF599] hover:border-[#0A84FF] hover:text-white',
    danger: 'bg-[#FF453A] hover:bg-[#FF6961] text-white'
  } as const;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  step
}: InputProps) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">
      {label} {required && <span className="text-[#FF453A]">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      step={step}
      className="w-full bg-[#0A0A0A] border border-[#38383A] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#0A84FF]"
    />
  </div>
);

const Select = ({ 
  label, 
  value, 
  onChange, 
  options, 
  required = false 
}: SelectProps) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">
      {label} {required && <span className="text-[#FF453A]">*</span>}
    </label>
    <select
      value={value}
      onChange={onChange}
      required={required}
      className="w-full bg-[#0A0A0A] border border-[#38383A] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#0A84FF]"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const UniLife = () => {
  const store = useStore();
  const db = useDatabase();
  const [isMobile, setIsMobile] = useState(false);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigation = [
    { id: 'dashboard' as PageType, icon: Calendar, label: 'Dashboard' },
    { id: 'academic' as PageType, icon: BookOpen, label: 'Academic' },
    { id: 'academic-progress' as PageType, icon: TrendingUp, label: 'Progress' },
    { id: 'tasks' as PageType, icon: CheckSquare, label: 'Tasks' },
    { id: 'finances' as PageType, icon: DollarSign, label: 'Finances' },
    { id: 'settings' as PageType, icon: Settings, label: 'Settings' },
  ];

  const cwa = calculateCWA(db.modules);
  const term2024 = calculateTermAverage(db.modules, '2024');
  const term2025 = calculateTermAverage(db.modules, '2025');

  const getThisWeekTasks = (moduleCode: string) => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return db.tasks.filter(task => 
      task.moduleCode === moduleCode &&
      new Date(task.dueDate) >= today &&
      new Date(task.dueDate) <= nextWeek &&
      !task.completed
    );
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return db.tasks.filter(task => task.dueDate === dateStr);
  };

  const exportData = () => {
    const data = {
      modules: db.modules,
      tasks: db.tasks,
      transactions: db.transactions,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unilife-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

const ModuleForm = () => {
  const [formState, setFormState] = useState<Partial<Module>>(store.editingModule || {
    code: '', name: '', semester: '2025', credits: 16, currentGrade: 0, targetGrade: 60, progress: 0, assessments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const moduleToSave: Module = {
        ...formState,
        id: store.editingModule?.id || Date.now().toString(),
        assessments: store.editingModule?.assessments || [],
        coverImage: store.editingModule?.coverImage || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        created_at: store.editingModule?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Module;
      
      const success = await db.saveModule(moduleToSave);
      
      if (success) {
        // Success - modal will close automatically via real-time subscription
        store.setShowModal(null);
        store.setEditingModule(null);
      } else {
        alert('Failed to save module. Please try again.');
      }
    } catch (error) {
      console.error('Error saving module:', error);
      alert('Error saving module. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input 
          label="Module Code" 
          value={formState.code || ''} 
          onChange={e => setFormState({...formState, code: e.target.value})} 
          placeholder="PHY114" 
          required 
        />
        <Input 
          label="Module Name" 
          value={formState.name || ''} 
          onChange={e => setFormState({...formState, name: e.target.value})} 
          placeholder="Physics 114" 
          required 
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input 
          label="Credits" 
          type="number" 
          value={formState.credits || 16} 
          onChange={e => setFormState({...formState, credits: parseInt(e.target.value)})} 
          placeholder="16" 
          required 
          min="1"
          max="32"
        />
        <Input 
          label="Current Grade" 
          type="number" 
          value={formState.currentGrade || 0} 
          onChange={e => setFormState({...formState, currentGrade: parseInt(e.target.value)})} 
          placeholder="75" 
          min="0"
          max="100"
        />
        <Input 
          label="Target Grade" 
          type="number" 
          value={formState.targetGrade || 60} 
          onChange={e => setFormState({...formState, targetGrade: parseInt(e.target.value)})} 
          placeholder="80" 
          min="0"
          max="100"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select 
          label="Semester" 
          value={formState.semester || '2025'} 
          onChange={e => setFormState({...formState, semester: e.target.value})}
          options={[
            {value: '2024', label: '2024'},
            {value: '2025', label: '2025'},
            {value: '2026', label: '2026'},
            {value: '2027', label: '2027'},
          ]} 
          required 
        />
        <Input 
          label="Progress (%)" 
          type="number" 
          value={formState.progress || 0} 
          onChange={e => setFormState({...formState, progress: parseInt(e.target.value)})} 
          placeholder="75" 
          min="0"
          max="100"
        />
      </div>
      <div className="flex gap-3 justify-end pt-4">
        <Button 
          variant="secondary" 
          onClick={() => {
            store.setShowModal(null);
            store.setEditingModule(null);
          }}
          type="button"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            `${store.editingModule ? 'Update' : 'Add'} Module`
          )}
        </Button>
      </div>
    </form>
  );
};

const TaskForm = () => {
  const [formState, setFormState] = useState<Partial<Task>>(store.editingTask || {
    title: '', moduleCode: '', dueDate: new Date().toISOString().split('T')[0], priority: 'medium', status: 'todo', completed: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const taskToSave: Task = {
        ...formState,
        id: store.editingTask?.id || Date.now().toString(),
        created_at: store.editingTask?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Task;
      
      const success = await db.saveTask(taskToSave);
      
      if (success) {
        // Success - modal will close automatically via real-time subscription
        store.setShowModal(null);
        store.setEditingTask(null);
      } else {
        alert('Failed to save task. Please try again.');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Error saving task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input 
        label="Task Title" 
        value={formState.title || ''} 
        onChange={e => setFormState({...formState, title: e.target.value})} 
        placeholder="Complete assignment" 
        required 
      />
      <div className="grid grid-cols-2 gap-4">
        <Select 
          label="Module" 
          value={formState.moduleCode || ''} 
          onChange={e => setFormState({...formState, moduleCode: e.target.value})}
          options={[
            {value: '', label: 'None'}, 
            ...db.modules.map(m => ({value: m.code, label: `${m.code} - ${m.name.substring(0, 20)}${m.name.length > 20 ? '...' : ''}`}))
          ]} 
          required 
        />
        <Input 
          label="Due Date" 
          type="date" 
          value={formState.dueDate || ''} 
          onChange={e => setFormState({...formState, dueDate: e.target.value})} 
          placeholder="" 
          required 
          min={new Date().toISOString().split('T')[0]}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select 
          label="Priority" 
          value={formState.priority || 'medium'} 
          onChange={e => setFormState({...formState, priority: e.target.value as Task['priority']})}
          options={[
            {value: 'low', label: 'Low'}, 
            {value: 'medium', label: 'Medium'}, 
            {value: 'high', label: 'High'}
          ]} 
          required 
        />
        <Select 
          label="Status" 
          value={formState.status || 'todo'} 
          onChange={e => setFormState({...formState, status: e.target.value as Task['status']})}
          options={[
            {value: 'todo', label: 'To Do'}, 
            {value: 'inprogress', label: 'In Progress'}, 
            {value: 'done', label: 'Done'}
          ]} 
          required 
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="completed"
          checked={formState.completed || false}
          onChange={e => setFormState({...formState, completed: e.target.checked})}
          className="w-4 h-4 rounded border-[#38383A] bg-[#0A0A0A]"
        />
        <label htmlFor="completed" className="text-sm text-white cursor-pointer">
          Mark as completed
        </label>
      </div>
      <div className="flex gap-3 justify-end pt-4">
        <Button 
          variant="secondary" 
          onClick={() => {
            store.setShowModal(null);
            store.setEditingTask(null);
          }}
          type="button"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            `${store.editingTask ? 'Update' : 'Add'} Task`
          )}
        </Button>
      </div>
    </form>
  );
};

const TransactionForm = () => {
  const [formState, setFormState] = useState<Partial<Transaction>>(store.editingTransaction || {
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
        id: store.editingTransaction?.id || Date.now().toString(),
        created_at: store.editingTransaction?.created_at || new Date().toISOString(),
      } as Transaction;
      
      const success = await db.saveTransaction(transactionToSave);
      
      if (success) {
        // Success - modal will close automatically via real-time subscription
        store.setShowModal(null);
        store.setEditingTransaction(null);
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
    // Remove any non-numeric characters except decimal point
    const num = value.replace(/[^0-9.-]/g, '');
    return num === '' ? '0' : num;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input 
          label="Date" 
          type="date" 
          value={formState.date || ''} 
          onChange={e => setFormState({...formState, date: e.target.value})} 
          placeholder="" 
          required 
          max={new Date().toISOString().split('T')[0]}
        />
        <Select 
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
        <div className="flex gap-2 mt-2">
          <span className="text-xs text-[#EBEBF599]">Quick add:</span>
          {[10, 20, 50, 100, 200].map(amt => (
            <button
              key={amt}
              type="button"
              onClick={() => setFormState({...formState, amount: -amt})}
              className="text-xs px-2 py-1 bg-[#38383A] hover:bg-[#444444] rounded transition-colors text-white"
            >
              -R{amt}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFormState({...formState, amount: Math.abs(formState.amount || 0)})}
            className="text-xs px-2 py-1 bg-[#30D158]/20 hover:bg-[#30D158]/30 rounded transition-colors text-[#30D158]"
          >
            Make positive
          </button>
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-4">
        <Button 
          variant="secondary" 
          onClick={() => {
            store.setShowModal(null);
            store.setEditingTransaction(null);
          }}
          type="button"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            `${store.editingTransaction ? 'Update' : 'Add'} Transaction`
          )}
        </Button>
      </div>
    </form>
  );
};

  const DashboardPage = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentCalendarDate);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    const getTasksThisWeek = () => {
      const startOfWeek = new Date(today);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);
      
      return db.tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate >= startOfWeek && taskDate <= endOfWeek && !task.completed;
      }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    };

    const thisWeekTasks = getTasksThisWeek();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
          <Button variant="secondary" onClick={exportData}><Download size={16} className="mr-2" />Export</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#141414] border border-[#38383A] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">
                {monthNames[month]} {year}
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentCalendarDate(new Date(year, month - 1, 1))}
                  className="p-2 hover:bg-[#38383A] rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} className="text-white" />
                </button>
                <button 
                  onClick={() => setCurrentCalendarDate(new Date())}
                  className="px-4 py-2 hover:bg-[#38383A] rounded-lg transition-colors text-sm text-white"
                >
                  Today
                </button>
                <button 
                  onClick={() => setCurrentCalendarDate(new Date(year, month + 1, 1))}
                  className="p-2 hover:bg-[#38383A] rounded-lg transition-colors"
                >
                  <ChevronRight size={20} className="text-white" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-[#EBEBF599] py-2">
                  {day}
                </div>
              ))}

              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(year, month, day);
                const dateStr = date.toISOString().split('T')[0];
                const events = getEventsForDate(date);
                const isToday = isCurrentMonth && day === today.getDate();

                return (
                  <div 
                    key={day}
                    className={`aspect-square border border-[#38383A] rounded-lg p-2 hover:border-[#0A84FF] transition-all cursor-pointer ${
                      isToday ? 'bg-[#0A84FF]/20 border-[#0A84FF]' : 'bg-[#0A0A0A]'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-[#0A84FF]' : 'text-white'}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {events.slice(0, 2).map(event => (
                        <div 
                          key={event.id}
                          className={`text-[10px] px-1 py-0.5 rounded truncate ${
                            event.priority === 'high' ? 'bg-[#FF453A]/20 text-[#FF453A]' :
                            event.priority === 'medium' ? 'bg-[#FF9F0A]/20 text-[#FF9F0A]' :
                            'bg-[#30D158]/20 text-[#30D158]'
                          }`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-[9px] text-[#EBEBF599] px-1">
                          +{events.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#141414] border border-[#38383A] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">This Week</h3>
                <span className="text-xs px-2 py-1 bg-[#FF453A]/20 text-[#FF453A] rounded-full">
                  {thisWeekTasks.length} tasks
                </span>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {thisWeekTasks.length > 0 ? (
                  thisWeekTasks.map(task => (
                    <div key={task.id} className="flex items-start gap-3 p-3 bg-[#0A0A0A] rounded-lg hover:bg-[#1C1C1C] transition-colors">
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        task.priority === 'high' ? 'bg-[#FF453A]' : 
                        task.priority === 'medium' ? 'bg-[#FF9F0A]' : 'bg-[#30D158]'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium">{task.title}</div>
                        <div className="text-xs text-[#EBEBF599] mt-1">
                          {task.moduleCode} · {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#EBEBF599] text-sm">
                    No tasks this week! 🎉
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#141414] border border-[#38383A] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#EBEBF599]">Current CWA</span>
                    <span className="text-2xl font-bold font-mono text-[#0A84FF]">{cwa}%</span>
                  </div>
                </div>
                <div className="h-px bg-[#38383A]" />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#EBEBF599]">Active Modules</span>
                    <span className="text-lg font-bold text-white">{db.modules.length}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#EBEBF599]">Tasks Completed</span>
                    <span className="text-lg font-bold text-white">
                      {db.tasks.filter(t => t.completed).length}/{db.tasks.length}
                    </span>
                  </div>
                  <ProgressBar percentage={(db.tasks.filter(t => t.completed).length / db.tasks.length) * 100} height={3} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#EBEBF599]">Avg Progress</span>
                    <span className="text-lg font-bold text-white">
                      {Math.round(db.modules.reduce((sum, m) => sum + m.progress, 0) / db.modules.length)}%
                    </span>
                  </div>
                  <ProgressBar percentage={db.modules.reduce((sum, m) => sum + m.progress, 0) / db.modules.length} height={3} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AcademicPage = () => {
    const handlePhotoUpload = (moduleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        db.setModules(db.modules.map(m => 
          m.id === moduleId ? { ...m, coverImage: reader.result as string } : m
        ));
      };
      reader.readAsDataURL(file);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-white">Academic</h1>
          <Button onClick={() => { store.setEditingModule(null); store.setShowModal('module'); }}>
            <Plus size={16} className="mr-1" />Add Module
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {db.modules.map(module => {
            const thisWeekTasks = getThisWeekTasks(module.code);
            const targetDiff = module.currentGrade - module.targetGrade;
            
            return (
              <div 
                key={module.id} 
                className="bg-[#141414] border border-[#38383A] rounded-xl overflow-hidden transition-all duration-200 hover:border-[#0A84FF] hover:shadow-lg hover:-translate-y-1"
              >
                <div className="h-32 relative group cursor-pointer" style={{ 
                  background: module.coverImage?.startsWith('data:') ? 'none' : module.coverImage || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundImage: module.coverImage?.startsWith('data:') ? `url(${module.coverImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <label className="p-2 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm transition-colors cursor-pointer">
                      <Camera size={16} className="text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handlePhotoUpload(module.id, e)}
                      />
                    </label>
                    <button 
                      onClick={(e) => { e.stopPropagation(); store.setEditingModule(module); store.setShowModal('module'); }}
                      className="p-2 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm transition-colors"
                    >
                      <Edit size={16} className="text-white" />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (confirm(`Delete ${module.code}?`)) {
                          db.setModules(db.modules.filter(m => m.id !== module.id));
                        }
                      }}
                      className="p-2 bg-black/50 hover:bg-[#FF453A]/70 rounded-lg backdrop-blur-sm transition-colors"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <div className="text-xs text-[#EBEBF599] mb-1">{module.code} · {module.credits} credits</div>
                    <h3 className="text-base font-semibold text-white line-clamp-2">{module.name}</h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ProgressRing percentage={module.currentGrade} size={50} strokeWidth={5} />
                      <div>
                        <div className="text-xs text-[#EBEBF599]">Current</div>
                        <div className="text-sm font-mono text-white">{module.currentGrade}%</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#EBEBF599]">Target: {module.targetGrade}%</div>
                      <div className={`text-sm font-mono font-semibold ${
                        targetDiff >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'
                      }`}>
                        {targetDiff >= 0 ? '+' : ''}{targetDiff}%
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-[#EBEBF599] mb-1">
                      <span>Progress to target</span>
                      <span>{Math.min(Math.round((module.currentGrade / module.targetGrade) * 100), 100)}%</span>
                    </div>
                    <ProgressBar 
                      percentage={Math.min((module.currentGrade / module.targetGrade) * 100, 100)}
                      color={targetDiff >= 0 ? '#30D158' : '#FF9F0A'}
                    />
                  </div>

                  {thisWeekTasks.length > 0 && (
                    <div className="pt-3 border-t border-[#38383A]">
                      <div className="text-xs font-medium text-[#EBEBF599] mb-2">📋 This Week:</div>
                      <div className="space-y-1">
                        {thisWeekTasks.slice(0, 2).map(task => (
                          <div key={task.id} className="text-xs text-white flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              task.priority === 'high' ? 'bg-[#FF453A]' : 'bg-[#FF9F0A]'
                            }`} />
                            <span className="truncate">{task.title}</span>
                          </div>
                        ))}
                        {thisWeekTasks.length > 2 && (
                          <div className="text-xs text-[#EBEBF599]">+{thisWeekTasks.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const AcademicProgressPage = () => {
    const currentYear = '2025';
    const currentYearModules = db.modules.filter(m => m.semester === currentYear);
    const currentYearAverage = calculateTermAverage(db.modules, currentYear);

    const years = [...new Set(db.modules.map(m => m.semester))].sort();

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-white">Academic Progress</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#141414] border border-[#38383A] rounded-2xl p-6">
            <div className="text-center mb-8">
              <div className="text-sm text-[#EBEBF599] mb-2">Cumulative Weighted Average</div>
              <div className="text-6xl font-mono font-bold text-[#0A84FF] mb-2">{cwa}%</div>
              <div className="text-xs text-[#EBEBF599]">
                Based on {db.modules.reduce((sum, m) => sum + m.credits, 0)} total credits
              </div>
            </div>

            <div className="space-y-6">
              {years.map(year => {
                const yearModules = db.modules.filter(m => m.semester === year);
                const yearAverage = calculateTermAverage(db.modules, year);
                const yearCredits = yearModules.reduce((sum, m) => sum + m.credits, 0);

                return (
                  <div key={year} className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#38383A]">
                      <h3 className="text-lg font-semibold text-white">Term {year}</h3>
                      <div className="text-right">
                        <div className="text-2xl font-mono font-bold text-[#0A84FF]">{yearAverage}%</div>
                        <div className="text-xs text-[#EBEBF599]">{yearCredits} credits</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {yearModules.map(module => (
                        <div 
                          key={module.id} 
                          className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg hover:bg-[#1C1C1C] transition-colors"
                        >
                          <div className="flex-1">
                            <div className="text-sm text-white font-medium">{module.code}</div>
                            <div className="text-xs text-[#EBEBF599]">{module.credits} credits</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-lg font-mono font-semibold text-white">{module.currentGrade}%</div>
                            </div>
                            <div className="w-16 text-right">
                              <div className="text-sm font-mono text-[#0A84FF]">
                                {(module.currentGrade * module.credits).toFixed(0)}
                              </div>
                              <div className="text-[10px] text-[#EBEBF599]">weighted</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-[#0A84FF]/10 border border-[#0A84FF]/30 rounded-lg">
              <div className="text-xs text-[#EBEBF599] mb-2">Formula:</div>
              <div className="text-xs font-mono text-[#0A84FF]">
                CWA = Σ(credits × grade) / Σ(total credits)
              </div>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#38383A] rounded-2xl p-6">
            <div className="text-center mb-8">
              <div className="text-sm text-[#EBEBF599] mb-2">Current Year Average</div>
              <div className="text-6xl font-mono font-bold text-[#30D158] mb-2">{currentYearAverage}%</div>
              <div className="text-xs text-[#EBEBF599]">
                Term {currentYear} • {currentYearModules.reduce((sum, m) => sum + m.credits, 0)} credits
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Module Performance</h3>
              
              {currentYearModules.map(module => {
                const targetDiff = module.currentGrade - module.targetGrade;
                const progressToTarget = Math.min((module.currentGrade / module.targetGrade) * 100, 100);

                return (
                  <div 
                    key={module.id} 
                    className="p-4 bg-[#0A0A0A] rounded-lg hover:bg-[#1C1C1C] transition-colors border border-[#38383A] hover:border-[#0A84FF]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{module.code}</div>
                        <div className="text-xs text-[#EBEBF599] line-clamp-1">{module.name}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ProgressRing percentage={module.currentGrade} size={45} strokeWidth={4} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="text-center p-2 bg-[#141414] rounded">
                        <div className="text-xs text-[#EBEBF599]">Current</div>
                        <div className="text-sm font-mono font-semibold text-white">{module.currentGrade}%</div>
                      </div>
                      <div className="text-center p-2 bg-[#141414] rounded">
                        <div className="text-xs text-[#EBEBF599]">Target</div>
                        <div className="text-sm font-mono font-semibold text-white">{module.targetGrade}%</div>
                      </div>
                      <div className="text-center p-2 bg-[#141414] rounded">
                        <div className="text-xs text-[#EBEBF599]">Diff</div>
                        <div className={`text-sm font-mono font-semibold ${
                          targetDiff >= 0 ? 'text-[#30D158]' : 'text-[#FF453A]'
                        }`}>
                          {targetDiff >= 0 ? '+' : ''}{targetDiff}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-[#EBEBF599] mb-1">
                        <span>Progress to target</span>
                        <span>{Math.round(progressToTarget)}%</span>
                      </div>
                      <ProgressBar 
                        percentage={progressToTarget}
                        color={targetDiff >= 0 ? '#30D158' : '#FF9F0A'}
                        height={6}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-[#30D158]/10 border border-[#30D158]/30 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-[#EBEBF599] mb-1">Modules Above Target</div>
                  <div className="text-2xl font-bold text-[#30D158]">
                    {currentYearModules.filter(m => m.currentGrade >= m.targetGrade).length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#EBEBF599] mb-1">Average Progress</div>
                  <div className="text-2xl font-bold text-[#30D158]">
                    {Math.round(currentYearModules.reduce((sum, m) => sum + m.progress, 0) / currentYearModules.length)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TasksPage = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Tasks</h1>
        <Button onClick={() => { store.setEditingTask(null); store.setShowModal('task'); }}>
          <Plus size={16} className="mr-1" />Add Task
        </Button>
      </div>

      <div className="bg-[#141414] border border-[#38383A] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0A0A0A]">
            <tr>
              <th className="text-left text-sm font-medium text-[#EBEBF599] px-6 py-4">Task</th>
              <th className="text-left text-sm font-medium text-[#EBEBF599] px-6 py-4">Module</th>
              <th className="text-left text-sm font-medium text-[#EBEBF599] px-6 py-4">Due</th>
              <th className="text-left text-sm font-medium text-[#EBEBF599] px-6 py-4">Priority</th>
              <th className="text-left text-sm font-medium text-[#EBEBF599] px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {db.tasks.map((task, i) => (
              <tr key={task.id} className={`border-b border-[#38383A]/50 hover:bg-[#1C1C1C] ${i % 2 === 0 ? 'bg-[#0A0A0A]' : 'bg-[#000000]'}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={task.completed}
                      onChange={() => db.setTasks(db.tasks.map(t => t.id === task.id ? {...t, completed: !t.completed} : t))}
                      className="w-4 h-4 rounded border-[#38383A]" 
                    />
                    <span className={`text-sm ${task.completed ? 'line-through text-[#EBEBF599]' : 'text-white'}`}>{task.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#EBEBF599]">{task.moduleCode}</td>
                <td className="px-6 py-4 text-sm font-mono text-[#EBEBF599]">{task.dueDate}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'high' ? 'bg-[#FF453A]/20 text-[#FF453A]' :
                    task.priority === 'medium' ? 'bg-[#FF9F0A]/20 text-[#FF9F0A]' : 'bg-[#30D158]/20 text-[#30D158]'
                  }`}>{task.priority}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => { store.setEditingTask(task); store.setShowModal('task'); }}
                      className="text-[#EBEBF54D] hover:text-white">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => db.setTasks(db.tasks.filter(t => t.id !== task.id))}
                      className="text-[#EBEBF54D] hover:text-[#FF453A]">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const FinancesPage = () => {
    const totalBalance = db.transactions.reduce((sum, t) => sum + t.amount, 0);
    const thisMonth = db.transactions.filter(t => t.date.startsWith('2024-12')).reduce((sum, t) => sum + t.amount, 0);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-white">Finances</h1>
          <Button onClick={() => { store.setEditingTransaction(null); store.setShowModal('transaction'); }}>
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
            <div className="text-3xl font-bold text-white">{db.transactions.length}</div>
          </div>
        </div>

        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {db.transactions.slice().reverse().map((transaction, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#38383A]/50">
                <div className="flex-1">
                  <div className="text-sm text-white">{transaction.description}</div>
                  <div className="text-xs text-[#EBEBF599] font-mono">{transaction.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 bg-[#38383A]/30 rounded text-[#EBEBF599]">{transaction.category}</span>
                  <div className={`text-sm font-mono font-semibold ${transaction.amount > 0 ? 'text-[#30D158]' : 'text-white'}`}>
                    R{transaction.amount.toFixed(2)}
                  </div>
                  <button onClick={() => { store.setEditingTransaction(transaction); store.setShowModal('transaction'); }}
                    className="text-[#EBEBF54D] hover:text-white">
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

  const SettingsPage = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-white">Settings</h1>
      <div className="bg-[#141414] border border-[#38383A] rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Data Management</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-[#38383A]">
            <div>
              <div className="text-sm font-medium text-white">Export Data</div>
              <div className="text-xs text-[#EBEBF599]">Download all your data as JSON</div>
            </div>
            <Button onClick={exportData}><Download size={16} className="mr-2" />Export</Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (store.currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'academic': return <AcademicPage />;
      case 'academic-progress': return <AcademicProgressPage />;
      case 'tasks': return <TasksPage />;
      case 'finances': return <FinancesPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className={`fixed left-0 top-0 h-full bg-[#0A0A0A] border-r border-[#38383A] transition-all duration-300 z-10 ${
        store.sidebarExpanded ? 'w-60' : 'w-16'
      } ${isMobile && !store.sidebarExpanded ? '-translate-x-full' : ''}`}>
        <div className="p-4 border-b border-[#38383A]">
          <div className="text-xl font-bold text-white">{store.sidebarExpanded ? 'UniLife' : 'UL'}</div>
        </div>
        <nav className="p-2 flex-1 overflow-y-auto">
          {navigation.map(item => {
            const Icon = item.icon;
            const isActive = store.currentPage === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => store.setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-all ${
                  isActive ? 'bg-[#0A84FF]/10 text-[#0A84FF] border-l-4 border-[#0A84FF]' : 'text-[#EBEBF599] hover:bg-[#141414] hover:text-white'
                }`}
              >
                <Icon size={20} className="shrink-0" />
                {store.sidebarExpanded && <span className="text-sm font-medium truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#38383A]">
          <button 
            onClick={() => store.setSidebarExpanded(!store.sidebarExpanded)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[#EBEBF599] hover:bg-[#141414] hover:text-white"
          >
            {store.sidebarExpanded ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {!store.sidebarExpanded && (
        <button
          onClick={() => store.setSidebarExpanded(true)}
          className="fixed top-4 left-4 z-50 p-3 bg-[#141414] border border-[#38383A] rounded-lg hover:bg-[#1C1C1C] hover:border-[#0A84FF] transition-colors shadow-lg"
        >
          <Menu size={24} className="text-white" />
        </button>
      )}

      {isMobile && store.sidebarExpanded && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => store.setSidebarExpanded(false)} />
      )}

      <div className={`transition-all duration-300 ${store.sidebarExpanded ? 'ml-60' : 'ml-16'} ${isMobile ? 'ml-0' : ''}`}>
        <div className="max-w-[1440px] mx-auto p-6 md:p-12">{renderPage()}</div>
      </div>

      <Modal isOpen={store.showModal === 'module'} onClose={() => { store.setShowModal(null); store.setEditingModule(null); }}
        title={store.editingModule ? 'Edit Module' : 'Add New Module'}>
        <ModuleForm />
      </Modal>

      <Modal isOpen={store.showModal === 'task'} onClose={() => { store.setShowModal(null); store.setEditingTask(null); }}
        title={store.editingTask ? 'Edit Task' : 'Add New Task'}>
        <TaskForm />
      </Modal>

      <Modal isOpen={store.showModal === 'transaction'} onClose={() => { store.setShowModal(null); store.setEditingTransaction(null); }}
        title={store.editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}>
        <TransactionForm />
      </Modal>
    </div>
  );
};

export default UniLife;