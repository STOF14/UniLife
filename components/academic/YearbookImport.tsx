// components/academic/YearbookImport.tsx
'use client';

import { useState, useCallback } from 'react';
import { Module } from '@/lib/types';
import { extractYearbookData, ExtractedYearbookData } from '@/lib/utils/advancedPdfParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  UploadSimple,
  FileText,
  CheckCircle,
  WarningCircle,
  BookOpen,
  Trophy,
  TrendUp,
  Calendar,
  Buildings,
  GraduationCap,
  CircleNotch,
  Eye,
  DownloadSimple
} from 'phosphor-react';

interface YearbookImportProps {
  onImport: (modules: Module[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function YearbookImport({ onImport, isOpen, onClose }: YearbookImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedYearbookData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setExtractionError(null);
      setExtractedData(null);
      setSelectedModules(new Set());
    } else {
      setExtractionError('Please select a valid PDF file');
    }
  }, []);

  const handleExtract = useCallback(async () => {
    if (!file) return;

    setIsExtracting(true);
    setExtractionError(null);

    try {
      const data = await extractYearbookData(file);
      setExtractedData(data);
      // Select all modules by default
      setSelectedModules(new Set(data.modules.map(m => m.id)));
    } catch (error) {
      setExtractionError(error instanceof Error ? error.message : 'Failed to extract data from PDF');
    } finally {
      setIsExtracting(false);
    }
  }, [file]);

  const handleImport = useCallback(() => {
    if (!extractedData) return;

    const selectedModuleData = extractedData.modules.filter(module => 
      selectedModules.has(module.id)
    );

    onImport(selectedModuleData);
    onClose();
    
    // Reset state
    setFile(null);
    setExtractedData(null);
    setSelectedModules(new Set());
    setShowPreview(false);
  }, [extractedData, selectedModules, onImport, onClose]);

  const toggleModuleSelection = useCallback((moduleId: string) => {
    setSelectedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  }, []);

  const toggleAllModules = useCallback(() => {
    if (!extractedData) return;

    if (selectedModules.size === extractedData.modules.length) {
      setSelectedModules(new Set());
    } else {
      setSelectedModules(new Set(extractedData.modules.map(m => m.id)));
    }
  }, [extractedData, selectedModules.size]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Yearbook">
      <div className="space-y-6">
        {/* File Upload Section */}
        {!extractedData && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border  p-8 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="yearbook-upload"
              />
              <label htmlFor="yearbook-upload" className="cursor-pointer">
                <FileText className="mx-auto h-12 w-12 text-text-tertiary mb-4" />
                <p className="text-text-primary font-medium mb-2">Select Yearbook PDF</p>
                <p className="text-text-tertiary text-sm">
                  Upload your university yearbook to extract module information
                </p>
                {file && (
                  <div className="mt-4 inline-flex items-center px-3 py-1 bg-surface ">
                    <FileText className="h-4 w-4 mr-2 text-text-primary" />
                    <span className="text-text-primary text-sm">{file.name}</span>
                  </div>
                )}
              </label>
            </div>

            {extractionError && (
              <div className="flex items-center space-x-2 p-3 bg-danger/20 border border-danger/50 ">
                <WarningCircle className="h-5 w-5 text-danger" />
                <p className="text-danger text-sm">{extractionError}</p>
              </div>
            )}

            {file && (
              <Button 
                onClick={handleExtract} 
                disabled={isExtracting}
                className="w-full bg-text-primary text-background hover:bg-text-secondary"
              >
                {isExtracting ? (
                  <>
                    <CircleNotch className="h-4 w-4 mr-2 animate-spin" />
                    Extracting Data...
                  </>
                ) : (
                  <>
                    <UploadSimple className="h-4 w-4 mr-2" />
                    Extract Module Information
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Extraction Results */}
        {extractedData && (
          <div className="space-y-6">
            {/* Academic Information Summary */}
            <Card className="bg-background border-border">
              <CardHeader>
                <CardTitle className="text-text-primary flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-text-primary" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-text-tertiary text-sm">Academic Year</p>
                    <p className="text-text-primary font-medium">{extractedData.academicYear}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-sm">Faculty</p>
                    <p className="text-text-primary font-medium">{extractedData.faculty}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-sm">Degree</p>
                    <p className="text-text-primary font-medium">{extractedData.degree}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-sm">Total Credits</p>
                    <p className="text-text-primary font-medium">{extractedData.totalCredits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module Selection */}
            <Card className="bg-background border-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-text-primary flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-text-primary" />
                    Modules Found ({extractedData.modules.length})
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {showPreview ? 'Hide' : 'Show'} Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleAllModules}
                    >
                      {selectedModules.size === extractedData.modules.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {extractedData.modules.map((module) => (
                    <div
                      key={module.id}
                      className={`flex items-center justify-between p-3  cursor-pointer transition-colors ${
                        selectedModules.has(module.id) 
                          ? 'bg-text-primary/20 border border-text-primary/50' 
                          : 'bg-surface hover:bg-border'
                      }`}
                      onClick={() => toggleModuleSelection(module.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 border-2 ${
                          selectedModules.has(module.id)
                            ? 'bg-text-primary border-text-primary'
                            : 'border-border'
                        }`}>
                          {selectedModules.has(module.id) && (
                            <CheckCircle className="h-3 w-3 text-text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="text-text-primary font-medium">{module.code}</p>
                          <p className="text-text-tertiary text-sm">{module.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-text-primary text-sm">{module.credits} credits</p>
                        <p className="text-text-tertiary text-xs">{module.semester}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Preview Section */}
            {showPreview && (
              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle className="text-text-primary flex items-center">
                    <Eye className="h-5 w-5 mr-2 text-text-primary" />
                    Preview Selected Modules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {extractedData.modules
                      .filter(module => selectedModules.has(module.id))
                      .map((module) => (
                        <div key={module.id} className="bg-surface p-4 ">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-text-primary font-medium">{module.code}</h4>
                              <p className="text-text-tertiary text-sm">{module.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-text-primary text-sm">{module.credits} credits</p>
                              <p className="text-text-tertiary text-xs">{module.semester}</p>
                            </div>
                          </div>
                          
                          {module.description && (
                            <p className="text-text-tertiary text-sm mb-2">{module.description}</p>
                          )}
                          
                          {module.prerequisites && module.prerequisites.length > 0 && (
                            <div className="mb-2">
                              <p className="text-text-tertiary text-xs">Prerequisites:</p>
                              <p className="text-text-primary text-sm">{module.prerequisites.join(', ')}</p>
                            </div>
                          )}
                          
                          {module.assessments && module.assessments.length > 0 && (
                            <div>
                              <p className="text-text-tertiary text-xs">Assessments:</p>
                              <div className="space-y-1">
                                {module.assessments.map((assessment, index) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span className="text-text-primary">{assessment.name}</span>
                                    <span className="text-text-tertiary">{assessment.weight}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Import Actions */}
            <div className="flex space-x-3">
              <Button
                onClick={handleImport}
                disabled={selectedModules.size === 0}
                className="flex-1 bg-text-primary text-background hover:bg-text-secondary"
              >
                <DownloadSimple className="h-4 w-4 mr-2" />
                Import {selectedModules.size} Module{selectedModules.size !== 1 ? 's' : ''}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setExtractedData(null);
                  setSelectedModules(new Set());
                  setShowPreview(false);
                }}
              >
                Start Over
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
