/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginView } from './components/auth/LoginView';
import { Navbar } from './components/layout/Navbar';
import { MobileNav } from './components/layout/MobileNav';
import { FilterBar } from './components/filters/FilterBar';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { SpendingChart } from './components/dashboard/SpendingChart';
import { CategoryBreakdown } from './components/dashboard/CategoryBreakdown';
import { ExpenseList } from './components/expenses/ExpenseList';
import { ExpenseModal } from './components/expenses/ExpenseModal';
import { CategoryModal } from './components/categories/CategoryModal';
import { CategoryManagerModal } from './components/categories/CategoryManagerModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { Plus, BarChart3, Receipt, Layers } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const {
    user,
    activeTab,
    setActiveTab,
    isAddExpenseOpen,
    setIsAddExpenseOpen,
    isAddCategoryOpen,
    setIsAddCategoryOpen,
    editingExpense,
    setEditingExpense,
    editingCategory,
    setEditingCategory,
    isCategoryManagerOpen,
    setIsCategoryManagerOpen,
    isProfileOpen,
    setIsProfileOpen,
  } = useApp();

  if (!user) {
    return <LoginView />;
  }

  const handleOpenAddExpense = () => {
    setEditingExpense(null);
    setIsAddExpenseOpen(true);
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setIsAddCategoryOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col pb-20 md:pb-12">
      {/* Top Navbar */}
      <Navbar
        onOpenAddExpense={handleOpenAddExpense}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Filter and Period Bar */}
        <FilterBar />

        {/* Key Performance Indicators */}
        <SummaryCards />

        {/* Tab Content */}
        {activeTab === 'expenses' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Transaction Ledger */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              <ExpenseList
                onOpenAddExpense={handleOpenAddExpense}
                onEditExpense={(exp) => {
                  setEditingExpense(exp);
                  setIsAddExpenseOpen(true);
                }}
                onOpenCreateCategory={handleOpenAddCategory}
              />
            </div>

            {/* Right Column: Visual Charts & Custom Categories Breakdown */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
              <SpendingChart />
              <CategoryBreakdown
                onOpenCreateCategory={handleOpenAddCategory}
                onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
              />
            </div>
          </div>
        ) : activeTab === 'analytics' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SpendingChart />
              <CategoryBreakdown
                onOpenCreateCategory={handleOpenAddCategory}
                onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
              />
            </div>

            {/* Full-width Transaction Ledger in Analytics */}
            <ExpenseList
              onOpenAddExpense={handleOpenAddExpense}
              onEditExpense={(exp) => {
                setEditingExpense(exp);
                setIsAddExpenseOpen(true);
              }}
              onOpenCreateCategory={handleOpenAddCategory}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Custom Categories dedicated tab */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryBreakdown
                onOpenCreateCategory={handleOpenAddCategory}
                onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
              />
              <SpendingChart />
            </div>

            <ExpenseList
              onOpenAddExpense={handleOpenAddExpense}
              onEditExpense={(exp) => {
                setEditingExpense(exp);
                setIsAddExpenseOpen(true);
              }}
              onOpenCreateCategory={handleOpenAddCategory}
            />
          </div>
        )}
      </main>

      {/* Floating Action Button for Quick Add on Desktop */}
      <button
        type="button"
        onClick={handleOpenAddExpense}
        title="Log New Expense"
        className="hidden lg:flex fixed bottom-8 right-8 z-30 p-4 rounded-2xl bg-[#00FF66] text-black font-bold shadow-2xl glow-neon hover:scale-105 active:scale-95 transition-all items-center gap-2 cursor-pointer"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span className="text-sm font-extrabold tracking-tight">Log Expense</span>
      </button>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        onOpenAddExpense={handleOpenAddExpense}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
      />

      {/* Modals & Dialogs */}
      <ExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        expenseToEdit={editingExpense}
        onOpenCreateCategory={() => {
          setIsAddExpenseOpen(false);
          handleOpenAddCategory();
        }}
      />

      <CategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => {
          setIsAddCategoryOpen(false);
          setEditingCategory(null);
        }}
        categoryToEdit={editingCategory}
      />

      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        onOpenCreateCategory={handleOpenAddCategory}
        onEditCategory={(cat) => {
          setEditingCategory(cat);
          setIsAddCategoryOpen(true);
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}
