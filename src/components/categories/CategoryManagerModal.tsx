import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getCategoryIconComponent } from '../../utils/icons';
import { formatCurrency } from '../../utils/formatters';
import { Category } from '../../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateCategory: () => void;
  onEditCategory: (cat: Category) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  onOpenCreateCategory,
  onEditCategory,
}) => {
  const { categories, deleteCategory, filteredExpenses, currency, addCategory } = useApp();
  const [deleteError, setDeleteError] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async (id: string) => {
    const res = await deleteCategory(id);
    if (!res.success) {
      setDeleteError(res.reason || 'Could not delete category');
    } else {
      setDeleteError('');
      setConfirmDeleteId(null);
    }
  };

  const handleQuickAddSuggested = (name: string, color: string, icon: string, budget: number) => {
    addCategory({
      name,
      color,
      icon,
      monthlyBudget: budget,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-[#121215] border border-neutral-800 rounded-2xl shadow-2xl z-10 max-h-[88vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center text-[#00FF66]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Custom Categories</h3>
                <p className="text-xs text-neutral-400">
                  Manage your personal expense categorization buckets
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delete error notification */}
          {deleteError && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Created Categories ({categories.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateCategory();
                }}
                className="px-3 py-1.5 bg-[#00FF66] hover:bg-[#10f06a] text-black text-xs font-bold rounded-lg shadow-sm glow-neon-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Category</span>
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="p-8 text-center bg-[#18181c] border border-neutral-800 rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">No Custom Categories Yet</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-5">
                  Expenza allows you to build custom categories that fit your lifestyle instead of forcing predefined ones.
                </p>

                <div className="border-t border-neutral-800 pt-4 text-left">
                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#00FF66]" /> Or Quick-Add Suggested Custom Categories:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickAddSuggested('Daily Food & Cafe', '#00FF66', 'Coffee', 300)
                      }
                      className="p-2.5 rounded-xl bg-[#121215] border border-neutral-800 hover:border-[#00FF66]/50 text-left transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span className="text-xs font-medium text-white group-hover:text-[#00FF66]">
                        ☕ Daily Food & Cafe
                      </span>
                      <Plus className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#00FF66]" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickAddSuggested('Tech & Gear', '#06B6D4', 'Laptop', 400)
                      }
                      className="p-2.5 rounded-xl bg-[#121215] border border-neutral-800 hover:border-cyan-400/50 text-left transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span className="text-xs font-medium text-white group-hover:text-cyan-400">
                        💻 Tech & Gear
                      </span>
                      <Plus className="w-3.5 h-3.5 text-neutral-500 group-hover:text-cyan-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickAddSuggested('Transit & Fuel', '#FACC15', 'Car', 150)
                      }
                      className="p-2.5 rounded-xl bg-[#121215] border border-neutral-800 hover:border-yellow-400/50 text-left transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span className="text-xs font-medium text-white group-hover:text-yellow-400">
                        🚗 Transit & Fuel
                      </span>
                      <Plus className="w-3.5 h-3.5 text-neutral-500 group-hover:text-yellow-400" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickAddSuggested('Fitness & Health', '#A855F7', 'Dumbbell', 120)
                      }
                      className="p-2.5 rounded-xl bg-[#121215] border border-neutral-800 hover:border-purple-400/50 text-left transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span className="text-xs font-medium text-white group-hover:text-purple-400">
                        🏋️ Fitness & Health
                      </span>
                      <Plus className="w-3.5 h-3.5 text-neutral-500 group-hover:text-purple-400" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {categories.map((cat) => {
                  const IconComp = getCategoryIconComponent(cat.icon);
                  const spent = filteredExpenses
                    .filter((e) => e.categoryId === cat.id)
                    .reduce((sum, e) => sum + e.amount, 0);

                  const expenseCount = filteredExpenses.filter((e) => e.categoryId === cat.id).length;
                  const isConfirmingDelete = confirmDeleteId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="p-3.5 rounded-xl bg-[#18181c] border border-neutral-800 hover:border-neutral-700 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            borderColor: `${cat.color}40`,
                            color: cat.color,
                          }}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate flex items-center gap-2">
                            <span>{cat.name}</span>
                            {cat.monthlyBudget && (
                              <span className="text-[10px] font-mono text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-800">
                                Limit: {formatCurrency(cat.monthlyBudget, currency)}
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                            <span>
                              {expenseCount} {expenseCount === 1 ? 'record' : 'records'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-neutral-300">
                              Spent: {formatCurrency(spent, currency)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 bg-rose-500/10 p-1 rounded-lg border border-rose-500/30">
                            <button
                              type="button"
                              onClick={() => handleDelete(cat.id)}
                              className="px-2 py-1 text-[11px] font-semibold bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-[11px] text-neutral-400 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onEditCategory(cat);
                              }}
                              title="Edit Category"
                              className="p-2 text-neutral-400 hover:text-[#00FF66] hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError('');
                                setConfirmDeleteId(cat.id);
                              }}
                              title="Delete Category"
                              className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 bg-[#101013]">
            <span>Filter or group your daily logs by any custom category</span>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors cursor-pointer font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
