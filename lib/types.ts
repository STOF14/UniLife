


// Type Definitions
export type ProgressRingProps = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
};

export type ProgressBarProps = {
  percentage: number;
  height?: number;
  color?: string;
};

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export type ButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  'data-testid'?: string;
};

export type InputProps = {
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  step?: string;
  min?: string;
  max?: string;
  inputMode?: 'text' | 'search' | 'email' | 'tel' | 'url' | 'none' | 'numeric' | 'decimal';
  'data-testid'?: string;
};

export type SelectProps = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  'data-testid'?: string;
};

export type Assessment = {
  id: string;
  name: string;
  type: 'assignment' | 'test' | 'exam';
  dueDate: string;
  weight?: number;
};

export type Module = {
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
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  targetMark: number; // <--- ADD THIS
};

export type Task = {
  id: string;
  title: string;
  moduleCode: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'inprogress' | 'done';
  completed: boolean;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  created_at?: string;
  user_id?: string;
};

export type PageType = 'dashboard' | 'academic' | 'academic-progress' | 'tasks' | 'finances' | 'analytics' | 'settings';