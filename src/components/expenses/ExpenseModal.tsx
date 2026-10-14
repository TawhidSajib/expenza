import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  Clock,
  Plus,
  AlertCircle,
  Tag,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Expense, PaymentMethod } from '../../types';
import { getTodayDateString, getYesterdayDateString } from '../../utils/formatters';
import { getCategoryIconComponent } from '../../utils/icons';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
  onOpenCreateCategory: () => void;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'debit_card', label: 'Debit Card' },
  { id: 'upi_wallet', label: 'UPI / Wallet' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'other', label: 'Other' },
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
  onOpenCreateCategory,
}) => {
  const { categories, addExpense, updateExpense, currency, filterState } = useApp();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [notes, setNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title);
      setAmount(expenseToEdit.amount.toString());
      setCategoryId(expenseToEdit.categoryId);
      setDate(expenseToEdit.date);
      setTime(expenseToEdit.time || '');
      setPaymentMethod(expenseToEdit.paymentMethod);
      setNotes(expenseToEdit.notes || '');
      setReceiptNumber(expenseToEdit.receiptNumber || '');
    } else {
      setTitle('');
      setAmount('');
      // If user is currently looking at a specific date, default to that date
      const initialDate =
        filterState.periodType === 'day' && filterState.selectedDate
          ? filterState.selectedDate
          : getTodayDateString();
      setDate(initialDate);

      const now = new Date();
      setTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
      setPaymentMethod('credit_card');
      setNotes('');
      setReceiptNumber('');

      // Default category if available
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      } else {
        setCategoryId('');
      }
    }
    setErrorMsg('');
  }, [expenseToEdit, isOpen, categories, filterState]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg('Please enter an expense title / description');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0');
      return;
    }

    if (!categoryId) {
      setErrorMsg('Please select or create a category for this expense');
      return;
    }

    if (!date) {
      setErrorMsg('Please select a valid date for this expense');
      return;
    }

    if (expenseToEdit) {
      updateExpense(expenseToEdit.id, {
        title: title.trim(),
        amount: parsedAmount,
        categoryId,
        date,
        time: time || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
        receiptNumber: receiptNumber.trim() || undefined,
      });
    } else {
      addExpense({
        title: title.trim(),
        amount: parsedAmount,
        categoryId,
        date,
        time: time || undefined,
        paymentMethod,
        notes: notes.trim() || undefined,
        receiptNumber: receiptNumber.trim() || undefined,
      });
    }

    onClose();
  };

  const setQuickDate = (quickDate: string) => {
    setDate(quickDate);
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

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

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-[#121215] border border-neutral-800 rounded-2xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Neon Header Accent */}
          <div className="h-1 w-full bg-gradient-to-r from-[#00FF66] via-[#10B981] to-[#06B6D4]" />

          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                {expenseToEdit ? 'Edit Expense Record' : 'Log New Expense'}
              </h3>
              <p className="text-xs text-neutral-400">
                Accurately record your daily outgoing transaction
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#00FF66] text-xl font-bold font-mono">
                  {currency}
                </div>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 bg-[#18181c] border border-neutral-800 focus:border-[#00FF66] focus:ring-1 focus:ring-[#00FF66] rounded-xl text-2xl font-bold font-mono text-white placeholder-neutral-600 focus:outline-none transition-all tabular-nums"
                />
              </div>
            </div>

            {/* Title / Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Title / Merchant *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Grocery Store, Netflix Subscription, Taxi"
                className="w-full px-3.5 py-2.5 bg-[#18181c] border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#00FF66] transition-all"
              />
            </div>

            {/* Custom Category Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Custom Category *
                </label>
                <button
                  type="button"
                  onClick={onOpenCreateCategory}
                  className="text-xs text-[#00FF66] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> New Custom Category
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                  <span>No custom categories yet.</span>
                  <button
                    type="button"
                    onClick={onOpenCreateCategory}
                    className="px-2.5 py-1 bg-[#00FF66] text-black font-bold rounded-lg hover:bg-[#10f06a] transition-colors"
                  >
                    Create Category
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-[#18181c] rounded-xl border border-neutral-800">
                  {categories.map((cat) => {
                    const IconComp = getCategoryIconComponent(cat.icon);
                    const isSelected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#00FF66] bg-[#00FF66]/10 text-white font-semibold'
                            : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs"
                          style={{
                            backgroundColor: `${cat.color}20`,
                            color: cat.color,
                          }}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs truncate">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Date & Time *
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickDate(getTodayDateString())}
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                      date === getTodayDateString()
                        ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40 font-semibold'
                        : 'text-neutral-400 hover:text-white bg-neutral-800'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(getYesterdayDateString())}
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                      date === getYesterdayDateString()
                        ? 'bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/40 font-semibold'
                        : 'text-neutral-400 hover:text-white bg-neutral-800'
                    }`}
                  >
                    Yesterday
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#18181c] border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00FF66] font-mono [color-scheme:dark]"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-neutral-500">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 bg-[#18181c] border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00FF66] font-mono [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer truncate ${
                      paymentMethod === pm.id
                        ? 'border-[#00FF66] bg-[#00FF66]/10 text-[#00FF66] shadow-sm font-semibold'
                        : 'border-neutral-800 bg-[#18181c] text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional notes & receipt */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Receipt / Ref # (Optional)
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="e.g. REC-1049"
                  className="w-full px-3 py-2 bg-[#18181c] border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00FF66] font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Extra context or tags"
                  className="w-full px-3 py-2 bg-[#18181c] border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00FF66]"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
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
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{expenseToEdit ? 'Save Changes' : 'Log Expense'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
