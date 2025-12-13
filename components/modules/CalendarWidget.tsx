'use client';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';

export const CalendarWidget = () => {
  const { tasks } = useDatabase();
  const [date, setDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const startingDayOfWeek = firstDay === 0 ? 6 : firstDay - 1;
    return { daysInMonth: days, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(date);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const changeMonth = (increment: number) => {
    setDate(new Date(year, month + increment, 1));
  };

  return (
    <div className="bg-[#141414] border border-[#38383A] rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-2">
          <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-[#38383A] rounded text-[#EBEBF599] hover:text-white"><ChevronLeft size={20} /></button>
          <button onClick={() => changeMonth(1)} className="p-1 hover:bg-[#38383A] rounded text-[#EBEBF599] hover:text-white"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-[#EBEBF599] uppercase tracking-wider">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1">
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = new Date().toISOString().split('T')[0] === currentDateStr;
          const dayTasks = tasks.filter(t => t.dueDate === currentDateStr);
          const hasHighPriority = dayTasks.some(t => t.priority === 'high');

          return (
            <div key={day} className={`aspect-square rounded-lg flex flex-col items-center justify-center relative group
              ${isToday ? 'bg-[#0A84FF] text-white' : 'hover:bg-[#1C1C1C] text-[#EBEBF5]'}`}>
              <span className="text-sm">{day}</span>
              {dayTasks.length > 0 && (
                <div className={`mt-1 w-1.5 h-1.5 rounded-full ${hasHighPriority ? 'bg-[#FF453A]' : 'bg-[#30D158]'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};