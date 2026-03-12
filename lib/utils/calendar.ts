// Calendar utility functions

export function getDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  return { daysInMonth, startingDayOfWeek, year, month };
}

export function getEventsForDate(date: Date, tasks: Array<{ dueDate: string }>) {
  const dateStr = date.toISOString().split('T')[0];
  return tasks.filter(task => task.dueDate === dateStr);
}

export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
