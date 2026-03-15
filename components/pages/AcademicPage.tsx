'use client';

import { AcademicDashboard } from '@/components/academic/AcademicDashboard';
import type { Module } from '@/lib/types';

type AcademicPageProps = {
  modules: Module[];
  onImportYearbook: () => void;
};

export const AcademicPage = ({ modules, onImportYearbook }: AcademicPageProps) => {
  return <AcademicDashboard modules={modules} onImportYearbook={onImportYearbook} />;
};
