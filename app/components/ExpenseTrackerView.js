'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Camera, Upload, DollarSign, PieChart, RefreshCw, 
  Trash2, Edit2, AlertCircle, CheckCircle2, Clock, 
  ChevronRight, ArrowUpRight, X, Image as ImageIcon, Eye,
  CloudOff, Cloud, Check
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

export default function ExpenseTrackerView({ tripId = 'default_trip', estBudget = 1450, destination = 'Rome, Italy' }) {
  const [expenses, setExpenses] = useState([]);
  const [homeCurrency, setHomeCurrency] = useState('USD');
  const [localCurrency, setLocalCurrency] = useState('EUR');
  const [isOffline, setIsOffline] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);

  // Form State
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [expenseCurrency, setExpenseCurrency] = useState('EUR');
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [receiptPhotoDataUrl, setReceiptPhotoDataUrl] = useState(null);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrConfidenceMsg, setOcrConfidenceMsg] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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

  // Calculations
  const totalSpentUSD = expenses.reduce((acc, exp) => {
    return acc + convertCurrency(exp.amount, exp.currency, 'USD');
  }, 0);

  const budgetGoalUSD = parseFloat(estBudget) || 1450;
  const remainingBudgetUSD = Math.max(0, budgetGoalUSD - totalSpentUSD);
  const percentSpent = Math.min(100, (totalSpentUSD / budgetGoalUSD) * 100);

  // Category Breakdown
  const categoryTotalsUSD = EXPENSE_CATEGORIES.map(cat => {
    const total = expenses
      .filter(exp => exp.category === cat.id)
      .reduce((acc, exp) => acc + convertCurrency(exp.amount, exp.currency, 'USD'), 0);
    return { ...cat, total };
  });

  const pendingSyncCount = expenses.filter(e => e.syncStatus === 'pending').length;

  // Handlers
  const handleOpenAddModal = (mode = 'manual') => {
    setEditingExpense(null);
    setAmount('');
    setMerchant('');
    setCategory('Food & Dining');
    setExpenseCurrency(localCurrency);
    setReceiptPhoto(null);
    setReceiptPhotoDataUrl(null);
    setOcrConfidenceMsg(null);
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

      if (ocrResult.isConfident) {
        setOcrConfidenceMsg({
          type: 'success',
          text: `Auto-extracted "${ocrResult.merchant || 'Merchant'}" for ${ocrResult.currency === 'EUR' ? '€' : '$'}${ocrResult.amount} (${ocrResult.confidence}% confidence)`
        });
      } else {
        setOcrConfidenceMsg({
          type: 'warning',
          text: 'Receipt image scanned. Please verify amount and merchant name below.'
        });
      }
    };
    reader.readAsDataURL(file);

    // Reset file input so same file can be re-selected
    e.target.value = '';
  };

  const handleSaveExpense = (e) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;

    const syncStatus = navigator.onLine ? 'synced' : 'pending';

    let updatedList = [];
    if (editingExpense) {
      updatedList = expenses.map(exp => 
        exp.id === editingExpense.id
          ? {
              ...exp,
              amount: parseFloat(amount),
              merchant: merchant.trim() || 'General Expense',
              category,
              currency: expenseCurrency,
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
        merchant: merchant.trim() || 'General Expense',
        category,
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
    setReceiptPhotoDataUrl(exp.photoUrl);
    setOcrConfidenceMsg(null);
    setShowAddModal(true);
  };

  const handleManualSync = () => {
    if (navigator.onLine) {
      const synced = syncPendingExpenses(tripId, expenses);
      setExpenses(synced);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      
      {/* HEADER TITLE */}
      <div className="text-center max-w-2xl mx-auto relative pt-4">
        <span className="text-xs font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
          In-Trip Finances
        </span>
        <h2 className="text-3xl sm:text-5xl font-serif font-black text-[#1E1C1A] tracking-tight leading-tight mb-3">
          Expense Tracker
        </h2>
        <p className="text-sm font-sans text-[#7A7268] flex items-center justify-center gap-2 flex-wrap">
          <span>{destination}</span>
          <span className="text-[#E6DFD5]">•</span>
          <span>Receipt Capture &amp; Budget Sync</span>
        </p>

        {/* OFFLINE BANNER NOTIFICATION */}
        {pendingSyncCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-sans font-bold shadow-xs"
          >
            <CloudOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{pendingSyncCount} expense{pendingSyncCount > 1 ? 's' : ''} queued offline (will auto-sync when online)</span>
            <button 
              onClick={handleManualSync}
              className="ml-1 px-2.5 py-0.5 rounded-lg bg-amber-600 text-white text-[10.5px] font-bold hover:bg-amber-700 transition-colors"
            >
              Sync Now
            </button>
          </motion.div>
        )}
      </div>

      {/* HERO BUDGET SUMMARY CARD */}
      <div className="bg-white rounded-3xl border border-[#E6DFD5] p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#E6DFD5]/60">
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-widest text-[#7A7268] font-bold">
                Total Spent vs Est. Budget
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#FAF6F0] border border-[#E6DFD5] text-[#1E1C1A] font-mono text-[10px] font-bold">
                Home: {homeCurrency}
              </span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl sm:text-5xl font-serif font-black text-[#1E1C1A]">
                {formatCurrency(totalSpentUSD, 'USD')}
              </span>
              <span className="text-lg sm:text-xl font-serif text-[#7A7268] font-bold">
                of {formatCurrency(budgetGoalUSD, 'USD')} Est. Budget
              </span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => handleOpenAddModal('manual')}
              className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-[#1E1C1A] text-white hover:bg-[#FF6B2C] font-sans text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Manual Entry</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 md:flex-initial px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF6B2C] to-[#E55A1C] text-white font-sans text-xs font-bold hover:shadow-md hover:scale-[1.02] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-white/20"
            >
              <Camera className="w-4 h-4" />
              <span>+ Scan Receipt</span>
            </button>
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoCaptured}
            />
          </div>
        </div>

        {/* PROGRESS GAUGE BAR */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-sans font-bold text-[#5F5E5A]">
            <span>{percentSpent.toFixed(0)}% of Budget Spent</span>
            <span>{formatCurrency(remainingBudgetUSD, 'USD')} Remaining</span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#FAF6F0] border border-[#E6DFD5] overflow-hidden p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentSpent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full transition-colors ${
                percentSpent > 90 ? 'bg-red-500' : percentSpent > 70 ? 'bg-amber-500' : 'bg-[#FF6B2C]'
              }`}
            />
          </div>
        </div>

        {/* CATEGORY BREAKDOWN CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
          {categoryTotalsUSD.map(cat => (
            <div 
              key={cat.id}
              className="p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#E6DFD5]/70 flex flex-col justify-between gap-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-base">{cat.icon}</span>
                <span className="font-mono text-[10px] text-[#7A7268] font-bold">
                  {totalSpentUSD > 0 ? ((cat.total / totalSpentUSD) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div>
                <span className="text-[11px] font-sans font-bold text-[#5F5E5A] block truncate">
                  {cat.label}
                </span>
                <span className="text-sm font-serif font-extrabold text-[#1E1C1A]">
                  {formatCurrency(cat.total, 'USD')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHRONOLOGICAL EXPENSES FEED */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-xl text-[#1E1C1A]">
            Logged Expenses ({expenses.length})
          </h3>
          <span className="text-xs font-sans text-[#7A7268]">
            Tap receipt photo to view preview
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#E6DFD5] flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center text-[#7A7268]">
              <DollarSign className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-lg text-[#1E1C1A]">No expenses logged yet</h4>
            <p className="text-xs font-sans text-[#7A7268] max-w-sm">
              Tap "+ Scan Receipt" to capture a receipt photo or click "Manual Entry" to record cash tips &amp; food expenses.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {expenses.map((exp) => {
              const catObj = EXPENSE_CATEGORIES.find(c => c.id === exp.category) || EXPENSE_CATEGORIES[0];
              const convertedUSD = convertCurrency(exp.amount, exp.currency, 'USD');

              return (
                <motion.div
                  key={exp.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E6DFD5] shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* RECEIPT PHOTO THUMBNAIL */}
                    {exp.photoUrl ? (
                      <div 
                        onClick={() => setPreviewPhotoUrl(exp.photoUrl)}
                        className="relative w-12 h-12 rounded-xl bg-gray-100 overflow-hidden border border-[#E6DFD5] shrink-0 cursor-pointer group"
                      >
                        <img src={exp.photoUrl} alt="Receipt" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center text-xl shrink-0">
                        {catObj.icon}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-serif font-bold text-base text-[#1E1C1A] truncate">
                          {exp.merchant}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#FAF6F0] border border-[#E6DFD5] text-[10px] font-sans font-bold text-[#5F5E5A]">
                          {exp.category}
                        </span>
                        {exp.syncStatus === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/30 text-[9.5px] font-mono font-bold flex items-center gap-1">
                            <CloudOff className="w-3 h-3 text-amber-600" /> Pending
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-sans text-[#7A7268]">
                        {new Date(exp.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* AMOUNT & ACTIONS */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="font-serif font-black text-lg text-[#1E1C1A]">
                        {formatCurrency(exp.amount, exp.currency)}
                      </div>
                      {exp.currency !== 'USD' && (
                        <div className="text-xs font-mono text-[#7A7268]">
                          (~{formatCurrency(convertedUSD, 'USD')})
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditClick(exp)}
                        className="p-2 rounded-xl text-[#7A7268] hover:text-[#1E1C1A] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                        title="Edit expense"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-2 rounded-xl text-[#7A7268] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD / EDIT EXPENSE MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl border border-[#E6DFD5] w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-[#E6DFD5]/60 flex items-center justify-between bg-[#FAF6F0]">
                <h3 className="font-serif font-bold text-xl text-[#1E1C1A]">
                  {editingExpense ? 'Edit Expense' : 'Log New Expense'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-xl text-[#7A7268] hover:text-[#1E1C1A] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="p-6 flex flex-col gap-5">
                
                {/* RECEIPT PHOTO DROP/SCAN ZONE */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5F5E5A]">
                    Receipt Photo (Optional)
                  </label>
                  
                  {receiptPhotoDataUrl ? (
                    <div className="relative h-36 rounded-2xl bg-gray-100 overflow-hidden border border-[#E6DFD5]">
                      <img src={receiptPhotoDataUrl} alt="Receipt" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setReceiptPhoto(null); setReceiptPhotoDataUrl(null); }}
                        className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/60 text-white hover:bg-black transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 p-4 rounded-2xl border-2 border-dashed border-[#E6DFD5] hover:border-[#FF6B2C] bg-[#FAF6F0]/50 hover:bg-[#FAF6F0] transition-all flex flex-col items-center justify-center gap-1.5 text-[#7A7268] hover:text-[#FF6B2C] cursor-pointer"
                      >
                        <Camera className="w-5 h-5" />
                        <span className="text-xs font-sans font-bold">Upload / Take Photo</span>
                      </button>
                    </div>
                  )}

                  {/* OCR SCANNING SPINNER */}
                  {isScanningOcr && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-sans flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Scanning receipt data via OCR...</span>
                    </div>
                  )}

                  {/* OCR CONFIDENCE FEEDBACK */}
                  {ocrConfidenceMsg && (
                    <div className={`p-3 rounded-xl border text-xs font-sans flex items-center gap-2 ${
                      ocrConfidenceMsg.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}>
                      {ocrConfidenceMsg.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <span>{ocrConfidenceMsg.text}</span>
                    </div>
                  )}
                </div>

                {/* AMOUNT & CURRENCY */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 flex flex-col gap-1.5">
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
                      className="w-full px-4 py-3 rounded-2xl border border-[#E6DFD5] font-serif font-bold text-lg text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C] focus:ring-1 focus:ring-[#FF6B2C]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5F5E5A]">
                      Currency
                    </label>
                    <select
                      value={expenseCurrency}
                      onChange={(e) => setExpenseCurrency(e.target.value)}
                      className="w-full px-3 py-3 rounded-2xl border border-[#E6DFD5] font-sans font-bold text-xs text-[#1E1C1A] bg-white focus:outline-none focus:border-[#FF6B2C]"
                    >
                      {SUPPORTED_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* MERCHANT NAME */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5F5E5A]">
                    Merchant / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sant'Eustachio Caffè, Uber, Hotel"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#E6DFD5] font-sans text-sm text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C]"
                  />
                </div>

                {/* CATEGORY SELECTOR */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#5F5E5A]">
                    Category *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {EXPENSE_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-xs font-sans font-bold flex items-center gap-2 transition-all ${
                          category === cat.id
                            ? 'bg-[#1E1C1A] text-white border-[#1E1C1A] shadow-xs'
                            : 'bg-white text-[#5F5E5A] border-[#E6DFD5] hover:bg-[#FAF6F0]'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span className="truncate">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-3 rounded-2xl border border-[#E6DFD5] text-xs font-bold text-[#7A7268] hover:bg-[#FAF6F0] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-[#FF6B2C] text-white text-xs font-bold hover:bg-[#E55A1C] transition-colors shadow-md cursor-pointer"
                  >
                    {editingExpense ? 'Update Expense' : 'Save Expense'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECEIPT PHOTO PREVIEW LIGHTBOX MODAL */}
      <AnimatePresence>
        {previewPhotoUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl bg-black border border-white/20 p-2"
            >
              <img src={previewPhotoUrl} alt="Receipt Preview" className="w-full h-full object-contain max-h-[80vh] rounded-2xl" />
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
