


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
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
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
  error?: string;
  className?: string;
  'data-testid'?: string;
};

export type SelectProps = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  error?: string;
  className?: string;
  'data-testid'?: string;
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



// Base types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// Module and Assessment types
export interface Assessment extends BaseEntity {
  name: string;
  weight: number;
  dueDate: string;
  grade?: number;
  submitted: boolean;
  graded: boolean;
  type: 'exam' | 'assignment' | 'quiz' | 'project' | 'presentation' | 'participation' | 'other';
  moduleId: string;
  description?: string;
  rubric?: {
    criteria: string;
    weight: number;
    score?: number;
    maxScore: number;
  }[];
  resources?: Resource[];
}

export interface Module extends BaseEntity {
  code: string;
  name: string;
  credits: number;
  semester: string;
  currentGrade: number;
  targetGrade: number;
  progress: number;
  assessments: Assessment[];
  prerequisites?: string[];
  corequisites?: string[];
  description?: string;
  learningOutcomes?: string[];
  coverImage?: string;  
  targetMark?: number;
  specialCode?: number;
  color?: string;
  professor?: string;
  schedule?: ClassSchedule[];
  resources?: Resource[];
}

// Additional types
export interface Resource {
  id: string;
  name: string;
  type: 'syllabus' | 'slides' | 'notes' | 'assignment' | 'other';
  url: string;
  uploadedAt: string;
  size?: number;
  moduleId?: string;
  assessmentId?: string;
}

export interface ClassSchedule {
  id: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  location: string;
  type: 'lecture' | 'tutorial' | 'lab' | 'seminar';
  recurring: boolean;
  frequency?: 'weekly' | 'biweekly' | 'monthly';
  exceptions?: string[]; // Dates when class doesn't occur
}

export type PageType = 'dashboard' | 'academic' | 'academic-progress' | 'roadmap' | 'tasks' | 'finances' | 'analytics' | 'settings';

// Export Button component for easy importing
export { Button } from '@/components/ui/Button';
