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
    logout,
    updateUserPreferences,
    seedDemoDataHandler,
    clearUserData,
    expenses,
    categories,
    currency,
    exportBackup,
    importBackup,
    dbStatus,
    syncWithMongo,
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
    const success = await syncWithMongo();
    setIsSyncing(false);
    if (success) {
      setSyncFeedback('Successfully synchronized with MongoDB!');
    } else {
      setSyncFeedback(
        dbStatus.connected
          ? 'Sync finished with local cache.'
          : 'Saved in local storage. Connect MongoDB URI in .env to enable cloud sync.'
      );
    }
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const backup = parseAndValidateBackup(content);
      if (!backup) {
        setRestoreMessage({ text: 'Invalid backup file format.', type: 'error' });
        return;
      }
      const success = importBackup(backup);
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
    // Reset input
    e.target.value = '';
  };

  if (!isOpen || !user) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetNum = budget ? parseFloat(budget) : undefined;
    updateUserPreferences({
      name: name.trim() || user.name,
      currency: selectedCurrency,
      monthlyBudget: budgetNum,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleClear = () => {
    clearUserData();
    setShowClearConfirm(false);
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
          className="relative w-full max-w-md bg-[#121215] border border-neutral-800 rounded-2xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00FF66]/20 border border-[#00FF66]/40 flex items-center justify-center text-[#00FF66] font-bold text-base">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{user.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <span className="font-mono">{user.mobile}</span>
                  <span className="text-[10px] text-[#00FF66] flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#18181c] border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00FF66]"
              />
            </div>

            {/* Currency Choice */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                Default Currency
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-[#18181c] border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00FF66] cursor-pointer"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.symbol} value={c.symbol} className="bg-[#18181c] text-white">
                    {c.symbol} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Overall Monthly Budget */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                Target Monthly Budget
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400 font-mono text-xs">
                  {selectedCurrency}
                </span>
                <input
                  type="number"
                  step="any"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full pl-8 pr-3 py-2 bg-[#18181c] border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#00FF66] font-mono tabular-nums"
                />
              </div>
            </div>

            {/* Account Diagnostics */}
            <div className="p-3 rounded-xl bg-[#18181c] border border-neutral-800/80 text-xs text-neutral-400 space-y-1">
              <div className="flex justify-between">
                <span>Total Recorded Transactions:</span>
                <span className="font-mono text-white">{expenses.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Custom Categories:</span>
                <span className="font-mono text-white">{categories.length}</span>
              </div>
            </div>

            {/* MongoDB Database Backend Section */}
            <div className="p-3.5 rounded-xl bg-[#18181c] border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#00FF66]" />
                  <h4 className="text-xs font-bold text-white">MongoDB Backend Database</h4>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                    dbStatus.connected
                      ? 'bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/30'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      dbStatus.connected ? 'bg-[#00FF66] shadow-[0_0_6px_#00FF66]' : 'bg-neutral-500'
                    }`}
                  />
                  {dbStatus.connected ? `Connected (${dbStatus.dbName})` : 'Local Fallback'}
                </span>
              </div>

              <p className="text-[11px] text-neutral-400">
                {dbStatus.connected
                  ? 'All custom categories, expenses, and user profile data are saved and synced to your remote MongoDB database.'
                  : 'Operating with local browser cache. Set MONGODB_URI in .env to connect your MongoDB Atlas cluster or local MongoDB instance.'}
              </p>

              {syncFeedback && (
                <div className="p-2 rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/30 text-[#00FF66] text-xs font-medium">
                  {syncFeedback}
                </div>
              )}

              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full py-2 px-3 rounded-xl bg-[#121215] hover:bg-[#202026] border border-neutral-700 hover:border-[#00FF66] text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#00FF66] ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing with MongoDB...' : 'Sync Data with MongoDB'}</span>
              </button>
            </div>

            {/* Local Storage & Recovery Section */}
            <div className="p-3.5 rounded-xl bg-[#18181c] border border-neutral-800 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>Local Storage & Backup Recovery</span>
                </h4>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Your data is stored <strong>locally</strong> in your browser's private storage (<code>localStorage</code>) on this device. It is retained indefinitely until browser site data is wiped.
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

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={exportBackup}
                  className="py-2 px-3 rounded-xl bg-[#121215] hover:bg-[#202026] border border-neutral-700 hover:border-[#00FF66] text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>Download Backup (.json)</span>
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

            {/* Data Management Actions */}
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <button
                type="button"
                onClick={seedDemoDataHandler}
                className="w-full py-2 px-3 rounded-xl bg-[#18181c] hover:bg-[#202028] border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#00FF66]" />
                <span>Reload Demo Starter Data</span>
              </button>

              {showClearConfirm ? (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                  <span>Wipe all expenses & categories?</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-2 py-1 bg-rose-500 text-white rounded font-bold hover:bg-rose-600"
                    >
                      Yes, Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2 py-1 text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full py-2 px-3 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All My Data</span>
                </button>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={logout}
                className="text-xs text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-[#00FF66] hover:bg-[#10f06a] text-black font-bold text-xs rounded-xl shadow-md glow-neon-sm transition-all flex items-center gap-1 cursor-pointer"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Preferences</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
