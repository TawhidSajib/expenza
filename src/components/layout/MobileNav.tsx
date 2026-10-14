import React from 'react';
import { Receipt, BarChart2, Layers, Plus, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileNavProps {
  onOpenAddExpense: () => void;
  onOpenProfile: () => void;
  onOpenCategoryManager: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  onOpenAddExpense,
  onOpenProfile,
  onOpenCategoryManager,
}) => {
  const { activeTab, setActiveTab } = useApp();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-lg border-t border-neutral-800 px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors ${
            activeTab === 'expenses' ? 'text-[#00FF66]' : 'text-neutral-500 hover:text-white'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span>Ledger</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors ${
            activeTab === 'analytics' ? 'text-[#00FF66]' : 'text-neutral-500 hover:text-white'
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span>Analytics</span>
        </button>

        {/* Center Floating Action */}
        <button
          type="button"
          onClick={onOpenAddExpense}
          className="w-12 h-12 -mt-5 rounded-2xl bg-[#00FF66] text-black shadow-lg glow-neon flex items-center justify-center font-bold active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('categories');
            onOpenCategoryManager();
          }}
          className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors ${
            activeTab === 'categories' ? 'text-[#00FF66]' : 'text-neutral-500 hover:text-white'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>Categories</span>
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          className="flex flex-col items-center gap-1 p-1 text-[10px] font-medium text-neutral-500 hover:text-white transition-colors"
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </div>
    </div>
  );
};
