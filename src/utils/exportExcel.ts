import * as XLSX from 'xlsx';
import { Expense, Category, User } from '../types';
import { getPaymentMethodLabel, formatDateDisplay } from './formatters';

export const exportToExcel = (
  expenses: Expense[],
  categories: Category[],
  user: User | null,
  fileNamePrefix: string = 'expenza_expenses'
): void => {
  const currencySymbol = user?.currency || '$';
  const categoryMap = new Map<string, Category>();
  categories.forEach((cat) => categoryMap.set(cat.id, cat));

  // 1. EXPENSES WORKSHEET
  const expenseRows = expenses.map((exp) => {
    const cat = categoryMap.get(exp.categoryId);
    return {
      'Date': exp.date,
      'Time': exp.time || '',
      'Title / Description': exp.title,
      'Category': cat ? cat.name : 'Uncategorized',
      [`Amount (${currencySymbol})`]: Number(exp.amount.toFixed(2)),
      'Payment Method': getPaymentMethodLabel(exp.paymentMethod),
      'Notes / Memo': exp.notes || '',
      'Receipt / Invoice #': exp.receiptNumber || '',
      'Transaction ID': exp.id,
      'Created At': exp.createdAt || '',
    };
  });

  const wsExpenses = XLSX.utils.json_to_sheet(
    expenseRows.length > 0
      ? expenseRows
      : [
          {
            'Date': '',
            'Time': '',
            'Title / Description': 'No expenses recorded yet',
            'Category': '',
            [`Amount (${currencySymbol})`]: 0,
            'Payment Method': '',
            'Notes / Memo': '',
            'Receipt / Invoice #': '',
            'Transaction ID': '',
            'Created At': '',
          },
        ]
  );

  // Set column widths for wsExpenses
  wsExpenses['!cols'] = [
    { wch: 12 }, // Date
    { wch: 8 },  // Time
    { wch: 28 }, // Title / Description
    { wch: 20 }, // Category
    { wch: 14 }, // Amount
    { wch: 16 }, // Payment Method
    { wch: 26 }, // Notes
    { wch: 18 }, // Receipt #
    { wch: 22 }, // ID
    { wch: 22 }, // Created At
  ];

  // 2. CATEGORY SUMMARY WORKSHEET
  const categoryRows = categories.map((cat) => {
    const catExpenses = expenses.filter((e) => e.categoryId === cat.id);
    const totalSpent = catExpenses.reduce((sum, e) => sum + e.amount, 0);
    const count = catExpenses.length;
    const budget = cat.monthlyBudget || 0;
    const remaining = budget > 0 ? budget - totalSpent : 0;
    const utilization = budget > 0 ? `${((totalSpent / budget) * 100).toFixed(1)}%` : 'No budget set';

    return {
      'Category Name': cat.name,
      [`Monthly Budget (${currencySymbol})`]: budget,
      [`Total Spent (${currencySymbol})`]: Number(totalSpent.toFixed(2)),
      'Transaction Count': count,
      [`Remaining Budget (${currencySymbol})`]: Number(remaining.toFixed(2)),
      'Budget Utilization': utilization,
      'Description': cat.description || '',
    };
  });

  const wsCategories = XLSX.utils.json_to_sheet(
    categoryRows.length > 0
      ? categoryRows
      : [
          {
            'Category Name': 'No custom categories created yet',
            [`Monthly Budget (${currencySymbol})`]: 0,
            [`Total Spent (${currencySymbol})`]: 0,
            'Transaction Count': 0,
            [`Remaining Budget (${currencySymbol})`]: 0,
            'Budget Utilization': '-',
            'Description': '',
          },
        ]
  );

  wsCategories['!cols'] = [
    { wch: 24 }, // Category Name
    { wch: 18 }, // Monthly Budget
    { wch: 16 }, // Total Spent
    { wch: 16 }, // Transaction Count
    { wch: 18 }, // Remaining
    { wch: 18 }, // Utilization
    { wch: 32 }, // Description
  ];

  // 3. ACCOUNT OVERVIEW WORKSHEET
  const totalSpentAll = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgExpense = expenses.length > 0 ? totalSpentAll / expenses.length : 0;
  const overviewData = [
    ['Expenza Account Financial Report', ''],
    ['Generated On', new Date().toLocaleString()],
    ['User Name', user?.name || 'User'],
    ['User Email', user?.email || 'N/A'],
    ['Base Currency', currencySymbol],
    ['Overall Monthly Budget Target', user?.monthlyBudget ? `${currencySymbol}${user.monthlyBudget}` : 'Not configured'],
    ['Total Transactions Count', expenses.length],
    ['Total Outgoing Expenditure', `${currencySymbol}${totalSpentAll.toFixed(2)}`],
    ['Average Outgoing per Transaction', `${currencySymbol}${avgExpense.toFixed(2)}`],
    ['Total Custom Categories', categories.length],
  ];

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  wsOverview['!cols'] = [{ wch: 32 }, { wch: 32 }];

  // 4. CREATE WORKBOOK AND APPEND SHEETS
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Expenses Ledger');
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Category Summary');
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Account Overview');

  // 5. TRIGGER SECURE BROWSER DOWNLOAD
  const cleanDate = new Date().toISOString().split('T')[0];
  const safeFilename = `${fileNamePrefix}_${cleanDate}.xlsx`;

  try {
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const downloadUrl = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    }, 150);
  } catch (err) {
    console.error('Error generating Excel file via Blob, falling back to XLSX.writeFile', err);
    XLSX.writeFile(wb, safeFilename);
  }
};
