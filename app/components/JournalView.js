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
  MessageSquare
} from 'lucide-react';
import { getTripJournalEntries, removeJournalEntry } from '../../lib/journalApi';
import JournalEntryModal from './JournalEntryModal';

export default function JournalView({ tripId, itinerary, onEntriesChange }) {
  const [entries, setEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);

  useEffect(() => {
    loadEntries();
  }, [tripId]);

  const loadEntries = () => {
    const loaded = getTripJournalEntries(tripId);
    // Sort reverse chronological
    loaded.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setEntries(loaded);
    if (onEntriesChange) onEntriesChange(loaded);
  };

  const handleDelete = (entryId) => {
    if (window.confirm("Are you sure you want to delete this journal entry?")) {
      removeJournalEntry(tripId, entryId);
      loadEntries();
      setEditingEntry(null);
    }
  };

  const handleSaveEdit = (updatedEntry) => {
    import('../../lib/journalApi').then(({ addJournalEntry }) => {
      addJournalEntry(tripId, updatedEntry);
      loadEntries();
      setEditingEntry(null);
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
        <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-[#E6DFD5] border-dashed text-center">
          <div className="w-16 h-16 rounded-full bg-[#FF6B2C]/10 flex items-center justify-center text-[#FF6B2C] mb-4">
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
    </div>
  );
}
