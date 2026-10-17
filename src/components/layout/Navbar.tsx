import React from 'react';
import { Plus, User, Layers, BarChart2, ListOrdered, ShieldCheck, Menu, X, FileSpreadsheet, NotebookTabs } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavbarProps {
  onOpenAddExpense: () => void;
  onOpenProfile: () => void;
  onOpenCategoryManager: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddExpense,
  onOpenProfile,
  onOpenCategoryManager,
}) => {
  const { user, activeTab, setActiveTab, firebaseStatus, exportExcel } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-[#09090b]/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Logo with NotebookTabs */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('expenses');
            }}
            className="text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00FF66]/20 to-[#00FF66]/5 border border-[#00FF66]/30 flex items-center justify-center text-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.15)] group-hover:border-[#00FF66]/60 transition-colors">
              <NotebookTabs className="w-4 h-4 text-[#00FF66]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span>Expenza</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />
            </div>
          </a>
        </div>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-400">
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'expenses'
                ? 'text-[#00FF66] font-semibold'
                : 'hover:text-white'
            }`}
          >
            Transactions
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'analytics'
                ? 'text-[#00FF66] font-semibold'
                : 'hover:text-white'
            }`}
          >
            Analytics & Trends
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('categories');
              onOpenCategoryManager();
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'categories'
                ? 'text-[#00FF66] font-semibold'
                : 'hover:text-white'
            }`}
          >
            Custom Categories
          </button>
          <button
            type="button"
            onClick={onOpenProfile}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Settings & Backup
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Excel export button */}
          <button
            type="button"
            onClick={() => exportExcel(false)}
            title="Download complete ledger in Microsoft Excel format (.xlsx)"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddExpense}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-black bg-[#00FF66] hover:bg-[#10f06a] rounded-xl shadow-sm glow-neon-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>

          {/* User profile capsule */}
          {user && (
            <button
              type="button"
              onClick={onOpenProfile}
              title="Open Profile & Settings"
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#121215] border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer shrink-0"
            >
              <div className="w-7 h-7 rounded-lg bg-[#00FF66]/20 border border-[#00FF66]/40 flex items-center justify-center text-[#00FF66] font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden lg:inline text-xs font-semibold text-white max-w-[100px] truncate">
                {user.name}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
