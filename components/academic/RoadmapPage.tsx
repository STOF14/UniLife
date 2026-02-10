'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Module } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Calendar,
  BookOpen,
  Trophy,
  TrendUp,
  UsersThree,
  Target,
  Clock,
  CheckCircle,
  Circle,
  ArrowRight,
  Star,
  GraduationCap,
  Lightbulb,
  RocketLaunch,
  Brain,
  Lightning
} from 'phosphor-react';

interface RoadmapPageProps {
  modules: Module[];
  major?: string;
  secondMajor?: string;
}

interface YearPlan {
  year: number;
  title: string;
  description: string;
  totalCredits: number;
  fundamentalCredits: number;
  coreCredits: number;
  electiveCredits: number;
  modules: Module[];
  milestones: Milestone[];
  focus: string[];
  color: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  date?: string;
  icon: React.ReactNode;
}

export function RoadmapPage({ modules, major = "Physics", secondMajor }: RoadmapPageProps) {
  const [selectedYear, setSelectedYear] = useState<number>(1);
  const [animatedProgress, setAnimatedProgress] = useState<{ [key: number]: number }>({});
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  // Generate milestones function - moved here before useMemo
  const generateYearMilestones = (year: number, major: string, secondMajor?: string): Milestone[] => {
    const baseMilestones = [
      {
        id: 'orientation',
        title: 'Academic Orientation',
        description: 'Complete university orientation and select modules',
        completed: year === 1,
        icon: <UsersThree className="h-5 w-5" />
      },
      {
        id: 'midterms',
        title: 'Midterm Assessments',
        description: 'Complete first major assessment period',
        completed: false,
        icon: <Clock className="h-5 w-5" />
      },
      {
        id: 'finals',
        title: 'Final Examinations',
        description: 'Complete end-of-year examinations',
        completed: false,
        icon: <Trophy className="h-5 w-5" />
      }
    ];

    if (year === 2 && secondMajor) {
      baseMilestones.push({
        id: 'second-major',
        title: `${secondMajor} Integration`,
        description: `Begin ${secondMajor} specialization courses`,
        completed: false,
        icon: <Brain className="h-5 w-5" />
      });
    }

    if (year === 3) {
      baseMilestones.push({
        id: 'research',
        title: 'Research Project',
        description: 'Complete capstone research project',
        completed: false,
        icon: <Lightbulb className="h-5 w-5" />
      });
    }

    return baseMilestones;
  };

  // Group modules by year and calculate credits
  const yearPlans = useMemo(() => {
    const plans: YearPlan[] = [];
    
    for (let year = 1; year <= 3; year++) {
      const yearModules = modules.filter(m => {
        const codeNum = parseInt(m.code.replace(/[A-Z]/g, ''));
        return codeNum >= (year * 100 - 99) && codeNum <= (year * 100);
      });

      const fundamentalModules = yearModules.filter(m => 
        ['AIM111', 'AIM121', 'LST110', 'UPO102'].includes(m.code)
      );
      const coreModules = yearModules.filter(m => 
        !fundamentalModules.includes(m) && (year === 1 || m.name.toLowerCase().includes('core'))
      );
      const electiveModules = yearModules.filter(m => 
        !fundamentalModules.includes(m) && !coreModules.includes(m)
      );

      const yearColors = ['#0A84FF', '#30D158', '#FF9F0A'];
      const yearFocus = [
        ['Foundation Building', 'Core Sciences', 'Academic Skills'],
        ['Advanced Topics', 'Specialization', 'Research Methods'],
        ['Expertise Development', 'Capstone Projects', 'Career Preparation']
      ];

      plans.push({
        year,
        title: year === 1 ? 'Foundation Year' : year === 2 ? 'Development Year' : 'Expertise Year',
        description: year === 1 
          ? 'Build strong foundations in physics, mathematics, and academic skills'
          : year === 2 
          ? 'Deepen knowledge and begin specialization in your chosen field'
          : 'Master advanced topics and prepare for career or postgraduate studies',
        totalCredits: yearModules.reduce((sum, m) => sum + m.credits, 0),
        fundamentalCredits: fundamentalModules.reduce((sum, m) => sum + m.credits, 0),
        coreCredits: coreModules.reduce((sum, m) => sum + m.credits, 0),
        electiveCredits: electiveModules.reduce((sum, m) => sum + m.credits, 0),
        modules: yearModules,
        milestones: generateYearMilestones(year, major, secondMajor),
        focus: yearFocus[year - 1],
        color: yearColors[year - 1]
      });
    }

    return plans;
  }, [modules, major, secondMajor]);

  // Animate progress bars on mount
  useEffect(() => {
    yearPlans.forEach(plan => {
      const progress = (plan.modules.filter(m => m.progress === 100).length / plan.modules.length) * 100;
      setTimeout(() => {
        setAnimatedProgress(prev => ({ ...prev, [plan.year]: progress }));
      }, 300 * plan.year);
    });
  }, [yearPlans]);

  const selectedPlan = yearPlans.find(plan => plan.year === selectedYear) || yearPlans[0];

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
              <GraduationCap className="h-8 w-8 mr-3 text-[#0A84FF]" />
              University Journey Roadmap
            </h1>
            <p className="text-[#EBEBF599] text-lg">
              Your personalized path to success in {major}
              {secondMajor && ` with ${secondMajor} as second major`}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-[#EBEBF599] text-sm">Total Journey</p>
              <p className="text-white text-2xl font-bold">3 Years</p>
            </div>
            <RocketLaunch className="h-8 w-8 text-[#0A84FF]" />
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex space-x-4 mb-8">
          {yearPlans.map((plan) => (
            <Button
              key={plan.year}
              onClick={() => setSelectedYear(plan.year)}
              className={`flex-1 transition-all duration-300 transform hover:scale-105 ${
                selectedYear === plan.year
                  ? 'bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/30'
                  : 'bg-[#1C1C1C] text-[#EBEBF599] hover:bg-[#38383A]'
              }`}
            >
              <div className="flex items-center justify-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  selectedYear === plan.year ? 'bg-white' : 'bg-[#EBEBF599]'
                }`} />
                <span className="font-medium">Year {plan.year}</span>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Year Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Year Card */}
          <Card className="bg-[#0A0A0A] border-[#38383A] overflow-hidden">
            <div 
              className="h-2 bg-gradient-to-r from-transparent via-[#0A84FF] to-transparent"
              style={{ backgroundColor: selectedPlan.color }}
            />
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: selectedPlan.color }}
                  />
                  {selectedPlan.title}
                </div>
                <span className="text-sm text-[#EBEBF599]">
                  {selectedPlan.totalCredits} Credits
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#EBEBF599] mb-6">{selectedPlan.description}</p>
              
              {/* Credit Breakdown */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-[#1C1C1C] rounded-lg">
                  <p className="text-2xl font-bold text-[#30D158]">{selectedPlan.fundamentalCredits}</p>
                  <p className="text-[#EBEBF599] text-sm">Fundamental</p>
                </div>
                <div className="text-center p-4 bg-[#1C1C1C] rounded-lg">
                  <p className="text-2xl font-bold text-[#0A84FF]">{selectedPlan.coreCredits}</p>
                  <p className="text-[#EBEBF599] text-sm">Core</p>
                </div>
                <div className="text-center p-4 bg-[#1C1C1C] rounded-lg">
                  <p className="text-2xl font-bold text-[#FF9F0A]">{selectedPlan.electiveCredits}</p>
                  <p className="text-[#EBEBF599] text-sm">Elective</p>
                </div>
              </div>

              {/* Focus Areas */}
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-[#0A84FF]" />
                  Focus Areas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPlan.focus.map((focus, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#1C1C1C] text-[#EBEBF599] rounded-full text-sm border border-[#38383A]"
                    >
                      {focus}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#EBEBF599]">Year Progress</span>
                  <span className="text-white font-medium">
                    {Math.round(animatedProgress[selectedPlan.year] || 0)}%
                  </span>
                </div>
                <div className="w-full bg-[#38383A] rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#0A84FF] to-[#30D158] rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${animatedProgress[selectedPlan.year] || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modules Grid */}
          <Card className="bg-[#0A0A0A] border-[#38383A]">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-[#0A84FF]" />
                Year {selectedPlan.year} Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPlan.modules.map((module, index) => (
                  <div
                    key={module.id}
                    className={`p-4 bg-[#1C1C1C] border border-[#38383A] rounded-lg transition-all duration-300 cursor-pointer
                      ${hoveredModule === module.id ? 'border-[#0A84FF] transform scale-105' : ''}
                      ${module.progress === 100 ? 'bg-[#1C1C1C]/50' : ''}
                    `}
                    onMouseEnter={() => setHoveredModule(module.id)}
                    onMouseLeave={() => setHoveredModule(null)}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'slideInUp 0.5s ease-out forwards'
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-white font-semibold">{module.code}</h4>
                        <p className="text-[#EBEBF599] text-sm">{module.name}</p>
                      </div>
                      <div className="flex items-center">
                        {module.progress === 100 ? (
                          <CheckCircle className="h-5 w-5 text-[#30D158]" />
                        ) : (
                          <Circle className="h-5 w-5 text-[#EBEBF599]" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-[#EBEBF599]">
                      <span>{module.credits} credits</span>
                      <span>{module.semester}</span>
                    </div>
                    {module.progress > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-[#38383A] rounded-full h-1">
                          <div 
                            className="bg-[#0A84FF] h-1 rounded-full transition-all duration-500"
                            style={{ width: `${module.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Milestones */}
          <Card className="bg-[#0A0A0A] border-[#38383A]">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Star className="h-5 w-5 mr-2 text-[#FF9F0A]" />
                Year {selectedPlan.year} Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedPlan.milestones.map((milestone, index) => (
                  <div
                    key={milestone.id}
                    className="flex items-start space-x-3"
                    style={{
                      animationDelay: `${index * 150}ms`,
                      animation: 'slideInRight 0.5s ease-out forwards'
                    }}
                  >
                    <div className={`p-2 rounded-full ${
                      milestone.completed ? 'bg-[#30D158]' : 'bg-[#38383A]'
                    }`}>
                      {milestone.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${
                        milestone.completed ? 'text-[#30D158]' : 'text-white'
                      }`}>
                        {milestone.title}
                      </h4>
                      <p className="text-[#EBEBF599] text-xs mt-1">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Journey Stats */}
          <Card className="bg-[#0A0A0A] border-[#38383A]">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendUp className="h-5 w-5 mr-2 text-[#30D158]" />
                Journey Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#EBEBF599]">Total Modules</span>
                  <span className="text-white font-bold">{modules.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#EBEBF599]">Completed</span>
                  <span className="text-[#30D158] font-bold">
                    {modules.filter(m => m.progress === 100).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#EBEBF599]">In Progress</span>
                  <span className="text-[#FF9F0A] font-bold">
                    {modules.filter(m => m.progress > 0 && m.progress < 100).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#EBEBF599]">Total Credits</span>
                  <span className="text-white font-bold">
                    {modules.reduce((sum, m) => sum + m.credits, 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#EBEBF599]">Avg Progress</span>
                  <span className="text-[#0A84FF] font-bold">
                    {Math.round(modules.reduce((sum, m) => sum + m.progress, 0) / modules.length)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-[#0A0A0A] border-[#38383A]">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Lightning className="h-5 w-5 mr-2 text-[#0A84FF]" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full bg-[#0A84FF] hover:bg-[#0066CC]">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Academic Calendar
                </Button>
                <Button className="w-full bg-[#1C1C1C] hover:bg-[#38383A] text-white">
                  <Target className="h-4 w-4 mr-2" />
                  Set Goals
                </Button>
                <Button className="w-full bg-[#1C1C1C] hover:bg-[#38383A] text-white">
                  <Trophy className="h-4 w-4 mr-2" />
                  Track Achievements
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
