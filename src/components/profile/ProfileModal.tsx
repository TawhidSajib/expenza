import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Smartphone,
  ShieldCheck,
  DollarSign,
  LogOut,
  Trash2,
  Sparkles,
  Check,
  AlertTriangle,
  HardDrive,
  Download,
  Upload,
  Database,
  RefreshCw,
  ExternalLink,
  Flame,
  Mail,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { parseAndValidateBackup } from '../../utils/storage';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CURRENCIES = [
  { symbol: '$', name: 'US Dollar (USD)' },
  { symbol: '€', name: 'Euro (EUR)' },
  { symbol: '£', name: 'British Pound (GBP)' },
  { symbol: '₹', name: 'Indian Rupee (INR)' },
  { symbol: '৳', name: 'Bangladeshi Taka (BDT)' },
  { symbol: '¥', name: 'Japanese Yen (JPY)' },
  { symbol: 'C$', name: 'Canadian Dollar (CAD)' },
  { symbol: 'A$', name: 'Australian Dollar (AUD)' },
  { symbol: 'AED', name: 'UAE Dirham (AED)' },
  { symbol: 'S$', name: 'Singapore Dollar (SGD)' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    isOwner,
    logout,
    updateUserPreferences,
    seedDemoDataHandler,
    clearUserData,
    expenses,
    categories,
    currency,
    exportExcel,
    exportBackup,
    importBackup,
    firebaseStatus,
    syncWithFirebase,
  } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || '$');
  const [budget, setBudget] = useState(user?.monthlyBudget ? user.monthlyBudget.toString() : '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const success = await syncWithFirebase();
      if (success) {
        setSyncFeedback('Successfully synchronized with Firebase Cloud Firestore!');
      } else {
        setSyncFeedback('Could not complete sync. Please check Firebase authentication.');
      }
    } catch (err: any) {
      setSyncFeedback(err.message || 'Sync error occurred');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const backup = parseAndValidateBackup(content);
      if (!backup) {
        setRestoreMessage({ text: 'Invalid backup file format.', type: 'error' });
        return;
      }
      const success = await importBackup(backup);
      if (success) {
        setRestoreMessage({
          text: `Restored ${backup.categories.length} categories and ${backup.expenses.length} expenses successfully!`,
          type: 'success',
        });
      } else {
        setRestoreMessage({ text: 'Failed to restore backup.', type: 'error' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const budgetNum = budget ? parseFloat(budget) : undefined;
    await updateUserPreferences({
      name: name.trim() || user.name,
      currency: selectedCurrency,
      monthlyBudget: budgetNum,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleClear = async () => {
    await clearUserData(true);
    setShowClearConfirm(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-[#121215] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center text-[#00FF66] font-bold text-base">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{user.name}</h3>
                  {isOwner && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                      App Owner
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3 h-3 text-[#00FF66]" />
                  <span>{user.email || user.mobile || 'Connected Account'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Preferences Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#18181c] border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF66] transition-colors"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Currency Symbol
                  </label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181c] border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-[#00FF66] transition-colors"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.symbol} value={c.symbol}>
                        {c.symbol} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Monthly Budget Target
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm font-mono">
                      {selectedCurrency}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-[#18181c] border border-neutral-800 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-[#00FF66] transition-colors"
                      placeholder="e.g. 2500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#00FF66] hover:bg-[#10f06a] text-black font-bold text-xs rounded-xl shadow glow-neon-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Preferences Saved!</span>
                  </>
                ) : (
                  <span>Save Profile Preferences</span>
                )}
              </button>
            </form>

            {/* Cloud Storage: Firebase Firestore (Restricted to App Owner / Creator only) */}
            {isOwner && (
              <div className="p-4 rounded-xl bg-[#18181c] border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Firebase Cloud Database</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                          Owner Access
                        </span>
                      </h4>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        Project: <span className="text-amber-400">{firebaseStatus.projectId}</span>
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] shadow-[0_0_6px_#00FF66] animate-pulse" />
                    Firestore Live
                  </span>
                </div>

                <p className="text-[11px] text-neutral-300">
                  All custom categories, expenses, and user profile data are saved and persisted in your Cloud Firestore database. You can directly browse documents in the Firebase console.
                </p>

                {firebaseStatus.lastSyncedAt && (
                  <div className="text-[10px] text-neutral-400 font-mono">
                    Last cloud sync: <span className="text-white">{firebaseStatus.lastSyncedAt}</span>
                  </div>
                )}

                {syncFeedback && (
                  <div className="p-2 rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66] text-xs font-medium">
                    {syncFeedback}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="py-2 px-3 rounded-xl bg-[#121215] hover:bg-[#202026] border border-neutral-700 hover:border-[#00FF66] text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#00FF66] ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync to Firebase'}</span>
                  </button>

                  <a
                    href={firebaseStatus.consoleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500 text-amber-300 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Data on Firebase</span>
                  </a>
                </div>
              </div>
            )}

            {/* Data Export (Excel & JSON) & Backup Recovery */}
            <div className="p-3.5 rounded-xl bg-[#18181c] border border-neutral-800 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>Data Export & Excel Download</span>
                </h4>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Download your complete financial records, expenses ledger, and custom category summaries in Microsoft Excel format (.xlsx) or JSON backup.
                </p>
              </div>

              {restoreMessage && (
                <div
                  className={`p-2 rounded-lg text-xs font-medium ${
                    restoreMessage.type === 'success'
                      ? 'bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {restoreMessage.text}
                </div>
              )}

              {/* Primary Excel Download Button */}
              <button
                type="button"
                onClick={() => exportExcel(false)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Download All Data in Excel (.xlsx)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={exportBackup}
                  className="py-2 px-3 rounded-xl bg-[#121215] hover:bg-[#202026] border border-neutral-700 hover:border-[#00FF66] text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>Backup (.json)</span>
                </button>

                <label className="py-2 px-3 rounded-xl bg-[#121215] hover:bg-[#202026] border border-neutral-700 hover:border-[#00FF66] text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>Restore from File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileRestore}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Starter Data & Clear Actions */}
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <button
                type="button"
                onClick={seedDemoDataHandler}
                className="w-full py-2 px-3 rounded-xl bg-[#18181c] hover:bg-[#202028] border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#00FF66]" />
                <span>Load Sample Template (Optional Demo Data)</span>
              </button>

              {showClearConfirm ? (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                  <span>Wipe all expenses & categories from your profile?</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-2 py-1 bg-rose-500 text-white rounded font-bold hover:bg-rose-600 cursor-pointer text-xs"
                    >
                      Yes, Wipe Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2 py-1 text-neutral-400 hover:text-white cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full py-2 px-3 rounded-xl bg-[#18181c] hover:bg-rose-500/10 border border-neutral-800 hover:border-rose-500/30 text-neutral-400 hover:text-rose-400 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe All Expenses & Categories (Start Clean Slate)</span>
                </button>
              )}
            </div>

            {/* Logout button */}
            <div className="pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-rose-950/40 border border-neutral-800 hover:border-rose-800/60 text-neutral-300 hover:text-rose-400 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Expenza</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
