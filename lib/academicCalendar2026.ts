export type AcademicEventCategory =
  | 'public-holiday'
  | 'orientation'
  | 'registration'
  | 'lecture-period'
  | 'test-week'
  | 'recess'
  | 'exam'
  | 'supplementary-exam'
  | 'cooling-off'
  | 'deadline'
  | 'event'
  | 'timetable-override';

type AcademicRangeEvent = {
  title: string;
  category: AcademicEventCategory;
  startDate: string;
  endDate?: string;
};

export type AcademicCalendarEvent = {
  id: string;
  title: string;
  category: AcademicEventCategory;
  date: string;
};

const UP_ACADEMIC_EVENTS_2026: AcademicRangeEvent[] = [
  { title: 'Public Holiday', category: 'public-holiday', startDate: '2026-01-01' },
  { title: 'Start of Academic Year', category: 'event', startDate: '2026-01-05' },
  { title: 'Online Registration (Senior Students) Opens', category: 'registration', startDate: '2026-01-05' },
  { title: 'Summer School', category: 'lecture-period', startDate: '2026-01-05', endDate: '2026-01-17' },
  { title: 'Submission Deadline: Summer School Final Marks', category: 'deadline', startDate: '2026-01-21' },
  { title: 'Submission Deadline: Chancellors and Special Examinations', category: 'deadline', startDate: '2026-01-28' },
  { title: 'Orientation (International Students)', category: 'orientation', startDate: '2026-01-30', endDate: '2026-02-01' },
  { title: 'Welcome Day', category: 'event', startDate: '2026-01-31' },
  { title: 'Orientation (First-Year Students)', category: 'orientation', startDate: '2026-02-02', endDate: '2026-02-06' },
  { title: 'Senate Review Committee on Readmissions', category: 'event', startDate: '2026-02-02', endDate: '2026-02-06' },
  { title: 'Submission Deadline: Autumn Graduation Final Marks', category: 'deadline', startDate: '2026-02-06' },
  { title: 'INSYNC First-Year Concert', category: 'event', startDate: '2026-02-07' },
  { title: 'Start of Lectures (Q1 and Semester 1)', category: 'lecture-period', startDate: '2026-02-09' },
  { title: 'UP Birthday', category: 'event', startDate: '2026-02-10' },
  { title: 'Autumn Graduation Awarding Deadline', category: 'deadline', startDate: '2026-02-13' },
  { title: 'Registration Closing Date (Q1, Q2, Semester 1)', category: 'registration', startDate: '2026-02-20' },
  { title: 'RAG of Hope Day', category: 'event', startDate: '2026-02-21' },
  { title: 'Cancellation/Swap Closing Date (Q1, Q2, Semester 1)', category: 'deadline', startDate: '2026-03-09' },
  { title: 'Test Week 1 (Semester 1)', category: 'test-week', startDate: '2026-03-14', endDate: '2026-03-20' },
  { title: 'Public Holiday', category: 'public-holiday', startDate: '2026-03-21' },
  { title: 'Lectures End (Q1)', category: 'event', startDate: '2026-03-27' },
  { title: 'Test Week 1 Continues (Semester 1)', category: 'test-week', startDate: '2026-03-28' },
  { title: 'March/April Recess', category: 'recess', startDate: '2026-03-29', endDate: '2026-04-06' },
  { title: 'Public Holiday', category: 'public-holiday', startDate: '2026-04-03' },
  { title: 'Public Holiday', category: 'public-holiday', startDate: '2026-04-06' },
  { title: 'Start of Lectures (Q2)', category: 'lecture-period', startDate: '2026-04-07' },
  { title: 'Monday Timetable Followed', category: 'timetable-override', startDate: '2026-04-07' },
  { title: 'Friday Timetable Followed', category: 'timetable-override', startDate: '2026-04-08' },
  { title: 'Test Week 1 Continues (Semester 1)', category: 'test-week', startDate: '2026-04-11' },
  { title: 'Public Holiday', category: 'public-holiday', startDate: '2026-04-27' },
  { title: 'Public Holiday', category: 'public-holiday', startDate: '2026-05-01' },
  { title: 'Test Week 2 (Semester 1)', category: 'test-week', startDate: '2026-05-02', endDate: '2026-05-09' },
  { title: 'Test Week 2 Continues (Semester 1)', category: 'test-week', startDate: '2026-05-16' },
  { title: 'Cooling-Off Period (Before/During Examinations)', category: 'cooling-off', startDate: '2026-05-17', endDate: '2026-06-27' },
  { title: 'Lectures End (Q2 and Semester 1)', category: 'event', startDate: '2026-05-27' },
  { title: 'Pre-Examination Study Period', category: 'exam', startDate: '2026-05-28', endDate: '2026-05-29' },
  { title: 'Examination Period (Q1, Q2, Semester 1)', category: 'exam', startDate: '2026-05-30', endDate: '2026-06-18' },
  { title: 'Public Holiday', category: 'public-holiday', startDate: '2026-06-16' },
  { title: 'Supplementary Examinations (Q1, Q2, Semester 1)', category: 'supplementary-exam', startDate: '2026-06-22', endDate: '2026-06-27' },
  { title: 'July Recess', category: 'recess', startDate: '2026-06-28', endDate: '2026-07-19' },
  { title: 'Submission Deadline: Supplementary Marks (Q1, Q2, Semester 1)', category: 'deadline', startDate: '2026-06-29' },
  { title: 'Winter School', category: 'lecture-period', startDate: '2026-06-29', endDate: '2026-07-11' },
  { title: 'Submission Deadline: Winter School and Spring Graduation Final Marks', category: 'deadline', startDate: '2026-07-15' },
  { title: 'Start of Lectures (Q3 and Semester 2)', category: 'lecture-period', startDate: '2026-07-20' },
  { title: 'Senate Review Committee on Readmissions', category: 'event', startDate: '2026-07-20', endDate: '2026-07-24' },
  { title: 'Registration Closing Date (Q3, Q4, Semester 2)', category: 'registration', startDate: '2026-07-31' },
  { title: 'Public Holiday', category: 'public-holiday', startDate: '2026-08-09' },
  { title: 'Public Holiday', category: 'public-holiday', startDate: '2026-08-10' },
  { title: 'Cancellation/Swap Closing Date (Q3, Q4, Semester 2)', category: 'deadline', startDate: '2026-08-17' },
  { title: 'Test Week 1 (Semester 2)', category: 'test-week', startDate: '2026-08-22', endDate: '2026-08-29' },
  { title: 'Test Week 1 Continues (Semester 2)', category: 'test-week', startDate: '2026-09-05' },
  { title: 'Lectures End (Q3)', category: 'event', startDate: '2026-09-07' },
  { title: 'Start of Lectures (Q4)', category: 'lecture-period', startDate: '2026-09-08' },
  { title: 'Choose UP Day', category: 'event', startDate: '2026-09-12' },
  { title: 'Friday Timetable Followed', category: 'timetable-override', startDate: '2026-09-15' },
  { title: 'UP Wellness Day (No Lectures)', category: 'event', startDate: '2026-09-16' },
  { title: 'September Recess', category: 'recess', startDate: '2026-09-17', endDate: '2026-09-27' },
  { title: 'Public Holiday', category: 'public-holiday', startDate: '2026-09-24' },
  { title: "International Students' Day", category: 'event', startDate: '2026-10-02' },
  { title: 'Test Week 2 (Semester 2)', category: 'test-week', startDate: '2026-10-10', endDate: '2026-10-17' },
  { title: 'Test Week 2 Continues (Semester 2)', category: 'test-week', startDate: '2026-10-24' },
  { title: 'Cooling-Off Period (Before/During Examinations)', category: 'cooling-off', startDate: '2026-10-25', endDate: '2026-12-05' },
  { title: 'Lectures End (Q4 and Semester 2)', category: 'event', startDate: '2026-11-05' },
  { title: 'Lectures End (Q4 and Semester 2)', category: 'event', startDate: '2026-11-06' },
  { title: 'Wednesday Timetable Followed', category: 'timetable-override', startDate: '2026-11-06' },
  { title: 'Pre-Examination Study Period', category: 'exam', startDate: '2026-11-06' },
  { title: 'Examination Period (Q3, Q4, Semester 2)', category: 'exam', startDate: '2026-11-07', endDate: '2026-11-25' },
  { title: 'Supplementary Examinations (Q3, Q4, Semester 2)', category: 'supplementary-exam', startDate: '2026-11-30', endDate: '2026-12-05' },
  { title: 'End of Academic Year', category: 'event', startDate: '2026-12-05' },
  { title: 'Submission Deadline: Supplementary Marks (Q3, Q4, Semester 2)', category: 'deadline', startDate: '2026-12-07' },
  { title: 'Public Holiday', category: 'public-holiday', startDate: '2026-12-16' },
  { title: 'University Closes (10:00)', category: 'event', startDate: '2026-12-23' },
  { title: 'Public Holiday', category: 'public-holiday', startDate: '2026-12-25' },
  { title: 'Public Holiday', category: 'public-holiday', startDate: '2026-12-26' },
];

function addOneDay(date: Date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return next;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const eventsByDate = (() => {
  const map = new Map<string, AcademicCalendarEvent[]>();

  UP_ACADEMIC_EVENTS_2026.forEach((event, eventIndex) => {
    const start = new Date(`${event.startDate}T00:00:00`);
    const end = new Date(`${event.endDate || event.startDate}T00:00:00`);

    for (let cursor = start; cursor <= end; cursor = addOneDay(cursor)) {
      const date = toDateKey(cursor);
      const bucket = map.get(date) || [];
      bucket.push({
        id: `up-2026-${eventIndex}-${date}`,
        title: event.title,
        category: event.category,
        date,
      });
      map.set(date, bucket);
    }
  });

  return map;
})();

export function getUpAcademicEventsForDate2026(date: Date): AcademicCalendarEvent[] {
  const key = toDateKey(date);
  return eventsByDate.get(key) || [];
}

export function getAcademicEventDotClass(category: AcademicEventCategory): string {
  switch (category) {
    case 'public-holiday':
      return 'bg-danger';
    case 'test-week':
      return 'bg-warning';
    case 'exam':
    case 'supplementary-exam':
      return 'bg-danger';
    case 'recess':
      return 'bg-info';
    case 'registration':
    case 'deadline':
      return 'bg-warning';
    case 'orientation':
    case 'event':
      return 'bg-success';
    case 'cooling-off':
      return 'bg-info';
    case 'timetable-override':
      return 'bg-text-secondary';
    case 'lecture-period':
    default:
      return 'bg-text-secondary';
  }
}
