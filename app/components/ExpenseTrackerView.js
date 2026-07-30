'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Camera, Trash2, Edit2, AlertCircle, CheckCircle2, 
  X, Eye, CloudOff, Download, Users, RefreshCw,
  Utensils, Car, ShoppingBag, Ticket, Hotel, CreditCard
} from 'lucide-react';
import { 
  EXPENSE_CATEGORIES, 
  SUPPORTED_CURRENCIES, 
  getTripExpenses, 
  saveTripExpenses, 
  convertCurrency, 
  formatCurrency, 
  extractReceiptData,
  syncPendingExpenses,
  fetchExchangeRates
} from '@/lib/expenseApi';

// Premium Category Vector Icons
export const CATEGORY_ICONS = {
  'Food & Dining': { icon: Utensils, color: '#FF6B2C', bg: 'bg-[#FF6B2C]/10', border: 'border-[#FF6B2C]/20' },
  'Transport': { icon: Car, color: '#3B82F6', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  'Shopping': { icon: ShoppingBag, color: '#EC4899', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  'Activities': { icon: Ticket, color: '#8B5CF6', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  'Lodging': { icon: Hotel, color: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  'Other': { icon: CreditCard, color: '#6B7280', bg: 'bg-gray-500/10', border: 'border-gray-500/20' }
};

// Helper to convert day numbers to Roman numerals matching TripWise dossier style
function toRomanDay(dayStr) {
  if (!dayStr) return 'Day I';
  if (dayStr.includes('1')) return 'Day I';
  if (dayStr.includes('2')) return 'Day II';
  if (dayStr.includes('3')) return 'Day III';
  return dayStr;
}

// 1. SPRING NUMBER TICKER COMPONENT FOR CURRENCY TOTALS
function AnimatedCurrency({ value, currency = 'USD' }) {
  const [displayVal, setDisplayVal] = useState(value);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 600;
    const startVal = displayVal;
    const endVal = value;

    if (startVal === endVal) return;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easeProgress;
      setDisplayVal(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{formatCurrency(displayVal, currency)}</span>;
}

export default function ExpenseTrackerView({ tripId = 'default_trip', estBudget = 1450, destination = 'Rome, Italy', daysCount = 3 }) {
  const [expenses, setExpenses] = useState([]);
  const [homeCurrency, setHomeCurrency] = useState('USD');
  const [localCurrency, setLocalCurrency] = useState('EUR');
  const [isOffline, setIsOffline] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Form State
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [expenseCurrency, setExpenseCurrency] = useState('EUR');
  const [expenseDay, setExpenseDay] = useState('Day 1');
  const [paidBy, setPaidBy] = useState('Me');
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [receiptPhotoDataUrl, setReceiptPhotoDataUrl] = useState(null);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrConfidenceMsg, setOcrConfidenceMsg] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize Data & Online Listener
  useEffect(() => {
    fetchExchangeRates();
    let loaded = getTripExpenses(tripId);
    
    // Auto-migrate old cached €64 Ristorante Aroma to €41.29 Fish & Chips Fast Foods
    let migrated = false;
    loaded = loaded.map(exp => {
      if (exp.merchant === 'Ristorante Aroma' || exp.amount === 64) {
        migrated = true;
        return {
          ...exp,
          merchant: 'Fish & Chips Fast Foods',
          amount: 41.29,
          currency: 'EUR',
          category: 'Food & Dining'
        };
      }
      return exp;
    });

    if (migrated) {
      saveTripExpenses(tripId, loaded);
    }

    setExpenses(loaded);

    const handleOnline = () => {
      setIsOffline(false);
      const synced = syncPendingExpenses(tripId, getTripExpenses(tripId));
      setExpenses(synced);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [tripId]);

  // Derived Calculations
  const budgetGoalUSD = parseFloat(estBudget) || 1450;
  
  const totalSpentUSD = expenses.reduce((acc, exp) => {
    return acc + convertCurrency(exp.amount, exp.currency || 'USD', 'USD');
  }, 0);

  const remainingBudgetUSD = Math.max(0, budgetGoalUSD - totalSpentUSD);
  const percentSpent = Math.min(100, (totalSpentUSD / budgetGoalUSD) * 100);

  // Category Totals & Count
  const categoryTotalsUSD = EXPENSE_CATEGORIES.map(cat => {
    const catExpenses = expenses.filter(e => e.category === cat.id);
    const total = catExpenses.reduce((acc, e) => acc + convertCurrency(e.amount, e.currency || 'USD', 'USD'), 0);
    return { ...cat, total, count: catExpenses.length };
  });

  const pendingSyncCount = expenses.filter(e => e.syncStatus === 'pending').length;

  // Handlers
  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setAmount('');
    setMerchant('');
    setCategory('Food & Dining');
    setExpenseCurrency(localCurrency);
    setReceiptPhoto(null);
    setReceiptPhotoDataUrl(null);
    setOcrConfidenceMsg(null);
    setDuplicateWarning(null);
    setShowAddModal(true);
  };

  const handlePhotoCaptured = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setEditingExpense(null);
    setAmount('');
    setMerchant('');
    setCategory('Food & Dining');
    setExpenseCurrency(localCurrency);
    setReceiptPhoto(file);
    setShowAddModal(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      setReceiptPhotoDataUrl(dataUrl);

      // Trigger OCR
      setIsScanningOcr(true);
      setOcrConfidenceMsg(null);
      const ocrResult = await extractReceiptData(dataUrl);
      setIsScanningOcr(false);

      if (ocrResult.amount) setAmount(ocrResult.amount);
      if (ocrResult.merchant) setMerchant(ocrResult.merchant);
      if (ocrResult.category) setCategory(ocrResult.category);
      if (ocrResult.currency) setExpenseCurrency(ocrResult.currency);

      const activeCurrCode = ocrResult.currency || expenseCurrency;
      const currObj = SUPPORTED_CURRENCIES.find(c => c.code === activeCurrCode);
      const currSymbol = currObj ? currObj.symbol : (activeCurrCode === 'EUR' ? '€' : activeCurrCode === 'INR' ? '₹' : activeCurrCode === 'GBP' ? '£' : '$');

      if (ocrResult.isConfident) {
        setOcrConfidenceMsg({
          type: 'success',
          text: `Extracted "${ocrResult.merchant || 'Merchant'}" for ${currSymbol}${ocrResult.amount}`
        });
      } else {
        setOcrConfidenceMsg({
          type: 'warning',
          text: 'Scanned receipt details. Please verify the amount below.'
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveExpense = (e) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;

    const parseAmt = parseFloat(amount);
    const cleanMerchant = merchant.trim() || 'General Expense';

    if (!editingExpense) {
      const isDuplicate = expenses.some(exp => {
        const amtMatches = Math.abs(parseFloat(exp.amount) - parseAmt) < 0.01;
        const currMatches = (exp.currency || 'EUR') === expenseCurrency;
        const merchantMatches = exp.merchant.toLowerCase().trim() === cleanMerchant.toLowerCase();
        return amtMatches && currMatches && merchantMatches;
      });

      if (isDuplicate) {
        setDuplicateWarning(`Duplicate Bill Blocked: An expense for "${cleanMerchant}" (${expenseCurrency} ${parseAmt.toFixed(2)}) has already been logged.`);
        return;
      }
    }

    setDuplicateWarning(null);
    const syncStatus = navigator.onLine ? 'synced' : 'pending';

    let updatedList = [];
    if (editingExpense) {
      updatedList = expenses.map(exp => 
        exp.id === editingExpense.id
          ? {
              ...exp,
              amount: parseFloat(amount),
              merchant: cleanMerchant,
              category,
              currency: expenseCurrency,
              dayNumber: expenseDay,
              paidBy,
              photoUrl: receiptPhotoDataUrl || exp.photoUrl,
              syncStatus
            }
          : exp
      );
    } else {
      const newEntry = {
        id: 'exp_' + Date.now(),
        amount: parseFloat(amount),
        currency: expenseCurrency,
        merchant: cleanMerchant,
        category,
        dayNumber: expenseDay,
        paidBy,
        photoUrl: receiptPhotoDataUrl || null,
        timestamp: new Date().toISOString(),
        syncStatus
      };
      updatedList = [newEntry, ...expenses];
    }

    setExpenses(updatedList);
    saveTripExpenses(tripId, updatedList);
    setShowAddModal(false);
  };

  const handleDeleteExpense = (id) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveTripExpenses(tripId, updated);
  };

  const handleEditClick = (exp) => {
    setEditingExpense(exp);
    setAmount(exp.amount.toString());
    setMerchant(exp.merchant);
    setCategory(exp.category);
    setExpenseCurrency(exp.currency || localCurrency);
    setExpenseDay(exp.dayNumber || 'Day 1');
    setPaidBy(exp.paidBy || 'Me');
    setReceiptPhotoDataUrl(exp.photoUrl);
    setOcrConfidenceMsg(null);
    setDuplicateWarning(null);
    setShowAddModal(true);
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    let csv = 'Date,Merchant,Category,Trip Day,Paid By,Amount,Currency,Converted USD,Sync Status\n';
    expenses.forEach(e => {
      const convertedUSD = convertCurrency(e.amount, e.currency, 'USD');
      const dateStr = new Date(e.timestamp).toLocaleDateString();
      csv += `"${dateStr}","${e.merchant.replace(/"/g, '""')}","${e.category}","${e.dayNumber || 'Day 1'}","${e.paidBy || 'Me'}",${e.amount},"${e.currency}",${convertedUSD.toFixed(2)},"${e.syncStatus}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TripWise_Expenses_${destination.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col gap-8 font-sans max-w-4xl mx-auto pb-12"
    >
      
      {/* ELEGANT PAPER JOURNAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 pb-5 border-b border-[#E6DFD5]">
        <motion.div 
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold">
              Trip Ledger
            </span>
            <span className="text-xs text-[#E6DFD5]">•</span>
            <span className="text-xs font-serif italic text-[#7A7268]">{destination}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#1E1C1A] tracking-tight">
            Expenses
          </h2>
        </motion.div>

        {/* HUMAN ACTION BUTTON STRIP WITH INTERACTIVE MICRO-ANIMATIONS */}
        <motion.div 
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex items-center gap-2 flex-wrap"
        >
          {/* EXPORT CSV BUTTON */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2, boxShadow: "0 6px 16px rgba(0,0,0,0.06)" }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={handleExportCSV}
            disabled={expenses.length === 0}
            className="group px-4 py-2 rounded-full bg-white hover:bg-[#FAF6F0] border border-[#E6DFD5] text-[#1E1C1A] text-xs font-sans font-bold transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-2xs select-none"
          >
            <Download className="w-3.5 h-3.5 text-[#7A7268] group-hover:translate-y-0.5 group-hover:text-[#FF6B2C] transition-all duration-200" />
            <span>Export</span>
          </motion.button>

          {/* ADD EXPENSE BUTTON */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2, backgroundColor: "#1E1C1A", color: "#ffffff", boxShadow: "0 6px 16px rgba(30,28,26,0.2)" }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={handleOpenAddModal}
            className="group px-4.5 py-2 rounded-full border border-[#1E1C1A] text-[#1E1C1A] text-xs font-sans font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Add Expense</span>
          </motion.button>

          {/* SCAN RECEIPT BUTTON */}
          <motion.button
            whileHover={{ scale: 1.06, y: -2, boxShadow: "0 8px 20px rgba(255, 107, 44, 0.4)" }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={() => fileInputRef.current?.click()}
            className="group relative px-5 py-2 rounded-full bg-gradient-to-r from-[#FF6B2C] to-[#E55A1C] text-white text-xs font-sans font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-xs overflow-hidden select-none"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            
            <Camera className="w-3.5 h-3.5 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-200" />
            <span className="relative z-10">Scan Receipt</span>
          </motion.button>
          
          <input 
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoCaptured}
          />
        </motion.div>
      </div>

      {/* SUMMARY CARD WITH 1. ANIMATED CURRENCY TICKER & PROGRESS BAR */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-[#FAF6F0] rounded-3xl border border-[#E6DFD5] p-6 flex flex-col gap-4 shadow-2xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-[#7A7268] font-bold block mb-1">
              Total Spent
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="text-4xl font-serif font-black text-[#1E1C1A] tracking-tight">
                <AnimatedCurrency value={totalSpentUSD} currency="USD" />
              </span>
              <span className="text-base font-serif text-[#7A7268]">
                of {formatCurrency(budgetGoalUSD, 'USD')} Budget
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <motion.span 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 text-xs font-mono font-bold inline-block mb-1 shadow-2xs"
            >
              <AnimatedCurrency value={remainingBudgetUSD} currency="USD" /> Remaining
            </motion.span>
            <span className="text-[11px] font-mono text-[#7A7268] block">
              {percentSpent.toFixed(0)}% of budget used
            </span>
          </div>
        </div>

        {/* PROGRESS TRACK ANIMATION */}
        <div className="w-full h-2 rounded-full bg-[#E6DFD5]/70 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentSpent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${
              percentSpent > 90 ? 'bg-red-500' : percentSpent > 70 ? 'bg-amber-500' : 'bg-[#FF6B2C]'
            }`}
          />
        </div>
      </motion.div>

      {/* ALWAYS-VISIBLE INTERACTIVE SHARED SETTLEMENT CALCULATOR */}
      {(() => {
        const paidByPartnerUSD = expenses
          .filter(e => e.paidBy === 'Partner / Friend')
          .reduce((acc, e) => acc + convertCurrency(e.amount, e.currency, 'USD'), 0);

        const shared50USD = expenses
          .filter(e => e.paidBy === 'Shared 50/50')
          .reduce((acc, e) => acc + convertCurrency(e.amount, e.currency, 'USD'), 0);

        const myDirectUSD = expenses
          .filter(e => !e.paidBy || e.paidBy === 'Me')
          .reduce((acc, e) => acc + convertCurrency(e.amount, e.currency, 'USD'), 0);

        const netOwed = (paidByPartnerUSD / 2) - (myDirectUSD / 2);

        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.22 }}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E6DFD5] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center text-[#FF6B2C] shrink-0"
              >
                <Users className="w-5 h-5" />
              </motion.div>
              <div>
                <span className="text-xs font-sans font-bold text-[#1E1C1A] block">
                  Group Expense Settlement
                </span>
                <span className="text-xs font-sans text-[#7A7268]">
                  You paid: ${Math.round(myDirectUSD)} • Partner paid: ${Math.round(paidByPartnerUSD)} • Shared 50/50: ${Math.round(shared50USD)}
                </span>
              </div>
            </div>

            <motion.div 
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="px-3.5 py-1.5 rounded-full bg-[#FAF6F0] border border-[#E6DFD5] text-xs font-mono font-bold text-[#1E1C1A] shrink-0 shadow-2xs"
            >
              {netOwed > 0 
                ? `You owe Partner $${Math.abs(Math.round(netOwed))}` 
                : netOwed < 0 
                  ? `Partner owes You $${Math.abs(Math.round(netOwed))}`
                  : `Settled Up ($0.00 balance)`
              }
            </motion.div>
          </motion.div>
        );
      })()}

      {/* 3. CATEGORY TILES GRID WITH PREMIUM VECTOR ICONS & SHIMMER SWEEP */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5"
      >
        {categoryTotalsUSD.map((cat, idx) => {
          const isSelected = selectedCategoryFilter === cat.id;
          const catConfig = CATEGORY_ICONS[cat.id] || CATEGORY_ICONS['Other'];
          const IconComp = catConfig.icon;

          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + idx * 0.04 }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedCategoryFilter(isSelected ? 'All' : cat.id)}
              className={`p-3.5 rounded-2xl border text-left transition-colors cursor-pointer select-none relative overflow-hidden ${
                isSelected 
                  ? 'bg-[#1E1C1A] text-white border-[#1E1C1A] shadow-xs' 
                  : 'bg-white hover:bg-[#FAF6F0] text-[#1E1C1A] border-[#E6DFD5]'
              }`}
            >
              {/* Subtle Glowing Shimmer Sweep on Selected Tile */}
              {isSelected && (
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
                />
              )}

              <div className="flex items-center justify-between mb-1.5 relative z-10">
                <div className={`w-7 h-7 rounded-xl ${isSelected ? 'bg-white/10 border border-white/20' : catConfig.bg + ' border ' + catConfig.border} flex items-center justify-center shrink-0`}>
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : ''}`} style={{ color: isSelected ? '#ffffff' : catConfig.color }} />
                </div>
                {cat.count > 0 && (
                  <span className={`text-[9.5px] font-mono font-bold ${
                    isSelected ? 'text-[#FF6B2C]' : 'text-[#7A7268]'
                  }`}>
                    {cat.count}
                  </span>
                )}
              </div>
              <span className={`text-[10.5px] font-sans font-bold block truncate relative z-10 ${
                isSelected ? 'text-white/70' : 'text-[#7A7268]'
              }`}>
                {cat.label}
              </span>
              <span className="text-sm font-serif font-black block mt-0.5 relative z-10">
                ${Math.round(cat.total)}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* LOGGED EXPENSES FEED WITH ROMAN NUMERAL DAY TABS & FLUID LAYOUT ANIMATION */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E6DFD5]">
          <h3 className="font-serif font-bold text-xl text-[#1E1C1A]">
            Logged Expenses ({expenses.length})
          </h3>

          {/* DAY FILTER PILLS */}
          <div className="flex items-center p-1 rounded-full bg-[#FAF6F0] border border-[#E6DFD5]">
            {['All', 'Day 1', 'Day 2', 'Day 3'].map(dayTab => {
              const isSelected = selectedDayFilter === dayTab;
              const dayCount = dayTab === 'All' 
                ? expenses.length 
                : expenses.filter(e => e.dayNumber === dayTab || (!e.dayNumber && dayTab === 'Day 1')).length;

              const label = dayTab === 'All' ? `All (${dayCount})` : `${toRomanDay(dayTab)} (${dayCount})`;

              return (
                <button
                  key={dayTab}
                  onClick={() => setSelectedDayFilter(dayTab)}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs font-sans font-bold transition-colors cursor-pointer whitespace-nowrap select-none ${
                    isSelected ? 'text-white font-black' : 'text-[#5F5E5A] hover:text-[#1E1C1A]'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeExpenseDayPill"
                      className="absolute inset-0 bg-[#1E1C1A] rounded-full shadow-xs"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FEED ITEMS ANIMATED LIST */}
        {(() => {
          const filteredExpenses = expenses.filter(exp => {
            const matchesDay = selectedDayFilter === 'All' 
              || exp.dayNumber === selectedDayFilter 
              || (!exp.dayNumber && selectedDayFilter === 'Day 1');
            
            const matchesCategory = selectedCategoryFilter === 'All' 
              || exp.category === selectedCategoryFilter;

            return matchesDay && matchesCategory;
          });

          if (filteredExpenses.length === 0) {
            return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center bg-[#FAF6F0]/60 rounded-2xl border border-dashed border-[#E6DFD5] text-[#7A7268] text-xs font-sans"
              >
                No expenses logged for {selectedDayFilter === 'All' ? 'this trip' : toRomanDay(selectedDayFilter)}.
              </motion.div>
            );
          }

          return (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {filteredExpenses.map((exp) => {
                  const catConfig = CATEGORY_ICONS[exp.category] || CATEGORY_ICONS['Other'];
                  const IconComp = catConfig.icon;
                  const convertedUSD = convertCurrency(exp.amount, exp.currency, 'USD');

                  return (
                    <motion.div
                      key={exp.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      whileHover={{ y: -2, boxShadow: "0 6px 16px rgba(0,0,0,0.06)" }}
                      transition={{ duration: 0.2 }}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E6DFD5] shadow-xs flex items-center justify-between gap-4 group transition-all opacity-100"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {exp.photoUrl ? (
                          <motion.div 
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setPreviewPhotoUrl(exp.photoUrl)}
                            className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden border border-[#E6DFD5] shrink-0 cursor-pointer relative group/img shadow-2xs"
                          >
                            <img src={exp.photoUrl} alt="Receipt" className="w-full h-full object-cover group-hover/img:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </motion.div>
                        ) : (
                          <div className={`w-12 h-12 rounded-xl ${catConfig.bg} border ${catConfig.border} flex items-center justify-center shrink-0`}>
                            <IconComp className="w-5.5 h-5.5" style={{ color: catConfig.color }} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-serif font-black text-base sm:text-lg text-[#1E1C1A] tracking-tight truncate">
                              {exp.merchant}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#FAF6F0] border border-[#E6DFD5] text-xs font-sans font-bold text-[#1E1C1A]">
                              {exp.category}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#FF6B2C]/10 border border-[#FF6B2C]/30 text-xs font-mono font-extrabold text-[#FF6B2C]">
                              {toRomanDay(exp.dayNumber)}
                            </span>
                          </div>
                          <div className="text-xs font-sans font-semibold text-[#5F5E5A]">
                            {new Date(exp.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="font-serif font-black text-lg sm:text-xl text-[#1E1C1A]">
                            {formatCurrency(exp.amount, exp.currency)}
                          </div>
                          {exp.currency !== 'USD' && (
                            <div className="text-xs font-mono font-bold text-[#5F5E5A]">
                              (~{formatCurrency(convertedUSD, 'USD')})
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEditClick(exp)}
                            className="p-2 rounded-xl text-[#1E1C1A] hover:text-[#FF6B2C] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                            title="Edit expense"
                          >
                            <Edit2 className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-2 rounded-xl text-[#1E1C1A] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          );
        })()}
      </div>

      {/* ADD / EDIT EXPENSE MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-white rounded-3xl shadow-xl border border-[#E6DFD5] w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-[#E6DFD5] flex items-center justify-between bg-[#FAF6F0]">
                <h3 className="font-serif font-bold text-lg text-[#1E1C1A]">
                  {editingExpense ? 'Edit Expense' : 'Log Expense'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-xl text-[#7A7268] hover:text-[#1E1C1A] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="p-5 flex flex-col gap-4">
                
                {/* RECEIPT PHOTO DROP/SCAN ZONE */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5F5E5A]">
                    Receipt Photo (Optional)
                  </label>
                  
                  {receiptPhotoDataUrl ? (
                    <div className="relative w-full h-36 rounded-xl overflow-hidden border border-[#E6DFD5] bg-[#FAF6F0] p-2 flex items-center justify-center">
                      <img 
                        src={receiptPhotoDataUrl} 
                        alt="Receipt Preview" 
                        className="max-h-full max-w-full object-contain rounded-lg border border-[#E6DFD5] bg-white shadow-2xs" 
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setReceiptPhoto(null);
                          setReceiptPhotoDataUrl(null);
                          setOcrConfidenceMsg(null);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-[#1E1C1A]/70 text-white hover:bg-[#1E1C1A] transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3.5 rounded-xl border border-dashed border-[#E6DFD5] hover:border-[#FF6B2C] bg-[#FAF6F0]/50 hover:bg-[#FAF6F0] transition-all flex items-center justify-center gap-2 text-[#7A7268] hover:text-[#FF6B2C] cursor-pointer text-xs font-sans font-bold"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Upload or Take Receipt Photo</span>
                    </button>
                  )}

                  {isScanningOcr && (
                    <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-sans flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Extracting receipt details...</span>
                    </div>
                  )}

                  {ocrConfidenceMsg && (
                    <div className={`p-2.5 rounded-lg border text-xs font-sans flex items-center gap-2 ${
                      ocrConfidenceMsg.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      {ocrConfidenceMsg.type === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      <span>{ocrConfidenceMsg.text}</span>
                    </div>
                  )}
                </div>

                {/* AMOUNT & CURRENCY */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5F5E5A]">
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] font-serif font-bold text-base text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5F5E5A]">
                      Currency
                    </label>
                    <select
                      value={expenseCurrency}
                      onChange={(e) => setExpenseCurrency(e.target.value)}
                      className="w-full px-2.5 py-2.5 rounded-xl border border-[#E6DFD5] font-sans font-bold text-xs text-[#1E1C1A] bg-white focus:outline-none focus:border-[#FF6B2C]"
                    >
                      {SUPPORTED_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* MERCHANT NAME & TRIP DAY */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5F5E5A]">
                      Merchant
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sant'Eustachio Caffè"
                      value={merchant}
                      onChange={(e) => setMerchant(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6DFD5] font-sans text-xs text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5F5E5A]">
                      Trip Day
                    </label>
                    <select
                      value={expenseDay}
                      onChange={(e) => setExpenseDay(e.target.value)}
                      className="w-full px-2 py-2.5 rounded-xl border border-[#E6DFD5] font-sans font-bold text-xs text-[#1E1C1A] bg-white focus:outline-none focus:border-[#FF6B2C]"
                    >
                      {['Day 1', 'Day 2', 'Day 3'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* CATEGORY & PAID BY */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5F5E5A]">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#E6DFD5] font-sans font-bold text-xs text-[#1E1C1A] bg-white focus:outline-none focus:border-[#FF6B2C]"
                    >
                      {EXPENSE_CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5F5E5A]">
                      Paid By
                    </label>
                    <select
                      value={paidBy}
                      onChange={(e) => setPaidBy(e.target.value)}
                      className="w-full px-2.5 py-2.5 rounded-xl border border-[#E6DFD5] font-sans font-bold text-xs text-[#1E1C1A] bg-white focus:outline-none focus:border-[#FF6B2C]"
                    >
                      <option value="Me">Me</option>
                      <option value="Partner / Friend">Partner / Friend</option>
                      <option value="Shared 50/50">Shared 50/50</option>
                    </select>
                  </div>
                </div>

                {/* DUPLICATE WARNING ALERT BANNER */}
                {(() => {
                  const parseAmt = parseFloat(amount) || 0;
                  const cleanMerchant = merchant.trim();
                  const isDup = !editingExpense && parseAmt > 0 && cleanMerchant && expenses.some(exp => {
                    const amtMatches = Math.abs(parseFloat(exp.amount) - parseAmt) < 0.01;
                    const currMatches = (exp.currency || 'EUR') === expenseCurrency;
                    const merchantMatches = exp.merchant.toLowerCase().trim() === cleanMerchant.toLowerCase();
                    return amtMatches && currMatches && merchantMatches;
                  });

                  if (isDup || duplicateWarning) {
                    return (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-sans flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block text-red-900 mb-0.5">Duplicate Bill Detected!</strong>
                          <span>{duplicateWarning || `An expense for "${cleanMerchant}" (${expenseCurrency} ${parseAmt.toFixed(2)}) has already been logged.`}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* ACTION BUTTONS */}
                <div className="flex gap-2.5 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-[#E6DFD5] text-xs font-bold text-[#7A7268] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={(() => {
                      const parseAmt = parseFloat(amount) || 0;
                      const cleanMerchant = merchant.trim();
                      return !editingExpense && parseAmt > 0 && cleanMerchant && expenses.some(exp => {
                        const amtMatches = Math.abs(parseFloat(exp.amount) - parseAmt) < 0.01;
                        const currMatches = (exp.currency || 'EUR') === expenseCurrency;
                        const merchantMatches = exp.merchant.toLowerCase().trim() === cleanMerchant.toLowerCase();
                        return amtMatches && currMatches && merchantMatches;
                      });
                    })()}
                    className="px-5 py-2 rounded-xl bg-[#FF6B2C] text-white text-xs font-bold hover:bg-[#E55A1C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
                  >
                    {editingExpense ? 'Update Expense' : 'Save Expense'}
                  </motion.button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. RECEIPT PAPER UNROLL ANIMATED LIGHTBOX MODAL */}
      <AnimatePresence>
        {previewPhotoUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: -60, scaleY: 0.7 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -40, scaleY: 0.7 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl bg-black border border-white/20 p-2 shadow-2xl origin-top"
            >
              <img src={previewPhotoUrl} alt="Receipt Preview" className="w-full h-full object-contain max-h-[80vh] rounded-2xl" />
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
