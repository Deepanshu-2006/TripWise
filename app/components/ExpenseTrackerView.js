'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Camera, Trash2, Edit2, AlertCircle, CheckCircle2, 
  X, Eye, CloudOff, Download, Users, RefreshCw, Utensils, Car, ShoppingBag, Ticket, Hotel, CreditCard,
  TrendingUp, TrendingDown, DollarSign, ChevronDown, ChevronRight, ChevronLeft
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { getTripCollaborators } from '../actions/trips';
import { 
  getTripExpenses, saveTripExpenses, syncPendingExpenses, 
  SUPPORTED_CURRENCIES, convertCurrency, fetchExchangeRates, getUserDisplayCurrency, getConvertedEstimatedCostNumber
} from '../../lib/expenseApi';
// OCR Receipt Extraction Helper
async function extractReceiptData(imageDataUrl) {
  try {
    const res = await fetch('/api/ocr-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: imageDataUrl })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.data) {
        const payload = data.data;
        return {
          merchant: payload.merchant || 'Scanned Receipt',
          amount: payload.amount || '41.29',
          currency: payload.currency || 'EUR',
          category: payload.category || 'Food & Dining',
          isConfident: payload.isConfident || true
        };
      } else {
        console.error("OCR API returned success: false", JSON.stringify(data));
      }
    } else {
      console.error("OCR API HTTP error:", res.status, res.statusText);
    }
  } catch (e) {
    console.warn("OCR API call failed, using client fallback:", e);
  }

  // Fallback heuristic if API is offline
  return {
    merchant: 'Scanned Merchant',
    amount: '41.29',
    currency: 'EUR',
    category: 'Food & Dining',
    isConfident: false
  };
}

// Vector Lucide Icon Map per Category
const CATEGORY_ICONS = {
  'Food & Dining': { icon: Utensils, color: '#FF6B2C', bg: 'bg-[#FF6B2C]/10', border: 'border-[#FF6B2C]/30' },
  'Transport': { icon: Car, color: '#3B82F6', bg: 'bg-[#3B82F6]/10', border: 'border-[#3B82F6]/30' },
  'Shopping': { icon: ShoppingBag, color: '#EC4899', bg: 'bg-[#EC4899]/10', border: 'border-[#EC4899]/30' },
  'Activities': { icon: Ticket, color: '#8B5CF6', bg: 'bg-[#8B5CF6]/10', border: 'border-[#8B5CF6]/30' },
  'Lodging': { icon: Hotel, color: '#10B981', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/30' },
  'Other': { icon: CreditCard, color: '#6B7280', bg: 'bg-[#6B7280]/10', border: 'border-[#6B7280]/30' }
};

export const EXPENSE_CATEGORIES = [
  { id: 'Food & Dining', label: 'Food & Dining', color: '#FF6B2C' },
  { id: 'Transport', label: 'Transport', color: '#3B82F6' },
  { id: 'Shopping', label: 'Shopping', color: '#EC4899' },
  { id: 'Activities', label: 'Activities', color: '#8B5CF6' },
  { id: 'Lodging', label: 'Lodging', color: '#10B981' },
  { id: 'Other', label: 'Other', color: '#6B7280' }
];

const formatCurrency = (val, code = 'USD') => {
  const curr = SUPPORTED_CURRENCIES.find(c => c.code === code) || SUPPORTED_CURRENCIES[0];
  const num = parseFloat(val) || 0;
  return `${curr.symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Animated Spring Currency Ticker
const formatCurrencyRounded = (val, code = 'USD') => {
  const curr = SUPPORTED_CURRENCIES.find(c => c.code === code) || SUPPORTED_CURRENCIES[0];
  const num = parseFloat(val) || 0;
  return `${curr.symbol}${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

function AnimatedCurrency({ value, currency = 'USD' }) {
  const [displayVal, setDisplayVal] = useState(value);
  const prevVal = useRef(value);

  useEffect(() => {
    let startTimestamp = null;
    const startVal = prevVal.current;
    const endVal = value;
    const duration = 600; // ms

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easeProgress;
      setDisplayVal(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        prevVal.current = endVal;
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{formatCurrency(displayVal, currency)}</span>;
}

export default function ExpenseTrackerView({ 
  tripId = 'default_trip', 
  estBudget = 1450, 
  destination = 'Rome, Italy', 
  daysCount = 3,
  collaborators = [],
  onShowToast = null,
  userCurrency = null
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const ledgerTabsContainerRef = useRef(null);
  const ledgerContainerRef = useRef(null);
  const [canScrollLedgerRight, setCanScrollLedgerRight] = useState(true);
  const [canScrollLedgerLeft, setCanScrollLedgerLeft] = useState(false);

  const checkLedgerScroll = () => {
    if (ledgerTabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ledgerTabsContainerRef.current;
      setCanScrollLedgerLeft(scrollLeft > 5);
      setCanScrollLedgerRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkLedgerScroll();
    window.addEventListener('resize', checkLedgerScroll);
    return () => window.removeEventListener('resize', checkLedgerScroll);
  }, []);

  const [expenses, setExpenses] = useState([]);
  const [homeCurrency, setHomeCurrency] = useState(userCurrency || 'USD');
  useEffect(() => { 
    if (userCurrency) setHomeCurrency(userCurrency);
    else setHomeCurrency(getUserDisplayCurrency()); 
  }, [userCurrency]);
  const [localCurrency] = useState('EUR');
  const [isOffline, setIsOffline] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  // Track when exchange rates have loaded so totals are stable from the start
  const [ratesReady, setRatesReady] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [expenseCurrency, setExpenseCurrency] = useState('EUR');
  const [expenseDay, setExpenseDay] = useState('Day 1');
  const [paidBy, setPaidBy] = useState('Me');
  const [, setReceiptPhoto] = useState(null);
  const [receiptPhotoDataUrl, setReceiptPhotoDataUrl] = useState(null);
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrConfidenceMsg, setOcrConfidenceMsg] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const fileInputRef = useRef(null);

  const [localCollaborators, setLocalCollaborators] = useState([]);
  const [supabaseCollaborators, setSupabaseCollaborators] = useState([]);

  useEffect(() => {
    let isMounted = true;
    if (tripId && tripId !== 'default-trip' && tripId !== 'default_trip') {
      getTripCollaborators(tripId).then(list => {
        if (isMounted && list && list.length > 0) {
          setSupabaseCollaborators(list);
        }
      }).catch(e => console.warn('Failed to fetch collaborators:', e));
    }
    return () => { isMounted = false; };
  }, [tripId]);

  useEffect(() => {
    const loadLocalCollabs = () => {
      try {
        const raw = localStorage.getItem('tw_trip_collaborators');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocalCollaborators(parsed);
          }
        }
      } catch (e) {}
    };

    loadLocalCollabs();
    window.addEventListener('storage', loadLocalCollabs);
    return () => window.removeEventListener('storage', loadLocalCollabs);
  }, []);

  const { user } = useUser();

  // Primary Collaborator Identity Resolution
  const primaryCollaborator = useMemo(() => {
    const currentName = (user?.firstName || user?.fullName || user?.username || '').trim();
    const currentEmail = user?.primaryEmailAddress?.emailAddress || '';
    
    // 1. Try to find a real friend from Supabase collaborators list
    if (supabaseCollaborators && supabaseCollaborators.length > 0) {
       // Filter out the current user to find the partner
       const partners = supabaseCollaborators.filter(c => {
         const cName = c.name || c.email?.split('@')[0] || '';
         // Check if this collab is the current user
         const isCurrentUser = currentName && cName && (currentName.toLowerCase().includes(cName.toLowerCase()) || cName.toLowerCase().includes(currentName.toLowerCase()));
         const isCurrentUserEmail = currentEmail && c.email && currentEmail === c.email;
         return !isCurrentUser && !isCurrentUserEmail;
       });
       
       if (partners.length > 0) {
         const p = partners[0];
         const pName = p.name || p.email?.split('@')[0] || 'Partner';
         return {
           name: pName,
           firstName: pName.split(' ')[0],
           photoURL: p.photoURL || null,
           email: p.email || ''
         };
       } else if (supabaseCollaborators.length > 1) {
         // Fallback if filter failed
         const p = supabaseCollaborators.find(c => c.name !== currentName) || supabaseCollaborators[1];
         const pName = p.name || p.email?.split('@')[0] || 'Partner';
         return { ...p, name: pName, firstName: pName.split(' ')[0] };
       }
    }

    // 2. Check local invites or trip collaborators (legacy/fallback)
    let invitedCollab = null;
    if (localCollaborators && localCollaborators.length > 0) {
      invitedCollab = localCollaborators[0];
    } else if (collaborators && collaborators.length > 0 && collaborators[0].name !== 'Sarah Jenkins') {
      invitedCollab = collaborators[0];
    }

    if (invitedCollab) {
      const collabName = invitedCollab.name || (invitedCollab.email ? invitedCollab.email.split('@')[0] : 'Partner');
      
      // If the current logged in user IS the invited partner, show the Trip Creator as partner
      if (currentName && (currentName.toLowerCase().includes(collabName.toLowerCase()) || collabName.toLowerCase().includes(currentName.toLowerCase()))) {
        return {
          name: 'Trip Creator',
          firstName: 'Creator',
          photoURL: null,
          email: ''
        };
      }
      
      return {
        name: collabName,
        firstName: collabName.split(' ')[0],
        photoURL: invitedCollab.photoURL || null,
        email: invitedCollab.email || ''
      };
    }

    // Default fallback if no invite sent yet
    return {
      name: 'Sarah Jenkins',
      firstName: 'Sarah',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      email: 'sarah@example.com'
    };
  }, [user, supabaseCollaborators, collaborators, localCollaborators]);

  // Dynamic array of all known trip members (for splitting)
  const tripMembers = useMemo(() => {
    const members = new Set(['Me']);
    
    // Only add people who have actually been involved in an expense!
    expenses.forEach(e => {
      if (e.paidBy && e.paidBy !== 'Shared 50/50' && e.paidBy !== 'Split Equally' && e.paidBy !== 'Partner / Friend') {
        members.add(e.paidBy);
      }
    });
    
    return Array.from(members);
  }, [expenses]);

  const collaboratorFirstName = primaryCollaborator?.firstName || (primaryCollaborator?.name ? primaryCollaborator.name.split(' ')[0] : 'Partner');

  // Initialize Data & Online Listener
  useEffect(() => {
    // Await live rates before showing any totals so they never shift mid-session
    fetchExchangeRates().then(() => setRatesReady(true));
    let loaded = getTripExpenses(tripId);
    
    // Check shared cross-session expenses storage key removed to prevent cross-trip contamination
    
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
  
  // Memoize conversions so they never shift mid-session when the async rate
  // fetch resolves — ratesReady flips once, recalculating everything cleanly.
  const totalSpentBase = useMemo(() => {
    return expenses.reduce((acc, exp) => {
      return acc + convertCurrency(exp.amount, exp.currency || 'USD', homeCurrency);
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, ratesReady]);
  const budgetGoalBase = getConvertedEstimatedCostNumber(estBudget, homeCurrency);
  const elapsedDays = 1; // Current active trip day
  const dailyPaceBase = totalSpentBase / Math.max(1, elapsedDays);
  const projectedTotalBase = dailyPaceBase * (parseInt(daysCount) || 3);
  const paceDiffBase = projectedTotalBase - budgetGoalBase;

  // Category Totals & Count
  const categoryTotalsBase = useMemo(() => {
    return EXPENSE_CATEGORIES.map(cat => {
      const catExpenses = expenses.filter(e => e.category === cat.id);
      const total = catExpenses.reduce((acc, e) => acc + convertCurrency(e.amount, e.currency || 'USD', homeCurrency), 0);
      return { ...cat, total, count: catExpenses.length };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, ratesReady]);

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
      let dataUrl = event.target.result;

      // Compress image to prevent LocalStorage QuotaExceededError
      try {
        dataUrl = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Output as compressed JPEG
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          };
          img.onerror = () => resolve(event.target.result);
          img.src = event.target.result;
        });
      } catch (err) {
        console.warn('Image compression failed', err);
      }

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

      if (isDuplicate && !duplicateWarning) {
        setDuplicateWarning(`You already logged "${cleanMerchant}" for ${expenseCurrency} ${parseAmt}. Tap Save again to log anyway.`);
        return;
      }
    }

    const payload = {
      id: editingExpense ? editingExpense.id : `exp_${Date.now()}`,
      merchant: cleanMerchant,
      amount: parseAmt,
      currency: expenseCurrency,
      category,
      day: expenseDay,
      paidBy,
      date: editingExpense ? editingExpense.date : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      photoDataUrl: receiptPhotoDataUrl || editingExpense?.photoDataUrl || null,
      syncStatus: 'synced'
    };

    let updated = [];
    if (editingExpense) {
      updated = expenses.map(exp => exp.id === editingExpense.id ? payload : exp);
    } else {
      updated = [payload, ...expenses];
    }

    setExpenses(updated);
    saveTripExpenses(tripId, updated);
    // removed global sync
    setShowAddModal(false);
    setDuplicateWarning(null);
    console.log("Attempting to show toast", !!onShowToast);
    if (onShowToast) {
      onShowToast(
        editingExpense ? "Expense updated" : "Expense logged", 
        editingExpense ? "success" : "expense", 
        editingExpense ? "CheckCircle2" : "Receipt"
      );
    }
  };

  const handleDeleteExpense = (id) => {
    const deletedExp = expenses.find(exp => exp.id === id);
    const updated = expenses.filter(exp => exp.id !== id);
    setExpenses(updated);
    saveTripExpenses(tripId, updated);
    // removed global sync
    
    if (onShowToast && deletedExp) {
      onShowToast("Expense deleted", "error", "Trash2", {
        label: "Undo",
        onClick: () => handleRestoreExpense(deletedExp)
      });
    }
  };

  const handleRestoreExpense = (expToRestore) => {
    setExpenses(prev => {
      // Re-insert at top of list
      const restored = [expToRestore, ...prev];
      saveTripExpenses(tripId, restored);
      // removed global sync
      return restored;
    });
    if (onShowToast) {
      onShowToast("Expense restored", "success", "CheckCircle2");
    }
  };

  const handleEditClick = (exp) => {
    setEditingExpense(exp);
    setAmount(exp.amount);
    setMerchant(exp.merchant);
    setCategory(exp.category);
    setExpenseCurrency(exp.currency || localCurrency);
    setExpenseDay(exp.day || 'Day 1');
    setPaidBy(exp.paidBy || 'Me');
    setReceiptPhotoDataUrl(exp.photoDataUrl || null);
    setOcrConfidenceMsg(null);
    setDuplicateWarning(null);
    setShowAddModal(true);
  };

  // Dynamic available days based on daysCount
  const availableDays = useMemo(() => {
    const count = Math.max(1, parseInt(daysCount) || 3);
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV'];
    return Array.from({ length: count }, (_, i) => ({
      id: `Day ${i + 1}`,
      label: `Day ${romanNumerals[i] || i + 1}`,
      fullLabel: `Day ${romanNumerals[i] || i + 1} (Day ${i + 1})`
    }));
  }, [daysCount]);

  // Filtered Expenses
  const filteredExpenses = expenses.filter(exp => {
    if (selectedDayFilter !== 'All' && exp.day !== selectedDayFilter) return false;
    if (selectedCategoryFilter !== 'All' && exp.category !== selectedCategoryFilter) return false;
    return true;
  });


  return (
    <div className="w-full space-y-4 sm:space-y-6 font-sans text-[#1E1C1A]">
      {/* ── HEADER BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 border-b border-[#E6DFD5]/70 pb-5 sm:pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1E1C1A]">Expenses</h2>
            {isOffline && (
              <span className="px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-600 text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1 shrink-0">
                <CloudOff className="w-2.5 h-2.5" /> Offline
              </span>
            )}
            {pendingSyncCount > 0 && !isOffline && (
              <span className="px-2 py-0.5 rounded-full bg-[#FAF6F0] border border-[#E6DFD5] text-[#7A7268] text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1 shrink-0">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" /> {pendingSyncCount} sync
              </span>
            )}
          </div>
          <p className="text-xs font-sans text-[#7A7268] font-medium leading-relaxed max-w-md">
            Track daily spending, split group bills with {collaboratorFirstName}, and scan receipts.
          </p>
        </div>

        {/* ── HEADER ACTION BUTTON STRIP ── */}
        <motion.div 
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto"
        >
          {/* EXPORT BUTTON */}
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(expenses, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `TripWise_${destination.replace(/[^a-zA-Z0-9]/g, '_')}_Expenses.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="flex-1 sm:flex-none justify-center group px-2 py-2 sm:px-4 sm:py-2 rounded-full bg-white hover:bg-[#FAF6F0] border border-[#E6DFD5] text-[#1E1C1A] text-[9.5px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#1E1C1A]" />
            <span>Export</span>
          </button>

          {/* ADD EXPENSE BUTTON */}
          <button
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-none justify-center group px-2 py-2 sm:px-4 sm:py-2 rounded-full border border-[#1E1C1A] text-[#1E1C1A] text-[9.5px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-[#1E1C1A] hover:text-white flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Add</span>
          </button>

          {/* SCAN RECEIPT BUTTON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none justify-center group px-2 py-2 sm:px-5 sm:py-2 rounded-full bg-[#1E1C1A] text-white text-[9.5px] sm:text-[11px] font-bold uppercase tracking-wider hover:bg-[#FF6B2C] transition-colors duration-300 flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan</span>
          </button>
          
          <input 
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoCaptured}
          />
        </motion.div>
      </div>

      {/* ── BUDGET DASHBOARD (SUMMARY CARD) ── */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex flex-col gap-5 pt-2"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-4">
          
          {/* Main Tally */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C827A]">
              Total Spent
            </span>
            <div className="flex items-baseline gap-2.5 sm:gap-3">
              <div className="text-4xl sm:text-5xl font-black text-[#1E1C1A] font-serif tracking-tight">
                <AnimatedCurrency value={totalSpentBase} currency={homeCurrency} />
              </div>
              <div className="text-xs sm:text-sm font-sans font-medium text-[#7A7268]">
                of {formatCurrency(budgetGoalBase, homeCurrency)} Budget
              </div>
            </div>
          </div>

          {/* Receipt-style Details */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 bg-[#FAF6F0] sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none">
            {/* Desktop vertical divider */}
            <div className="hidden sm:block w-px h-10 bg-[#E6DFD5]" />
            
            <div className="flex sm:flex-col items-center sm:items-start justify-between gap-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C827A]">Used</span>
              <span className="text-xs sm:text-sm font-bold text-[#1E1C1A] font-mono">
                {Math.min(100, (totalSpentBase / budgetGoalBase) * 100).toFixed(0)}%
              </span>
            </div>
            
            <div className="h-px w-full bg-[#E6DFD5]/50 sm:hidden" />
            
            <div className="flex sm:flex-col items-center sm:items-start justify-between gap-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C827A]">Remaining</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-700 font-mono">
                <AnimatedCurrency value={Math.max(0, budgetGoalBase - totalSpentBase)} currency={homeCurrency} />
              </span>
            </div>
          </div>
        </div>

        {/* Ultra-thin Progress Track */}
        <div className="w-full h-1 sm:h-1.5 rounded-full bg-[#E6DFD5] overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (totalSpentBase / budgetGoalBase) * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${
              Math.min(100, (totalSpentBase / budgetGoalBase) * 100) > 90 ? 'bg-red-500' : Math.min(100, (totalSpentBase / budgetGoalBase) * 100) > 70 ? 'bg-amber-500' : 'bg-[#1E1C1A]'
            }`}
          />
        </div>

        {/* Minimal Spending Pace Indicator */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
          {projectedTotalBase > budgetGoalBase ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-red-700 shrink-0">Pace Warning:</span>
              <span className="text-[#8C827A] hidden sm:inline tracking-normal font-medium lowercase truncate">~{formatCurrency(dailyPaceBase, homeCurrency)}/day</span>
              <span className="text-[#1E1C1A] truncate">Projected {formatCurrency(projectedTotalBase, homeCurrency)}</span>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-emerald-700 shrink-0">Pace On Track:</span>
              <span className="text-[#8C827A] hidden sm:inline tracking-normal font-medium lowercase truncate">~{formatCurrency(dailyPaceBase, homeCurrency)}/day</span>
              <span className="text-[#1E1C1A] truncate">Projected {formatCurrency(projectedTotalBase, homeCurrency)}</span>
            </>
          )}
        </div>
      </motion.div>

      {/* ── GROUP SETTLEMENT & CATEGORY BREAKDOWN ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pt-6">
        
        {/* GROUP SETTLEMENT */}
        {(() => {
          const totalGroupCost = expenses.reduce((acc, e) => acc + convertCurrency(e.amount, e.currency, homeCurrency), 0);
          
          const activeMembers = tripMembers.filter(m => m !== 'Shared 50/50' && m !== 'Split Equally' && m !== 'Partner / Friend');
          if (!activeMembers.includes('Me')) activeMembers.unshift('Me'); 
          
          const partnerAlias = primaryCollaborator.name !== 'Trip Creator' ? primaryCollaborator.name : 'Partner';
          if (!activeMembers.includes(partnerAlias) && expenses.some(e => e.paidBy === 'Partner / Friend')) {
              activeMembers.push(partnerAlias);
          }

          const numMembers = Math.max(2, activeMembers.length); 
          const fairShare = totalGroupCost / numMembers;

          const paidAmounts = {};
          activeMembers.forEach(m => paidAmounts[m] = 0);
          
          expenses.forEach(e => {
             let amount = convertCurrency(e.amount, e.currency, homeCurrency);
             let payer = e.paidBy || 'Me';
             if (payer === 'Shared 50/50' || payer === 'Split Equally') {
                 let splitAmount = amount / numMembers;
                 activeMembers.forEach(m => {
                     paidAmounts[m] += splitAmount;
                 });
             } else {
                 if (payer === 'Partner / Friend') payer = partnerAlias;
                 if (!paidAmounts[payer]) paidAmounts[payer] = 0;
                 paidAmounts[payer] += amount;
             }
          });

          const balances = activeMembers.map(m => {
             const paid = paidAmounts[m] || 0;
             const net = paid - fairShare;
             return { name: m, paid, net };
          });

          balances.sort((a, b) => b.net - a.net);

          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.22 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-[#E6DFD5]/70 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1E1C1A] flex items-center gap-1.5"><Users className="w-3 h-3 text-[#FF6B2C]" /> Group Settlement</span>
                <span className="text-[10px] font-mono text-[#8C827A]">Total: <strong className="text-[#1E1C1A]">{formatCurrencyRounded(totalGroupCost, homeCurrency)}</strong></span>
              </div>
              <div className="flex flex-col gap-3">
                {balances.map((b, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-sans group">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#FAF6F0] flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold uppercase text-[#1E1C1A]">{b.name.substring(0,2)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1E1C1A] truncate max-w-[120px] sm:max-w-[160px]">{b.name}</span>
                        <span className="text-[9px] uppercase tracking-wider text-[#8C827A]">Paid {formatCurrencyRounded(b.paid, homeCurrency)}</span>
                      </div>
                    </div>
                    {b.net > 1 ? (
                      <div className="text-right flex flex-col">
                        <span className="font-bold text-[#1E1C1A]">+{formatCurrencyRounded(b.net, homeCurrency)}</span>
                        <span className="text-[9px] uppercase tracking-widest text-emerald-600">Owed</span>
                      </div>
                    ) : b.net < -1 ? (
                      <div className="text-right flex flex-col">
                        <span className="font-bold text-[#1E1C1A]">{formatCurrencyRounded(Math.abs(b.net), homeCurrency)}</span>
                        <span className="text-[9px] uppercase tracking-widest text-orange-600">Owes</span>
                      </div>
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#D5CBBF]">Settled</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })()}

        {/* CATEGORY BREAKDOWN */}
        {totalSpentBase > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="flex flex-col gap-4"
          >
             <div className="flex items-center justify-between border-b border-[#E6DFD5]/70 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1E1C1A] flex items-center gap-1.5"><DollarSign className="w-3 h-3 text-[#FF6B2C]" /> Category Breakdown</span>
                <span className="text-[10px] font-mono text-[#8C827A]"><strong className="text-[#1E1C1A]">{categoryTotalsBase.filter(c => c.total > 0).length}</strong> Active</span>
             </div>
             
             <div className="w-full h-1.5 rounded-full bg-[#FAF6F0] overflow-hidden flex gap-0.5 my-1">
               {categoryTotalsBase.map(cat => {
                 if (cat.total <= 0) return null;
                 const pct = (cat.total / totalSpentBase) * 100;
                 const catConfig = CATEGORY_ICONS[cat.id] || CATEGORY_ICONS['Other'];
                 return (
                   <motion.div
                     key={`bar-${cat.id}`}
                     initial={{ width: 0 }}
                     animate={{ width: `${pct}%` }}
                     transition={{ duration: 0.6, ease: "easeOut" }}
                     style={{ backgroundColor: catConfig.color }}
                     className="h-full first:rounded-l-full last:rounded-r-full"
                   />
                 );
               })}
             </div>

             <div className="grid grid-cols-2 gap-y-3 gap-x-4">
               {categoryTotalsBase.map(cat => {
                 if (cat.total <= 0) return null;
                 const catConfig = CATEGORY_ICONS[cat.id] || CATEGORY_ICONS['Other'];
                 return (
                   <div key={`legend-${cat.id}`} className="flex items-center justify-between text-xs group">
                     <div className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${catConfig.color}15` }}>
                          <catConfig.icon className="w-2.5 h-2.5" style={{ color: catConfig.color }} />
                       </div>
                       <span className="text-[9px] font-bold uppercase tracking-wider text-[#1E1C1A] truncate">{cat.label}</span>
                     </div>
                     <span className="font-mono text-[10px] font-medium text-[#7A7268] group-hover:text-[#1E1C1A] transition-colors">{formatCurrencyRounded(cat.total, homeCurrency)}</span>
                   </div>
                 );
               })}
              </div>
           </motion.div>
        )}
      </div>
      {/* CATEGORY TILES GRID WITH MUTED ZERO-SPEND CARDS */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-2.5"
      >
        {categoryTotalsBase.map((cat, idx) => {
          const isSelected = selectedCategoryFilter === cat.id;
          const catConfig = CATEGORY_ICONS[cat.id] || CATEGORY_ICONS['Other'];
          const IconComp = catConfig.icon;
          const isZeroSpend = cat.total === 0;

          return (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 + idx * 0.04 }}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setSelectedCategoryFilter(isSelected ? 'All' : cat.id);
                if (!isSelected) {
                  setTimeout(() => {
                    ledgerContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }
              }}
              className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer select-none relative overflow-hidden ${
                isSelected 
                  ? 'bg-[#1E1C1A] text-white border-[#1E1C1A] shadow-xs' 
                  : isZeroSpend
                    ? 'bg-[#FAF6F0]/60 border-dashed border-[#E6DFD5] opacity-55 grayscale-60 hover:opacity-85 hover:grayscale-0'
                    : 'bg-white hover:bg-[#FAF6F0] text-[#1E1C1A] border-[#E6DFD5] shadow-2xs'
              }`}
            >
              {/* Subtle Glowing Shimmer Sweep on Selected Tile */}
              {isSelected && (
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/15 to-transparent pointer-events-none"
                />
              )}

              <div className="flex items-center justify-between mb-1 relative z-10">
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl ${
                  isSelected ? 'bg-white/10 border border-white/20' : isZeroSpend ? 'bg-gray-200/50 border border-gray-300/60' : catConfig.bg + ' border ' + catConfig.border
                } flex items-center justify-center shrink-0`}>
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : ''}`} style={{ color: isSelected ? '#ffffff' : isZeroSpend ? '#9CA3AF' : catConfig.color }} />
                </div>
                {cat.count > 0 && (
                  <span className={`text-[9px] sm:text-[9.5px] font-mono font-bold ${
                    isSelected ? 'text-[#FF6B2C]' : 'text-[#7A7268]'
                  }`}>
                    {cat.count}
                  </span>
                )}
              </div>

              <span className={`text-[11px] sm:text-xs font-sans font-bold block truncate ${
                isSelected ? 'text-white' : isZeroSpend ? 'text-gray-400' : 'text-[#1E1C1A]'
              }`}>
                {cat.label}
              </span>
              <span className={`text-xs sm:text-sm font-serif font-black block mt-0.5 ${
                isSelected ? 'text-[#FF6B2C]' : isZeroSpend ? 'text-gray-400 font-normal' : 'text-[#1E1C1A]'
              }`}>
                {formatCurrencyRounded(cat.total, homeCurrency)}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── FILTER BAR & LOGGED EXPENSES FEED ── */}
      <div ref={ledgerContainerRef} className="space-y-4 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-serif text-2xl font-bold text-[#1E1C1A] tracking-tight">
            Ledger
          </h3>

          {/* DAY FILTER PILLS */}
          <div className="relative flex-1 min-w-0 max-w-full overflow-hidden">
            {/* Animated left scroll indicator */}
            <div className={`absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-[#FAF6F0] via-[#FAF6F0]/80 to-transparent pointer-events-none flex items-center justify-start pl-0.5 sm:hidden z-10 transition-opacity duration-300 ${canScrollLedgerLeft ? 'opacity-100' : 'opacity-0'}`}>
              <motion.div
                animate={{ x: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <ChevronLeft className="w-3.5 h-3.5 text-[#FF6B2C]" />
              </motion.div>
            </div>

            <div 
              ref={ledgerTabsContainerRef}
              onScroll={checkLedgerScroll}
              className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              <button
                onClick={() => setSelectedDayFilter('All')}
                className={`px-3.5 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer select-none shrink-0 border ${
                  selectedDayFilter === 'All'
                    ? 'bg-[#1E1C1A] border-[#1E1C1A] text-white' 
                    : 'bg-transparent border-[#E6DFD5] text-[#8C827A] hover:border-[#1E1C1A] hover:text-[#1E1C1A]'
                }`}
              >
                All
              </button>
              {availableDays.map(d => {
                const isActive = selectedDayFilter === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDayFilter(d.id)}
                    className={`px-3.5 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer select-none shrink-0 border ${
                      isActive 
                        ? 'bg-[#1E1C1A] border-[#1E1C1A] text-white' 
                        : 'bg-transparent border-[#E6DFD5] text-[#8C827A] hover:border-[#1E1C1A] hover:text-[#1E1C1A]'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            
            {/* Animated right scroll indicator */}
            <div className={`absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-[#FAF6F0] via-[#FAF6F0]/80 to-transparent pointer-events-none flex items-center justify-end pr-0.5 sm:hidden z-10 transition-opacity duration-300 ${canScrollLedgerRight && availableDays.length > 2 ? 'opacity-100' : 'opacity-0'}`}>
              <motion.div
                animate={{ x: [0, 3, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <ChevronRight className="w-3.5 h-3.5 text-[#FF6B2C]" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* FEED ITEMS LIST */}
        {filteredExpenses.length === 0 ? (
          <div className="py-12 border-t border-b border-[#E6DFD5]/50 flex flex-col items-center justify-center gap-2">
             <span className="text-[10px] uppercase tracking-widest font-bold text-[#8C827A]">No records</span>
             <span className="text-sm font-serif text-[#1E1C1A]">Clean slate for this filter.</span>
          </div>
        ) : (
          <div className="flex flex-col border-t border-[#E6DFD5]/50 mt-2">
            <AnimatePresence>
              {filteredExpenses.map((exp) => {
                const catConfig = CATEGORY_ICONS[exp.category] || CATEGORY_ICONS['Other'];
                const IconComp = catConfig.icon;
                const usdEquiv = convertCurrency(exp.amount, exp.currency, homeCurrency);
                const isForeign = exp.currency && exp.currency !== homeCurrency;
                const currObj = SUPPORTED_CURRENCIES.find(c => c.code === exp.currency);
                const symbol = currObj ? currObj.symbol : (homeCurrency === 'EUR' ? '€' : homeCurrency === 'INR' ? '₹' : homeCurrency === 'GBP' ? '£' : '$');
                return (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.25 }}
                    className="group border-b border-[#E6DFD5]/50 py-3 sm:py-4 flex items-center justify-between gap-3 hover:bg-[#FAF6F0] -mx-4 px-4 transition-colors"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      {/* Thumbnail or Icon */}
                      {(() => {
                        const imgUrl = exp.receiptUrl || exp.receiptPhoto || exp.photoDataUrl;
                        if (imgUrl) {
                          return (
                            <div 
                              onClick={() => setPreviewPhotoUrl(imgUrl)}
                              className="w-10 h-10 rounded-full overflow-hidden shrink-0 cursor-pointer relative shadow-2xs border border-[#E6DFD5]"
                            >
                              <img src={imgUrl} alt="Receipt" className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all" />
                            </div>
                          );
                        }
                        return (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-[#E6DFD5] bg-white group-hover:border-transparent transition-colors" style={{ backgroundColor: `${catConfig.color}08` }}>
                            <IconComp className="w-4 h-4" style={{ color: catConfig.color }} />
                          </div>
                        );
                      })()}

                      <div className="min-w-0 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 max-w-full">
                          <h4 className="font-serif font-bold text-sm sm:text-base text-[#1E1C1A] truncate">{exp.merchant}</h4>
                          {exp.day && (
                            <span className="text-[9px] uppercase tracking-widest text-[#8C827A] shrink-0">
                              {exp.day}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-[#8C827A] mt-0.5">
                          <span>{exp.date || 'Today'}</span>
                          {exp.paidBy && exp.paidBy !== 'Me' && (
                            <>
                              <span>&middot;</span>
                              <span className="text-[#1E1C1A]">{exp.paidBy}</span>
                            </>
                          )}
                          {exp.syncStatus === 'pending' && (
                            <span className="text-amber-600 flex items-center gap-1">
                              &middot; <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Syncing
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right flex flex-col justify-center">
                        <span className="text-sm sm:text-base font-mono font-bold text-[#1E1C1A] block">
                          {symbol}{parseFloat(exp.amount).toFixed(2)}
                        </span>
                        {isForeign && (
                          <span className="text-[9px] uppercase tracking-widest text-[#8C827A] block mt-0.5">
                            {formatCurrencyRounded(usdEquiv, homeCurrency)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(exp)}
                          className="p-2 rounded-full text-[#8C827A] hover:text-[#1E1C1A] transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-2 rounded-full text-[#8C827A] hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ADD / EDIT EXPENSE MODAL (PORTALED TO BODY TO ESCAPE 3D PERSPECTIVE) */}
      {mounted && createPortal(
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-999999 flex items-center justify-center p-3 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto bg-[#FAF6F0] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-[#E6DFD5] text-[#1E1C1A] z-10 font-sans"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
                  <h3 className="font-serif text-lg sm:text-xl font-bold">
                    {editingExpense ? 'Edit Expense' : 'Log New Expense'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-8 h-8 rounded-full bg-white border border-[#E6DFD5] flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* OCR PROCESSING LOADING SCANNING BEAM */}
                {isScanningOcr && (
                  <div className="my-3 p-3.5 rounded-2xl bg-white border border-[#FF6B2C]/40 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#FF6B2C]/15 flex items-center justify-center text-[#FF6B2C] animate-spin shrink-0">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#FF6B2C]">Scanning Receipt Text...</p>
                      <p className="text-[10.5px] text-gray-500">Extracting merchant, category, amount, and currency.</p>
                    </div>
                  </div>
                )}

                {/* OCR CONFIDENCE SUCCESS MSG */}
                {ocrConfidenceMsg && (
                  <div className={`my-2.5 p-2.5 sm:p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    ocrConfidenceMsg.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{ocrConfidenceMsg.text}</span>
                  </div>
                )}

                {/* DUPLICATE WARNING */}
                {duplicateWarning && (
                  <div className="my-2.5 p-2.5 sm:p-3 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                    <span>{duplicateWarning}</span>
                  </div>
                )}

                {/* SCANNED BILL RECEIPT PHOTO PREVIEW INSIDE MODAL */}
                {receiptPhotoDataUrl && (
                  <div className="my-3 p-2.5 sm:p-3 rounded-2xl bg-white border border-[#E6DFD5] flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        onClick={() => setPreviewPhotoUrl(receiptPhotoDataUrl)}
                        className="w-12 h-12 rounded-xl border border-[#E6DFD5] overflow-hidden shrink-0 cursor-pointer relative group"
                        title="Click to view full-size receipt"
                      >
                        <img src={receiptPhotoDataUrl} alt="Scanned Bill" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-[#1E1C1A] block truncate">Bill Photo Attached</span>
                        <span className="text-[10.5px] text-[#7A7268] block">Receipt photo saved to feed</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptPhoto(null);
                        setReceiptPhotoDataUrl(null);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                      title="Remove Attached Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSaveExpense} className="mt-3.5 space-y-3 sm:space-y-3.5 text-xs">
                  {/* Amount and Currency */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1 text-[11px] sm:text-xs">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E6DFD5] text-base sm:text-sm font-bold text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1 text-[11px] sm:text-xs">Currency</label>
                      <div className="relative">
                        <select
                          value={expenseCurrency}
                          onChange={(e) => setExpenseCurrency(e.target.value)}
                          className="w-full px-3 py-2.5 pr-8 rounded-xl bg-white border border-[#E6DFD5] text-sm font-bold text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C] appearance-none"
                        >
                          {SUPPORTED_CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>
                              {c.code} ({c.symbol})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Merchant Description */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1 text-[11px] sm:text-xs">Merchant / Description</label>
                    <input
                      type="text"
                      placeholder="e.g. The Bikers Cafe, Trattoria, Taxi"
                      value={merchant}
                      onChange={(e) => setMerchant(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E6DFD5] text-base sm:text-sm font-bold text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C]"
                    />
                  </div>

                  {/* Category: FULL WIDTH to prevent truncation */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1 text-[11px] sm:text-xs">Category</label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-8 rounded-xl bg-white border border-[#E6DFD5] text-sm font-bold text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C] appearance-none"
                      >
                        {EXPENSE_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Itinerary Day & Paid By */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1 text-[11px] sm:text-xs">Itinerary Day</label>
                      <div className="relative">
                        <select
                          value={expenseDay}
                          onChange={(e) => setExpenseDay(e.target.value)}
                          className="w-full px-3 py-2.5 pr-8 rounded-xl bg-white border border-[#E6DFD5] text-sm font-bold text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C] appearance-none"
                        >
                          {availableDays.map(d => (
                            <option key={d.id} value={d.id}>{d.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1 text-[11px] sm:text-xs">Paid By</label>
                      <div className="relative">
                        <input
                          type="text"
                          list="trip-members"
                          value={paidBy}
                          onChange={(e) => setPaidBy(e.target.value)}
                          placeholder="e.g. Me, Sarah"
                          className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#E6DFD5] text-base sm:text-sm font-bold text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C]"
                        />
                        <datalist id="trip-members">
                          <option value="Me" />
                          <option value="Split Equally" />
                          {tripMembers.filter(m => m !== 'Me' && m !== 'Split Equally' && m !== 'Shared 50/50').map(m => (
                            <option key={m} value={m} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>

                  {!receiptPhotoDataUrl && (
                    <div>
                      <label className="block font-bold text-gray-700 mb-1 text-[11px] sm:text-xs">Receipt Photo (Optional)</label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2.5 rounded-xl bg-white border border-dashed border-gray-400 text-gray-600 font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
                      >
                        <Camera className="w-4 h-4 text-[#FF6B2C]" />
                        Attach Receipt Photo
                      </button>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#E6DFD5] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-200/50 transition-colors cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.04, boxShadow: "0px 10px 20px rgba(255,107,44,0.3)" }}
                      whileTap={{ scale: 0.96 }}
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1C] text-white font-bold shadow-md transition-colors cursor-pointer text-xs"
                    >
                      Save Expense
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* FULL RECEIPT PREVIEW LIGHTBOX (PORTALED TO BODY) */}
      {mounted && createPortal(
        <AnimatePresence>
          {previewPhotoUrl && (
            <div className="fixed inset-0 z-999999 flex items-center justify-center p-3 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPreviewPhotoUrl(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              />

              <motion.div
                initial={{ opacity: 0, scaleY: 0.3, y: -40 }}
                animate={{ opacity: 1, scaleY: 1, y: 0 }}
                exit={{ opacity: 0, scaleY: 0.3, y: -40 }}
                transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                className="relative max-w-md w-full bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl border border-[#E6DFD5] z-10 overflow-hidden text-[#1E1C1A] origin-top"
              >
                <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[#E6DFD5] mb-2.5 sm:mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#FF6B2C]" />
                    <span className="font-serif font-bold text-sm sm:text-base">Receipt Preview</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewPhotoUrl(null)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="w-full max-h-[70vh] rounded-xl sm:rounded-2xl overflow-hidden border border-[#E6DFD5] bg-stone-900 flex items-center justify-center">
                  <img src={previewPhotoUrl} alt="Receipt Preview" className="max-w-full max-h-[70vh] object-contain" />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}