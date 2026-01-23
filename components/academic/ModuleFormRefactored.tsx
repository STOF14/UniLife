// Refactored ModuleForm - Uses Server-Side APIs
// Replaces client-side validation with authoritative server validation

'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/lib/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

// Simplified schema - most validation now server-side
const moduleSchema = z.object({
  moduleCode: z.string().min(1, 'Module code is required'),
});

type ModuleFormData = z.infer<typeof moduleSchema>;

interface ModuleFormRefactoredProps {
  studentProfileId: string;
  onSubmit: (data: ModuleFormData) => Promise<void>;
  onCancel: () => void;
  initialModuleCode?: string;
}

export default function ModuleFormRefactored({ 
  studentProfileId, 
  onSubmit, 
  onCancel, 
  initialModuleCode 
}: ModuleFormRefactoredProps) {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [availableModules, setAvailableModules] = useState<Array<{
    code: string;
    name: string;
    credits: number;
    isEligible: boolean;
  }>>([]);

  const { 
    control, 
    handleSubmit, 
    formState: { errors }, 
    setValue,
    watch 
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      moduleCode: initialModuleCode || '',
    }
  });

  const watchedModuleCode = watch('moduleCode');

  // Load available modules when component mounts
  useEffect(() => {
    loadAvailableModules();
  }, [studentProfileId]);

  // Check eligibility when module code changes
  useEffect(() => {
    if (watchedModuleCode.length >= 3) {
      checkModuleEligibility(watchedModuleCode);
    }
  }, [watchedModuleCode, studentProfileId]);

  const loadAvailableModules = async () => {
    try {
      // Get student's curriculum modules
      const response = await fetch(`/api/academic/progress?studentProfileId=${studentProfileId}&type=curriculum`);
      const data = await response.json();
      
      if (data.recommendedModules) {
        const modulesWithEligibility = data.recommendedModules.map((code: string) => ({
          code,
          name: code, // Would get from API
          credits: 12, // Would get from API
          isEligible: true
        }));
        
        setAvailableModules(modulesWithEligibility);
      }
    } catch (error) {
      console.error('Failed to load available modules:', error);
    }
  };

  const checkModuleEligibility = async (moduleCode: string) => {
    setIsCheckingEligibility(true);
    try {
      const response = await fetch('/api/academic/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': await getCurrentUserId(),
        },
        body: JSON.stringify({
          action: 'checkModuleEligibility',
          studentProfileId,
          data: { moduleCode }
        })
      });

      const result = await response.json();
      setValidationResult(result);
    } catch (error) {
      console.error('Failed to check eligibility:', error);
      setValidationResult({ eligible: false, reason: 'Failed to check eligibility' });
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const onFormSubmit = async (data: ModuleFormData) => {
    // Validate module addition on server
    try {
      const response = await fetch('/api/academic/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': await getCurrentUserId(),
        },
        body: JSON.stringify({
          action: 'validateModuleAddition',
          studentProfileId,
          data: { moduleCode: data.moduleCode }
        })
      });

      const result = await response.json();
      
      if (result.valid) {
        await onSubmit(data);
      } else {
        setValidationResult(result);
      }
    } catch (error) {
      console.error('Failed to validate module addition:', error);
      setValidationResult({ valid: false, errors: ['Server validation failed'] });
    }
  };

  const getCurrentUserId = async () => {
    // Get current user ID - this would come from auth context
    return 'current-user-id'; // Placeholder
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Module Code Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Module Code
          </label>
          <Controller
            name="moduleCode"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="e.g., INF 151"
                disabled={isCheckingEligibility}
              />
            )}
          />
          {errors.moduleCode && (
            <p className="text-red-500 text-sm mt-1">{errors.moduleCode.message}</p>
          )}
        </div>

        {/* Module Selection Dropdown */}
        {availableModules.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or select from your curriculum
            </label>
            <Controller
              name="moduleCode"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  onChange={(value) => {
                    field.onChange(value);
                    if (value) {
                      checkModuleEligibility(value);
                    }
                  }}
                >
                  <option value="">Select a module...</option>
                  {availableModules.map((module) => (
                    <option 
                      key={module.code} 
                      value={module.code}
                      disabled={!module.isEligible}
                    >
                      {module.code} - {module.name} ({module.credits} credits)
                      {!module.isEligible && ' - Not Eligible'}
                    </option>
                  ))}
                </Select>
              )}
            />
          </div>
        )}

        {/* Validation Results */}
        {validationResult && (
          <div className={`p-4 rounded-lg ${
            validationResult.eligible 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {validationResult.eligible ? (
              <div>
                <h4 className="font-medium text-green-800 mb-2">✅ Module Eligible</h4>
                <p className="text-green-700 text-sm">
                  You can add this module to your academic profile.
                </p>
                {validationResult.prerequisitesMet && (
                  <p className="text-green-600 text-xs mt-2">
                    Prerequisites met: {validationResult.prerequisitesMet.join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <h4 className="font-medium text-red-800 mb-2">❌ Module Not Eligible</h4>
                <p className="text-red-700 text-sm mb-2">
                  {validationResult.reason}
                </p>
                {validationResult.prerequisitesMissing && (
                  <div className="mt-3">
                    <p className="font-medium text-red-800 text-sm">Missing Prerequisites:</p>
                    <ul className="list-disc list-inside text-red-600 text-sm mt-1">
                      {validationResult.prerequisitesMissing.map((prereq: string) => (
                        <li key={prereq}>{prereq}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {validationResult.corequisitesRequired && (
                  <div className="mt-3">
                    <p className="font-medium text-red-800 text-sm">Corequisites Required:</p>
                    <ul className="list-disc list-inside text-red-600 text-sm mt-1">
                      {validationResult.corequisitesRequired.map((coreq: string) => (
                        <li key={coreq}>{coreq}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Server Validation Errors */}
        {validationResult && !validationResult.valid && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
            <ul className="list-disc list-inside text-red-600 text-sm">
              {validationResult.errors.map((error: string, index: number) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Server Validation Warnings */}
        {validationResult && validationResult.warnings && validationResult.warnings.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
            <ul className="list-disc list-inside text-yellow-600 text-sm">
              {validationResult.warnings.map((warning: string, index: number) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Loading State */}
        {isCheckingEligibility && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">Checking module eligibility...</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isCheckingEligibility}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!validationResult?.eligible || isCheckingEligibility}
            loading={isCheckingEligibility}
          >
            Add Module
          </Button>
        </div>
      </form>
    </div>
  );
}
