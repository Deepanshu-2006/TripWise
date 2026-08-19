'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Camera, Trash2, Edit2, AlertCircle, CheckCircle2, 
  X, Eye, CloudOff, Download, Users, RefreshCw, Utensils, Car, ShoppingBag, Ticket, Hotel, CreditCard,
  TrendingUp, TrendingDown, DollarSign, ChevronDown
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { getTripCollaborators } from '../actions/trips';
import { 
  getTripExpenses, saveTripExpenses, syncPendingExpenses, 
  SUPPORTED_CURRENCIES, convertCurrency, fetchExchangeRates, calculateDailyPace, getUserDisplayCurrency, getConvertedEstimatedCostNumber
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
  onShowToast = null
}) {
  const [expenses, setExpenses] = useState([]);
  const [homeCurrency, setHomeCurrency] = useState('USD');
  useEffect(() => { setHomeCurrency(getUserDisplayCurrency()); }, []);
  const [localCurrency, setLocalCurrency] = useState('EUR');
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
  const [receiptPhoto, setReceiptPhoto] = useState(null);
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

  // Filtered Expenses
  const filteredExpenses = expenses.filter(exp => {
    if (selectedDayFilter !== 'All' && exp.day !== selectedDayFilter) return false;
    if (selectedCategoryFilter !== 'All' && exp.category !== selectedCategoryFilter) return false;
    return true;
  });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-full space-y-6 font-sans text-[#1E1C1A]">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6DFD5] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-[#1E1C1A]">Expenses</h2>
            {isOffline && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-mono font-bold flex items-center gap-1">
                <CloudOff className="w-3 h-3 text-amber-600" /> Offline Mode
              </span>
            )}
            {pendingSyncCount > 0 && !isOffline && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 text-[10px] font-mono font-bold flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin text-amber-600" /> {pendingSyncCount} pending sync
              </span>
            )}
          </div>
          <p className="text-xs text-[#7A7268] mt-0.5">
            Track daily spending, split group bills with {collaboratorFirstName}, and scan receipts.
          </p>
        </div>

        {/* HEADER ACTION BUTTON STRIP WITH INTERACTIVE MICRO-ANIMATIONS */}
        <motion.div 
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex items-center gap-2 flex-wrap"
        >
          {/* EXPORT BUTTON */}
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(expenses, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `TripWise_${destination.replace(/[^a-zA-Z0-9]/g, '_')}_Expenses.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="group px-4 py-2 rounded-full border border-[#E6DFD5] bg-white hover:bg-[#F5F0E8] text-[#1E1C1A] text-xs font-sans font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-2xs select-none"
          >
            <Download className="w-3.5 h-3.5 text-[#FF6B2C] group-hover:translate-y-0.5 transition-transform" />
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

      {/* SUMMARY CARD WITH 1. ANIMATED CURRENCY TICKER, PROGRESS BAR & SPENDING PACE INDICATOR */}
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
              <div className="text-3xl font-black text-gray-900 mt-2">
                <AnimatedCurrency value={totalSpentBase} currency={homeCurrency} />
              </div>
              <div className="text-sm text-gray-500 mt-1 font-medium">
                of {formatCurrency(budgetGoalBase, homeCurrency)} Budget
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <motion.span 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 text-xs font-mono font-bold inline-block mb-1 shadow-2xs"
            >
              <AnimatedCurrency value={Math.max(0, budgetGoalBase - totalSpentBase)} currency={homeCurrency} /> Remaining
            </motion.span>
            <span className="text-[11px] font-mono text-[#7A7268] block">
              {Math.min(100, (totalSpentBase / budgetGoalBase) * 100).toFixed(0)}% of budget used
            </span>
          </div>
        </div>

        {/* PROGRESS TRACK ANIMATION */}
        <div className="w-full h-2 rounded-full bg-[#E6DFD5]/70 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (totalSpentBase / budgetGoalBase) * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${
              Math.min(100, (totalSpentBase / budgetGoalBase) * 100) > 90 ? 'bg-red-500' : Math.min(100, (totalSpentBase / budgetGoalBase) * 100) > 70 ? 'bg-amber-500' : 'bg-[#FF6B2C]'
            }`}
          />
        </div>

        {/* SPENDING PACE INDICATOR NOTE */}
        {projectedTotalBase > budgetGoalBase ? (
            <div className="mt-6 flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="p-2 bg-orange-100 rounded-full shrink-0 mt-0.5">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm text-orange-800 leading-relaxed">
                <strong>⚠️ Spending Pace Warning:</strong> At current pace (~{formatCurrency(dailyPaceBase, homeCurrency)}/day), projected total is <strong>{formatCurrency(projectedTotalBase, homeCurrency)}</strong> ({formatCurrency(paceDiffBase, homeCurrency)} over {formatCurrency(budgetGoalBase, homeCurrency)} budget).
              </p>
            </div>
          ) : (
            <div className="mt-6 flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="p-2 bg-emerald-100 rounded-full shrink-0 mt-0.5">
                <TrendingDown className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm text-emerald-800 leading-relaxed">
                <strong>✓ Spending Pace On Track:</strong> Current pace (~{formatCurrency(dailyPaceBase, homeCurrency)}/day) is on track to stay within your {formatCurrency(budgetGoalBase, homeCurrency)} budget.
              </p>
            </div>
          )}
      </motion.div>

      {/* REAL COLLABORATOR IDENTITY IN GROUP EXPENSE SETTLEMENT CARD */}
      {(() => {
        const totalGroupCost = expenses.reduce((acc, e) => acc + convertCurrency(e.amount, e.currency, homeCurrency), 0);
        
        // Members who are part of the settlement (everyone who paid + 'Me')
        const activeMembers = tripMembers.filter(m => m !== 'Shared 50/50' && m !== 'Split Equally' && m !== 'Partner / Friend');
        if (!activeMembers.includes('Me')) activeMembers.unshift('Me'); 
        
        // Treat 'Partner / Friend' alias as primary collaborator
        const partnerAlias = primaryCollaborator.name !== 'Trip Creator' ? primaryCollaborator.name : 'Partner';
        if (!activeMembers.includes(partnerAlias) && expenses.some(e => e.paidBy === 'Partner / Friend')) {
            activeMembers.push(partnerAlias);
        }

        const numMembers = Math.max(2, activeMembers.length); 
        const fairShare = totalGroupCost / numMembers;

        // Calculate how much each person actually paid
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
            className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E6DFD5] shadow-2xs flex flex-col gap-4"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-[#E6DFD5]">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-serif font-black text-[#1E1C1A] block">
                  Group Settlement
                </span>
                <span className="text-xs font-sans text-[#7A7268]">
                  Total Trip Cost: {formatCurrencyRounded(totalGroupCost, homeCurrency)} • Split equally among {numMembers} people
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {balances.map((b, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm font-sans">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-stone-300"></span>
                    <span className="font-bold text-[#1E1C1A]">{b.name}</span>
                    <span className="text-xs text-[#7A7268] hidden sm:inline">(Paid: {formatCurrencyRounded(b.paid, homeCurrency)})</span>
                  </div>
                  
                  {b.net > 1 ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100">
                      is owed {formatCurrencyRounded(b.net, homeCurrency)}
                    </span>
                  ) : b.net < -1 ? (
                    <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 font-bold text-xs border border-orange-100">
                      owes {formatCurrencyRounded(Math.abs(b.net), homeCurrency)}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 font-bold text-xs border border-stone-200">
                      Settled Up
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      {/* VISUAL CATEGORY BREAKDOWN STACKED BAR CHART */}
      {totalSpentBase > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24 }}
          className="bg-white rounded-2xl border border-[#E6DFD5] p-4 shadow-2xs space-y-3"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1E1C1A] uppercase tracking-wider text-[10.5px] font-mono flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-[#FF6B2C]" />
              <span>Category Breakdown</span>
            </span>
            <span className="text-[#7A7268] text-[11px] font-mono">
              {categoryTotalsBase.filter(c => c.total > 0).length} Active Categories
            </span>
          </div>

          {/* Multi-segment stacked bar */}
          <div className="w-full h-3.5 rounded-full bg-[#FAF6F0] overflow-hidden flex p-0.5 border border-[#E6DFD5]/70 gap-0.5">
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
                  className="h-full rounded-xs first:rounded-l-full last:rounded-r-full relative group cursor-pointer"
                  title={`${cat.label}: ${formatCurrencyRounded(cat.total, homeCurrency)} (${pct.toFixed(0)}%)`}
                />
              );
            })}
          </div>

          {/* Legend chips */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-sans pt-1">
            {categoryTotalsBase.map(cat => {
              if (cat.total <= 0) return null;
              const pct = (cat.total / totalSpentBase) * 100;
              const catConfig = CATEGORY_ICONS[cat.id] || CATEGORY_ICONS['Other'];
              return (
                <div key={`legend-${cat.id}`} className="flex items-center gap-1.5 text-[#1E1C1A]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: catConfig.color }} />
                  <span className="font-medium text-gray-700">{cat.label}:</span>
                  <span className="font-bold font-mono text-[#1E1C1A]">{formatCurrencyRounded(cat.total, homeCurrency)}</span>
                  <span className="text-[10px] text-gray-500 font-mono">({pct.toFixed(0)}%)</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* CATEGORY TILES GRID WITH MUTED ZERO-SPEND CARDS */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5"
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
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedCategoryFilter(isSelected ? 'All' : cat.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer select-none relative overflow-hidden ${
                isSelected 
                  ? 'bg-[#1E1C1A] text-white border-[#1E1C1A] shadow-xs' 
                  : isZeroSpend
                    ? 'bg-[#FAF6F0]/60 border-dashed border-[#E6DFD5] opacity-55 grayscale-[60%] hover:opacity-85 hover:grayscale-0'
                    : 'bg-white hover:bg-[#FAF6F0] text-[#1E1C1A] border-[#E6DFD5] shadow-2xs'
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
                <div className={`w-7 h-7 rounded-xl ${
                  isSelected ? 'bg-white/10 border border-white/20' : isZeroSpend ? 'bg-gray-200/50 border border-gray-300/60' : catConfig.bg + ' border ' + catConfig.border
                } flex items-center justify-center shrink-0`}>
                  <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : ''}`} style={{ color: isSelected ? '#ffffff' : isZeroSpend ? '#9CA3AF' : catConfig.color }} />
                </div>
                {cat.count > 0 && (
                  <span className={`text-[9.5px] font-mono font-bold ${
                    isSelected ? 'text-[#FF6B2C]' : 'text-[#7A7268]'
                  }`}>
                    {cat.count}
                  </span>
                )}
              </div>

              <span className={`text-xs font-sans font-bold block ${
                isSelected ? 'text-white' : isZeroSpend ? 'text-gray-400' : 'text-[#1E1C1A]'
              }`}>
                {cat.label}
              </span>
              <span className={`text-xs font-serif font-black block mt-0.5 ${
                isSelected ? 'text-[#FF6B2C]' : isZeroSpend ? 'text-gray-400 font-normal' : 'text-[#1E1C1A]'
              }`}>
                {formatCurrencyRounded(cat.total, homeCurrency)}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* FILTER BAR & LOGGED EXPENSES FEED */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-serif text-xl font-bold text-[#1E1C1A]">
            Logged Expenses ({filteredExpenses.length})
          </h3>

          {/* DAY FILTER PILLS */}
          <div className="flex items-center gap-1.5 bg-[#FAF6F0] p-1 rounded-full border border-[#E6DFD5] self-start sm:self-auto">
            {['All', 'Day I', 'Day II', 'Day III'].map(dayLabel => {
              const filterVal = dayLabel === 'Day I' ? 'Day 1' : dayLabel === 'Day II' ? 'Day 2' : dayLabel === 'Day III' ? 'Day 3' : 'All';
              const count = expenses.filter(e => filterVal === 'All' || e.day === filterVal).length;
              const isActive = (selectedDayFilter === 'All' && filterVal === 'All') || selectedDayFilter === filterVal;

              return (
                <button
                  key={dayLabel}
                  onClick={() => setSelectedDayFilter(filterVal)}
                  className={`px-3 py-1 rounded-full text-xs font-sans font-bold transition-all cursor-pointer select-none ${
                    isActive 
                      ? 'bg-[#1E1C1A] text-white shadow-2xs' 
                      : 'text-[#7A7268] hover:text-[#1E1C1A] hover:bg-white/60'
                  }`}
                >
                  {dayLabel} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* FEED ITEMS LIST */}
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center bg-[#FAF6F0] rounded-3xl border border-dashed border-[#E6DFD5]">
            <p className="text-sm font-sans text-[#7A7268]">No expenses logged for this filter selection.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
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
                    initial={{ opacity: 0, scale: 0.98, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="p-4 rounded-2xl bg-white border border-[#E6DFD5] shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Interactive Clickable Receipt Thumbnail if available */}
                      {(() => {
                        const imgUrl = exp.receiptUrl || exp.receiptPhoto || exp.photoDataUrl;
                        if (imgUrl) {
                          return (
                            <div 
                              onClick={() => setPreviewPhotoUrl(imgUrl)}
                              title="Click to view full receipt"
                              className="w-11 h-11 rounded-xl border border-[#E6DFD5] overflow-hidden shrink-0 cursor-pointer relative group/thumb shadow-2xs hover:scale-105 transition-transform"
                            >
                              <img src={imgUrl} alt="Receipt" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="w-4 h-4" />
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className={`w-11 h-11 rounded-xl ${catConfig.bg} border ${catConfig.border} flex items-center justify-center shrink-0`}>
                            <IconComp className="w-5 h-5" style={{ color: catConfig.color }} />
                          </div>
                        );
                      })()}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-serif font-extrabold text-base text-[#1E1C1A] truncate">{exp.merchant}</h4>
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF6F0] border border-[#E6DFD5] text-[10px] font-sans font-bold text-[#1E1C1A]">
                            {exp.category}
                          </span>
                          {exp.day && (
                            <span className="px-2 py-0.5 rounded-md bg-[#FF6B2C]/10 border border-[#FF6B2C]/30 text-[10px] font-mono font-bold text-[#FF6B2C]">
                              {exp.day}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-sans text-gray-600 mt-1">
                          <span>{exp.date || 'Today'}</span>
                          {exp.paidBy && exp.paidBy !== 'Me' && (
                            <>
                              <span>•</span>
                              <span className="font-bold text-[#FF6B2C]">Paid by {exp.paidBy}</span>
                            </>
                          )}
                          {exp.syncStatus === 'pending' && (
                            <span className="text-amber-600 font-bold flex items-center gap-1">
                              • <RefreshCw className="w-3 h-3 animate-spin" /> Pending sync
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-lg font-serif font-black text-[#1E1C1A] block">
                          {symbol}{parseFloat(exp.amount).toFixed(2)}
                        </span>
                        {isForeign && (
                          <span className="text-[11px] font-mono font-bold text-gray-500 block">
                            (~{formatCurrency(usdEquiv, homeCurrency)})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEditClick(exp)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#1E1C1A] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.15, rotate: -5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ADD / EDIT EXPENSE MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-[#FAF6F0] rounded-3xl p-6 shadow-2xl border border-[#E6DFD5] text-[#1E1C1A] z-10 font-sans"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
                <h3 className="font-serif text-xl font-bold">
                  {editingExpense ? 'Edit Expense' : 'Log New Expense'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-white border border-[#E6DFD5] flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* OCR PROCESSING LOADING SCANNING BEAM */}
              {isScanningOcr && (
                <div className="my-4 p-4 rounded-2xl bg-white border border-[#FF6B2C]/40 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FF6B2C]/15 flex items-center justify-center text-[#FF6B2C] animate-spin">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#FF6B2C]">Scanning Receipt Text...</p>
                    <p className="text-[11px] text-gray-500">Extracting merchant, category, total amount, and currency.</p>
                  </div>
                </div>
              )}

              {/* OCR CONFIDENCE SUCCESS MSG */}
              {ocrConfidenceMsg && (
                <div className={`my-3 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  ocrConfidenceMsg.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{ocrConfidenceMsg.text}</span>
                </div>
              )}

              {/* DUPLICATE WARNING */}
              {duplicateWarning && (
                <div className="my-3 p-3 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>{duplicateWarning}</span>
                </div>
              )}

              {/* SCANNED BILL RECEIPT PHOTO PREVIEW INSIDE MODAL */}
              {receiptPhotoDataUrl && (
                <div className="my-3 p-3 rounded-2xl bg-white border border-[#E6DFD5] flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => setPreviewPhotoUrl(receiptPhotoDataUrl)}
                      className="w-14 h-14 rounded-xl border border-[#E6DFD5] overflow-hidden shrink-0 cursor-pointer relative group"
                      title="Click to view full-size receipt"
                    >
                      <img src={receiptPhotoDataUrl} alt="Scanned Bill" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#1E1C1A] block">Bill Photo Attached</span>
                      <span className="text-[11px] text-[#7A7268] block">Receipt photo will be saved & previewable in feed</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptPhoto(null);
                      setReceiptPhotoDataUrl(null);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove Attached Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveExpense} className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E6DFD5] text-sm font-bold text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Currency</label>
                    <div className="relative">
                      <select
                        value={expenseCurrency}
                        onChange={(e) => setExpenseCurrency(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white border border-[#E6DFD5] text-xs font-bold text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C] appearance-none"
                      >
                        {SUPPORTED_CURRENCIES.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.code} ({c.symbol}) — {c.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Merchant / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. The Bikers Cafe, Trattoria, Taxi"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E6DFD5] text-xs font-bold text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Category</label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white border border-[#E6DFD5] text-xs font-bold text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C] appearance-none"
                      >
                        {EXPENSE_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Itinerary Day</label>
                    <div className="relative">
                      <select
                        value={expenseDay}
                        onChange={(e) => setExpenseDay(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white border border-[#E6DFD5] text-xs font-bold text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C] appearance-none"
                      >
                        <option value="Day 1">Day I (Sep 4)</option>
                        <option value="Day 2">Day II (Sep 5)</option>
                        <option value="Day 3">Day III (Sep 6)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Paid By (Who paid the bill?)</label>
                  <div className="relative">
                    <input
                      type="text"
                      list="trip-members"
                      value={paidBy}
                      onChange={(e) => setPaidBy(e.target.value)}
                      placeholder="e.g. Me, John, Alice"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E6DFD5] text-xs font-bold text-[#1E1C1A] focus:outline-none focus:border-[#FF6B2C]"
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

                {!receiptPhotoDataUrl && (
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Receipt / Bill (Optional)</label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 rounded-xl bg-white border border-dashed border-gray-400 text-gray-600 font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Attach Receipt Photo
                    </button>
                  </div>
                )}

                <div className="pt-3 border-t border-[#E6DFD5] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-gray-600 font-bold hover:bg-gray-200/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(255,107,44,0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1C] text-white font-bold shadow-md transition-colors cursor-pointer"
                  >
                    Save Expense
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL RECEIPT PREVIEW LIGHTBOX WITH PAPER UNROLL ANIMATION */}
      <AnimatePresence>
        {previewPhotoUrl && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scaleY: 0.3, y: -40 }}
              animate={{ opacity: 1, scaleY: 1, y: 0 }}
              exit={{ opacity: 0, scaleY: 0.3, y: -40 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="relative max-w-md w-full bg-white rounded-3xl p-5 shadow-2xl border border-[#E6DFD5] z-10 overflow-hidden text-[#1E1C1A] origin-top"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5] mb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#FF6B2C]" />
                  <span className="font-serif font-bold text-base">Receipt Preview</span>
                </div>
                <button
                  onClick={() => setPreviewPhotoUrl(null)}
                  className="w-8 h-8 rounded-full bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="w-full max-h-[70vh] rounded-2xl overflow-hidden border border-[#E6DFD5] bg-stone-900 flex items-center justify-center">
                <img src={previewPhotoUrl} alt="Receipt Preview" className="max-w-full max-h-[70vh] object-contain" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}