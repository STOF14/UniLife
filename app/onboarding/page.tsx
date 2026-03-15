'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  clearOnboardingDraft,
  getOnboardingDraft,
  getOnboardingStatus,
  setOnboardingDraft,
  setOnboardingStatus,
} from '@/lib/onboarding';

type StudentIntent = 'first_year' | 'returning' | 'transfer';

type DegreeOption = {
  id: string;
  name: string;
  code: string;
  faculty?: string;
};

type CurriculumOption = {
  id: string;
  academic_year: number;
  is_active: boolean;
  moduleCount?: number;
};

type OnboardingForm = {
  studentIntent: StudentIntent;
  degreeId: string;
  curriculumVersionId: string;
  startYear: string;
  weekStart: 'monday' | 'sunday';
  taskView: 'today' | 'week';
  remindersEnabled: boolean;
  importMode: 'import' | 'quick_start' | 'skip';
};

const defaultForm: OnboardingForm = {
  studentIntent: 'first_year',
  degreeId: '',
  curriculumVersionId: '',
  startYear: String(new Date().getFullYear()),
  weekStart: 'monday',
  taskView: 'week',
  remindersEnabled: true,
  importMode: 'quick_start',
};

const steps = [
  { id: 0, label: 'Welcome' },
  { id: 1, label: 'Academic Setup' },
  { id: 2, label: 'Data Start' },
  { id: 3, label: 'Preferences' },
  { id: 4, label: 'Review' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [isBooting, setIsBooting] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<OnboardingForm>(defaultForm);
  const [degrees, setDegrees] = useState<DegreeOption[]>([]);
  const [curricula, setCurricula] = useState<CurriculumOption[]>([]);
  const [loadingDegrees, setLoadingDegrees] = useState(false);
  const [loadingCurricula, setLoadingCurricula] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(() => Math.round(((stepIndex + 1) / steps.length) * 100), [stepIndex]);

  useEffect(() => {
    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const id = session?.user?.id;

      if (!id) {
        router.replace('/login');
        return;
      }

      if (getOnboardingStatus(id) === 'completed') {
        router.replace('/');
        return;
      }

      const savedDraft = getOnboardingDraft<OnboardingForm>(id);
      if (savedDraft) {
        setForm(savedDraft);
      } else {
        setOnboardingStatus(id, 'in_progress');
      }

      setUserId(id);
      setIsBooting(false);
    };

    bootstrap().catch(() => {
      setIsBooting(false);
      setError('Unable to start onboarding. You can continue to the app and retry from settings.');
    });
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    setOnboardingDraft(userId, form);
  }, [form, userId]);

  useEffect(() => {
    const loadDegrees = async () => {
      setLoadingDegrees(true);
      setError(null);

      try {
        const response = await fetch('/api/degrees/available', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load degrees');
        }

        const payload = await response.json();
        setDegrees(payload.degrees || []);
      } catch {
        setDegrees([]);
        setError('Degree catalog could not be loaded. You can still continue and finish setup later.');
      } finally {
        setLoadingDegrees(false);
      }
    };

    loadDegrees();
  }, []);

  useEffect(() => {
    if (!form.degreeId) {
      setCurricula([]);
      return;
    }

    const loadCurricula = async () => {
      setLoadingCurricula(true);
      setError(null);

      try {
        const response = await fetch(`/api/curriculum/available?degreeId=${form.degreeId}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to load curriculum options');
        }

        const payload = await response.json();
        setCurricula(payload.curricula || []);
      } catch {
        setCurricula([]);
        setError('Curriculum options are temporarily unavailable.');
      } finally {
        setLoadingCurricula(false);
      }
    };

    loadCurricula();
  }, [form.degreeId]);

  const canProceed = () => {
    if (stepIndex === 1) {
      return Boolean(form.degreeId && form.curriculumVersionId && form.startYear);
    }

    return true;
  };

  const goNext = () => {
    if (!canProceed()) {
      setError('Select degree, curriculum, and start year to continue.');
      return;
    }

    setError(null);
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const persistBestEffortProfile = async () => {
    if (!form.degreeId || !form.curriculumVersionId || !userId) {
      return;
    }

    const startYear = Number(form.startYear) || new Date().getFullYear();

    const { data: existing } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('student_profiles')
        .update({
          degree_id: form.degreeId,
          curriculum_version_id: form.curriculumVersionId,
          start_year: startYear,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      return;
    }

    await supabase.from('student_profiles').insert({
      user_id: userId,
      degree_id: form.degreeId,
      curriculum_version_id: form.curriculumVersionId,
      start_year: startYear,
      status: 'active',
      binding_date: new Date().toISOString(),
    });
  };

  const completeOnboarding = async () => {
    if (!userId) return;

    setSaving(true);
    setError(null);

    try {
      localStorage.setItem('tasks_view', form.taskView);
      localStorage.setItem('unilife_week_start', form.weekStart);
      localStorage.setItem('unilife_notify_push', String(form.remindersEnabled));
      localStorage.setItem('unilife_onboarding_student_intent', form.studentIntent);
      localStorage.setItem('unilife_onboarding_import_mode', form.importMode);
      localStorage.setItem('unilife_onboarding_checklist', JSON.stringify([
        { id: 'add_module', label: 'Add your first module', done: false },
        { id: 'add_task', label: 'Create your first task', done: false },
        { id: 'calendar_click', label: 'Open a day in calendar', done: false },
      ]));

      if (form.importMode === 'import') {
        localStorage.setItem('unilife_open_import_on_load', 'true');
      }

      await persistBestEffortProfile();

      setOnboardingStatus(userId, 'completed');
      clearOnboardingDraft(userId);

      router.replace('/');
      router.refresh();
    } catch {
      setError('We could not finalize onboarding right now. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  const skipOnboarding = async () => {
    if (!userId) return;

    setOnboardingStatus(userId, 'skipped');
    clearOnboardingDraft(userId);
    router.replace('/');
  };

  if (isBooting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-body-sm uppercase tracking-[0.12em] text-text-muted">Preparing onboarding</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-md border border-border/80 bg-surface/80 p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-caption uppercase tracking-[0.12em] text-text-muted">First-Time Setup</p>
              <h1 className="mt-1 font-display text-title-sm">Build your UniLife workspace</h1>
            </div>
            <button
              onClick={skipOnboarding}
              className="rounded-sm border border-border/80 px-3 py-2 text-caption uppercase tracking-[0.08em] text-text-tertiary transition-all duration-300 hover:border-border-hover hover:text-text-primary"
            >
              Skip for now
            </button>
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-caption uppercase tracking-[0.08em] text-text-muted">
              <span>Step {stepIndex + 1} of {steps.length}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
              <div className="h-full bg-text-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {stepIndex === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-title-xs">Welcome. What best describes you right now?</h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { id: 'first_year', label: 'First Year' },
                  { id: 'returning', label: 'Returning' },
                  { id: 'transfer', label: 'Transfer / Importing' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setForm((prev) => ({ ...prev, studentIntent: option.id as StudentIntent }))}
                    className={`rounded-sm border px-3 py-3 text-body-sm transition-all duration-300 ${
                      form.studentIntent === option.id
                        ? 'border-text-primary/50 bg-text-primary/10 text-text-primary'
                        : 'border-border/80 bg-surface text-text-tertiary hover:border-border-hover hover:text-text-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {stepIndex === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-title-xs">Set your academic identity</h2>
              <div className="grid gap-3">
                <label className="grid gap-1 text-body-sm text-text-tertiary">
                  <span className="text-caption uppercase tracking-[0.08em] text-text-muted">Degree</span>
                  <select
                    value={form.degreeId}
                    onChange={(e) => setForm((prev) => ({ ...prev, degreeId: e.target.value, curriculumVersionId: '' }))}
                    className="rounded-sm border border-border/80 bg-surface px-3 py-2 text-text-primary"
                    disabled={loadingDegrees}
                  >
                    <option value="">Select degree</option>
                    {degrees.map((degree) => (
                      <option key={degree.id} value={degree.id}>
                        {degree.code} - {degree.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-body-sm text-text-tertiary">
                  <span className="text-caption uppercase tracking-[0.08em] text-text-muted">Curriculum</span>
                  <select
                    value={form.curriculumVersionId}
                    onChange={(e) => setForm((prev) => ({ ...prev, curriculumVersionId: e.target.value }))}
                    className="rounded-sm border border-border/80 bg-surface px-3 py-2 text-text-primary"
                    disabled={!form.degreeId || loadingCurricula}
                  >
                    <option value="">Select curriculum</option>
                    {curricula.map((curriculum) => (
                      <option key={curriculum.id} value={curriculum.id}>
                        {curriculum.academic_year} {curriculum.is_active ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-body-sm text-text-tertiary">
                  <span className="text-caption uppercase tracking-[0.08em] text-text-muted">Start year</span>
                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={form.startYear}
                    onChange={(e) => setForm((prev) => ({ ...prev, startYear: e.target.value }))}
                    className="rounded-sm border border-border/80 bg-surface px-3 py-2 text-text-primary"
                  />
                </label>
              </div>
            </div>
          )}

          {stepIndex === 2 && (
            <div className="space-y-4">
              <h2 className="font-display text-title-xs">How do you want to start your data?</h2>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { id: 'import', label: 'Import Documents', description: 'Bring in yearbook and records.' },
                  { id: 'quick_start', label: 'Quick Start', description: 'Start clean with guided actions.' },
                  { id: 'skip', label: 'Skip Data Setup', description: 'Handle setup later in app.' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setForm((prev) => ({ ...prev, importMode: option.id as OnboardingForm['importMode'] }))}
                    className={`rounded-sm border p-3 text-left transition-all duration-300 ${
                      form.importMode === option.id
                        ? 'border-text-primary/50 bg-text-primary/10'
                        : 'border-border/80 bg-surface hover:border-border-hover'
                    }`}
                  >
                    <div className="text-body-sm text-text-primary">{option.label}</div>
                    <div className="mt-1 text-caption text-text-muted">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {stepIndex === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-title-xs">Set your planner defaults</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-body-sm text-text-tertiary">
                  <span className="text-caption uppercase tracking-[0.08em] text-text-muted">Week starts</span>
                  <select
                    value={form.weekStart}
                    onChange={(e) => setForm((prev) => ({ ...prev, weekStart: e.target.value as OnboardingForm['weekStart'] }))}
                    className="rounded-sm border border-border/80 bg-surface px-3 py-2 text-text-primary"
                  >
                    <option value="monday">Monday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </label>

                <label className="grid gap-1 text-body-sm text-text-tertiary">
                  <span className="text-caption uppercase tracking-[0.08em] text-text-muted">Task view</span>
                  <select
                    value={form.taskView}
                    onChange={(e) => setForm((prev) => ({ ...prev, taskView: e.target.value as OnboardingForm['taskView'] }))}
                    className="rounded-sm border border-border/80 bg-surface px-3 py-2 text-text-primary"
                  >
                    <option value="week">Week</option>
                    <option value="today">Today</option>
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-2 text-body-sm text-text-tertiary">
                <input
                  type="checkbox"
                  checked={form.remindersEnabled}
                  onChange={(e) => setForm((prev) => ({ ...prev, remindersEnabled: e.target.checked }))}
                />
                Enable reminder notifications
              </label>
            </div>
          )}

          {stepIndex === 4 && (
            <div className="space-y-4">
              <h2 className="font-display text-title-xs">Review your setup</h2>
              <div className="rounded-sm border border-border/80 bg-background/70 p-4 text-body-sm text-text-tertiary space-y-2">
                <p><span className="text-text-primary">Student type:</span> {form.studentIntent.replace('_', ' ')}</p>
                <p><span className="text-text-primary">Degree selected:</span> {form.degreeId ? 'Yes' : 'No'}</p>
                <p><span className="text-text-primary">Curriculum selected:</span> {form.curriculumVersionId ? 'Yes' : 'No'}</p>
                <p><span className="text-text-primary">Start mode:</span> {form.importMode.replace('_', ' ')}</p>
                <p><span className="text-text-primary">Week start:</span> {form.weekStart}</p>
                <p><span className="text-text-primary">Task view:</span> {form.taskView}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-sm border border-danger/40 bg-danger/10 p-3 text-caption text-danger">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={goBack}
              disabled={stepIndex === 0 || saving}
              className="rounded-sm border border-border/80 px-4 py-2 text-caption uppercase tracking-[0.08em] text-text-secondary transition-all duration-300 hover:border-border-hover disabled:opacity-40"
            >
              Back
            </button>

            {stepIndex < steps.length - 1 ? (
              <button
                onClick={goNext}
                className="rounded-sm border border-text-primary bg-text-primary px-4 py-2 text-caption uppercase tracking-[0.08em] text-background transition-all duration-300 hover:bg-accent-hover"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={completeOnboarding}
                disabled={saving}
                className="rounded-sm border border-text-primary bg-text-primary px-4 py-2 text-caption uppercase tracking-[0.08em] text-background transition-all duration-300 hover:bg-accent-hover disabled:opacity-50"
              >
                {saving ? 'Finalizing...' : 'Start UniLife'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
