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

      const yearColors = ['#E8E8E8', '#34C759', '#FF9F0A'];
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
    <div className="space-y-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="pb-6 border-b border-border mb-6 flex items-start justify-between">
          <div>
            <p className="chapter-label mb-2">(keikaku) Path</p>
            <h1 className="chapter-title flex items-center gap-3">
              <GraduationCap className="h-7 w-7" />
              University Journey Roadmap
            </h1>
            <p className="chapter-subtitle">
              Your personalized path to success in {major}
              {secondMajor && ` with ${secondMajor} as second major`}
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-2">
            <div className="text-right">
              <p className="text-text-tertiary text-sm">Total Journey</p>
              <p className="font-display text-title-xs text-text-primary">3 Years</p>
            </div>
            <RocketLaunch className="h-6 w-6 text-text-tertiary" />
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex space-x-4 mb-8">
          {yearPlans.map((plan) => (
            <Button
              key={plan.year}
              onClick={() => setSelectedYear(plan.year)}
              className={`flex-1 rounded-sm transition-all duration-300 ease-contemplative ${
                selectedYear === plan.year
                  ? 'bg-text-primary text-background shadow-md'
                  : 'bg-surface text-text-tertiary hover:bg-border'
              }`}
            >
              <div className="flex items-center justify-center">
                <div className={`w-3 h-3  mr-2 ${
                  selectedYear === plan.year ? 'bg-white' : 'bg-text-tertiary'
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
          <Card className="overflow-hidden">
            <div 
              className="h-2 bg-gradient-to-r from-transparent via-text-primary to-transparent"
              style={{ backgroundColor: selectedPlan.color }}
            />
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4  mr-3"
                    style={{ backgroundColor: selectedPlan.color }}
                  />
                  {selectedPlan.title}
                </div>
                <span className="text-sm text-text-tertiary">
                  {selectedPlan.totalCredits} Credits
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-tertiary mb-6">{selectedPlan.description}</p>
              
              {/* Credit Breakdown */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-sm bg-surface/70">
                  <p className="text-2xl font-bold text-success">{selectedPlan.fundamentalCredits}</p>
                  <p className="text-text-tertiary text-sm">Fundamental</p>
                </div>
                <div className="text-center p-4 rounded-sm bg-surface/70">
                  <p className="text-2xl font-bold text-text-primary">{selectedPlan.coreCredits}</p>
                  <p className="text-text-tertiary text-sm">Core</p>
                </div>
                <div className="text-center p-4 rounded-sm bg-surface/70">
                  <p className="text-2xl font-bold text-warning">{selectedPlan.electiveCredits}</p>
                  <p className="text-text-tertiary text-sm">Elective</p>
                </div>
              </div>

              {/* Focus Areas */}
              <div className="mb-6">
                <h3 className="text-text-primary font-semibold mb-3 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-text-primary" />
                  Focus Areas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPlan.focus.map((focus, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-sm bg-surface text-text-tertiary text-sm border border-border"
                    >
                      {focus}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-tertiary">Year Progress</span>
                  <span className="text-text-primary font-medium">
                    {Math.round(animatedProgress[selectedPlan.year] || 0)}%
                  </span>
                </div>
                <div className="w-full rounded-sm bg-border h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-text-primary to-success  transition-all duration-1000 ease-out"
                    style={{ width: `${animatedProgress[selectedPlan.year] || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modules Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-text-primary" />
                Year {selectedPlan.year} Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPlan.modules.map((module, index) => (
                  <div
                    key={module.id}
                    className={`p-4 surface-card transition-all duration-300 ease-contemplative cursor-pointer
                      ${hoveredModule === module.id ? 'border-border-hover -translate-y-0.5' : ''}
                      ${module.progress === 100 ? 'opacity-70' : ''}
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
                        <h4 className="text-text-primary font-semibold">{module.code}</h4>
                        <p className="text-text-tertiary text-sm">{module.name}</p>
                      </div>
                      <div className="flex items-center">
                        {module.progress === 100 ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <Circle className="h-5 w-5 text-text-tertiary" />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-text-tertiary">
                      <span>{module.credits} credits</span>
                      <span>{module.semester}</span>
                    </div>
                    {module.progress > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-border  h-1">
                          <div 
                            className="bg-text-primary h-1  transition-all duration-500"
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
          <Card>
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center">
                <Star className="h-5 w-5 mr-2 text-text-tertiary" />
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
                    <div className={`p-2 rounded-sm ${
                      milestone.completed ? 'bg-success/20' : 'bg-border'
                    }`}>
                      {milestone.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${
                        milestone.completed ? 'text-success' : 'text-text-primary'
                      }`}>
                        {milestone.title}
                      </h4>
                      <p className="text-text-tertiary text-xs mt-1">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Journey Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center">
                <TrendUp className="h-5 w-5 mr-2 text-text-tertiary" />
                Journey Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-tertiary">Total Modules</span>
                  <span className="text-text-primary font-bold">{modules.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-tertiary">Completed</span>
                  <span className="text-success font-bold">
                    {modules.filter(m => m.progress === 100).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-tertiary">In Progress</span>
                  <span className="text-warning font-bold">
                    {modules.filter(m => m.progress > 0 && m.progress < 100).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-tertiary">Total Credits</span>
                  <span className="text-text-primary font-bold">
                    {modules.reduce((sum, m) => sum + m.credits, 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-tertiary">Avg Progress</span>
                  <span className="text-text-primary font-bold">
                    {Math.round(modules.reduce((sum, m) => sum + m.progress, 0) / modules.length)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center">
                <Lightning className="h-5 w-5 mr-2 text-text-tertiary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full rounded-sm bg-text-primary text-background hover:bg-text-secondary ease-contemplative">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Academic Calendar
                </Button>
                <Button className="w-full rounded-sm bg-surface hover:bg-border text-text-primary ease-contemplative">
                  <Target className="h-4 w-4 mr-2" />
                  Set Goals
                </Button>
                <Button className="w-full rounded-sm bg-surface hover:bg-border text-text-primary ease-contemplative">
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
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
