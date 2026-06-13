/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar, Award, Sparkles, CheckCircle2 } from 'lucide-react';

interface CommitmentCalendarProps {
  prayerHistory: Record<string, Record<string, boolean>>;
  selectedDateString: string;
  onSelectDate: (dateStr: string) => void;
  pinkMode: boolean;
  colors: any;
  playSoundEffect: (type: 'tap' | 'done' | 'finish' | 'cancel') => void;
}

const WEEKDAYS = ['أحد', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

export default function CommitmentCalendar({
  prayerHistory,
  selectedDateString,
  onSelectDate,
  pinkMode,
  colors,
  playSoundEffect
}: CommitmentCalendarProps) {
  const today = new Date();
  const todayStr = getLocalDateString(today);

  // Calendar navigation state (viewed month and year)
  const [viewDate, setViewDate] = useState<Date>(() => {
    // Default to the selected date or today
    return new Date(selectedDateString);
  });

  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();

  // Helper to get local date string YYYY-MM-DD
  function getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Handle month navigation
  const handlePrevMonth = () => {
    playSoundEffect('tap');
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    playSoundEffect('tap');
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleJumpToToday = () => {
    playSoundEffect('tap');
    setViewDate(today);
    onSelectDate(todayStr);
  };

  // Month stats & details
  const arabicMonths = [
    "كانون الثاني (1 - يناير)", "شباط (2 - فبراير)", "آذار (3 - مارس)", "نيسان (4 - أبريل)", "أيار (5 - مايو)", "حزيران (6 - يونيو)",
    "تموز (7 - يوليو)", "آب (8 - أغسطس)", "أيلول (9 - سبتمبر)", "تشرين الأول (10 - أكتوبر)", "تشرين الثاني (11 - نوفمبر)", "كانون الأول (12 - ديسمبر)"
  ];
  const monthName = arabicMonths[viewMonth];

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // Day of week (0 = Sun, ..., 6 = Sat)
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Generate blank calendar cell placeholders for offset days (weekday offset)
  const cells: { dayNum: number | null; dateStr: string | null }[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push({ dayNum: null, dateStr: null });
  }

  // Populate cells with actual day attributes
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dayNum: d, dateStr: dStr });
  }

  // Calculate monthly stats
  let totalTrackedDaysInMonth = 0;
  let fullyPrayedDaysInMonth = 0;
  let partialPrayedDaysInMonth = 0;

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const cellDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayRecord = prayerHistory[cellDateStr];
    if (dayRecord) {
      const cnt = Object.values(dayRecord).filter(Boolean).length;
      if (cnt > 0) {
        totalTrackedDaysInMonth++;
        if (cnt === 5) {
          fullyPrayedDaysInMonth++;
        } else {
          partialPrayedDaysInMonth++;
        }
      }
    }
  }

  const MonthCommitmentPct = totalTrackedDaysInMonth > 0 
    ? Math.round((fullyPrayedDaysInMonth / totalTrackedDaysInMonth) * 100) 
    : 0;

  return (
    <div 
      id="commitment-calendar-card" 
      className={`w-full p-4 rounded-3xl border ${colors.borderSoftThin} bg-white dark:bg-stone-900/90 transition-all duration-300 shadow-xs relative overflow-hidden flex flex-col gap-3 font-sans`}
    >
      {/* Sparkles or visual decoration inside header */}
      <div className={`absolute -left-12 -top-12 w-32 h-32 rounded-full filter blur-xl opacity-10 pointer-events-none ${pinkMode ? 'bg-pink-500' : 'bg-emerald-500'}`} />

      {/* Header Info */}
      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-bold text-xs">
          <Calendar className={`w-4 h-4 ${colors.textPri}`} />
          <span>روزنامة الالتزام بالصلوات</span>
        </div>

        {/* Jump back today helper badge if viewing another month or not on today */}
        {(selectedDateString !== todayStr || viewMonth !== today.getMonth() || viewYear !== today.getFullYear()) && (
          <button
            id="cal-jump-today"
            onClick={handleJumpToToday}
            className={`px-2.5 py-1 text-[9px] font-black rounded-full border cursor-pointer transition-all ${
              colors.bgSoft
            } ${colors.borderSoft} ${colors.textPri}`}
          >
            العودة لليوم ⚡
          </button>
        )}
      </div>

      {/* Month Navigation Control */}
      <div className="flex justify-between items-center bg-stone-50 dark:bg-stone-950/40 p-1.5 rounded-2xl border border-stone-100 dark:border-stone-850 relative z-10">
        <button
          id="cal-next-month"
          onClick={handleNextMonth}
          className="p-1 px-1.5 bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer hover:border-stone-300 dark:hover:border-stone-700 transition-all"
          title="الشهر القادم"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <span className="text-xs font-black text-stone-750 dark:text-stone-200 tabular-nums">
          {monthName}
        </span>

        <button
          id="cal-prev-month"
          onClick={handlePrevMonth}
          className="p-1 px-1.5 bg-white dark:bg-stone-900 border border-stone-150 dark:border-stone-800 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-205 cursor-pointer hover:border-stone-300 dark:hover:border-stone-700 transition-all"
          title="الشهر السابق"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Animated Calendar Grid */}
      <div className="relative z-10">
        {/* Weekdays Letters Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1 pb-1 border-b border-stone-100 dark:border-stone-800">
          {WEEKDAYS.map((day, idx) => (
            <span 
              key={idx} 
              className={`text-[10px] font-bold ${idx === 5 ? 'text-amber-600 dark:text-amber-500' : 'text-stone-400 dark:text-stone-500'}`}
            >
              {day}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 font-sans">
          {cells.map((cell, idx) => {
            if (!cell.dayNum || !cell.dateStr) {
              return <div key={`empty-${idx}`} className="aspect-square bg-transparent" />;
            }

            const { dayNum, dateStr } = cell;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDateString;
            const isFuture = dateStr > todayStr;

            // Get prayer record for this day
            const dayRecord = prayerHistory[dateStr];
            const checkedCount = dayRecord ? Object.values(dayRecord).filter(Boolean).length : 0;
            const completedAll = checkedCount === 5;

            // Visual Intensity representation colors
            let cellBgClass = 'bg-stone-50 dark:bg-stone-950/20 text-stone-700 dark:text-stone-400 border border-transparent';
            let glowStyle: React.CSSProperties = {};

            if (isFuture) {
              cellBgClass = 'bg-transparent text-stone-300 dark:text-stone-750 cursor-not-allowed';
            } else if (checkedCount > 0) {
              if (completedAll) {
                // Fully completed colors (Pink Mode or standard Green)
                cellBgClass = pinkMode 
                  ? 'bg-pink-600 dark:bg-pink-700 text-white border border-pink-500' 
                  : 'bg-[#066A38] dark:bg-emerald-700 text-white border border-emerald-600';
                
                // Add glowing shadow for beautiful premium effect
                glowStyle = {
                  boxShadow: pinkMode 
                    ? '0 0 6px rgba(219, 39, 119, 0.45)' 
                    : '0 0 6px rgba(6, 106, 56, 0.45)'
                };
              } else {
                // Partial completions
                // Incremental intensity colors
                if (checkedCount === 1) {
                  cellBgClass = pinkMode 
                    ? 'bg-pink-500/10 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/20' 
                    : 'bg-[#066A38]/10 dark:bg-emerald-500/15 text-stone-800 dark:text-stone-200 border border-emerald-500/20';
                } else if (checkedCount === 2) {
                  cellBgClass = pinkMode 
                    ? 'bg-pink-500/25 dark:bg-pink-500/30 text-pink-700 dark:text-pink-300 border border-pink-500/30' 
                    : 'bg-[#066A38]/25 dark:bg-emerald-500/30 text-stone-800 dark:text-stone-200 border border-emerald-500/30';
                } else if (checkedCount === 3) {
                  cellBgClass = pinkMode 
                    ? 'bg-pink-500/45 dark:bg-pink-500/50 text-pink-800 dark:text-pink-200 border border-pink-500/40' 
                    : 'bg-[#066A38]/45 dark:bg-emerald-500/50 text-stone-800 dark:text-stone-250 border border-emerald-500/40';
                } else { // 4/5
                  cellBgClass = pinkMode 
                    ? 'bg-pink-500/70 dark:bg-pink-550/70 text-white border border-pink-500/60' 
                    : 'bg-[#066A38]/70 dark:bg-emerald-600/70 text-white border border-emerald-500/60';
                }
              }
            } else {
              // Tracked but zero prayers logged (past day empty state)
              cellBgClass = 'bg-stone-50 dark:bg-stone-900/40 text-stone-500 dark:text-amber-500/30 border border-stone-200/20 dark:border-stone-800';
            }

            // Highlighting today or selected cell
            let ringBorderClass = '';
            if (isSelected) {
              ringBorderClass = pinkMode 
                ? 'ring-2 ring-pink-500 ring-offset-2 dark:ring-offset-stone-900' 
                : 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-stone-900';
            } else if (isToday) {
              ringBorderClass = 'border-2 border-amber-400 dark:border-amber-500 scale-102';
            }

            return (
              <button
                key={dateStr}
                disabled={isFuture}
                onClick={() => {
                  playSoundEffect('tap');
                  onSelectDate(dateStr);
                }}
                style={glowStyle}
                className={`aspect-square rounded-xl text-xs font-bold flex flex-col items-center justify-center relative transition-all cursor-pointer ${cellBgClass} ${ringBorderClass} hover:rotate-1`}
              >
                <span className="tabular-nums select-none">{dayNum}</span>

                {/* Miniature checklist success dot inside */}
                {completedAll && (
                  <span className="absolute bottom-0.5 text-[6px] text-white/90">✓</span>
                )}
                {!completedAll && checkedCount > 0 && (
                  <span className="absolute bottom-1 font-mono text-[7px] leading-none opacity-80 font-bold tracking-tight">
                    {checkedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Monthly Statistics Card Footer */}
      <div className="mt-1 pb-1 pt-2.5 border-t border-dashed border-stone-100 dark:border-stone-800 relative z-10 flex flex-col gap-2">
        
        {/* Progress Bar Label */}
        <div className="flex justify-between items-center text-[10px] font-bold text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1">
            <Award className={`w-3.5 h-3.5 ${MonthCommitmentPct >= 75 ? 'text-amber-500' : 'text-stone-400'}`} />
            <span>التزام شهرك الحالي:</span>
          </div>
          <span className={`text-[11px] font-black tabular-nums ${colors.textPri}`}>
            {MonthCommitmentPct}% كامل ({fullyPrayedDaysInMonth} يوم)
          </span>
        </div>

        {/* Dynamic progress loader bar */}
        <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-950 rounded-full overflow-hidden relative border border-stone-200/10 dark:border-stone-850/10">
          <motion.div 
            className={`h-full rounded-full ${pinkMode ? 'bg-gradient-to-r from-pink-500 to-rose-400' : 'bg-gradient-to-r from-[#066A38] to-emerald-400'}`}
            initial={{ width: 0 }}
            animate={{ width: `${MonthCommitmentPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="text-[9px] text-stone-400 dark:text-stone-500 leading-normal font-semibold text-center mt-0.5 select-none">
          💡 انقر على أي يوم سابق باللون الرمادي أو الخفيف لتسجيل صلوات ومراجعة فروضك فيه استدراكاً!
        </div>

      </div>

    </div>
  );
}
