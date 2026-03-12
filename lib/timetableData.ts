
export type TimetableSession = {
  time: string;
  module: string;
  type: string;
  venue: string;
  notes?: string;
  isFree?: boolean;
};

export type DaySchedule = {
  day: string;
  highlight: string;
  highlightTone: string;
  totalHours: string;
  sessions: TimetableSession[];
};

export const weeklySchedule: DaySchedule[] = [
  {
    day: 'Monday',
    highlight: 'Busiest day - 8.5 hours!',
    highlightTone: 'Peak',
    totalHours: '8.5 hours',
    sessions: [
      { time: '08:30 - 09:20', module: 'PHY 255', type: 'Lecture', venue: 'NS1 5-42' },
      { time: '11:30 - 12:20', module: 'COS 210', type: 'Lecture', venue: 'IT 2-26' },
      { time: '12:30 - 13:20', module: 'WTW 211', type: 'Lecture', venue: 'HB 4-3' },
      { time: '13:30 - 16:20', module: 'PHY 255', type: 'Practical', venue: 'NS1 5-42', notes: '3 hours' },
      { time: '16:30 - 17:20', module: 'COS 212', type: 'Lecture', venue: 'Large Chemistry Hall' }
    ]
  },
  {
    day: 'Tuesday',
    highlight: 'Best study day - Free morning!',
    highlightTone: 'Study',
    totalHours: '4 hours',
    sessions: [
      { time: '08:30 - 09:20', module: 'WTW 218', type: 'Lecture', venue: 'HB 4-3', notes: 'G02' },
      { time: '09:30 - 13:20', module: 'FREE TIME', type: 'Study', venue: 'Library?', notes: '4-hour block', isFree: true },
      { time: '14:30 - 17:20', module: 'PHY 255', type: 'Tutorial', venue: 'NS1 5-42', notes: '3 hours' }
    ]
  },
  {
    day: 'Wednesday',
    highlight: 'Balanced day - 4.5 hours',
    highlightTone: 'On track',
    totalHours: '4.5 hours',
    sessions: [
      { time: '08:30 - 09:20', module: 'COS 210', type: 'Lecture', venue: 'IT 2-26' },
      { time: '09:30 - 10:20', module: 'COS 212', type: 'Lecture', venue: 'Louw hall' },
      { time: '11:30 - 12:50', module: 'WTW 218', type: 'Tutorial', venue: 'Botany 2-26', notes: 'T03' },
      { time: '14:30 - 15:50', module: 'WTW 211', type: 'Tutorial', venue: 'Te Water hall', notes: 'T02' }
    ]
  },
  {
    day: 'Thursday',
    highlight: 'Light day - 3.5 hours',
    highlightTone: 'Light',
    totalHours: '3.5 hours',
    sessions: [
      { time: '08:30 - 09:20', module: 'WTW 218', type: 'Lecture', venue: 'HB 4-3', notes: 'Attend G01 (cross-group)' },
      { time: '12:30 - 14:20', module: 'PHY 255', type: 'Lecture', venue: 'NS1 5-42', notes: '2 hours' },
      { time: '16:30 - 17:20', module: 'COS 212', type: 'Lecture', venue: 'Roos hall' }
    ]
  },
  {
    day: 'Friday',
    highlight: 'Early start day',
    highlightTone: 'Early',
    totalHours: '6 hours',
    sessions: [
      { time: '07:30 - 08:20', module: 'WTW 211', type: 'Lecture', venue: 'AE Annex', notes: 'Early start' },
      { time: '08:30 - 09:20', module: 'PHY 255', type: 'Lecture', venue: 'NS1 5-42' },
      { time: '09:30 - 10:20', module: 'COS 212', type: 'Lecture', venue: 'Louw hall' },
      { time: '14:30 - 17:20', module: 'COS 210', type: 'Practical', venue: 'IT 2-26', notes: '3 hours' }
    ]
  }
];

const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const getNextSession = (now: Date) => {
  const todayIndex = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (let offset = 0; offset < 7; offset += 1) {
    const dayIndex = (todayIndex + offset) % 7;
    const dayName = dayOrder[dayIndex];
    const daySchedule = weeklySchedule.find(d => d.day === dayName);

    if (!daySchedule) continue;

    const sessions = daySchedule.sessions
      .map(session => {
        const [startRaw] = session.time.split(' - ');
        return {
          ...session,
          startMinutes: timeToMinutes(startRaw)
        };
      })
      .sort((a, b) => a.startMinutes - b.startMinutes);

    const nonFreeSessions = sessions.filter(s => !s.isFree);
    const candidate = offset === 0
      ? nonFreeSessions.find(s => s.startMinutes > nowMinutes)
      : nonFreeSessions[0];

    if (candidate) {
      return {
        day: dayName,
        time: candidate.time,
        module: candidate.module,
        type: candidate.type,
        venue: candidate.venue,
        notes: candidate.notes
      };
    }
  }

  return null;
};
