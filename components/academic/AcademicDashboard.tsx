// components/academic/AcademicDashboard.tsx
'use client';

import { useState } from 'react';
import { Module } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ModuleForm } from '@/components/academic/ModuleForm';
import {
  TrendUp,
  Plus,
  PencilSimple,
  Trash,
  MagnifyingGlass,
  ChartBar,
  Clock,
  CheckCircle,
  Trophy,
  UploadSimple
} from 'phosphor-react';
import { calculateCWA, calculateTermAverage, getGradeLetter } from '@/lib/utils/calculations';

interface AcademicDashboardProps {
  modules: Module[];
  onImportYearbook: () => void;
}

export function AcademicDashboard({ modules, onImportYearbook }: AcademicDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterMajor, setFilterMajor] = useState('all');
  const [showNeedsAttention, setShowNeedsAttention] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [importing, setImporting] = useState(false);

  // Calculate statistics
  const cwa = calculateCWA(modules);
  const averageGrade = modules.length > 0 
    ? modules.reduce((sum, m) => sum + (m.currentGrade || 0), 0) / modules.length 
    : 0;
  const totalCredits = modules.reduce((sum, m) => sum + m.credits, 0);
  const activeCredits = modules
    .filter(m => !(m.completed || m.currentGrade >= 100))
    .reduce((sum, m) => sum + m.credits, 0);
  const completedModules = modules.filter(m => m.progress === 100).length;
  const upcomingAssessments = modules.flatMap(m => 
    m.assessments?.filter(a => !a.submitted && new Date(a.dueDate) > new Date()) || []
  ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);

  // Get unique years and majors
  const years = [...new Set(modules.map(m => m.semester?.split(' ')[1] || '1'))].sort();
  const majors = [...new Set(modules.map(m => {
    // Extract major from module name or code
    if (m.code.startsWith('STK') || m.code.startsWith('WST')) return 'Statistics';
    if (m.code.startsWith('PHY')) return 'Physics';
    if (m.code.startsWith('MAT')) return 'Mathematics';
    if (m.code.startsWith('CMY')) return 'Chemistry';
    if (m.code.startsWith('AIM') || m.code.startsWith('LST') || m.code.startsWith('UPO')) return 'Academic Skills';
    return 'Other';
  }))].sort();

  const currentYear = new Date().getFullYear();

  // Filter modules
  const filteredModules = modules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = filterSemester === 'all' || module.semester === filterSemester;
    const matchesYear = filterYear === 'all' || module.semester?.includes(filterYear);
    const matchesMajor = filterMajor === 'all' || 
      (filterMajor === 'Statistics' && (module.code.startsWith('STK') || module.code.startsWith('WST'))) ||
      (filterMajor === 'Physics' && module.code.startsWith('PHY')) ||
      (filterMajor === 'Mathematics' && module.code.startsWith('MAT')) ||
      (filterMajor === 'Chemistry' && module.code.startsWith('CMY')) ||
      (filterMajor === 'Academic Skills' && (module.code.startsWith('AIM') || module.code.startsWith('LST') || module.code.startsWith('UPO'))) ||
      (filterMajor === 'Other' && !['STK', 'WST', 'PHY', 'MAT', 'CMY', 'AIM', 'LST', 'UPO'].some(prefix => module.code.startsWith(prefix)));

    const isCompleted = module.completed || module.currentGrade >= 100;
    const yearMatch = module.semester?.match(/\b20\d{2}\b/);
    const isPastYear = yearMatch ? parseInt(yearMatch[0], 10) < currentYear : false;
    const needsAttention = module.currentGrade < module.targetGrade;
    
    return matchesSearch && matchesSemester && matchesYear && matchesMajor && !isCompleted && !isPastYear && (!showNeedsAttention || needsAttention);
  });

  // Group modules by major
  const modulesByMajor = filteredModules.reduce((acc, module) => {
    let major = 'Other';
    if (module.code.startsWith('STK') || module.code.startsWith('WST')) major = 'Statistics';
    else if (module.code.startsWith('PHY')) major = 'Physics';
    else if (module.code.startsWith('MAT')) major = 'Mathematics';
    else if (module.code.startsWith('CMY')) major = 'Chemistry';
    else if (module.code.startsWith('AIM') || module.code.startsWith('LST') || module.code.startsWith('UPO')) major = 'Academic Skills';
    
    if (!acc[major]) acc[major] = [];
    acc[major].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  // Get unique semesters
  const semesters = [...new Set(modules.map(m => m.semester))].sort();

  const getGradeColor = (grade: number) => {
    if (grade >= 75) return 'text-success';
    if (grade >= 60) return 'text-text-primary';
    if (grade >= 50) return 'text-yellow-500';
    return 'text-danger';
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-success';
    if (progress >= 75) return 'bg-text-primary';
    if (progress >= 50) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-tertiary text-sm">CWA</p>
                <p className="text-2xl font-bold text-text-primary">{parseFloat(cwa).toFixed(1)}</p>
              </div>
              <ChartBar className="h-8 w-8 text-text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-tertiary text-sm">Average Grade</p>
                <p className={`text-2xl font-bold ${getGradeColor(averageGrade)}`}>
                  {averageGrade.toFixed(1)}%
                </p>
              </div>
              <TrendUp className="h-8 w-8 text-text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-tertiary text-sm">Total Credits</p>
                <p className="text-2xl font-bold text-text-primary">{totalCredits}</p>
              </div>
              <Trophy className="h-8 w-8 text-text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-tertiary text-sm">Completed</p>
                <p className="text-2xl font-bold text-text-primary">{completedModules}/{modules.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-tertiary text-sm">Active Credits</p>
                <p className="text-2xl font-bold text-text-primary">{activeCredits}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                <Input
                  placeholder="Search modules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-surface border-border text-text-primary"
                  label=""
                />
              </div>
            </div>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 bg-surface border-border  text-text-primary"
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>Year {year}</option>
              ))}
            </select>
            <select
              value={filterMajor}
              onChange={(e) => setFilterMajor(e.target.value)}
              className="px-3 py-2 bg-surface border-border  text-text-primary"
            >
              <option value="all">All Majors</option>
              {majors.map(major => (
                <option key={major} value={major}>{major}</option>
              ))}
            </select>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="px-3 py-2 bg-surface border-border  text-text-primary"
            >
              <option value="all">All Semesters</option>
              {semesters.map(semester => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterYear('all')}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors duration-300 ease-contemplative ${
                filterYear === 'all' ? 'bg-text-primary/20 text-text-primary border-text-primary/40' : 'bg-surface text-text-tertiary border-border'
              }`}
            >
              All Years
            </button>
            {years.map(year => (
              <button
                key={year}
                onClick={() => setFilterYear(year)}
                className={`px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors duration-300 ease-contemplative ${
                  filterYear === year ? 'bg-text-primary/20 text-text-primary border-text-primary/40' : 'bg-surface text-text-tertiary border-border'
                }`}
              >
                Year {year}
              </button>
            ))}
            {semesters.slice(0, 4).map(semester => (
              <button
                key={semester}
                onClick={() => setFilterSemester(semester)}
                className={`px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors duration-300 ease-contemplative ${
                  filterSemester === semester ? 'bg-success/20 text-success border-success/40' : 'bg-surface text-text-tertiary border-border'
                }`}
              >
                {semester}
              </button>
            ))}
            <button
              onClick={() => setShowNeedsAttention(!showNeedsAttention)}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium border transition-colors duration-300 ease-contemplative ${
                showNeedsAttention ? 'bg-warning/20 text-warning border-warning/40' : 'bg-surface text-text-tertiary border-border'
              }`}
            >
              Needs attention
            </button>
          </div>
          <Button onClick={onImportYearbook} className="bg-text-primary text-background hover:bg-text-secondary">
            <UploadSimple className="h-4 w-4 mr-2" />
            Import Yearbook
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Assessments */}
      {upcomingAssessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-text-primary flex items-center">
              <Clock className="h-5 w-5 mr-2 text-text-primary" />
              Upcoming Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAssessments.map((assessment, index) => {
                const module = modules.find(m => m.assessments?.some(a => a.dueDate === assessment.dueDate));
                const daysLeft = Math.ceil((new Date(assessment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-sm bg-surface/70">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2  ${daysLeft <= 3 ? 'bg-danger' : daysLeft <= 7 ? 'bg-warning' : 'bg-text-primary'}`} />
                      <div>
                        <p className="text-text-primary font-medium">{assessment.name}</p>
                        <p className="text-text-tertiary text-sm">{module?.code} - {module?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-text-primary text-sm">{daysLeft} days</p>
                      <p className="text-text-tertiary text-xs">{new Date(assessment.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredModules.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-text-primary text-sm mb-2">No active modules match your filters.</p>
            <p className="text-text-tertiary text-xs mb-4">Try adjusting filters or import your yearbook.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={onImportYearbook} className="bg-text-primary text-background hover:bg-text-secondary">
                <UploadSimple className="h-4 w-4 mr-2" />Import Yearbook
              </Button>
              <Button onClick={() => setShowAddModuleModal(true)} variant="secondary">
                <Plus className="h-4 w-4 mr-2" />Add Module
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modules by Major */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-text-primary">Modules</h2>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddModuleModal(true)} className="bg-text-primary text-background hover:bg-text-secondary">
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>
        </div>
        
        {Object.entries(modulesByMajor).map(([major, majorModules]) => (
          <Card key={major}>
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center justify-between">
                <span>{major}</span>
                <span className="text-sm text-text-tertiary">{majorModules.length} modules</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {majorModules.map((module) => (
                  <div key={module.id} className="surface-card p-4 transition-colors duration-300 ease-contemplative hover:border-border-hover">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-text-primary">{module.code}</h4>
                        <p className="text-text-tertiary text-sm">{module.name}</p>
                        <p className="text-text-tertiary text-xs">{module.credits} credits • {module.semester}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="text-[10px] px-2 py-0.5  bg-text-primary/20 text-text-primary">Active</span>
                          {module.currentGrade < module.targetGrade && (
                            <span className="text-[10px] px-2 py-0.5  bg-warning/20 text-warning">Below target</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-lg font-bold ${getGradeColor(module.currentGrade || 0)}`}>
                          {module.currentGrade || 0}%
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingModule(module);
                            setShowAddModuleModal(true);
                          }}
                          className="p-1 hover:bg-border"
                        >
                          <PencilSimple className="h-4 w-4 text-text-tertiary" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle delete - you'll need to implement this
                            if (confirm(`Delete ${module.code} - ${module.name}?`)) {
                              // TODO: Implement delete functionality
                            }
                          }}
                          className="p-1 hover:bg-border"
                        >
                          <Trash className="h-4 w-4 text-danger" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-tertiary">Target Grade</span>
                        <span className="text-text-primary font-medium">{module.targetGrade}%</span>
                      </div>
                      <div className="w-full bg-border  h-2">
                        <div 
                          className="bg-text-primary h-2  transition-all duration-300"
                          style={{ width: `${module.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-text-tertiary">
                        <span>Progress: {module.progress}%</span>
                        <span>{module.assessments?.length || 0} assessments</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedModule(module)}
                      className="mt-3 w-full py-2 rounded-sm bg-text-primary text-background hover:bg-text-secondary text-sm transition-colors duration-300 ease-contemplative"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module Details Modal */}
      <Modal
        isOpen={showModuleModal}
        onClose={() => setShowModuleModal(false)}
        title="Module Details"
      >
        {selectedModule && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-text-tertiary text-sm">Module Code</p>
                <p className="text-text-primary font-medium">{selectedModule.code}</p>
              </div>
              <div>
                <p className="text-text-tertiary text-sm">Credits</p>
                <p className="text-text-primary font-medium">{selectedModule.credits}</p>
              </div>
            </div>
            
            <div>
              <p className="text-text-tertiary text-sm">Module Name</p>
              <p className="text-text-primary font-medium">{selectedModule.name}</p>
            </div>
            
            <div>
              <p className="text-text-tertiary text-sm">Description</p>
              <p className="text-text-primary">{selectedModule.description || 'No description available'}</p>
            </div>
            
            {selectedModule.prerequisites && selectedModule.prerequisites.length > 0 && (
              <div>
                <p className="text-text-tertiary text-sm">Prerequisites</p>
                <p className="text-text-primary">{selectedModule.prerequisites.join(', ')}</p>
              </div>
            )}
            
            <div>
              <p className="text-text-tertiary text-sm">Assessments</p>
              <div className="space-y-2">
                {selectedModule.assessments?.map((assessment, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-surface">
                    <span className="text-text-primary">{assessment.name}</span>
                    <span className="text-text-tertiary">{assessment.weight}%</span>
                  </div>
                )) || <p className="text-text-tertiary">No assessments found</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Module Modal */}
      <Modal
        isOpen={showAddModuleModal}
        onClose={() => {
          setShowAddModuleModal(false);
          setEditingModule(null);
        }}
        title={editingModule ? 'Edit Module' : 'Add Module'}
      >
        <ModuleForm
          onSubmit={async (moduleData) => {
            // TODO: Implement add/edit functionality
            setShowAddModuleModal(false);
            setEditingModule(null);
          }}
          onCancel={() => {
            setShowAddModuleModal(false);
            setEditingModule(null);
          }}
          isSubmitting={false}
        />
      </Modal>
    </div>
  );
}
