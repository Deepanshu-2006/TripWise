import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

// Helper to parse YYYY-MM-DD locally without UTC timezone shift issues
const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  const [y, m, d] = dateString.split('-');
  return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
};

export default function CustomDatePicker({ value, onChange, placeholder = "Select date" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const popupRef = useRef(null);
  
  const [mounted, setMounted] = useState(false);
  const [popupStyle, setPopupStyle] = useState({});

  // Initialize view date to selected date or current date
  const parsedValue = parseLocalDate(value);
  const initialDate = parsedValue || new Date();
  
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;
      
      let top = rect.bottom + 8;
      let bottom = 'auto';
      let isUpwards = false;
      
      // If opening downwards overflows the bottom, open upwards
      if (top + 330 > window.innerHeight) {
        top = 'auto';
        bottom = window.innerHeight - rect.top + 8;
        isUpwards = true;
      }

      setPopupStyle({
        position: 'fixed',
        top,
        bottom,
        left: isMobile ? '50%' : rect.left,
        marginLeft: isMobile ? -150 : 0,
        zIndex: 999999,
        width: 300,
        transformOrigin: isMobile 
          ? (isUpwards ? 'bottom center' : 'top center') 
          : (isUpwards ? 'bottom left' : 'top left'),
      });
    }
  };

  const toggleOpen = () => {
    if (!isOpen) {
      updatePosition();
      const currentParsed = parseLocalDate(value) || new Date();
      setViewYear(currentParsed.getFullYear());
      setViewMonth(currentParsed.getMonth());
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Handle click outside and scrolling
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(e.target) &&
        (!popupRef.current || !popupRef.current.contains(e.target))
      ) {
        setIsOpen(false);
      }
    };
    
    const handleScroll = (e) => {
      // Don't close if scrolling inside the popup (though not applicable now, good practice)
      if (popupRef.current && popupRef.current.contains(e.target)) return;
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Capture phase scroll events to detect scrolling on any ancestor container
      window.addEventListener('wheel', handleScroll, { passive: true, capture: true });
      window.addEventListener('touchmove', handleScroll, { passive: true, capture: true });
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('wheel', handleScroll, { capture: true });
      window.removeEventListener('touchmove', handleScroll, { capture: true });
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Update view when opened so it shows the currently selected month
  useEffect(() => {
    if (isOpen && parsedValue) {
      setViewYear(parsedValue.getFullYear());
      setViewMonth(parsedValue.getMonth());
    }
  }, [isOpen, value]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDate = (day) => {
    // Construct YYYY-MM-DD local timezone string
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const yyyy = viewYear;
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // Generate calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  
  const grid = [];
  // Empty slots for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    grid.push(null);
  }
  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push(i);
  }

  // Format display value
  let displayValue = placeholder;
  if (parsedValue) {
    displayValue = parsedValue.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Check if a day is selected
  const isSelected = (day) => {
    if (!parsedValue || !day) return false;
    return parsedValue.getDate() === day && parsedValue.getMonth() === viewMonth && parsedValue.getFullYear() === viewYear;
  };

  // Check if a day is today
  const isToday = (day) => {
    if (!day) return false;
    const tDate = new Date();
    return tDate.getDate() === day && tDate.getMonth() === viewMonth && tDate.getFullYear() === viewYear;
  };

  const popoverContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          style={popupStyle}
          className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-stone-200/80 p-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button 
              type="button" 
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="font-bold text-stone-800 text-sm tracking-wide">
              {MONTHS[viewMonth]} {viewYear}
            </div>
            <button 
              type="button" 
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 transition-colors cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {DAYS.map((day, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {grid.map((day, idx) => {
              const selected = isSelected(day);
              const today = isToday(day);
              
              return (
                <div key={idx} className="aspect-square flex items-center justify-center">
                  {day ? (
                    <button
                      type="button"
                      onClick={() => handleSelectDate(day)}
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all cursor-pointer ${
                        selected 
                          ? 'bg-[#FF6B2C] text-white shadow-md shadow-[#FF6B2C]/30' 
                          : today 
                            ? 'text-[#FF6B2C] bg-[#FF6B2C]/10 hover:bg-[#FF6B2C]/20'
                            : 'text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {day}
                    </button>
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Quick Actions */}
          <div className="mt-5 pt-3 border-t border-stone-100 flex justify-between items-center px-1">
            <button 
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="text-[11px] font-bold text-stone-400 hover:text-stone-600 transition-colors uppercase tracking-wider cursor-pointer"
            >
              Clear
            </button>
            <button 
              type="button"
              onClick={() => {
                const now = new Date();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const yyyy = now.getFullYear();
                onChange(`${yyyy}-${mm}-${dd}`);
                setIsOpen(false);
              }}
              className="text-[11px] font-bold text-[#FF6B2C] hover:text-[#e85c21] transition-colors uppercase tracking-wider cursor-pointer"
            >
              Today
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleOpen}
        className={`w-full flex items-center justify-between p-2.5 rounded-xl border shadow-2xs text-sm font-semibold transition-all outline-none focus:ring-2 focus:ring-[#FF6B2C]/50 ${
          isOpen ? 'bg-stone-50 border-[#FF6B2C]/50' : 'bg-bg-white border-[rgba(28,27,27,0.1)] hover:bg-stone-50'
        }`}
      >
        <span className={value ? "text-[#1F1F1F]" : "text-stone-400 font-medium"}>
          {displayValue}
        </span>
        <Calendar size={18} className={value ? "text-[#FF6B2C]" : "text-stone-400"} />
      </button>

      {/* Render Popover into Portal to escape scroll containers */}
      {mounted && createPortal(popoverContent, document.body)}
    </div>
  );
}
