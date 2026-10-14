import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PeriodType, SortOption } from '../../types';
import {
  MONTH_NAMES,
  formatDateDisplay,
  getTodayDateString,
} from '../../utils/formatters';
import { getCategoryIconComponent } from '../../utils/icons';

export const FilterBar: React.FC = () => {
  const {
    filterState,
    setFilterState,
    resetFilters,
    categories,
    filteredExpenses,
    expenses,
  } = useApp();

  // Period navigation helpers
  const handlePrevPeriod = () => {
    if (filterState.periodType === 'day') {
      const [y, m, d] = filterState.selectedDate.split('-').map(Number);
      const curr = new Date(y, m - 1, d);
      curr.setDate(curr.getDate() - 1);
      const newDate = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
      setFilterState((prev) => ({ ...prev, selectedDate: newDate }));
    } else if (filterState.periodType === 'month') {
      let newMonth = filterState.selectedMonth - 1;
      let newYear = filterState.selectedYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      }
      setFilterState((prev) => ({
        ...prev,
        selectedMonth: newMonth,
        selectedYear: newYear,
      }));
    } else if (filterState.periodType === 'year') {
      setFilterState((prev) => ({
        ...prev,
        selectedYear: prev.selectedYear - 1,
      }));
    }
  };

  const handleNextPeriod = () => {
    if (filterState.periodType === 'day') {
      const [y, m, d] = filterState.selectedDate.split('-').map(Number);
      const curr = new Date(y, m - 1, d);
      curr.setDate(curr.getDate() + 1);
      const newDate = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
      setFilterState((prev) => ({ ...prev, selectedDate: newDate }));
    } else if (filterState.periodType === 'month') {
      let newMonth = filterState.selectedMonth + 1;
      let newYear = filterState.selectedYear;
      if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
      setFilterState((prev) => ({
        ...prev,
        selectedMonth: newMonth,
        selectedYear: newYear,
      }));
    } else if (filterState.periodType === 'year') {
      setFilterState((prev) => ({
        ...prev,
        selectedYear: prev.selectedYear + 1,
      }));
    }
  };

  const setPeriodType = (type: PeriodType) => {
    setFilterState((prev) => ({ ...prev, periodType: type }));
  };

  const toggleCategory = (catId: string) => {
    setFilterState((prev) => {
      const exists = prev.selectedCategoryIds.includes(catId);
      const updated = exists
        ? prev.selectedCategoryIds.filter((id) => id !== catId)
        : [...prev.selectedCategoryIds, catId];
      return { ...prev, selectedCategoryIds: updated };
    });
  };

  const clearCategoriesFilter = () => {
    setFilterState((prev) => ({ ...prev, selectedCategoryIds: [] }));
  };

  // Generate Year list for dropdown (e.g. 2024 to 2028)
  const currentSystemYear = new Date().getFullYear();
  const availableYears = [
    currentSystemYear - 2,
    currentSystemYear - 1,
    currentSystemYear,
    currentSystemYear + 1,
  ];

  return (
    <div className="bg-[#121215] border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
      {/* 1. Period Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Period mode tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#18181c] rounded-xl border border-neutral-800 self-start">
          <button
            type="button"
            onClick={() => setPeriodType('day')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterState.periodType === 'day'
                ? 'bg-[#00FF66] text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => setPeriodType('month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterState.periodType === 'month'
                ? 'bg-[#00FF66] text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setPeriodType('year')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterState.periodType === 'year'
                ? 'bg-[#00FF66] text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Year
          </button>
          <button
            type="button"
            onClick={() => setPeriodType('range')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterState.periodType === 'range'
                ? 'bg-[#00FF66] text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Custom Range
          </button>
          <button
            type="button"
            onClick={() => setPeriodType('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              filterState.periodType === 'all'
                ? 'bg-[#00FF66] text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Time
          </button>
        </div>

        {/* Reset Filters button if any active filter */}
        {(filterState.selectedCategoryIds.length > 0 ||
          filterState.searchQuery ||
          filterState.paymentMethod ||
          filterState.periodType !== 'month') && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-[#00FF66] transition-colors self-end sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* 2. Dynamic Period Navigator Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#18181c] rounded-xl border border-neutral-800/80">
        {filterState.periodType === 'day' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrevPeriod}
              title="Previous Day"
              className="p-1.5 rounded-lg bg-[#121215] border border-neutral-800 text-neutral-300 hover:text-[#00FF66] hover:border-[#00FF66]/40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={filterState.selectedDate}
              onChange={(e) =>
                setFilterState((prev) => ({ ...prev, selectedDate: e.target.value }))
              }
              className="px-3 py-1.5 bg-[#121215] border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#00FF66] [color-scheme:dark]"
            />
            <button
              type="button"
              onClick={handleNextPeriod}
              title="Next Day"
              className="p-1.5 rounded-lg bg-[#121215] border border-neutral-800 text-neutral-300 hover:text-[#00FF66] hover:border-[#00FF66]/40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setFilterState((prev) => ({ ...prev, selectedDate: getTodayDateString() }))
              }
              className="text-xs text-[#00FF66] hover:underline px-2 font-medium"
            >
              Today
            </button>
          </div>
        )}

        {filterState.periodType === 'month' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrevPeriod}
              title="Previous Month"
              className="p-1.5 rounded-lg bg-[#121215] border border-neutral-800 text-neutral-300 hover:text-[#00FF66] hover:border-[#00FF66]/40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={filterState.selectedMonth}
              onChange={(e) =>
                setFilterState((prev) => ({
                  ...prev,
                  selectedMonth: parseInt(e.target.value, 10),
                }))
              }
              className="px-3 py-1.5 bg-[#121215] border border-neutral-800 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-[#00FF66] cursor-pointer"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx} className="bg-[#121215] text-white">
                  {m}
                </option>
              ))}
            </select>
            <select
              value={filterState.selectedYear}
              onChange={(e) =>
                setFilterState((prev) => ({
                  ...prev,
                  selectedYear: parseInt(e.target.value, 10),
                }))
              }
              className="px-3 py-1.5 bg-[#121215] border border-neutral-800 rounded-lg text-xs font-mono font-semibold text-white focus:outline-none focus:border-[#00FF66] cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-[#121215] text-white">
                  {yr}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleNextPeriod}
              title="Next Month"
              className="p-1.5 rounded-lg bg-[#121215] border border-neutral-800 text-neutral-300 hover:text-[#00FF66] hover:border-[#00FF66]/40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {filterState.periodType === 'year' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrevPeriod}
              title="Previous Year"
              className="p-1.5 rounded-lg bg-[#121215] border border-neutral-800 text-neutral-300 hover:text-[#00FF66] hover:border-[#00FF66]/40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={filterState.selectedYear}
              onChange={(e) =>
                setFilterState((prev) => ({
                  ...prev,
                  selectedYear: parseInt(e.target.value, 10),
                }))
              }
              className="px-4 py-1.5 bg-[#121215] border border-neutral-800 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-[#00FF66] cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-[#121215] text-white">
                  {yr}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleNextPeriod}
              title="Next Year"
              className="p-1.5 rounded-lg bg-[#121215] border border-neutral-800 text-neutral-300 hover:text-[#00FF66] hover:border-[#00FF66]/40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {filterState.periodType === 'range' && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-neutral-400">From:</span>
            <input
              type="date"
              value={filterState.startDate || ''}
              onChange={(e) =>
                setFilterState((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="px-2.5 py-1.5 bg-[#121215] border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#00FF66] [color-scheme:dark]"
            />
            <span className="text-xs text-neutral-400">To:</span>
            <input
              type="date"
              value={filterState.endDate || ''}
              onChange={(e) =>
                setFilterState((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="px-2.5 py-1.5 bg-[#121215] border border-neutral-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#00FF66] [color-scheme:dark]"
            />
          </div>
        )}

        {filterState.periodType === 'all' && (
          <div className="text-xs text-neutral-300 font-medium">
            Displaying all lifetime recorded expenses ({expenses.length} records)
          </div>
        )}

        {/* Sort & Order Dropdown */}
        <div className="flex items-center gap-2 ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
          <select
            value={filterState.sortBy}
            onChange={(e) =>
              setFilterState((prev) => ({
                ...prev,
                sortBy: e.target.value as SortOption,
              }))
            }
            className="px-2.5 py-1.5 bg-[#121215] border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-[#00FF66] cursor-pointer"
          >
            <option value="date_desc">Latest Date First</option>
            <option value="date_asc">Oldest Date First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* 3. Search and Custom Category Multi-Filter */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={filterState.searchQuery}
              onChange={(e) =>
                setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              placeholder="Search expenses by title, notes, or receipt ref..."
              className="w-full pl-9 pr-8 py-2 bg-[#18181c] border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00FF66] transition-all"
            />
            {filterState.searchQuery && (
              <button
                type="button"
                onClick={() => setFilterState((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Payment Method Quick Filter */}
          <select
            value={filterState.paymentMethod || ''}
            onChange={(e) =>
              setFilterState((prev) => ({ ...prev, paymentMethod: e.target.value }))
            }
            className="px-3 py-2 bg-[#18181c] border border-neutral-800 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-[#00FF66] cursor-pointer"
          >
            <option value="">All Payment Methods</option>
            <option value="cash">Cash Only</option>
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
            <option value="upi_wallet">UPI / Wallet</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        {/* Custom Category Filter Buttons */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter by:
            </span>

            <button
              type="button"
              onClick={clearCategoriesFilter}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterState.selectedCategoryIds.length === 0
                  ? 'bg-neutral-200 text-black font-semibold'
                  : 'bg-[#18181c] text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              All Categories
            </button>

            {categories.map((cat) => {
              const isSelected = filterState.selectedCategoryIds.includes(cat.id);
              const IconComp = getCategoryIconComponent(cat.icon);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'border-[#00FF66] bg-[#00FF66]/15 text-[#00FF66] shadow-sm font-semibold'
                      : 'border-neutral-800 bg-[#18181c] text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  <IconComp className="w-3 h-3" style={{ color: cat.color }} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
