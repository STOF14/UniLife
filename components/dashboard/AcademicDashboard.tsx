// Academic Dashboard - Real-time Analytics
// Comprehensive academic progress dashboard using server-side APIs

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/lib/types';

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

export default function AcademicDashboard({ studentProfileId }: { studentProfileId: string }) {
  const [progress, setProgress] = useState<AcademicProgress | null>(null);
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);
  const [creditMetrics, setCreditMetrics] = useState<CreditMetrics | null>(null);
  const [projection, setProjection] = useState<GraduationProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'analytics' | 'projection'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, [studentProfileId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load all dashboard data in parallel
      const [progressRes, metricsRes, creditsRes, projectionRes] = await Promise.all([
        fetch(`/api/academic/progress?studentProfileId=${studentProfileId}&type=basic`),
        fetch(`/api/academic/progress?studentProfileId=${studentProfileId}&type=metrics`),
        fetch(`/api/academic/progress?studentProfileId=${studentProfileId}&type=credits`),
        fetch(`/api/academic/progress?studentProfileId=${studentProfileId}&type=projection`)
      ]);

      const [progressData, metricsData, creditsData, projectionData] = await Promise.all([
        progressRes.json(),
        metricsRes.json(),
        creditsRes.json(),
        projectionRes.json()
      ]);

      setProgress(progressData);
      setMetrics(metricsData);
      setCreditMetrics(creditsData);
      setProjection(projectionData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
          />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsTab 
            metrics={metrics}
            projection={projection}
            getStandingColor={getStandingColor}
            studentProfileId={studentProfileId}
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
            <span className="text-white text-2xl">📊</span>
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
            <span className="text-white text-2xl">🎓</span>
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
            <span className="text-white text-2xl">📚</span>
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
            <span className="text-white text-2xl">📈</span>
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
  studentProfileId 
}: any) {
  const [showDetails, setShowDetails] = useState(false);

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
              <p className={`text-lg font-medium ${
                creditMetrics.onTrackForGraduation ? 'text-green-600' : 'text-red-600'
              }`}>
                {creditMetrics.onTrackForGraduation ? '✅ Yes' : '⚠️ No'}
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
  studentProfileId 
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

      {/* Risk Factors */}
      {projection?.riskFactors && projection.riskFactors.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Factors</h3>
          
          <div className="space-y-2">
            {projection.riskFactors.map((risk: string, index: number) => (
              <div key={index} className="flex items-center p-3 bg-red-50 border border-red-200 rounded">
                <span className="text-red-600 mr-2">⚠️</span>
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
                <span className="text-blue-600 mr-2">💡</span>
                <span className="text-blue-700 text-sm">{recommendation}</span>
              </div>
            ))}
          </div>
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
                <span className={`font-medium ${
                  projection?.onTime ? 'text-green-600' : 'text-red-600'
                }`}>
                  {projection?.onTime ? '✅ Yes' : '❌ No'}
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
