/**
 * Document Import Hub
 * Unified import interface with separate buttons per document type:
 * 1. Yearbook PDF → degree structure + modules
 * 2. Academic Record → grades + CWA + history
 * 3. Module Schedule → weekly timetable
 * 4. Exam/Test Schedule → assessments with dates
 */
'use client';

import { useState, useCallback } from 'react';
import { Module, Assessment, ClassSchedule } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { extractPDFText, detectDocumentType, UPDocumentType } from '@/lib/import/pdfExtractor';
import { parseYearbook, YearbookResult, YearbookModule } from '@/lib/import/yearbookParser';
import { parseAcademicRecord, AcademicRecordResult, RecordModule } from '@/lib/import/academicRecordParser';
import { parseModuleSchedule, ScheduleResult, ScheduleEntry } from '@/lib/import/scheduleParser';
import { parseExamSchedule, ExamScheduleResult, ExamEntry } from '@/lib/import/examScheduleParser';
import {
  FileText,
  BookOpen,
  GraduationCap,
  CalendarBlank,
  Exam,
  CheckCircle,
  WarningCircle,
  CircleNotch,
  UploadSimple,
  ArrowLeft,
  CaretRight,
  X,
  Info,
  ListChecks,
  Clock,
  MapPin,
} from 'phosphor-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ImportStep = 'select' | 'upload' | 'review' | 'done';

interface DocumentImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportModules: (modules: Module[]) => void;
  onImportSchedule?: (entries: ScheduleEntry[]) => void;
  onImportAssessments?: (entries: ExamEntry[], moduleCode: string) => void;
  existingModules: Module[];
}

type ParsedResult = {
  type: UPDocumentType;
  yearbook?: YearbookResult;
  record?: AcademicRecordResult;
  schedule?: ScheduleResult;
  exams?: ExamScheduleResult;
};

// ─── Document Type Config ────────────────────────────────────────────────────

const DOC_TYPES = [
  {
    type: 'yearbook' as UPDocumentType,
    title: 'Yearbook',
    description: 'Import your degree structure, modules, credits, and prerequisites from the UP yearbook PDF',
    icon: BookOpen,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/30',
  },
  {
    type: 'academic-record' as UPDocumentType,
    title: 'Academic Record',
    description: 'Import your grades, marks, pass/fail history, and CWA from your UP academic record',
    icon: GraduationCap,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/30',
  },
  {
    type: 'module-schedule' as UPDocumentType,
    title: 'Module Schedule',
    description: 'Import your weekly class timetable — lectures, tutorials, and practicals',
    icon: CalendarBlank,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/30',
  },
  {
    type: 'exam-schedule' as UPDocumentType,
    title: 'Exam / Test Schedule',
    description: 'Import exam and test dates, times, venues, and weights',
    icon: Exam,
    color: 'text-rose-400',
    bgColor: 'bg-rose-400/10',
    borderColor: 'border-rose-400/30',
  },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export function DocumentImport({
  isOpen,
  onClose,
  onImportModules,
  onImportSchedule,
  onImportAssessments,
  existingModules,
}: DocumentImportProps) {
  const [step, setStep] = useState<ImportStep>('select');
  const [selectedType, setSelectedType] = useState<UPDocumentType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [importCount, setImportCount] = useState(0);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setStep('select');
    setSelectedType(null);
    setFile(null);
    setIsProcessing(false);
    setError(null);
    setResult(null);
    setSelectedItems(new Set());
    setImportCount(0);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // ── File Selection ─────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
    }
  }, []);

  // ── Process PDF ────────────────────────────────────────────────────────────

  const handleProcess = useCallback(async () => {
    if (!file || !selectedType) return;

    setIsProcessing(true);
    setError(null);

    try {
      const pdfResult = await extractPDFText(file);

      // Auto-detect and warn if type doesn't match
      const detected = detectDocumentType(pdfResult);
      if (detected !== selectedType && detected !== 'unknown') {
        setError(
          `This looks like a ${DOC_TYPES.find((d) => d.type === detected)?.title || detected} document. ` +
          `You selected "${DOC_TYPES.find((d) => d.type === selectedType)?.title}". Proceeding anyway...`
        );
      }

      let parsed: ParsedResult;

      switch (selectedType) {
        case 'yearbook': {
          const yearbook = parseYearbook(pdfResult);
          parsed = { type: 'yearbook', yearbook };
          // Select all modules by default
          setSelectedItems(new Set(yearbook.modules.map((m) => m.code)));
          break;
        }
        case 'academic-record': {
          const record = parseAcademicRecord(pdfResult);
          parsed = { type: 'academic-record', record };
          // Select all modules
          const allCodes = record.years.flatMap((y) =>
            y.semesters.flatMap((s) => s.modules.map((m) => m.code))
          );
          setSelectedItems(new Set(allCodes));
          break;
        }
        case 'module-schedule': {
          const schedule = parseModuleSchedule(pdfResult);
          parsed = { type: 'module-schedule', schedule };
          setSelectedItems(new Set(schedule.classes.map((c) => `${c.moduleCode}-${c.day}-${c.startTime}`)));
          break;
        }
        case 'exam-schedule': {
          const exams = parseExamSchedule(pdfResult);
          parsed = { type: 'exam-schedule', exams };
          setSelectedItems(new Set(exams.assessments.map((a) => `${a.moduleCode}-${a.date}`)));
          break;
        }
        default:
          throw new Error('Unknown document type');
      }

      setResult(parsed);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
    } finally {
      setIsProcessing(false);
    }
  }, [file, selectedType]);

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = useCallback(() => {
    if (!result) return;

    switch (result.type) {
      case 'yearbook': {
        if (!result.yearbook) return;
        const selected = result.yearbook.modules.filter((m) => selectedItems.has(m.code));
        const modules = selected.map((m) => yearbookModuleToModule(m));
        onImportModules(modules);
        setImportCount(modules.length);
        break;
      }
      case 'academic-record': {
        if (!result.record) return;
        const allMods = result.record.years.flatMap((y) =>
          y.semesters.flatMap((s) => s.modules)
        );
        const selected = allMods.filter((m) => selectedItems.has(m.code));
        const modules = selected.map((m) => recordModuleToModule(m));
        onImportModules(modules);
        setImportCount(modules.length);
        break;
      }
      case 'module-schedule': {
        if (!result.schedule || !onImportSchedule) return;
        const selected = result.schedule.classes.filter((c) =>
          selectedItems.has(`${c.moduleCode}-${c.day}-${c.startTime}`)
        );
        onImportSchedule(selected);
        setImportCount(selected.length);
        break;
      }
      case 'exam-schedule': {
        if (!result.exams || !onImportAssessments) return;
        const selected = result.exams.assessments.filter((a) =>
          selectedItems.has(`${a.moduleCode}-${a.date}`)
        );
        // Group by module code
        const byModule = new Map<string, ExamEntry[]>();
        for (const entry of selected) {
          const list = byModule.get(entry.moduleCode) || [];
          list.push(entry);
          byModule.set(entry.moduleCode, list);
        }
        for (const [code, entries] of byModule) {
          onImportAssessments(entries, code);
        }
        setImportCount(selected.length);
        break;
      }
    }

    setStep('done');
  }, [result, selectedItems, onImportModules, onImportSchedule, onImportAssessments]);

  // ── Toggle Selection ───────────────────────────────────────────────────────

  const toggleItem = useCallback((key: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (!result) return;
    if (selectedItems.size > 0) {
      setSelectedItems(new Set());
    } else {
      // Re-select all
      switch (result.type) {
        case 'yearbook':
          setSelectedItems(new Set(result.yearbook!.modules.map((m) => m.code)));
          break;
        case 'academic-record':
          setSelectedItems(
            new Set(
              result.record!.years.flatMap((y) =>
                y.semesters.flatMap((s) => s.modules.map((m) => m.code))
              )
            )
          );
          break;
        case 'module-schedule':
          setSelectedItems(
            new Set(result.schedule!.classes.map((c) => `${c.moduleCode}-${c.day}-${c.startTime}`))
          );
          break;
        case 'exam-schedule':
          setSelectedItems(
            new Set(result.exams!.assessments.map((a) => `${a.moduleCode}-${a.date}`))
          );
          break;
      }
    }
  }, [result, selectedItems.size]);

  if (!isOpen) return null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Documents">
      <div className="space-y-4">
        {/* Step: Select Document Type */}
        {step === 'select' && (
          <div className="space-y-3">
            <p className="text-text-tertiary text-sm">
              Select the type of document you want to import from the University of Pretoria.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {DOC_TYPES.map((doc) => {
                const Icon = doc.icon;
                return (
                  <button
                    key={doc.type}
                    onClick={() => {
                      setSelectedType(doc.type);
                      setStep('upload');
                    }}
                    className={`flex items-center gap-4 p-4 bg-surface border border-border hover:border-text-tertiary transition-colors text-left group`}
                  >
                    <div className={`p-3 ${doc.bgColor} border ${doc.borderColor}`}>
                      <Icon className={`h-6 w-6 ${doc.color}`} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary font-medium text-sm">{doc.title}</p>
                      <p className="text-text-tertiary text-xs mt-0.5 line-clamp-2">{doc.description}</p>
                    </div>
                    <CaretRight className="h-4 w-4 text-text-tertiary group-hover:text-text-primary transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Upload File */}
        {step === 'upload' && selectedType && (
          <div className="space-y-4">
            <button
              onClick={() => { setStep('select'); setFile(null); setError(null); }}
              className="flex items-center gap-1 text-text-tertiary hover:text-text-primary text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            {(() => {
              const doc = DOC_TYPES.find((d) => d.type === selectedType)!;
              const Icon = doc.icon;
              return (
                <div className={`flex items-center gap-3 p-3 ${doc.bgColor} border ${doc.borderColor}`}>
                  <Icon className={`h-5 w-5 ${doc.color}`} weight="duotone" />
                  <span className="text-text-primary font-medium text-sm">{doc.title}</span>
                </div>
              );
            })()}

            <div className="border-2 border-dashed border-border hover:border-text-tertiary transition-colors p-8 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="doc-upload"
              />
              <label htmlFor="doc-upload" className="cursor-pointer">
                <FileText className="mx-auto h-10 w-10 text-text-tertiary mb-3" />
                <p className="text-text-primary font-medium text-sm mb-1">
                  {file ? file.name : 'Select PDF File'}
                </p>
                <p className="text-text-tertiary text-xs">
                  Click to browse or drag and drop
                </p>
              </label>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/30">
                <WarningCircle className="h-4 w-4 text-danger mt-0.5 flex-shrink-0" />
                <p className="text-danger text-xs">{error}</p>
              </div>
            )}

            {file && (
              <Button
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full bg-text-primary text-background hover:bg-text-secondary"
              >
                {isProcessing ? (
                  <>
                    <CircleNotch className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UploadSimple className="h-4 w-4 mr-2" />
                    Extract Data
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Step: Review Extracted Data */}
        {step === 'review' && result && (
          <div className="space-y-4">
            <button
              onClick={() => { setStep('upload'); setResult(null); setError(null); }}
              className="flex items-center gap-1 text-text-tertiary hover:text-text-primary text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            {/* Warnings */}
            {getWarnings(result).length > 0 && (
              <div className="p-3 bg-amber-400/10 border border-amber-400/30">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-400 text-xs font-medium">Warnings</span>
                </div>
                {getWarnings(result).map((w, i) => (
                  <p key={i} className="text-text-tertiary text-xs ml-6">• {w}</p>
                ))}
              </div>
            )}

            {/* Type-specific review */}
            {result.type === 'yearbook' && result.yearbook && (
              <YearbookReview
                data={result.yearbook}
                selected={selectedItems}
                onToggle={toggleItem}
                onToggleAll={toggleAll}
              />
            )}
            {result.type === 'academic-record' && result.record && (
              <RecordReview
                data={result.record}
                selected={selectedItems}
                onToggle={toggleItem}
                onToggleAll={toggleAll}
              />
            )}
            {result.type === 'module-schedule' && result.schedule && (
              <ScheduleReview
                data={result.schedule}
                selected={selectedItems}
                onToggle={toggleItem}
                onToggleAll={toggleAll}
              />
            )}
            {result.type === 'exam-schedule' && result.exams && (
              <ExamReview
                data={result.exams}
                selected={selectedItems}
                onToggle={toggleItem}
                onToggleAll={toggleAll}
              />
            )}

            {/* Import button */}
            <div className="flex gap-3">
              <Button
                onClick={handleImport}
                disabled={selectedItems.size === 0}
                className="flex-1 bg-text-primary text-background hover:bg-text-secondary"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Import {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''}
              </Button>
              <Button variant="outline" onClick={reset}>
                Start Over
              </Button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="text-center py-8 space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" weight="duotone" />
            <div>
              <p className="text-text-primary font-medium">Import Complete</p>
              <p className="text-text-tertiary text-sm mt-1">
                Successfully imported {importCount} item{importCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={reset} variant="outline">
                Import Another
              </Button>
              <Button
                onClick={handleClose}
                className="bg-text-primary text-background hover:bg-text-secondary"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Review Sub-Components ───────────────────────────────────────────────────

function YearbookReview({
  data,
  selected,
  onToggle,
  onToggleAll,
}: {
  data: YearbookResult;
  selected: Set<string>;
  onToggle: (k: string) => void;
  onToggleAll: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* Degree summary */}
      <div className="p-3 bg-surface border border-border">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-text-tertiary">Degree</span>
            <p className="text-text-primary font-medium">{data.degree.name}</p>
          </div>
          <div>
            <span className="text-text-tertiary">Faculty</span>
            <p className="text-text-primary font-medium">{data.degree.faculty}</p>
          </div>
          <div>
            <span className="text-text-tertiary">Duration</span>
            <p className="text-text-primary font-medium">{data.degree.durationYears} years</p>
          </div>
          <div>
            <span className="text-text-tertiary">Total Credits</span>
            <p className="text-text-primary font-medium">{data.degree.totalCredits}</p>
          </div>
        </div>
      </div>

      {/* Module list */}
      <div className="flex justify-between items-center">
        <span className="text-text-primary text-sm font-medium">
          Modules ({data.modules.length})
        </span>
        <button onClick={onToggleAll} className="text-text-tertiary text-xs hover:text-text-primary">
          {selected.size > 0 ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1">
        {data.modules.map((m) => (
          <button
            key={m.code}
            onClick={() => onToggle(m.code)}
            className={`w-full flex items-center justify-between p-2.5 text-left transition-colors ${
              selected.has(m.code)
                ? 'bg-text-primary/10 border border-text-primary/30'
                : 'bg-surface border border-border hover:border-text-tertiary'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center ${
                  selected.has(m.code) ? 'bg-text-primary border-text-primary' : 'border-border'
                }`}
              >
                {selected.has(m.code) && <CheckCircle className="h-2.5 w-2.5 text-background" weight="bold" />}
              </div>
              <div className="min-w-0">
                <span className="text-text-primary text-xs font-mono">{m.code}</span>
                <span className="text-text-tertiary text-xs ml-2 truncate">{m.name}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <span className="text-text-tertiary text-xs">{m.credits}cr</span>
              <span className="text-text-tertiary text-xs ml-2">Y{m.yearLevel}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RecordReview({
  data,
  selected,
  onToggle,
  onToggleAll,
}: {
  data: AcademicRecordResult;
  selected: Set<string>;
  onToggle: (k: string) => void;
  onToggleAll: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* Student summary */}
      <div className="p-3 bg-surface border border-border">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-text-tertiary">Student</span>
            <p className="text-text-primary font-medium">{data.student.name}</p>
          </div>
          <div>
            <span className="text-text-tertiary">Number</span>
            <p className="text-text-primary font-mono font-medium">{data.student.studentNumber}</p>
          </div>
          <div>
            <span className="text-text-tertiary">CWA</span>
            <p className="text-text-primary font-medium">{data.summary.cwa}%</p>
          </div>
          <div>
            <span className="text-text-tertiary">Credits Passed</span>
            <p className="text-text-primary font-medium">{data.summary.totalCreditsPassed} / {data.summary.totalCredits}</p>
          </div>
        </div>
      </div>

      {/* Toggle all */}
      <div className="flex justify-between items-center">
        <span className="text-text-primary text-sm font-medium">
          Academic History
        </span>
        <button onClick={onToggleAll} className="text-text-tertiary text-xs hover:text-text-primary">
          {selected.size > 0 ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Year by year */}
      <div className="max-h-64 overflow-y-auto space-y-3">
        {data.years.map((year) => (
          <div key={year.year}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-text-primary text-xs font-medium">{year.year} — Year {year.yearOfStudy}</span>
              <span className="text-text-tertiary text-xs">Avg: {year.yearAverage}%</span>
            </div>
            <div className="space-y-1">
              {year.semesters.flatMap((s) => s.modules).map((m) => (
                <button
                  key={`${m.code}-${year.year}`}
                  onClick={() => onToggle(m.code)}
                  className={`w-full flex items-center justify-between p-2 text-left transition-colors ${
                    selected.has(m.code)
                      ? 'bg-text-primary/10 border border-text-primary/30'
                      : 'bg-surface border border-border hover:border-text-tertiary'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-3 h-3 border flex-shrink-0 ${
                      selected.has(m.code) ? 'bg-text-primary border-text-primary' : 'border-border'
                    }`} />
                    <span className="text-text-primary text-xs font-mono">{m.code}</span>
                    <span className="text-text-tertiary text-xs truncate">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className={`text-xs font-medium ${
                      m.result === 'P' || m.result === 'PP' ? 'text-emerald-400' :
                      m.result === 'F' || m.result === 'FM' ? 'text-danger' : 'text-text-tertiary'
                    }`}>
                      {m.mark !== null ? `${m.mark}%` : m.result}
                    </span>
                    <span className={`text-[10px] px-1 py-0.5 ${
                      m.result === 'P' ? 'bg-emerald-400/10 text-emerald-400' :
                      m.result === 'F' || m.result === 'FM' ? 'bg-danger/10 text-danger' :
                      'bg-surface text-text-tertiary'
                    }`}>
                      {m.result}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleReview({
  data,
  selected,
  onToggle,
  onToggleAll,
}: {
  data: ScheduleResult;
  selected: Set<string>;
  onToggle: (k: string) => void;
  onToggleAll: () => void;
}) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const byDay = new Map<string, ScheduleEntry[]>();
  for (const entry of data.classes) {
    const list = byDay.get(entry.day) || [];
    list.push(entry);
    byDay.set(entry.day, list);
  }

  return (
    <div className="space-y-3">
      <div className="p-3 bg-surface border border-border">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-text-tertiary">Semester</span>
            <p className="text-text-primary font-medium">Semester {data.semester}</p>
          </div>
          <div>
            <span className="text-text-tertiary">Classes</span>
            <p className="text-text-primary font-medium">{data.classes.length} sessions</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-text-primary text-sm font-medium">Weekly Schedule</span>
        <button onClick={onToggleAll} className="text-text-tertiary text-xs hover:text-text-primary">
          {selected.size > 0 ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-3">
        {days.map((day) => {
          const entries = (byDay.get(day) || []).sort((a, b) => a.startTime.localeCompare(b.startTime));
          if (entries.length === 0) return null;
          return (
            <div key={day}>
              <span className="text-text-tertiary text-xs font-medium uppercase tracking-wider">{day}</span>
              <div className="mt-1 space-y-1">
                {entries.map((e) => {
                  const key = `${e.moduleCode}-${e.day}-${e.startTime}`;
                  return (
                    <button
                      key={key}
                      onClick={() => onToggle(key)}
                      className={`w-full flex items-center justify-between p-2 text-left transition-colors ${
                        selected.has(key)
                          ? 'bg-text-primary/10 border border-text-primary/30'
                          : 'bg-surface border border-border hover:border-text-tertiary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 border flex-shrink-0 ${
                          selected.has(key) ? 'bg-text-primary border-text-primary' : 'border-border'
                        }`} />
                        <span className="text-text-primary text-xs font-mono">{e.moduleCode}</span>
                        <span className="text-text-tertiary text-xs capitalize">{e.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-tertiary">
                        <Clock className="h-3 w-3" />
                        <span>{e.startTime}–{e.endTime}</span>
                        {e.venue && (
                          <>
                            <MapPin className="h-3 w-3 ml-1" />
                            <span>{e.venue}</span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExamReview({
  data,
  selected,
  onToggle,
  onToggleAll,
}: {
  data: ExamScheduleResult;
  selected: Set<string>;
  onToggle: (k: string) => void;
  onToggleAll: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="p-3 bg-surface border border-border">
        <div className="text-xs">
          <span className="text-text-tertiary">Period</span>
          <p className="text-text-primary font-medium">{data.period}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-text-primary text-sm font-medium">
          Assessments ({data.assessments.length})
        </span>
        <button onClick={onToggleAll} className="text-text-tertiary text-xs hover:text-text-primary">
          {selected.size > 0 ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1">
        {data.assessments.map((a) => {
          const key = `${a.moduleCode}-${a.date}`;
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className={`w-full flex items-center justify-between p-2.5 text-left transition-colors ${
                selected.has(key)
                  ? 'bg-text-primary/10 border border-text-primary/30'
                  : 'bg-surface border border-border hover:border-text-tertiary'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-3 h-3 border flex-shrink-0 ${
                  selected.has(key) ? 'bg-text-primary border-text-primary' : 'border-border'
                }`} />
                <span className="text-text-primary text-xs font-mono">{a.moduleCode}</span>
                <span className={`text-[10px] px-1 py-0.5 uppercase ${
                  a.type === 'exam' ? 'bg-rose-400/10 text-rose-400' : 'bg-amber-400/10 text-amber-400'
                }`}>
                  {a.type}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-tertiary flex-shrink-0 ml-2">
                <CalendarBlank className="h-3 w-3" />
                <span>{formatDate(a.date)}</span>
                {a.startTime && (
                  <>
                    <Clock className="h-3 w-3 ml-1" />
                    <span>{a.startTime}</span>
                  </>
                )}
                {a.weight > 0 && <span className="text-text-primary font-medium">{a.weight}%</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Converters ──────────────────────────────────────────────────────────────

function yearbookModuleToModule(m: YearbookModule): Module {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    code: m.code,
    name: m.name,
    credits: m.credits,
    semester: m.semester,
    year: m.yearLevel,
    currentGrade: 0,
    targetGrade: 60,
    progress: 0,
    assessments: [],
    completed: false,
    prerequisites: m.prerequisites,
    corequisites: m.corequisites,
    description: m.description,
    createdAt: now,
    updatedAt: now,
    userId: '',
  };
}

function recordModuleToModule(m: RecordModule): Module {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    code: m.code,
    name: m.name,
    credits: m.credits,
    semester: 'Unknown',
    currentGrade: m.mark ?? 0,
    targetGrade: 60,
    progress: m.result === 'P' || m.result === 'PP' ? 100 : 0,
    assessments: [],
    completed: m.result === 'P' || m.result === 'PP',
    createdAt: now,
    updatedAt: now,
    userId: '',
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWarnings(result: ParsedResult): string[] {
  switch (result.type) {
    case 'yearbook': return result.yearbook?.warnings ?? [];
    case 'academic-record': return result.record?.warnings ?? [];
    case 'module-schedule': return result.schedule?.warnings ?? [];
    case 'exam-schedule': return result.exams?.warnings ?? [];
    default: return [];
  }
}

function formatDate(iso: string): string {
  if (!iso) return 'No date';
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}
