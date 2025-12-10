// Component Props Types
export interface ProgressRingProps {
  percentage: number;
  size?: number;
}

export interface ProgressBarProps {
  percentage: number;
  height?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps {
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  step?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  required?: boolean;
}

// Data Model Types
export interface Grade {
  id: string;
  name: string;
  weight: number;
  score: number;
}

export interface Module {
  id: string;
  code: string;
  name: string;
  professor: string;
  semester: string;
  credits: number;
  weight: number;
  currentGrade: number;
  progress: number;
  coverImage: string;
  grades: Grade[];
}

export interface Task {
  id: string;
  title: string;
  moduleCode: string;
  dueDate: string;
  priority: string;
  status: string;
  completed: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
  appliedDate: string;
  notes: string;
}

// Store Types
export type ModalType = 'module' | 'task' | 'transaction' | 'application' | null;
export type PageType = 'dashboard' | 'modules' | 'tasks' | 'finance' | 'career' | 'module-detail';
export type EditingItem = Module | Task | Transaction | Application | null;