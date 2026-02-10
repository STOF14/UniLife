import React, { useEffect, useMemo, useState } from 'react';
import { weeklySchedule, type DaySchedule, type TimetableSession } from '@/lib/timetableData';

type TimeSlot = {
  label: string;
  start: string;
  end: string;
};


const timeSlots: TimeSlot[] = Array.from({ length: 24 }, (_, hour) => {
  const start = `${String(hour).padStart(2, '0')}:00`;
  const end = `${String(hour).padStart(2, '0')}:59`;
  return { label: `${start} - ${end}`, start, end };
});

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const buildInitialPlanner = () => {
  const planner: Record<string, Record<string, string>> = {};

  weeklySchedule.forEach(day => {
    planner[day.day] = {};
    timeSlots.forEach(slot => {
      planner[day.day][slot.start] = '';
    });

    day.sessions.forEach(session => {
      const [startRaw, endRaw] = session.time.split(' - ');
      const startMinutes = timeToMinutes(startRaw);
      const endMinutes = timeToMinutes(endRaw);
      const baseLabel = `${session.module} · ${session.type}${session.venue ? ` @ ${session.venue}` : ''}`;
      const label = session.notes ? `${baseLabel}\n${session.notes}` : baseLabel;

      timeSlots.forEach(slot => {
        const slotStart = timeToMinutes(slot.start);
        const slotEnd = timeToMinutes(slot.end) + 1;
        const overlaps = slotStart < endMinutes && slotEnd > startMinutes;
        if (overlaps) {
          planner[day.day][slot.start] = label;
        }
      });
    });
  });

  return planner;
};

const groupRegistrations = [
  { module: 'COS 210', lectures: 'G01', practicals: 'G01', tutorials: '-' },
  { module: 'COS 212', lectures: 'G01', practicals: 'SKIPPED', tutorials: '-' },
  { module: 'PHY 255', lectures: 'G01', practicals: 'G01', tutorials: 'G01' },
  { module: 'WTW 211', lectures: 'G01', practicals: '-', tutorials: 'T02' },
  { module: 'WTW 218', lectures: 'G02', practicals: '-', tutorials: 'T03' }
];

const quickStats = [
  { label: 'Earliest Class', value: 'Friday 07:30 (WTW 211)' },
  { label: 'Latest Class', value: '17:20 (Mon/Tue/Fri)' },
  { label: 'Longest Day', value: 'Monday (8h 30m)' },
  { label: 'Shortest Day', value: 'Thursday (3h 30m)' },
  { label: 'Free Mornings', value: 'Tuesday until 14:30' },
  { label: '3-Hour Blocks', value: 'Mon (PHY prac), Tue (PHY tut), Fri (COS prac)' }
];

const importantDates = {
  tests: [
    { module: 'COS 210', date: '18 Mar', label: 'Test 1' },
    { module: 'WTW 211', date: '17 Mar', label: 'Test 1' },
    { module: 'WTW 218', date: '16 Mar', label: 'Test 1' },
    { module: 'PHY 255', date: '19 Mar', label: 'Test 1' },
    { module: 'COS 212', date: '28 Mar', label: 'Test 1' },
    { module: 'WTW 218', date: '2 May', label: 'Test 2' },
    { module: 'WTW 211', date: '8 May', label: 'Test 2' },
    { module: 'COS 212', date: '7 May', label: 'Test 2' },
    { module: 'PHY 255', date: '16 May', label: 'Test 2' },
    { module: 'COS 210', date: '16 May', label: 'Test 2' }
  ],
  exams: [
    { module: 'WTW 211', date: '01 Jun', time: '15:00-18:00' },
    { module: 'PHY 255 Paper 1', date: '03 Jun', time: '11:15-14:15' },
    { module: 'COS 210', date: '05 Jun', time: '07:30-10:30' },
    { module: 'COS 212', date: '08 Jun', time: '11:15-14:15' },
    { module: 'PHY 255 Paper 2', date: '10 Jun', time: '07:30-10:30' },
    { module: 'WTW 218', date: '13 Jun', time: '07:30-10:30' }
  ]
};

const checklist = [
  'Check schedule night before',
  'Pack materials for all classes',
  'Set alarms (especially Thursday night for Friday!)',
  'Note any venue changes',
  'Download lecture slides if available',
  'Bring snacks for long days (Monday!)'
];

const goals = [
  'Maintain >75% attendance',
  'Complete all practicals',
  'Attend all tutorials',
  'Use Tuesday study block effectively',
  'Stay on top of COS 212 (no practical = self-study!)',
  'Get good sleep before Friday 07:30 start'
];

export const TimetablePage = () => {
  const [planner, setPlanner] = useState<Record<string, Record<string, string>>>(() => {
    if (typeof window === 'undefined') return buildInitialPlanner();
    const saved = localStorage.getItem('unilife_timetable_planner');
    return saved ? JSON.parse(saved) : buildInitialPlanner();
  });
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'all'>('week');
  const [copyFromDay, setCopyFromDay] = useState('Monday');
  const [copyToDay, setCopyToDay] = useState('Tuesday');

  useEffect(() => {
    localStorage.setItem('unilife_timetable_planner', JSON.stringify(planner));
  }, [planner]);

  const weekDays = weeklySchedule.map(day => day.day);
  const todayName = useMemo(() => {
    const name = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return weekDays.includes(name) ? name : weekDays[0];
  }, [weekDays]);

  const daysToShow = viewMode === 'today'
    ? [todayName]
    : weekDays;

  const updateSlot = (day: string, slotStart: string, value: string) => {
    setPlanner(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slotStart]: value
      }
    }));
  };

  const clearDay = (day: string) => {
    setPlanner(prev => {
      const cleared = { ...prev[day] };
      Object.keys(cleared).forEach(slot => {
        cleared[slot] = '';
      });
      return { ...prev, [day]: cleared };
    });
  };

  const copyDay = () => {
    if (copyFromDay === copyToDay) return;
    setPlanner(prev => ({
      ...prev,
      [copyToDay]: { ...prev[copyFromDay] }
    }));
  };

  const modulePalette = ['bg-[#0A84FF]/15', 'bg-[#30D158]/15', 'bg-[#FF9F0A]/15', 'bg-[#FF453A]/15', 'bg-[#BF5AF2]/15'];
  const getModuleColor = (label: string) => {
    const moduleKey = label.split('·')[0]?.trim() || '';
    if (!moduleKey) return 'bg-transparent';
    const hash = moduleKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return modulePalette[hash % modulePalette.length];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-white">Timetable</h1>
        <p className="text-sm text-[#EBEBF599]">Semester 1, 2026 · Last updated Feb 3, 2026</p>
      </div>

      <div className="bg-[#141414] border border-[#38383A] rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-[#0A84FF]/20 text-[#0A84FF] text-sm">
            23 contact hours / week
          </div>
          <div className="px-3 py-1 rounded-full bg-[#30D158]/20 text-[#30D158] text-sm">
            18 classes / week
          </div>
          <div className="px-3 py-1 rounded-full bg-[#FF9F0A]/20 text-[#FF9F0A] text-sm">
            Best study block: Tue 09:30-13:20
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex gap-2">
          {(['today', 'week', 'all'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-[#0A84FF] text-white'
                  : 'bg-[#141414] text-[#EBEBF599] hover:bg-[#1C1C1C] border border-[#38383A]'
              }`}
            >
              {mode === 'today' ? 'Today' : mode === 'week' ? 'Week' : 'All'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={copyFromDay}
            onChange={(e) => setCopyFromDay(e.target.value)}
            className="px-3 py-2 bg-[#141414] border border-[#38383A] rounded-lg text-white text-sm"
          >
            {weeklySchedule.map(day => (
              <option key={day.day} value={day.day}>Copy {day.day}</option>
            ))}
          </select>
          <select
            value={copyToDay}
            onChange={(e) => setCopyToDay(e.target.value)}
            className="px-3 py-2 bg-[#141414] border border-[#38383A] rounded-lg text-white text-sm"
          >
            {weeklySchedule.map(day => (
              <option key={day.day} value={day.day}>to {day.day}</option>
            ))}
          </select>
          <button
            onClick={copyDay}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#141414] text-white border border-[#38383A] hover:border-[#0A84FF]"
          >
            Copy Day
          </button>
        </div>
      </div>

      <div className="bg-[#141414] border border-[#38383A] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#38383A]">
          <h2 className="text-lg font-semibold text-white">Weekly Planner</h2>
          <p className="text-xs text-[#EBEBF599]">Day-by-day · Hour-by-hour · Click any cell to edit</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="bg-[#0A0A0A] text-[#EBEBF599]">
              <tr>
                <th className="text-left px-4 py-3">Time</th>
                {daysToShow.map(dayName => {
                  const day = weeklySchedule.find(d => d.day === dayName)!;
                  return (
                  <th key={day.day} className="text-left px-4 py-3">
                    <div className="text-white text-sm font-semibold">{day.day}</div>
                    <div className="text-[11px] text-[#EBEBF599]">
                      {day.totalHours} · {day.highlightTone} {day.highlight}
                    </div>
                    <button
                      onClick={() => clearDay(day.day)}
                      className="mt-2 text-[11px] text-[#EBEBF599] hover:text-white"
                    >
                      Clear Day
                    </button>
                  </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(slot => (
                <tr key={slot.start} className="border-t border-[#38383A]">
                  <td className="px-4 py-3 whitespace-nowrap text-[#EBEBF599]">
                    {slot.label}
                  </td>
                  {daysToShow.map(dayName => {
                    const cellValue = planner[dayName]?.[slot.start] ?? '';
                    const isFree = cellValue.toLowerCase().includes('free');

                    return (
                      <td
                        key={`${dayName}-${slot.start}`}
                        className={`px-3 py-2 align-top ${isFree ? 'bg-[#0A0A0A]' : getModuleColor(cellValue)}`}
                      >
                        <textarea
                          value={cellValue}
                          onChange={(e) => updateSlot(dayName, slot.start, e.target.value)}
                          placeholder="Free"
                          rows={3}
                          className={`w-full resize-none rounded-md border border-transparent bg-transparent text-xs text-white placeholder:text-[#3A3A3C] focus:outline-none focus:border-[#0A84FF] focus:bg-[#0A0A0A] ${
                            isFree ? 'text-[#30D158]' : 'text-white'
                          }`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-3">Group Registrations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[#EBEBF599]">
                <tr>
                  <th className="text-left py-2">Module</th>
                  <th className="text-left py-2">Lectures</th>
                  <th className="text-left py-2">Practicals</th>
                  <th className="text-left py-2">Tutorials</th>
                </tr>
              </thead>
              <tbody>
                {groupRegistrations.map(row => (
                  <tr key={row.module} className="border-t border-[#38383A]">
                    <td className="py-2 text-white">{row.module}</td>
                    <td className="py-2 text-[#EBEBF599]">{row.lectures}</td>
                    <td className={`py-2 ${row.practicals === 'SKIPPED' ? 'text-[#FF453A]' : 'text-[#EBEBF599]'}`}>
                      {row.practicals}
                    </td>
                    <td className="py-2 text-[#EBEBF599]">{row.tutorials}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-4 space-y-4">
          <h2 className="text-lg font-semibold text-white">Important Notes</h2>
          <div className="bg-[#0A0A0A] border border-[#38383A] rounded-lg p-3">
            <p className="text-sm text-white font-medium">WTW 218 Cross-Group Attendance</p>
            <p className="text-xs text-[#EBEBF599] mt-1">Attend G01 on Thursday @ HB 4-3, 08:30-09:20 (avoid Fri conflict with COS 212).</p>
          </div>
          <div className="bg-[#0A0A0A] border border-[#38383A] rounded-lg p-3">
            <p className="text-sm text-white font-medium">COS 212 Practical</p>
            <p className="text-xs text-[#EBEBF599] mt-1">Status: Not attending (optional). Saves 2h 50m/week (~34h/semester).</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-3">Quick Stats</h2>
          <div className="space-y-2">
            {quickStats.map(stat => (
              <div key={stat.label} className="flex items-center justify-between text-sm">
                <span className="text-[#EBEBF599]">{stat.label}</span>
                <span className="text-white text-right">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-3">Semester Tests</h2>
          <div className="space-y-2">
            {importantDates.tests.map(test => (
              <div key={`${test.module}-${test.label}`} className="flex items-center justify-between text-sm">
                <span className="text-[#EBEBF599]">{test.module}</span>
                <span className="text-white">{test.label} · {test.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-3">Final Exams</h2>
          <div className="space-y-2">
            {importantDates.exams.map(exam => (
              <div key={exam.module} className="flex items-center justify-between text-sm">
                <span className="text-[#EBEBF599]">{exam.module}</span>
                <span className="text-white">{exam.date} · {exam.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-3">Daily Checklist</h2>
          <ul className="space-y-2">
            {checklist.map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-[#EBEBF599]">
                <span className="w-2 h-2 rounded-full bg-[#30D158]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#141414] border border-[#38383A] rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-3">Semester Goals</h2>
          <ul className="space-y-2">
            {goals.map(goal => (
              <li key={goal} className="flex items-center gap-2 text-sm text-[#EBEBF599]">
                <span className="w-2 h-2 rounded-full bg-[#0A84FF]" />
                {goal}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
