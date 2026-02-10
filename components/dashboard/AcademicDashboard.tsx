// Academic Dashboard - Real-time Analytics
// Comprehensive academic progress dashboard using server-side APIs

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/lib/types';
import { ChartLineUp, GraduationCap, BookOpen, TrendUp, CheckCircle, WarningCircle, Lightbulb, XCircle, CircleDashed, SpinnerGap } from 'phosphor-react';

interface AcademicProgress {
  totalCredits: number;
  earnedCredits: number;
  completedModules: number;
  totalModules: number;
  averageGrade: number;
  gpa: number;
  academicStanding: string;
  progressPercentage: number;
}

interface ProgressMetrics {
  currentGPA: number;
  cumulativeGPA: number;
  academicStanding: string;
  classRank?: number;
  percentile?: number;
}

interface CreditMetrics {
  totalCreditsEarned: number;
  creditsThisSemester: number;
  creditsThisYear: number;
  onTrackForGraduation: boolean;
  estimatedGraduationDate: string;
}

interface GraduationProjection {
  onTime: boolean;
  estimatedDate: string;
  requiredCreditsPerSemester: number;
  riskFactors: string[];
  recommendations: string[];
}

interface ModuleWithStatus {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: string;
  year: number;
  currentGrade: number;
  targetGrade: number;
  status: 'completed' | 'in-progress' | 'upcoming';
  assessments: number;
  completedAssessments: number;
}

interface GroupedModules {
  [year: number]: {
    completed: ModuleWithStatus[];
    inProgress: ModuleWithStatus[];
    upcoming: ModuleWithStatus[];
  };
}

export default function AcademicDashboard({ studentProfileId }: { studentProfileId: string }) {
  const [progress, setProgress] = useState<AcademicProgress | null>(null);
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);
  const [creditMetrics, setCreditMetrics] = useState<CreditMetrics | null>(null);
  const [projection, setProjection] = useState<GraduationProjection | null>(null);
  const [modules, setModules] = useState<GroupedModules>({});
  const [currentYear, setCurrentYear] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'analytics' | 'projection'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, [studentProfileId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load all dashboard data in parallel
      const [progressRes, metricsRes, creditsRes, projectionRes, modulesRes] = await Promise.all([
        fetch(`/api/academic/progress?studentProfileId=${studentProfileId}&type=basic`),
        fetch(`/api/academic/progress?studentProfileId=${studentProfileId}&type=metrics`),
        fetch(`/api/academic/progress?studentProfileId=${studentProfileId}&type=credits`),
        fetch(`/api/academic/progress?studentProfileId=${studentProfileId}&type=projection`),
        fetch(`/api/academic/modules?studentProfileId=${studentProfileId}`)
      ]);

      const [progressData, metricsData, creditsData, projectionData, modulesData] = await Promise.all([
        progressRes.json(),
        metricsRes.json(),
        creditsRes.json(),
        projectionRes.json(),
        modulesRes.json()
      ]);

      setProgress(progressData);
      setMetrics(metricsData);
      setCreditMetrics(creditsData);
      setProjection(projectionData);
      
      // Group modules by year and status
      if (modulesData?.modules) {
        const grouped = groupModulesByYearAndStatus(modulesData.modules);
        setModules(grouped);
        setCurrentYear(modulesData.currentYear || 1);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupModulesByYearAndStatus = (modulesList: any[]): GroupedModules => {
    const grouped: GroupedModules = {};
    
    modulesList.forEach(module => {
      const year = module.year || 1;
      if (!grouped[year]) {
        grouped[year] = { completed: [], inProgress: [], upcoming: [] };
      }
      
      // Determine status based on grades and completion
      let status: 'completed' | 'in-progress' | 'upcoming' = 'in-progress';
      if (module.currentGrade >= 100 || module.completed) {
        status = 'completed';
      } else if (module.currentGrade === 0 && module.completedAssessments === 0) {
        status = 'upcoming';
      }
      
      const moduleWithStatus: ModuleWithStatus = {
        ...module,
        status
      };
      
      // Map status to correct property name
      if (status === 'completed') {
        grouped[year].completed.push(moduleWithStatus);
      } else if (status === 'in-progress') {
        grouped[year].inProgress.push(moduleWithStatus);
      } else {
        grouped[year].upcoming.push(moduleWithStatus);
      }
    });
    
    return grouped;
  };

  const getStandingColor = (standing: string) => {
    switch (standing.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'satisfactory': return 'text-yellow-600 bg-yellow-100';
      case 'at_risk': return 'text-orange-600 bg-orange-100';
      case 'failing': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your academic dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Academic Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Real-time academic progress and insights
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'progress', 'analytics', 'projection'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab 
            progress={progress} 
            metrics={metrics} 
            creditMetrics={creditMetrics}
            getStandingColor={getStandingColor}
            getProgressColor={getProgressColor}
          />
        )}
        
        {activeTab === 'progress' && (
          <ProgressTab 
            progress={progress}
            creditMetrics={creditMetrics}
            getProgressColor={getProgressColor}
            studentProfileId={studentProfileId}
            modules={modules}
            currentYear={currentYear}
          />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsTab 
            metrics={metrics}
            projection={projection}
            getStandingColor={getStandingColor}
            studentProfileId={studentProfileId}
            modules={modules}
            currentYear={currentYear}
          />
        )}
        
        {activeTab === 'projection' && (
          <ProjectionTab 
            projection={projection}
            creditMetrics={creditMetrics}
            getStandingColor={getStandingColor}
          />
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ 
  progress, 
  metrics, 
  creditMetrics, 
  getStandingColor, 
  getProgressColor 
}: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* GPA Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
            <ChartLineUp size={24} className="text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Current GPA</dt>
              <dd className="text-lg font-medium text-gray-900">
                {metrics?.currentGPA?.toFixed(2) || '0.00'}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Academic Standing */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
            <GraduationCap size={24} className="text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Standing</dt>
              <dd className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStandingColor(metrics?.academicStanding || '')}`}>
                  {metrics?.academicStanding || 'Unknown'}
                </span>
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Credits Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
            <BookOpen size={24} className="text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Credits Earned</dt>
              <dd className="text-lg font-medium text-gray-900">
                {creditMetrics?.totalCreditsEarned || 0}
              </dd>
              <dd className="text-sm text-gray-500">
                of {progress?.totalCredits || 0} total
              </dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Progress Percentage */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
            <TrendUp size={24} className="text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Progress</dt>
              <dd className="text-lg font-medium text-gray-900">
                {progress?.progressPercentage?.toFixed(1) || '0'}%
              </dd>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getProgressColor(progress?.progressPercentage || 0)}`}
                    style={{ width: `${progress?.progressPercentage || 0}%` }}
                  ></div>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

// Progress Tab Component
function ProgressTab({ 
  progress, 
  creditMetrics, 
  getProgressColor, 
  studentProfileId,
  modules,
  currentYear
}: any) {
  const [showDetails, setShowDetails] = useState(false);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([currentYear]));
  
  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Progress</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {progress?.completedModules || 0}
            </div>
            <p className="text-sm text-gray-500">Modules Completed</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {progress?.averageGrade?.toFixed(1) || '0'}
            </div>
            <p className="text-sm text-gray-500">Average Grade</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {creditMetrics?.creditsThisSemester || 0}
            </div>
            <p className="text-sm text-gray-500">Credits This Semester</p>
          </div>
        </div>
      </div>

      {/* Detailed Progress Bar */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Completion Progress</h3>
          <Button
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{progress?.progressPercentage?.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${getProgressColor(progress?.progressPercentage || 0)}`}
                style={{ width: `${progress?.progressPercentage || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules by Year and Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Your Modules</h3>
        
        <div className="space-y-4">
          {Object.keys(modules).sort((a, b) => Number(b) - Number(a)).map(yearStr => {
            const year = Number(yearStr);
            const yearModules = modules[year];
            const isCurrentYear = year === currentYear;
            const isExpanded = expandedYears.has(year);
            
            // Only count active modules (in-progress and upcoming)
            const activeModulesCount = yearModules.inProgress.length + yearModules.upcoming.length;
            
            // Skip this year if it only has completed modules
            if (activeModulesCount === 0) {
              return null;
            }
            
            return (
              <div 
                key={year} 
                className={`border rounded-lg overflow-hidden transition-all ${
                  isCurrentYear ? 'border-blue-500 shadow-md' : 'border-gray-200'
                }`}
              >
                <button
                  onClick={() => toggleYear(year)}
                  className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                    isCurrentYear ? 'bg-blue-50 hover:bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${
                      isCurrentYear ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      Year {year}
                    </span>
                    {isCurrentYear && (
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full">
                        Current
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {activeModulesCount} module{activeModulesCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 text-xs">
                      {yearModules.inProgress.length > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          <span className="inline-flex items-center gap-1">
                            <SpinnerGap size={12} className="animate-spin" />
                            {yearModules.inProgress.length} active
                          </span>
                        </span>
                      )}
                      {yearModules.upcoming.length > 0 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          <span className="inline-flex items-center gap-1">
                            <CircleDashed size={12} />
                            {yearModules.upcoming.length} upcoming
                          </span>
                        </span>
                      )}
                    </div>
                    <svg 
                      className={`w-5 h-5 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="p-4 space-y-6">
                    {/* In Progress Modules */}
                    {yearModules.inProgress.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                          Currently Taking ({yearModules.inProgress.length})
                        </h4>
                        <div className="grid gap-3">
                          {yearModules.inProgress.map((module: ModuleWithStatus) => (
                            <ModuleCard key={module.id} module={module} status="in-progress" />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Upcoming Modules */}
                    {yearModules.upcoming.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                          Upcoming ({yearModules.upcoming.length})
                        </h4>
                        <div className="grid gap-3 opacity-60">
                          {yearModules.upcoming.map((module: ModuleWithStatus) => (
                            <ModuleCard key={module.id} module={module} status="upcoming" />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Note about completed modules */}
                    {yearModules.completed.length > 0 && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-600" />
                          <span>
                            {yearModules.completed.length} module{yearModules.completed.length !== 1 ? 's' : ''} completed this year. 
                            <span className="text-green-600">View in Analytics tab for details.</span>
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Graduation Tracking */}
      {creditMetrics?.estimatedGraduationDate && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Graduation Tracking</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Estimated Graduation</p>
              <p className="text-lg font-medium text-gray-900">
                {new Date(creditMetrics.estimatedGraduationDate).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">On Track</p>
              <p className={`text-lg font-medium flex items-center gap-2 ${
                creditMetrics.onTrackForGraduation ? 'text-green-600' : 'text-red-600'
              }`}>
                {creditMetrics.onTrackForGraduation ? (
                  <CheckCircle size={18} />
                ) : (
                  <WarningCircle size={18} />
                )}
                {creditMetrics.onTrackForGraduation ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics Tab Component
function AnalyticsTab({ 
  metrics, 
  projection, 
  getStandingColor, 
  studentProfileId,
  modules,
  currentYear
}: any) {
  const [analyticsData, setAnalyticsData] = useState<{
    trends: any;
    performance: any;
  } | null>(null);

  useEffect(() => {
    loadDetailedAnalytics();
  }, [studentProfileId]);

  const loadDetailedAnalytics = async () => {
    try {
      const [trendsRes, performanceRes] = await Promise.all([
        fetch(`/api/academic/progress?studentProfileId=${studentProfileId}&type=trends`),
        fetch(`/api/academic/progress?studentProfileId=${studentProfileId}&type=performance`)
      ]);

      const [trendsData, performanceData] = await Promise.all([
        trendsRes.json(),
        performanceRes.json()
      ]);

      setAnalyticsData({ trends: trendsData, performance: performanceData });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  // Get all completed modules across all years
  const allCompletedModules = Object.values(modules).flatMap((yearModules: any) => yearModules.completed);

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Academic Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Current GPA:</span>
                <span className="font-medium">{metrics?.currentGPA?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cumulative GPA:</span>
                <span className="font-medium">{metrics?.cumulativeGPA?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Class Rank:</span>
                <span className="font-medium">
                  {metrics?.classRank ? `#${metrics.classRank}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Academic Standing</h4>
            <div className={`inline-flex px-3 py-2 text-sm font-semibold rounded-full ${getStandingColor(metrics?.academicStanding || '')}`}>
              {metrics?.academicStanding || 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Completed Modules History */}
      {allCompletedModules.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Completed Modules ({allCompletedModules.length})
          </h3>
          
          <div className="space-y-4">
            {Object.keys(modules).sort((a, b) => Number(b) - Number(a)).map(yearStr => {
              const year = Number(yearStr);
              const yearModules = modules[year];
              
              if (yearModules.completed.length === 0) return null;
              
              return (
                <div key={year} className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Year {year}</h4>
                  <div className="grid gap-2">
                    {yearModules.completed.map((module: ModuleWithStatus) => (
                      <div 
                        key={module.id} 
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-gray-600">{module.code}</span>
                            <span className="text-sm font-medium text-gray-900">{module.name}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {module.credits} credits • {module.semester}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{module.currentGrade}%</div>
                          {module.currentGrade >= module.targetGrade && (
                            <div className="text-xs text-green-600 inline-flex items-center gap-1">
                              <CheckCircle size={12} />
                              Target met
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risk Factors */}
      {projection?.riskFactors && projection.riskFactors.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Factors</h3>
          
          <div className="space-y-2">
            {projection.riskFactors.map((risk: string, index: number) => (
              <div key={index} className="flex items-center p-3 bg-red-50 border border-red-200 rounded">
                <WarningCircle size={16} className="text-red-600 mr-2" />
                <span className="text-red-700 text-sm">{risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {projection?.recommendations && projection.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
          
          <div className="space-y-2">
            {projection.recommendations.map((recommendation: string, index: number) => (
              <div key={index} className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded">
                <Lightbulb size={16} className="text-blue-600 mr-2" />
                <span className="text-blue-700 text-sm">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Module Card Component
function ModuleCard({ module, status }: { module: ModuleWithStatus; status: 'completed' | 'in-progress' | 'upcoming' }) {
  const getStatusStyle = () => {
    switch (status) {
      case 'completed':
        return {
          border: 'border-green-200 bg-green-50',
          badge: 'bg-green-600 text-white',
          badgeText: 'Completed',
          icon: <CheckCircle size={12} />
        };
      case 'in-progress':
        return {
          border: 'border-blue-200 bg-blue-50',
          badge: 'bg-blue-600 text-white',
          badgeText: 'Active',
          icon: <SpinnerGap size={12} className="animate-spin" />
        };
      case 'upcoming':
        return {
          border: 'border-gray-200 bg-gray-50',
          badge: 'bg-gray-500 text-white',
          badgeText: 'Upcoming',
          icon: <CircleDashed size={12} />
        };
    }
  };

  const style = getStatusStyle();
  const progressPercentage = module.targetGrade > 0 
    ? Math.min((module.currentGrade / module.targetGrade) * 100, 100) 
    : 0;

  return (
    <div className={`border rounded-lg p-4 transition-all hover:shadow-md ${style.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-gray-600">{module.code}</span>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded inline-flex items-center gap-1 ${style.badge}`}>
              {style.icon}
              {style.badgeText}
            </span>
          </div>
          <h5 className="font-medium text-gray-900">{module.name}</h5>
          <p className="text-xs text-gray-500 mt-1">
            {module.credits} credits • {module.semester}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500">Current</p>
          <p className={`text-lg font-bold ${
            status === 'completed' ? 'text-green-600' : 
            status === 'in-progress' ? 'text-blue-600' : 'text-gray-400'
          }`}>
            {module.currentGrade}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Target</p>
          <p className="text-lg font-bold text-gray-700">{module.targetGrade}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Assessments</p>
          <p className="text-lg font-bold text-gray-700">
            {module.completedAssessments || 0}/{module.assessments || 0}
          </p>
        </div>
      </div>

      {status === 'in-progress' && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {status === 'completed' && module.currentGrade >= module.targetGrade && (
        <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Target achieved!</span>
        </div>
      )}
    </div>
  );
}

// Projection Tab Component
function ProjectionTab({ projection, creditMetrics, getStandingColor }: any) {
  return (
    <div className="space-y-6">
      {/* Graduation Projection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Graduation Projection</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Timeline</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">On Track:</span>
                <span className={`font-medium inline-flex items-center gap-2 ${
                  projection?.onTime ? 'text-green-600' : 'text-red-600'
                }`}>
                  {projection?.onTime ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {projection?.onTime ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Est. Date:</span>
                <span className="font-medium">
                  {projection?.estimatedDate ? new Date(projection.estimatedDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Credits/Semester:</span>
                <span className="font-medium">{projection?.requiredCreditsPerSemester || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Current Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Credits Earned:</span>
                <span className="font-medium">{creditMetrics?.totalCreditsEarned || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">This Year:</span>
                <span className="font-medium">{creditMetrics?.creditsThisYear || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">This Semester:</span>
                <span className="font-medium">{creditMetrics?.creditsThisSemester || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
