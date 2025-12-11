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
};

export type Assessment = {
  id: string;
  name: string;
  type: 'assignment' | 'test' | 'exam';
  dueDate: string;
  weight?: number;
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
