import React, { useState } from 'react';
import {
  Download,
  Plus,
  Receipt,
  FileSpreadsheet,
  FileText,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpenseCard } from './ExpenseCard';
import { Expense } from '../../types';
import { formatCurrency, formatDateDisplay, getTodayDateString } from '../../utils/formatters';

interface ExpenseListProps {
  onOpenAddExpense: () => void;
  onEditExpense: (exp: Expense) => void;
  onOpenCreateCategory: () => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  onOpenAddExpense,
  onEditExpense,
  onOpenCreateCategory,
}) => {
  const { filteredExpenses, categories, currency, filterState, seedDemoDataHandler } = useApp();
  const [groupByDate, setGroupByDate] = useState(true);

  // CSV export handler
  const exportToCSV = () => {
    if (filteredExpenses.length === 0) return;

    const headers = ['Date', 'Time', 'Title', 'Category', 'Amount', 'Currency', 'Payment Method', 'Notes', 'Receipt'];
    const rows = filteredExpenses.map((exp) => {
      const cat = categories.find((c) => c.id === exp.categoryId);
      return [
        exp.date,
        exp.time || '',
        `"${exp.title.replace(/"/g, '""')}"`,
        `"${(cat?.name || 'Uncategorized').replace(/"/g, '""')}"`,
        exp.amount,
        currency,
        exp.paymentMethod,
        `"${(exp.notes || '').replace(/"/g, '""')}"`,
        `"${(exp.receiptNumber || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expenza_expenses_${filterState.periodType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group by date logic
  const dateGroups: { date: string; items: Expense[]; subtotal: number }[] = [];
  if (groupByDate) {
    const map: Record<string, { items: Expense[]; subtotal: number }> = {};
    filteredExpenses.forEach((exp) => {
      if (!map[exp.date]) {
        map[exp.date] = { items: [], subtotal: 0 };
      }
      map[exp.date].items.push(exp);
      map[exp.date].subtotal += exp.amount;
    });

    Object.keys(map)
      .sort((a, b) => b.localeCompare(a))
      .forEach((dateKey) => {
        dateGroups.push({
          date: dateKey,
          items: map[dateKey].items,
          subtotal: map[dateKey].subtotal,
        });
      });
  }

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Transaction Ledger</span>
            <span className="font-mono text-xs text-neutral-400 font-normal">
              ({filteredExpenses.length} records)
            </span>
          </h3>
          <p className="text-xs text-neutral-400">
            Recorded daily outgoing entries for the filtered criteria
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Date Grouping */}
          <button
            type="button"
            onClick={() => setGroupByDate(!groupByDate)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
              groupByDate
                ? 'border-neutral-700 bg-[#18181c] text-white'
                : 'border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {groupByDate ? 'Grouped by Day' : 'Flat List'}
          </button>

          {/* Export to CSV */}
          {filteredExpenses.length > 0 && (
            <button
              type="button"
              onClick={exportToCSV}
              title="Export to CSV"
              className="px-3 py-1.5 rounded-xl bg-[#18181c] hover:bg-[#222228] border border-neutral-800 text-neutral-300 hover:text-[#00FF66] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          {/* Add Expense Button */}
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="px-3.5 py-1.5 rounded-xl bg-[#00FF66] hover:bg-[#10f06a] text-black text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm glow-neon-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredExpenses.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#121215] border border-neutral-800 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-neutral-800/60 flex items-center justify-center text-neutral-400 mb-3">
            <Receipt className="w-6 h-6 text-[#00FF66]" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">No Expenses Found</h4>
          <p className="text-xs text-neutral-400 max-w-sm mb-5">
            There are no expenses logged for the current period or search filters.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="px-4 py-2 bg-[#00FF66] hover:bg-[#10f06a] text-black font-bold text-xs rounded-xl shadow-md glow-neon-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Log Expense for this Date</span>
            </button>
            <button
              type="button"
              onClick={seedDemoDataHandler}
              className="px-3.5 py-2 bg-[#18181c] hover:bg-[#202026] border border-neutral-800 text-xs text-neutral-300 hover:text-white rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00FF66]" />
              <span>Load Sample Expenses</span>
            </button>
          </div>
        </div>
      ) : groupByDate ? (
        /* Grouped by Date View */
        <div className="space-y-5">
          {dateGroups.map((group) => {
            const isToday = group.date === getTodayDateString();
            return (
              <div key={group.date} className="space-y-2">
                {/* Date Group Header */}
                <div className="flex items-center justify-between text-xs px-2 text-neutral-400 border-b border-neutral-800/60 pb-1.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="font-semibold text-neutral-200">
                      {formatDateDisplay(group.date)}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-bold text-[#00FF66] px-1.5 py-0.2 rounded bg-[#00FF66]/10">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-neutral-300 font-semibold tabular-nums">
                    Subtotal: {formatCurrency(group.subtotal, currency)}
                  </div>
                </div>

                {/* Items in this date */}
                <div className="space-y-2">
                  {group.items.map((exp) => (
                    <ExpenseCard key={exp.id} expense={exp} onEdit={onEditExpense} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat List View */
        <div className="space-y-2">
          {filteredExpenses.map((exp) => (
            <ExpenseCard key={exp.id} expense={exp} onEdit={onEditExpense} />
          ))}
        </div>
      )}
    </div>
  );
};
