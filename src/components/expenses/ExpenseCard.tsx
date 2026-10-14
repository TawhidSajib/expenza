import React, { useState } from 'react';
import { Edit2, Trash2, Tag, FileText, CreditCard, Check, X } from 'lucide-react';
import { Expense } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateDisplay, getPaymentMethodLabel } from '../../utils/formatters';
import { getCategoryIconComponent } from '../../utils/icons';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (exp: Expense) => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onEdit }) => {
  const { categories, deleteExpense, currency } = useApp();
  const [isDeleting, setIsDeleting] = useState(false);

  const category = categories.find((c) => c.id === expense.categoryId);
  const IconComp = category ? getCategoryIconComponent(category.icon) : Tag;
  const categoryColor = category ? category.color : '#00FF66';
  const categoryName = category ? category.name : 'Uncategorized';

  const handleDelete = () => {
    deleteExpense(expense.id);
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-xl bg-[#121215] border border-neutral-800/80 hover:border-neutral-700/80 transition-all flex items-center justify-between gap-3 group">
      {/* Left: Category Icon & Title Details */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
          style={{
            backgroundColor: `${categoryColor}15`,
            borderColor: `${categoryColor}35`,
            color: categoryColor,
          }}
        >
          <IconComp className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white truncate">{expense.title}</h4>
          </div>

          {/* Clean Unboxed Metadata without pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400 mt-1">
            <span style={{ color: categoryColor }} className="font-medium">
              {categoryName}
            </span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span>{formatDateDisplay(expense.date)}</span>
            {expense.time && (
              <>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="font-mono text-neutral-500">{expense.time}</span>
              </>
            )}
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="text-neutral-400">
              {getPaymentMethodLabel(expense.paymentMethod)}
            </span>
            {expense.receiptNumber && (
              <>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="font-mono text-[11px] text-neutral-500">
                  Ref: {expense.receiptNumber}
                </span>
              </>
            )}
          </div>

          {expense.notes && (
            <p className="text-[11px] text-neutral-400 mt-1 truncate max-w-md">
              {expense.notes}
            </p>
          )}
        </div>
      </div>

      {/* Right: Amount & Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <div className="text-base sm:text-lg font-bold font-mono text-white tabular-nums">
            -{formatCurrency(expense.amount, currency)}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {isDeleting ? (
            <div className="flex items-center gap-1 bg-rose-500/10 p-1 rounded-lg border border-rose-500/30">
              <button
                type="button"
                onClick={handleDelete}
                title="Confirm Delete"
                className="p-1 rounded text-rose-400 hover:text-white hover:bg-rose-500 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => setIsDeleting(false)}
                title="Cancel"
                className="p-1 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onEdit(expense)}
                title="Edit Expense"
                className="p-2 text-neutral-500 hover:text-[#00FF66] hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsDeleting(true)}
                title="Delete Expense"
                className="p-2 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
