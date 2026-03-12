// components/academic/ModuleForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, FieldValues, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Module, Assessment } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ColorPicker } from '@/components/ui/ColorPicker';

const moduleSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  credits: z.number().min(0).max(30),
  semester: z.string().min(4, 'Please select a semester'),
  targetGrade: z.number().min(0).max(100),
  professor: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
});

type ModuleFormData = z.infer<typeof moduleSchema>;

type FormFieldProps = {
  field: {
    value: any;
    onChange: (...event: any[]) => void;
    onBlur: () => void;
    name: string;
    ref: React.Ref<any>;
  };
};
interface ModuleFormProps {
  module?: Module;
  onSubmit: (data: ModuleFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ModuleForm({ module, onSubmit, onCancel, isSubmitting }: ModuleFormProps) {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      code: module?.code || '',
      name: module?.name || '',
      credits: module?.credits || 3,
      semester: module?.semester || '',
      targetGrade: module?.targetGrade || 70,
      professor: module?.professor || '',
      description: module?.description || '',
      color: module?.color || '#3b82f6',
    }
  });

 const handleFormSubmit = async (data: ModuleFormData) => {
  try {
    await onSubmit(data);
  } catch (error) {
    console.error('Form submission error:', error);
  }
};

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          name="code"
          control={control as unknown as Control<FieldValues>}
          render={({ field }: { field: FormFieldProps['field'] }) => (
            <Input  
              label="Module Code"
              placeholder="e.g., CS101"
              error={errors.code?.message as string | undefined}
              {...field}
            />
          )}
        />

        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              label="Module Name"
              placeholder="e.g., Introduction to Computer Science"
              error={errors.name?.message}
              {...field}
            />
          )}
        />

        <Controller
          name="credits"
          control={control}
          render={({ field }) => (
            <Input
              type="number"
              label="Credits"
              min="0"
              max="30"
              step="0.5"
              error={errors.credits?.message}
              {...field}
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          )}
        />

        <Controller
          name="semester"
          control={control}
          render={({ field }) => (
            <Select
              label="Semester"
              options={[
                { value: 'Semester 1 2024', label: 'Semester 2 2024' },
                { value: 'Semester 1 2025', label: 'Semester 2 2025' },
              ]}
              error={errors.semester?.message}
              {...field}
            />
          )}
        />

        <Controller
          name="targetGrade"
          control={control}
          render={({ field }) => (
            <Input
              type="number"
              label="Target Grade (%)"
              min="0"
              max="100"
              error={errors.targetGrade?.message}
              {...field}
              value={field.value}
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          )}
        />
        <Controller
          name="professor"
          control={control}
          render={({ field }) => (
            <Input
              label="Instructor"
              placeholder="Professor's name"
              error={errors.professor?.message}
              {...field}
              value={field.value || ''} // This ensures value is never undefined
            />
          )}
        />

        <div className="md:col-span-2">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                label="Description"
                placeholder="Module description and learning objectives..."
                rows={4}
                error={errors.description?.message}
                {...field}
              />
            )}
          />
        </div>

        <div>
          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <ColorPicker
                label="Module Color"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {module ? 'Update Module' : 'Create Module'}
        </Button>
      </div>
    </form>
  );
}