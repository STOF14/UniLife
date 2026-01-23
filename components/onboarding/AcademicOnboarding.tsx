// Academic Onboarding Component
// Automated onboarding flow for new students

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AcademicBusinessLogic } from '@/lib/services/academicBusinessLogic';
import { StudentProfileService } from '@/lib/services/studentProfile';
import { Button } from '@/lib/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

interface Degree {
  id: string;
  code: string;
  name: string;
  faculty: string;
  level: string;
  durationYears: number;
  totalCredits: number;
}

interface CurriculumVersion {
  id: string;
  academicYear: number;
  isActive: boolean;
  moduleCount: number;
}

export default function AcademicOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    universityId: '',
    degreeId: '',
    curriculumVersionId: '',
    startYear: new Date().getFullYear()
  });

  const [availableDegrees, setAvailableDegrees] = useState<Degree[]>([]);
  const [availableCurricula, setAvailableCurricula] = useState<CurriculumVersion[]>([]);
  const [needsOnboarding, setNeedsOnboarding] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      
      const needsOnboardingCheck = await StudentProfileService.needsOnboarding(user.id);
      setNeedsOnboarding(needsOnboardingCheck);

      if (!needsOnboardingCheck) {
        // User already has complete profile, redirect to dashboard
        window.location.href = '/dashboard';
        return;
      }

      // Load available degrees
      await loadAvailableDegrees();
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
    }
  };

  const loadAvailableDegrees = async () => {
    try {
      const response = await fetch('/api/degrees/available');
      const { degrees } = await response.json();
      setAvailableDegrees(degrees);
    } catch (error) {
      console.error('Failed to load degrees:', error);
    }
  };

  const loadCurriculaForDegree = async (degreeId: string) => {
    try {
      const response = await fetch(`/api/curriculum/available?degreeId=${degreeId}`);
      const { curricula } = await response.json();
      setAvailableCurricula(curricula);
    } catch (error) {
      console.error('Failed to load curricula:', error);
    }
  };

  const handleDegreeSelection = async (degreeId: string) => {
    setOnboardingData(prev => ({ ...prev, degreeId }));
    await loadCurriculaForDegree(degreeId);
  };

  const handleCurriculumSelection = (curriculumId: string) => {
    setOnboardingData(prev => ({ ...prev, curriculumVersionId: curriculumId }));
  };

  const completeOnboarding = async () => {
    if (!userId || !onboardingData.degreeId || !onboardingData.curriculumVersionId) {
      alert('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      await StudentProfileService.createStudentProfile({
        userId,
        universityId: onboardingData.universityId || 'up-university-id', // Would get from API
        degreeId: onboardingData.degreeId,
        curriculumVersionId: onboardingData.curriculumVersionId,
        startYear: onboardingData.startYear
      });

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to UniLife',
      description: 'Let\'s set up your academic profile with authoritative data from University of Pretoria',
      component: WelcomeStep
    },
    {
      id: 'degree',
      title: 'Select Your Degree',
      description: 'Choose your current degree program from the official catalog',
      component: DegreeSelectionStep
    },
    {
      id: 'curriculum',
      title: 'Choose Curriculum Version',
      description: 'Select the academic year and curriculum version for your studies',
      component: CurriculumSelectionStep
    },
    {
      id: 'confirmation',
      title: 'Confirm Your Profile',
      description: 'Review your selections and complete your academic profile',
      component: ConfirmationStep
    }
  ];

  if (!needsOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Setting up your profile...</h2>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-24 h-1 mx-4 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-lg font-medium">{steps[currentStep].title}</h3>
            <p className="text-gray-600 mt-1">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <CurrentStepComponent
            data={onboardingData}
            onUpdate={setOnboardingData}
            availableDegrees={availableDegrees}
            availableCurricula={availableCurricula}
            onDegreeSelect={handleDegreeSelection}
            onCurriculumSelect={handleCurriculumSelection}
          />
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={
                (currentStep === 1 && !onboardingData.degreeId) ||
                (currentStep === 2 && !onboardingData.curriculumVersionId)
              }
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={completeOnboarding}
              disabled={loading || !onboardingData.degreeId || !onboardingData.curriculumVersionId}
              loading={loading}
            >
              Complete Onboarding
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
function WelcomeStep({ data }: any) {
  return (
    <div className="text-center py-8">
      <div className="mb-8">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎓</span>
        </div>
        <h2 className="text-2xl font-bold mb-4">Welcome to UniLife</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          We\'ve integrated with University of Pretoria\'s official academic data to provide you with 
          accurate degree information, module requirements, and progress tracking.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="text-center p-6 bg-blue-50 rounded-lg">
          <div className="text-2xl mb-2">📚</div>
          <h3 className="font-semibold mb-2">Authoritative Data</h3>
          <p className="text-sm text-gray-600">
            Real-time curriculum data directly from UP
          </p>
        </div>
        <div className="text-center p-6 bg-green-50 rounded-lg">
          <div className="text-2xl mb-2">🎯</div>
          <h3 className="font-semibold mb-2">Smart Planning</h3>
          <p className="text-sm text-gray-600">
            Automated prerequisite checking and academic path optimization
          </p>
        </div>
        <div className="text-center p-6 bg-purple-50 rounded-lg">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-semibold mb-2">Progress Tracking</h3>
          <p className="text-sm text-gray-600">
            Real-time GPA calculations and graduation projections
          </p>
        </div>
      </div>
    </div>
  );
}

function DegreeSelectionStep({ 
  availableDegrees, 
  onDegreeSelect, 
  data 
}: { 
  availableDegrees: Degree[];
  onDegreeSelect: (id: string) => void;
  data: any;
}) {
  return (
    <div className="py-8">
      <h3 className="text-lg font-semibold mb-6">Select Your Degree Program</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableDegrees.map((degree) => (
          <div
            key={degree.id}
            className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
              data.degreeId === degree.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onDegreeSelect(degree.id)}
          >
            <h4 className="font-semibold text-lg mb-2">{degree.name}</h4>
            <p className="text-gray-600 mb-4">{degree.faculty}</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Level:</span>
                <span className="font-medium">{degree.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration:</span>
                <span className="font-medium">{degree.durationYears} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Credits:</span>
                <span className="font-medium">{degree.totalCredits}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {data.degreeId && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            ✓ Selected: {availableDegrees.find(d => d.id === data.degreeId)?.name}
          </p>
        </div>
      )}
    </div>
  );
}

function CurriculumSelectionStep({ 
  availableCurricula, 
  onCurriculumSelect, 
  data 
}: { 
  availableCurricula: CurriculumVersion[];
  onCurriculumSelect: (id: string) => void;
  data: any;
}) {
  return (
    <div className="py-8">
      <h3 className="text-lg font-semibold mb-6">Choose Curriculum Version</h3>
      
      <div className="space-y-4">
        {availableCurricula.map((curriculum) => (
          <div
            key={curriculum.id}
            className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
              data.curriculumVersionId === curriculum.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onCurriculumSelect(curriculum.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-lg">Academic Year {curriculum.academicYear}</h4>
                <p className="text-gray-600 mt-1">
                  {curriculum.moduleCount} modules in curriculum
                </p>
              </div>
              <div className="text-right">
                {curriculum.isActive && (
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {data.curriculumVersionId && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            ✓ Selected: Academic Year {availableCurricula.find(c => c.id === data.curriculumVersionId)?.academicYear}
          </p>
        </div>
      )}
    </div>
  );
}

function ConfirmationStep({ data, availableDegrees, availableCurricula }: any) {
  const selectedDegree = availableDegrees.find((d: any) => d.id === data.degreeId);
  const selectedCurriculum = availableCurricula.find((c: any) => c.id === data.curriculumVersionId);

  return (
    <div className="py-8">
      <h3 className="text-lg font-semibold mb-6">Confirm Your Academic Profile</h3>
      
      <div className="bg-gray-50 rounded-lg p-6 space-y-6">
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Degree Program</h4>
          <div className="bg-white p-4 rounded border">
            <p className="font-semibold">{selectedDegree?.name}</p>
            <p className="text-gray-600">{selectedDegree?.faculty}</p>
            <p className="text-sm text-gray-500">
              {selectedDegree?.level} • {selectedDegree?.durationYears} years • {selectedDegree?.totalCredits} credits
            </p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Curriculum Version</h4>
          <div className="bg-white p-4 rounded border">
            <p className="font-semibold">Academic Year {selectedCurriculum?.academicYear}</p>
            <p className="text-gray-600">{selectedCurriculum?.moduleCount} modules</p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Start Year</h4>
          <div className="bg-white p-4 rounded border">
            <p className="font-semibold">{data.startYear}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
          <strong>Important:</strong> This profile will be permanently linked to this curriculum version. 
          You can view your progress but cannot change your degree requirements.
        </p>
      </div>
    </div>
  );
}
