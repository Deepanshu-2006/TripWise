import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, 
  MapPin, 
  Star, 
  Edit3, 
  Trash2,
  Calendar,
  Image as ImageIcon,
  Globe,
  Lock,
  MessageSquare,
  Check
} from 'lucide-react';
import { getTripJournalEntries, removeJournalEntry } from '../../lib/journalApi';
import JournalEntryModal from './JournalEntryModal';
import Animated3DBackground from './Animated3DBackground';

const AnimatedTrashIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 shrink-0">
        <motion.rect x="9" y="0" width="6" height="6" rx="1" fill="currentColor" stroke="none" initial={{ y: -20, opacity: 0 }} animate={{ y: [ -20, -5, 10 ], opacity: [0, 1, 0] }} transition={{ delay: 0.4, duration: 0.35, times: [0, 0.5, 1], ease: "easeIn" }} />
        <motion.g initial={{ y: 0 }} animate={{ y: [0, 0, 0, 2, -1, 0] }} transition={{ delay: 0.3, duration: 0.7, times: [0, 0.2, 0.7, 0.8, 0.9, 1] }}>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
        </motion.g>
        <motion.g initial={{ rotate: 0 }} animate={{ rotate: [0, -45, -45, 0] }} transition={{ delay: 0.3, duration: 0.6, times: [0, 0.15, 0.85, 1] }} style={{ originX: "4px", originY: "6px" }}>
            <path d="M3 6h18"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        </motion.g>
    </svg>
);

export default function JournalView({ tripId, itinerary, onEntriesChange }) {
  const [entries, setEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    loadEntries();
  }, [tripId]);

  const loadEntries = () => {
    const loaded = getTripJournalEntries(tripId);
    // Sort reverse chronological
    loaded.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Filter out any pending deletes from previous sessions
    const pendingDeletesStr = localStorage.getItem('pendingJournalDeletes');
    if (pendingDeletesStr) {
        const pendingDeletes = JSON.parse(pendingDeletesStr);
        if (pendingDeletes.length > 0) {
            setEntries(loaded.filter(e => !pendingDeletes.includes(e.id)));
            
            // Process orphaned deletes in the background
            pendingDeletes.forEach(id => {
                removeJournalEntry(tripId, id);
            });
            localStorage.removeItem('pendingJournalDeletes');
        } else {
            setEntries(loaded);
        }
    } else {
        setEntries(loaded);
    }
    if (onEntriesChange) onEntriesChange(loaded);
  };

  const handleDelete = (entryId) => {
    setEntryToDelete(entryId);
  };

  const confirmDelete = () => {
    if (!entryToDelete) return;
    
    const entryId = entryToDelete;
    const entryData = entries.find(e => e.id === entryId);
    
    // Save to local storage in case of reload
    const pending = JSON.parse(localStorage.getItem('pendingJournalDeletes') || '[]');
    pending.push(entryId);
    localStorage.setItem('pendingJournalDeletes', JSON.stringify(pending));

    // Optimistic UI update
    setEntries(prev => prev.filter(e => e.id !== entryId));
    setEditingEntry(null);
    setEntryToDelete(null);

    const timeoutId = setTimeout(() => {
        removeJournalEntry(tripId, entryId);
        
        // Remove from local storage once processed
        const currentPending = JSON.parse(localStorage.getItem('pendingJournalDeletes') || '[]');
        localStorage.setItem('pendingJournalDeletes', JSON.stringify(currentPending.filter(id => id !== entryId)));
        
        loadEntries();
        setToast(null);
    }, 7000);

    setToast({
        entryId,
        entryData,
        timeoutId,
        activityTitle: getActivityDetails(entryData.activityId)?.title || 'Journal Entry'
    });
  };

  const handleUndo = () => {
    if (!toast) return;
    clearTimeout(toast.timeoutId);
    
    // Remove from pending deletes
    const currentPending = JSON.parse(localStorage.getItem('pendingJournalDeletes') || '[]');
    localStorage.setItem('pendingJournalDeletes', JSON.stringify(currentPending.filter(id => id !== toast.entryId)));
    
    // Restore entry
    setEntries(prev => {
        const restored = [...prev, toast.entryData];
        restored.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return restored;
    });
    setToast(null);
  };

  const handleSaveEdit = (updatedEntry) => {
    import('../../lib/journalApi').then(({ addJournalEntry }) => {
      addJournalEntry(tripId, updatedEntry);
      loadEntries();
      setEditingEntry(null);
      
      setSuccessMessage({
        title: getActivityDetails(updatedEntry.activityId)?.title || "Activity"
      });
    });
  };

  // Helper to find the activity details for a given activityId (dayNum-stopNum)
  const getActivityDetails = (activityId) => {
    if (!itinerary || !itinerary.days) return null;
    const [dayStr, stopStr] = activityId.split('-');
    const dayNum = parseInt(dayStr, 10);
    const stopNum = parseInt(stopStr, 10);
    
    const day = itinerary.days[dayNum - 1];
    if (day && day.activities) {
      return day.activities[stopNum - 1] || null;
    }
    return null;
  };

  return (
    <div className="font-sans relative z-10 max-w-4xl mx-auto py-8">
      
      <div className="border-b-2 border-[#1E1C1A] pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-1">
            Travel Memories
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#1E1C1A] tracking-tight">
            Digital Travel Journal
          </h2>
        </div>
        <div className="text-right">
          <span className="text-sm font-sans font-medium text-[#7A7268]">
            {entries.length} {entries.length === 1 ? 'Entry' : 'Entries'}
          </span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl border border-[#E6DFD5] border-dashed text-center overflow-hidden isolate">
          <Animated3DBackground />

          <div className="w-16 h-16 rounded-full bg-[#FF6B2C]/10 flex items-center justify-center text-[#FF6B2C] mb-4 shadow-xl shadow-[#FF6B2C]/5">
            <Book className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-serif font-bold text-[#1E1C1A] mb-2">Your Journal is Empty</h3>
          <p className="text-sm text-[#7A7268] max-w-md leading-relaxed">
            As you explore {itinerary?.destinationName || 'your destination'}, tap the "Add Journal Entry" button on any itinerary stop to capture photos, thoughts, and memories.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {entries.map((entry) => {
            const activity = getActivityDetails(entry.activityId);
            const entryDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
              weekday: 'long', month: 'short', day: 'numeric'
            });
            const [dayNum, stopNum] = entry.activityId.split('-');

            return (
              <motion.article 
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-[#E6DFD5] shadow-sm overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-[#E6DFD5]/60 bg-[#FAF6F0]/30 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-md bg-[#1E1C1A] text-white text-[10px] font-mono uppercase tracking-widest font-bold">
                        Day {dayNum} • Stop {stopNum}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-sans text-[#7A7268]">
                        <Calendar className="w-3.5 h-3.5" />
                        {entryDate}
                      </span>
                      {entry.isPublic ? (
                        <span className="flex items-center gap-1 text-[10px] font-sans text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Globe className="w-3 h-3" /> Public
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-sans text-[#7A7268] font-bold bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-serif font-black text-[#1E1C1A] tracking-tight">
                      {activity?.title || 'Unknown Stop'}
                    </h3>
                    <p className="text-sm font-sans text-[#5F5E5A] mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#FF6B2C]" />
                      {activity?.location || itinerary?.destinationName || 'Location'}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingEntry(entry)}
                      className="w-10 h-10 rounded-full border border-[#E6DFD5] bg-white flex items-center justify-center text-[#7A7268] hover:text-[#FF6B2C] hover:border-[#FF6B2C] shadow-2xs transition-colors cursor-pointer"
                      title="Edit Entry"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="w-10 h-10 rounded-full border border-[#E6DFD5] bg-white flex items-center justify-center text-[#7A7268] hover:text-red-500 hover:border-red-500 shadow-2xs transition-colors cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                  {/* Rating */}
                  {entry.personalRating > 0 && (
                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star}
                          className={`w-5 h-5 ${star <= entry.personalRating ? 'fill-[#FF6B2C] text-[#FF6B2C]' : 'fill-transparent text-[#E6DFD5]'}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Note */}
                  {entry.note && (
                    <div className="prose prose-stone prose-sm sm:prose-base font-serif text-[#4A443E] leading-relaxed max-w-none">
                      <p>{entry.note}</p>
                    </div>
                  )}

                  {/* Photo Gallery */}
                  {entry.photoUrls && entry.photoUrls.length > 0 && (
                    <div className={`mt-6 grid gap-3 ${
                      entry.photoUrls.length === 1 ? 'grid-cols-1 max-w-2xl' : 
                      entry.photoUrls.length === 2 ? 'grid-cols-2 max-w-3xl' : 
                      entry.photoUrls.length === 3 ? 'grid-cols-3' : 
                      'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                    }`}>
                      {entry.photoUrls.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm border border-[#E6DFD5]">
                          <img src={url} alt={`Journal photo ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <JournalEntryModal
          isOpen={true}
          onClose={() => setEditingEntry(null)}
          activity={getActivityDetails(editingEntry.activityId)}
          dayNum={parseInt(editingEntry.activityId.split('-')[0], 10)}
          stopNum={parseInt(editingEntry.activityId.split('-')[1], 10)}
          existingEntry={editingEntry}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {entryToDelete && (
          <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-md"
              onClick={() => setEntryToDelete(null)}
          >
              {(() => {
                  const entry = entries.find(e => e.id === entryToDelete);
                  const activity = entry ? getActivityDetails(entry.activityId) : null;
                  
                  return (
                      <motion.div
                          initial={{ scale: 0.95, opacity: 0, y: 20 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.95, opacity: 0, y: 20 }}
                          transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                          className="bg-white rounded-4xl max-w-sm w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-stone-200/50 flex flex-col relative overflow-hidden"
                          onClick={e => e.stopPropagation()}
                      >
                          {/* Modal Header with Entry Image */}
                          <div className="h-44 relative bg-stone-100 w-full overflow-hidden">
                              {entry?.photoUrls && entry.photoUrls.length > 0 ? (
                                  <img src={entry.photoUrls[0]} alt="Journal Entry" className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                  <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(25,85%,65%)_0%,hsl(45,90%,50%)_100%)]"></div>
                              )}
                              {/* Soft fade to white at the bottom */}
                              <div className="absolute inset-0 bg-[linear-gradient(to_top,#FFFFFF,transparent,rgba(0,0,0,0.2))]" />
                          </div>
                          
                          {/* Overlapping Icon */}
                          <div className="relative -mt-8 flex justify-center z-10">
                              <motion.div 
                                  initial={{ rotate: 0 }}
                                  animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
                                  transition={{ delay: 0.3, duration: 0.5, ease: "easeInOut" }}
                                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
                              >
                                  <div className="w-full h-full bg-rose-50 rounded-full flex items-center justify-center border border-rose-100">
                                      <Trash2 size={24} className="text-rose-500" />
                                  </div>
                              </motion.div>
                          </div>

                          {/* Modal Body */}
                          <div className="p-8 pt-5 flex flex-col items-center text-center">
                              <h3 className="font-serif font-bold text-3xl text-stone-900 mb-2">Delete Entry?</h3>
                              <p className="text-stone-500 text-[13px] leading-relaxed mb-8 max-w-65">
                                  You are about to permanently delete this journal entry for <span className="font-bold">{activity?.title || 'this stop'}</span>. This cannot be undone.
                              </p>
                              
                              {/* Actions - Horizontal Layout */}
                              <div className="flex w-full gap-3 mt-2">
                                  <button 
                                      onClick={() => setEntryToDelete(null)}
                                      className="flex-1 px-4 py-3.5 rounded-2xl text-[12px] font-bold uppercase tracking-widest text-stone-600 bg-white border border-stone-200 shadow-sm hover:bg-stone-50 hover:border-stone-300 transition-all active:scale-[0.98]"
                                  >
                                      Cancel
                                  </button>
                                  <button 
                                      onClick={confirmDelete}
                                      className="flex-1 px-4 py-3.5 rounded-2xl text-[12px] font-bold uppercase tracking-widest text-white bg-[linear-gradient(to_bottom,#F43F5E,#E11D48)] border border-rose-600 shadow-[0_8px_20px_rgba(225,29,72,0.25)] hover:shadow-[0_12px_25px_rgba(225,29,72,0.4)] transition-all hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0"
                                  >
                                      Delete
                                  </button>
                              </div>
                          </div>
                      </motion.div>
                  );
              })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo Toast */}
      <AnimatePresence>
          {toast && (
              <motion.div
                  initial={{ x: 80, opacity: 0, y: 0, scale: 0.8, rotateX: -60, transformPerspective: 1000 }}
                  animate={{ x: 0, opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                  exit={{ x: 80, opacity: 0, y: 0, scale: 0.8, rotateX: 60 }}
                  transition={{ type: "spring", bounce: 0.35, duration: 0.7 }}
                  className="fixed bottom-10 right-10 z-[100002] flex items-center gap-4 bg-stone-900/90 backdrop-blur-xl border border-white/10 text-white pl-5 pr-3 py-2.5 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden min-w-75 origin-right"
              >
                  <AnimatedTrashIcon />
                  
                  <p className="text-[13px] text-stone-200 flex-1 truncate">
                      Deleted <strong className="text-white font-semibold">{toast.activityTitle}</strong>
                  </p>
                  
                  <div className="w-px h-4 bg-white/20 ml-2 shrink-0" />
                  
                  <button 
                      onClick={handleUndo}
                      className="px-3 py-1.5 hover:bg-white/10 rounded-lg text-[#FF6B2C] hover:text-[#FF8A4C] text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 shrink-0"
                  >
                      Undo
                  </button>
                  
                  {/* Time remaining indicator */}
                  <motion.div 
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 7, ease: "linear" }}
                      className="absolute bottom-0 left-0 h-0.75 bg-[#FF6B2C]"
                  />
              </motion.div>
          )}
      </AnimatePresence>

      {/* Premium Animated Success Message */}
      <AnimatePresence>
        {successMessage && (
          <div className="fixed bottom-10 left-0 right-0 z-[200000] flex justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-white/95 backdrop-blur-xl border border-[#E6DFD5]/60 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] p-2 pr-6 rounded-full flex items-center gap-3 pointer-events-auto"
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(255,107,44,0.3)] bg-[#FF6B2C]">
                <motion.div
                   initial={{ scale: 0, rotate: -45 }}
                   animate={{ scale: 1, rotate: 0 }}
                   transition={{ type: "spring", stiffness: 400, delay: 0.1 }}
                >
                  <Check className="w-5 h-5 text-white stroke-[3px]" />
                </motion.div>
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="text-[13px] font-sans font-bold text-[#1E1C1A] leading-none mb-1">
                  Entry updated successfully
                </h4>
                <p className="text-[11px] font-sans font-medium text-[#7A7268] truncate max-w-[200px] leading-none">
                  {successMessage.title}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
