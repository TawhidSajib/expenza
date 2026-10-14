import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  PieChart,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, MONTH_NAMES } from '../../utils/formatters';

export const SummaryCards: React.FC = () => {
  const {
    totalFilteredAmount,
    averageDailyAmount,
    filteredExpenses,
    categories,
    currency,
    filterState,
    user,
  } = useApp();

  // Find top spending category in current filtered set
  const categorySpendingMap = filteredExpenses.reduce<Record<string, number>>((acc, exp) => {
    acc[exp.categoryId] = (acc[exp.categoryId] || 0) + exp.amount;
    return acc;
  }, {});

  let topCategoryId = '';
  let topCategoryAmount = 0;
  Object.entries(categorySpendingMap).forEach(([catId, amount]) => {
    if (amount > topCategoryAmount) {
      topCategoryAmount = amount;
      topCategoryId = catId;
    }
  });

  const topCategory = categories.find((c) => c.id === topCategoryId);

  // Period descriptor
  let periodLabel = 'This Month';
  if (filterState.periodType === 'day') {
    periodLabel = 'Selected Day';
  } else if (filterState.periodType === 'month') {
    periodLabel = `${MONTH_NAMES[filterState.selectedMonth]} ${filterState.selectedYear}`;
  } else if (filterState.periodType === 'year') {
    periodLabel = `Year ${filterState.selectedYear}`;
  } else if (filterState.periodType === 'range') {
    periodLabel = 'Custom Range';
  } else if (filterState.periodType === 'all') {
    periodLabel = 'All Time';
  }

  // Monthly budget calculation
  const monthlyBudget = user?.monthlyBudget || 0;
  const isBudgetSet = monthlyBudget > 0 && filterState.periodType === 'month';
  const budgetPercent = isBudgetSet ? Math.min(Math.round((totalFilteredAmount / monthlyBudget) * 100), 100) : 0;
  const isOverBudget = isBudgetSet && totalFilteredAmount > monthlyBudget;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Outgoing */}
      <div className="p-5 rounded-2xl bg-[#121215] border border-neutral-800 relative overflow-hidden group hover:border-[#00FF66]/50 transition-colors">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
          <span className="font-semibold uppercase tracking-wider">Total Outgoing</span>
          <span className="text-[11px] text-neutral-500 font-medium">{periodLabel}</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
          {formatCurrency(totalFilteredAmount, currency)}
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-neutral-400">
          <span className="font-mono text-[#00FF66] font-semibold">
            {filteredExpenses.length}
          </span>
          <span>transactions logged</span>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#00FF66]/5 rounded-bl-full pointer-events-none group-hover:bg-[#00FF66]/10 transition-colors" />
      </div>

      {/* 2. Daily Average */}
      <div className="p-5 rounded-2xl bg-[#121215] border border-neutral-800 relative overflow-hidden group hover:border-[#00FF66]/50 transition-colors">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
          <span className="font-semibold uppercase tracking-wider">Daily Average</span>
          <TrendingUp className="w-3.5 h-3.5 text-[#00FF66]" />
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
          {formatCurrency(averageDailyAmount, currency)}
        </div>
        <div className="mt-2.5 text-xs text-neutral-400">
          Per active spending day
        </div>
      </div>

      {/* 3. Top Category */}
      <div className="p-5 rounded-2xl bg-[#121215] border border-neutral-800 relative overflow-hidden group hover:border-[#00FF66]/50 transition-colors">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
          <span className="font-semibold uppercase tracking-wider">Top Category</span>
          <PieChart className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-white truncate tracking-tight">
          {topCategory ? topCategory.name : '—'}
        </div>
        <div className="mt-2.5 text-xs text-neutral-400 flex items-center justify-between">
          <span>Amount spent</span>
          <span className="font-mono tabular-nums font-semibold text-white">
            {topCategory ? formatCurrency(topCategoryAmount, currency) : `${currency}0.00`}
          </span>
        </div>
      </div>

      {/* 4. Monthly Target / Budget */}
      <div className="p-5 rounded-2xl bg-[#121215] border border-neutral-800 relative overflow-hidden group hover:border-[#00FF66]/50 transition-colors">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
          <span className="font-semibold uppercase tracking-wider">Budget Status</span>
          <span
            className={`font-mono text-xs font-bold ${
              isOverBudget ? 'text-rose-400' : 'text-[#00FF66]'
            }`}
          >
            {isBudgetSet ? `${budgetPercent}% Used` : 'Flexible'}
          </span>
        </div>

        <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
          {isBudgetSet
            ? formatCurrency(Math.max(0, monthlyBudget - totalFilteredAmount), currency)
            : formatCurrency(totalFilteredAmount, currency)}
        </div>

        <div className="mt-2.5">
          {isBudgetSet ? (
            <div>
              <div className="w-full bg-[#18181c] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isOverBudget ? 'bg-rose-500' : 'bg-[#00FF66]'
                  }`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
                <span>{isOverBudget ? 'Budget Exceeded' : 'Remaining limit'}</span>
                <span className="font-mono">{formatCurrency(monthlyBudget, currency)} cap</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-neutral-400">
              Tracking outgoing flow seamlessly
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
