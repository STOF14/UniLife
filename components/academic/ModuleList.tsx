// components/academic/ModuleList.tsx
'use client';

import { useState } from 'react';
import { Module } from '@/lib/types';
import { calculateCurrentGrade, calculatePredictedGrade } from '@/lib/utils/academicCalculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { Plus, BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ModuleListProps {
  modules: Module[];
  onAddModule?: () => void;
}

export function ModuleList({ modules, onAddModule }: ModuleListProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  if (modules.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No modules yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding your first module.
        </p>
        <div className="mt-6">
          <Button onClick={onAddModule}>
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Add Module
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">My Modules</h2>
        {onAddModule && (
          <Button size="sm" onClick={onAddModule}>
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Module
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => {
          const currentGrade = calculateCurrentGrade(module);
          const predictedGrade = calculatePredictedGrade(module);
          const isExpanded = expandedModule === module.id;

          return (
            <Card key={module.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-medium">
                      {module.code}
                    </CardTitle>
                    <p className="text-sm text-gray-500">{module.name}</p>
                  </div>
                  <div 
                    className={`w-4 h-4 rounded-full`}
                    style={{ backgroundColor: module.color || '#3b82f6' }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium">{Math.round(module.progress)}%</span>
                    </div>
                    <Progress value={module.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Current</div>
                      <div className="font-medium">
                        {currentGrade ? `${currentGrade}%` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Predicted</div>
                      <div 
                        className={`font-medium ${
                          predictedGrade >= module.targetGrade 
                            ? 'text-green-600' 
                            : 'text-amber-600'
                        }`}
                      >
                        {predictedGrade}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Target</div>
                      <div className="font-medium">{module.targetGrade}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Credits</div>
                      <div className="font-medium">{module.credits}</div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link 
                      href={`/academic/modules/${module.id}`}
                      className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80"
                    >
                      View details <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}