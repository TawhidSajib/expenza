import React from 'react';
import { Layers, Plus, ExternalLink, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { getCategoryIconComponent } from '../../utils/icons';

interface CategoryBreakdownProps {
  onOpenCreateCategory: () => void;
  onOpenCategoryManager: () => void;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  onOpenCreateCategory,
  onOpenCategoryManager,
}) => {
  const {
    categories,
    filteredExpenses,
    totalFilteredAmount,
    currency,
    filterState,
    setFilterState,
  } = useApp();

  // Aggregate expenditures by category
  const categoryStats = categories.map((cat) => {
    const amount = filteredExpenses
      .filter((e) => e.categoryId === cat.id)
      .reduce((sum, e) => sum + e.amount, 0);

    const percentage = totalFilteredAmount > 0 ? (amount / totalFilteredAmount) * 100 : 0;
    const isFiltered = filterState.selectedCategoryIds.includes(cat.id);

    return {
      category: cat,
      amount,
      percentage,
      isFiltered,
    };
  });

  // Sort descending by amount
  categoryStats.sort((a, b) => b.amount - a.amount);

  const toggleCategoryFilter = (catId: string) => {
    setFilterState((prev) => {
      const exists = prev.selectedCategoryIds.includes(catId);
      const updated = exists
        ? prev.selectedCategoryIds.filter((id) => id !== catId)
        : [...prev.selectedCategoryIds, catId];
      return { ...prev, selectedCategoryIds: updated };
    });
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#121215] border border-neutral-800 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Custom Category Allocation</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Click any custom category to isolate in the ledger
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCategoryManager}
          className="text-xs text-[#00FF66] hover:underline flex items-center gap-1 cursor-pointer font-medium"
        >
          <span>Manage</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Breakdown list */}
      {categories.length === 0 ? (
        <div className="p-6 rounded-xl bg-[#18181c] border border-neutral-800 text-center my-auto">
          <p className="text-xs text-neutral-400 mb-3">
            No custom categories created yet. Build your first custom category to see allocation charts.
          </p>
          <button
            type="button"
            onClick={onOpenCreateCategory}
            className="px-3 py-1.5 bg-[#00FF66] hover:bg-[#10f06a] text-black text-xs font-bold rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Category</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5 my-auto max-h-[300px] overflow-y-auto pr-1">
          {categoryStats.map(({ category: cat, amount, percentage, isFiltered }) => {
            const IconComp = getCategoryIconComponent(cat.icon);
            const isOverCatBudget =
              cat.monthlyBudget && cat.monthlyBudget > 0 && amount > cat.monthlyBudget;

            return (
              <div
                key={cat.id}
                onClick={() => toggleCategoryFilter(cat.id)}
                className={`p-2.5 rounded-xl transition-all cursor-pointer border ${
                  isFiltered
                    ? 'border-[#00FF66] bg-[#00FF66]/5'
                    : 'border-transparent hover:bg-[#18181c]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        borderColor: `${cat.color}30`,
                        color: cat.color,
                      }}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-white truncate">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-neutral-400 text-[11px]">
                      {percentage.toFixed(1)}%
                    </span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {formatCurrency(amount, currency)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#18181c] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(percentage, amount > 0 ? 3 : 0)}%`,
                      backgroundColor: isOverCatBudget ? '#F43F5E' : cat.color,
                    }}
                  />
                </div>

                {/* Budget hint if set */}
                {cat.monthlyBudget && (
                  <div className="flex justify-between text-[10px] text-neutral-500 mt-1 font-mono">
                    <span>Target: {formatCurrency(cat.monthlyBudget, currency)}/mo</span>
                    <span className={isOverCatBudget ? 'text-rose-400 font-semibold' : ''}>
                      {isOverCatBudget
                        ? `Over by ${formatCurrency(amount - cat.monthlyBudget, currency)}`
                        : `${formatCurrency(cat.monthlyBudget - amount, currency)} left`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
        <span>Categories: {categories.length}</span>
        <button
          type="button"
          onClick={onOpenCreateCategory}
          className="text-neutral-300 hover:text-[#00FF66] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>New</span>
        </button>
      </div>
    </div>
  );
};
