import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, MONTH_NAMES, MONTH_SHORT_NAMES } from '../../utils/formatters';

export const SpendingChart: React.FC = () => {
  const { filteredExpenses, filterState, currency } = useApp();
  const [hoveredDay, setHoveredDay] = useState<{ day: string; amount: number; count: number } | null>(
    null
  );

  // Group spending by date
  const dailyTotals: Record<string, { total: number; count: number }> = {};
  filteredExpenses.forEach((exp) => {
    if (!dailyTotals[exp.date]) {
      dailyTotals[exp.date] = { total: 0, count: 0 };
    }
    dailyTotals[exp.date].total += exp.amount;
    dailyTotals[exp.date].count += 1;
  });

  // Determine date buckets depending on periodType
  let chartBars: { label: string; dateKey: string; amount: number; count: number }[] = [];

  if (filterState.periodType === 'month') {
    // Generate all days of that month
    const daysInMonth = new Date(filterState.selectedYear, filterState.selectedMonth + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const monthStr = String(filterState.selectedMonth + 1).padStart(2, '0');
      const dateKey = `${filterState.selectedYear}-${monthStr}-${dayStr}`;
      const entry = dailyTotals[dateKey] || { total: 0, count: 0 };
      chartBars.push({
        label: `${day}`,
        dateKey,
        amount: entry.total,
        count: entry.count,
      });
    }
  } else if (filterState.periodType === 'year') {
    // Group by month
    for (let m = 0; m < 12; m++) {
      const monthStr = String(m + 1).padStart(2, '0');
      let mTotal = 0;
      let mCount = 0;
      Object.entries(dailyTotals).forEach(([dateKey, val]) => {
        if (dateKey.startsWith(`${filterState.selectedYear}-${monthStr}`)) {
          mTotal += val.total;
          mCount += val.count;
        }
      });
      chartBars.push({
        label: MONTH_SHORT_NAMES[m],
        dateKey: `${filterState.selectedYear}-${monthStr}`,
        amount: mTotal,
        count: mCount,
      });
    }
  } else {
    // Day, range, or all: show unique dates sorted
    const sortedDates = Object.keys(dailyTotals).sort();
    if (sortedDates.length === 0) {
      chartBars = [];
    } else {
      chartBars = sortedDates.map((dateKey) => {
        const parts = dateKey.split('-');
        const label = parts.length === 3 ? `${parts[1]}/${parts[2]}` : dateKey;
        return {
          label,
          dateKey,
          amount: dailyTotals[dateKey].total,
          count: dailyTotals[dateKey].count,
        };
      });
    }
  }

  const maxAmount = chartBars.reduce((max, b) => Math.max(max, b.amount), 0) || 1;

  if (filteredExpenses.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-[#121215] border border-neutral-800 text-center flex flex-col items-center justify-center min-h-[220px]">
        <BarChart3 className="w-8 h-8 text-neutral-600 mb-2" />
        <h4 className="text-sm font-semibold text-neutral-300">No chart data for this period</h4>
        <p className="text-xs text-neutral-500 mt-0.5">
          Log an expense to see your daily distribution curve
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#121215] border border-neutral-800 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Spending Cadence & Trajectory</span>
          </h3>
          <p className="text-xs text-neutral-400">
            {filterState.periodType === 'year' ? 'Monthly breakdown' : 'Daily outgoing timeline'}
          </p>
        </div>

        {/* Hover inspector badge */}
        <div className="text-right">
          {hoveredDay ? (
            <div className="text-xs">
              <span className="text-neutral-400 mr-2">{hoveredDay.day}:</span>
              <span className="font-mono font-bold text-[#00FF66] tabular-nums">
                {formatCurrency(hoveredDay.amount, currency)}
              </span>
              <span className="text-[11px] text-neutral-500 ml-1.5">
                ({hoveredDay.count} {hoveredDay.count === 1 ? 'item' : 'items'})
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-neutral-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#00FF66]" /> Hover a bar for details
            </div>
          )}
        </div>
      </div>

      {/* SVG / Flex Bar Chart */}
      <div className="h-44 w-full flex items-end gap-1 sm:gap-1.5 pt-4 pb-2 px-1 relative">
        {chartBars.map((bar, idx) => {
          const heightPercent = bar.amount > 0 ? Math.max(8, Math.round((bar.amount / maxAmount) * 100)) : 3;
          const isHighest = bar.amount === maxAmount && bar.amount > 0;

          return (
            <div
              key={idx}
              onMouseEnter={() =>
                setHoveredDay({ day: bar.label, amount: bar.amount, count: bar.count })
              }
              onMouseLeave={() => setHoveredDay(null)}
              className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
            >
              <div
                className={`w-full rounded-t-md transition-all duration-300 ${
                  bar.amount === 0
                    ? 'bg-neutral-800/40 hover:bg-neutral-700'
                    : isHighest
                    ? 'bg-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.6)]'
                    : 'bg-[#00FF66]/50 group-hover:bg-[#00FF66] group-hover:shadow-[0_0_8px_rgba(0,255,102,0.4)]'
                }`}
                style={{ height: `${heightPercent}%` }}
              />

              {/* Tooltip on Hover */}
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 whitespace-nowrap bg-black border border-neutral-700 px-2 py-0.5 rounded text-[10px] font-mono text-white shadow-xl">
                {formatCurrency(bar.amount, currency)}
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-[10px] font-mono text-neutral-500 pt-2 border-t border-neutral-800/80">
        <span>{chartBars[0]?.label || ''}</span>
        {chartBars.length > 10 && (
          <span>{chartBars[Math.floor(chartBars.length / 2)]?.label || ''}</span>
        )}
        <span>{chartBars[chartBars.length - 1]?.label || ''}</span>
      </div>
    </div>
  );
};
