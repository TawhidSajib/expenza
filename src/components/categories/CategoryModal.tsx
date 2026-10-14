import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Plus, FolderPlus, Tag, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CATEGORY_ICONS, CATEGORY_COLOR_PALETTE, getCategoryIconComponent } from '../../utils/icons';
import { Category } from '../../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
}) => {
  const { addCategory, updateCategory, currency } = useApp();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#00FF66');
  const [selectedIcon, setSelectedIcon] = useState('ShoppingCart');
  const [monthlyBudget, setMonthlyBudget] = useState<string>('');
  const [description, setDescription] = useState('');
  const [iconSearch, setIconSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setSelectedColor(categoryToEdit.color);
      setSelectedIcon(categoryToEdit.icon);
      setMonthlyBudget(categoryToEdit.monthlyBudget ? categoryToEdit.monthlyBudget.toString() : '');
      setDescription(categoryToEdit.description || '');
    } else {
      setName('');
      setSelectedColor('#00FF66');
      setSelectedIcon('ShoppingCart');
      setMonthlyBudget('');
      setDescription('');
    }
    setErrorMsg('');
    setIconSearch('');
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Category name is required');
      return;
    }

    const budgetNum = monthlyBudget ? parseFloat(monthlyBudget) : undefined;
    if (monthlyBudget && (isNaN(budgetNum!) || budgetNum! < 0)) {
      setErrorMsg('Please enter a valid monthly budget amount');
      return;
    }

    if (categoryToEdit) {
      updateCategory(categoryToEdit.id, {
        name: name.trim(),
        color: selectedColor,
        icon: selectedIcon,
        monthlyBudget: budgetNum,
        description: description.trim() || undefined,
      });
    } else {
      addCategory({
        name: name.trim(),
        color: selectedColor,
        icon: selectedIcon,
        monthlyBudget: budgetNum,
        description: description.trim() || undefined,
      });
    }

    onClose();
  };

  const filteredIcons = CATEGORY_ICONS.filter((item) =>
    item.label.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const PreviewIcon = getCategoryIconComponent(selectedIcon);

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

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#121215] border border-neutral-800 rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Top Neon Border Line */}
          <div
            className="h-1 w-full transition-colors duration-300"
            style={{ backgroundColor: selectedColor }}
          />

          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all"
                style={{
                  backgroundColor: `${selectedColor}15`,
                  borderColor: `${selectedColor}40`,
                  color: selectedColor,
                }}
              >
                <PreviewIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {categoryToEdit ? 'Edit Custom Category' : 'Create Custom Category'}
                </h3>
                <p className="text-xs text-neutral-400">
                  Tailored expense bucket for your financial records
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

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Category Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Specialty Coffee, Gaming, Workspace"
                className="w-full px-3.5 py-2.5 bg-[#18181c] border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-all"
              />
            </div>

            {/* Color Swatch Picker */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                Color Accent
              </label>
              <div className="flex flex-wrap gap-2.5">
                {CATEGORY_COLOR_PALETTE.map((pal) => (
                  <button
                    key={pal.hex}
                    type="button"
                    onClick={() => setSelectedColor(pal.hex)}
                    style={{ backgroundColor: pal.hex }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                      selectedColor === pal.hex
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#121215] scale-105 shadow-md'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {selectedColor === pal.hex && (
                      <Check className="w-4 h-4 text-black stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Category Icon
                </label>
                <input
                  type="text"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder="Filter icons..."
                  className="px-2 py-0.5 bg-[#18181c] border border-neutral-800 rounded text-[11px] text-white placeholder-neutral-500 focus:outline-none focus:border-[#00FF66]"
                />
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 max-h-36 overflow-y-auto p-1 bg-[#18181c] rounded-xl border border-neutral-800">
                {filteredIcons.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = selectedIcon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedIcon(item.id)}
                      title={item.label}
                      className={`h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#00FF66] text-black shadow-md font-bold'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monthly Budget Target (Optional) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Monthly Spending Limit (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 font-mono text-sm">
                  {currency}
                </div>
                <input
                  type="number"
                  step="any"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  placeholder="e.g. 250.00"
                  className="w-full pl-8 pr-4 py-2.5 bg-[#18181c] border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] transition-all font-mono tabular-nums"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Set a target to visually monitor budget burn throughout the month
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Notes / Scope (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What belongs in this category?"
                className="w-full px-3.5 py-2 bg-[#18181c] border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00FF66] transition-all resize-none"
              />
            </div>

            {/* Live Preview Bar */}
            <div className="p-3 rounded-xl bg-[#18181c] border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center border"
                  style={{
                    backgroundColor: `${selectedColor}15`,
                    borderColor: `${selectedColor}40`,
                    color: selectedColor,
                  }}
                >
                  <PreviewIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {name.trim() || 'Category Name'}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {monthlyBudget ? `Budget: ${currency}${monthlyBudget}/mo` : 'No budget set'}
                  </div>
                </div>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium"
                style={{
                  backgroundColor: `${selectedColor}20`,
                  color: selectedColor,
                }}
              >
                Preview
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#00FF66] hover:bg-[#10f06a] text-black font-bold text-xs rounded-xl shadow-lg glow-neon-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5"
              >
                {categoryToEdit ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
