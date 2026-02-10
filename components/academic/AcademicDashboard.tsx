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
    if (grade >= 75) return 'text-green-500';
    if (grade >= 60) return 'text-blue-500';
    if (grade >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#0A0A0A] border-[#38383A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#EBEBF599] text-sm">CWA</p>
                <p className="text-2xl font-bold text-white">{parseFloat(cwa).toFixed(1)}</p>
              </div>
              <ChartBar className="h-8 w-8 text-[#0A84FF]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A] border-[#38383A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#EBEBF599] text-sm">Average Grade</p>
                <p className={`text-2xl font-bold ${getGradeColor(averageGrade)}`}>
                  {averageGrade.toFixed(1)}%
                </p>
              </div>
              <TrendUp className="h-8 w-8 text-[#0A84FF]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A] border-[#38383A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#EBEBF599] text-sm">Total Credits</p>
                <p className="text-2xl font-bold text-white">{totalCredits}</p>
              </div>
              <Trophy className="h-8 w-8 text-[#0A84FF]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A] border-[#38383A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#EBEBF599] text-sm">Completed</p>
                <p className="text-2xl font-bold text-white">{completedModules}/{modules.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A] border-[#38383A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#EBEBF599] text-sm">Active Credits</p>
                <p className="text-2xl font-bold text-white">{activeCredits}</p>
              </div>
              <Clock className="h-8 w-8 text-[#FF9F0A]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-[#0A0A0A] border-[#38383A]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#EBEBF599]" />
                <Input
                  placeholder="Search modules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#1C1C1C] border-[#38383A] text-white"
                  label=""
                />
              </div>
            </div>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 bg-[#1C1C1C] border-[#38383A] rounded-lg text-white"
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>Year {year}</option>
              ))}
            </select>
            <select
              value={filterMajor}
              onChange={(e) => setFilterMajor(e.target.value)}
              className="px-3 py-2 bg-[#1C1C1C] border-[#38383A] rounded-lg text-white"
            >
              <option value="all">All Majors</option>
              {majors.map(major => (
                <option key={major} value={major}>{major}</option>
              ))}
            </select>
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="px-3 py-2 bg-[#1C1C1C] border-[#38383A] rounded-lg text-white"
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
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                filterYear === 'all' ? 'bg-[#0A84FF]/20 text-[#0A84FF] border-[#0A84FF]/40' : 'bg-[#1C1C1C] text-[#EBEBF599] border-[#38383A]'
              }`}
            >
              All Years
            </button>
            {years.map(year => (
              <button
                key={year}
                onClick={() => setFilterYear(year)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  filterYear === year ? 'bg-[#0A84FF]/20 text-[#0A84FF] border-[#0A84FF]/40' : 'bg-[#1C1C1C] text-[#EBEBF599] border-[#38383A]'
                }`}
              >
                Year {year}
              </button>
            ))}
            {semesters.slice(0, 4).map(semester => (
              <button
                key={semester}
                onClick={() => setFilterSemester(semester)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  filterSemester === semester ? 'bg-[#30D158]/20 text-[#30D158] border-[#30D158]/40' : 'bg-[#1C1C1C] text-[#EBEBF599] border-[#38383A]'
                }`}
              >
                {semester}
              </button>
            ))}
            <button
              onClick={() => setShowNeedsAttention(!showNeedsAttention)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                showNeedsAttention ? 'bg-[#FF9F0A]/20 text-[#FF9F0A] border-[#FF9F0A]/40' : 'bg-[#1C1C1C] text-[#EBEBF599] border-[#38383A]'
              }`}
            >
              Needs attention
            </button>
          </div>
          <Button onClick={onImportYearbook} className="bg-[#0A84FF] hover:bg-[#0066CC]">
            <UploadSimple className="h-4 w-4 mr-2" />
            Import Yearbook
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Assessments */}
      {upcomingAssessments.length > 0 && (
        <Card className="bg-[#0A0A0A] border-[#38383A]">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Clock className="h-5 w-5 mr-2 text-[#0A84FF]" />
              Upcoming Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAssessments.map((assessment, index) => {
                const module = modules.find(m => m.assessments?.some(a => a.dueDate === assessment.dueDate));
                const daysLeft = Math.ceil((new Date(assessment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#1C1C1C] rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${daysLeft <= 3 ? 'bg-red-500' : daysLeft <= 7 ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                      <div>
                        <p className="text-white font-medium">{assessment.name}</p>
                        <p className="text-[#EBEBF599] text-sm">{module?.code} - {module?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm">{daysLeft} days</p>
                      <p className="text-[#EBEBF599] text-xs">{new Date(assessment.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredModules.length === 0 && (
        <Card className="bg-[#0A0A0A] border-[#38383A]">
          <CardContent className="p-6 text-center">
            <p className="text-white text-sm mb-2">No active modules match your filters.</p>
            <p className="text-[#EBEBF599] text-xs mb-4">Try adjusting filters or import your yearbook.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={onImportYearbook} className="bg-[#0A84FF] hover:bg-[#0066CC]">
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
          <h2 className="text-xl font-semibold text-white">Modules</h2>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddModuleModal(true)} className="bg-[#0A84FF] hover:bg-[#0066CC]">
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </div>
        </div>
        
        {Object.entries(modulesByMajor).map(([major, majorModules]) => (
          <Card key={major} className="bg-[#0A0A0A] border-[#38383A]">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>{major}</span>
                <span className="text-sm text-[#EBEBF599]">{majorModules.length} modules</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {majorModules.map((module) => (
                  <div key={module.id} className="bg-[#1C1C1C] border border-[#38383A] rounded-lg p-4 hover:border-[#0A84FF] transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white">{module.code}</h4>
                        <p className="text-[#EBEBF599] text-sm">{module.name}</p>
                        <p className="text-[#EBEBF599] text-xs">{module.credits} credits • {module.semester}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0A84FF]/20 text-[#0A84FF]">Active</span>
                          {module.currentGrade < module.targetGrade && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF9F0A]/20 text-[#FF9F0A]">Below target</span>
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
                          className="p-1 hover:bg-[#38383A] rounded"
                        >
                          <PencilSimple className="h-4 w-4 text-[#EBEBF599]" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle delete - you'll need to implement this
                            if (confirm(`Delete ${module.code} - ${module.name}?`)) {
                              // TODO: Implement delete functionality
                            }
                          }}
                          className="p-1 hover:bg-[#38383A] rounded"
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#EBEBF599]">Target Grade</span>
                        <span className="text-white font-medium">{module.targetGrade}%</span>
                      </div>
                      <div className="w-full bg-[#38383A] rounded-full h-2">
                        <div 
                          className="bg-[#0A84FF] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${module.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-[#EBEBF599]">
                        <span>Progress: {module.progress}%</span>
                        <span>{module.assessments?.length || 0} assessments</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedModule(module)}
                      className="mt-3 w-full py-2 bg-[#0A84FF] hover:bg-[#0066CC] text-white rounded-lg text-sm transition-colors"
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
                <p className="text-[#EBEBF599] text-sm">Module Code</p>
                <p className="text-white font-medium">{selectedModule.code}</p>
              </div>
              <div>
                <p className="text-[#EBEBF599] text-sm">Credits</p>
                <p className="text-white font-medium">{selectedModule.credits}</p>
              </div>
            </div>
            
            <div>
              <p className="text-[#EBEBF599] text-sm">Module Name</p>
              <p className="text-white font-medium">{selectedModule.name}</p>
            </div>
            
            <div>
              <p className="text-[#EBEBF599] text-sm">Description</p>
              <p className="text-white">{selectedModule.description || 'No description available'}</p>
            </div>
            
            {selectedModule.prerequisites && selectedModule.prerequisites.length > 0 && (
              <div>
                <p className="text-[#EBEBF599] text-sm">Prerequisites</p>
                <p className="text-white">{selectedModule.prerequisites.join(', ')}</p>
              </div>
            )}
            
            <div>
              <p className="text-[#EBEBF599] text-sm">Assessments</p>
              <div className="space-y-2">
                {selectedModule.assessments?.map((assessment, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-[#1C1C1C] rounded">
                    <span className="text-white">{assessment.name}</span>
                    <span className="text-[#EBEBF599]">{assessment.weight}%</span>
                  </div>
                )) || <p className="text-[#EBEBF599]">No assessments found</p>}
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
