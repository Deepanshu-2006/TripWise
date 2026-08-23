'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Camera, 
  Image as ImageIcon, 
  Star, 
  Globe, 
  Lock,
  Save,
  Trash2,
  AlertCircle
} from 'lucide-react';

export default function JournalEntryModal({ 
  isOpen, 
  onClose, 
  activity, 
  dayNum, 
  stopNum, 
  existingEntry, 
  onSave, 
  onDelete 
}) {
  const [note, setNote] = useState('');
  const [rating, setRating] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (existingEntry) {
        setNote(existingEntry.note || '');
        setRating(existingEntry.personalRating || 0);
        setPhotos(existingEntry.photoUrls || []);
        setIsPublic(existingEntry.isPublic || false);
      } else {
        setNote('');
        setRating(0);
        setPhotos([]);
        setIsPublic(false);
      }
      
      setError('');
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen, existingEntry]);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxAllowed = 5 - photos.length;
    const filesToProcess = files.slice(0, maxAllowed);

    if (files.length > maxAllowed) {
      setError(`You can only upload a maximum of 5 photos. (Remaining slots: ${maxAllowed})`);
      setTimeout(() => setError(''), 4000);
    }

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        let dataUrl = reader.result;
        
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
              resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.onerror = () => resolve(reader.result);
            img.src = reader.result;
          });
        } catch (err) {
          console.warn('Image compression failed', err);
        }
        
        setPhotos(prev => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
    
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!note.trim() && photos.length === 0 && rating === 0) {
      setError("Please add a note, photo, or rating before saving.");
      setTimeout(() => setError(''), 4000);
      return;
    }

    const entryData = {
      id: existingEntry?.id || null,
      activityId: `${dayNum}-${stopNum}`,
      note,
      photoUrls: photos,
      personalRating: rating,
      isPublic,
    };
    
    onSave(entryData);
  };

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative w-full max-w-xl bg-[#FAF6F0] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-[#E6DFD5] flex items-center justify-between gap-3 bg-white relative z-10 shrink-0">
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF6B2C] font-bold block mb-0.5">
                  Day {dayNum} • Stop {stopNum}
                </span>
                <h3 className="text-base sm:text-xl font-serif font-black text-[#1E1C1A] truncate leading-tight">
                  {activity?.title || 'Journal Entry'}
                </h3>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#F5F0E8] border border-[#E6DFD5] flex items-center justify-center text-[#7A7268] hover:text-[#1E1C1A] hover:bg-white transition-all shadow-2xs shrink-0 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Scrollable Form Content */}
            <div 
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-6"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              
              {/* Rating Section */}
              <div className="flex flex-col items-center justify-center py-1 sm:py-2">
                <span className="text-[11px] sm:text-xs font-sans uppercase tracking-widest text-[#7A7268] font-bold mb-2 sm:mb-3">
                  How was your experience?
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      whileTap={{ scale: 1.25, rotate: 15 }}
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                    >
                      <Star 
                        className={`w-7 h-7 sm:w-8 sm:h-8 ${
                          (hoveredStar || rating) >= star 
                            ? 'fill-[#FF6B2C] text-[#FF6B2C]' 
                            : 'fill-transparent text-[#C8BFB2]'
                        } transition-colors duration-200`}
                        strokeWidth={1.5}
                      />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Note Section */}
              <div>
                <label className="text-[11px] sm:text-xs font-sans uppercase tracking-widest text-[#7A7268] font-bold mb-2 flex justify-between">
                  <span>Reflections &amp; Memories</span>
                  <span className="text-[#C8BFB2] font-normal lowercase">{note.length} chars</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What stood out to you? Any hidden details or personal thoughts?"
                  className="w-full h-24 sm:h-32 p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E6DFD5] text-[#1E1C1A] font-serif text-sm focus:outline-none focus:border-[#FF6B2C] focus:ring-1 focus:ring-[#FF6B2C] resize-none shadow-2xs placeholder:text-[#C8BFB2] leading-relaxed transition-all"
                />
              </div>

              {/* Photos Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] sm:text-xs font-sans uppercase tracking-widest text-[#7A7268] font-bold">
                    Visuals ({photos.length}/5)
                  </label>
                  <motion.button 
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photos.length >= 5}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E6DFD5] text-xs font-bold text-[#FF6B2C] hover:bg-[#FF6B2C]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Add Photos</span>
                  </motion.button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                    onChange={handlePhotoUpload} 
                  />
                </div>
                
                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    <AnimatePresence>
                      {photos.map((url, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative aspect-square rounded-xl overflow-hidden border border-[#E6DFD5] group shadow-2xs bg-white"
                        >
                          <img src={url} alt={`Upload ${idx+1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              type="button"
                              onClick={() => removePhoto(idx)}
                              className="w-8 h-8 rounded-full bg-white/20 hover:bg-red-500/80 backdrop-blur-sm text-white flex items-center justify-center transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-20 sm:h-24 rounded-2xl border-2 border-dashed border-[#E6DFD5] bg-white/50 flex flex-col items-center justify-center text-[#C8BFB2] cursor-pointer hover:bg-white hover:border-[#FF6B2C]/40 hover:text-[#FF6B2C] transition-all group"
                  >
                    <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] sm:text-xs font-sans font-medium">Tap to add captures</span>
                  </div>
                )}
              </div>

              {/* Privacy Toggle */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E6DFD5] flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isPublic ? 'bg-[#FF6B2C]/15 text-[#FF6B2C]' : 'bg-stone-100 text-[#7A7268]'}`}>
                    {isPublic ? <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-sans font-bold text-[#1E1C1A]">Share to Community Feed</h4>
                    <p className="text-[10px] sm:text-[11px] font-sans text-[#7A7268] mt-0.5 leading-snug">
                      {isPublic 
                        ? "Visible to travelers exploring this place." 
                        : "Private entry for you & your group."}
                    </p>
                  </div>
                </div>
                {/* Custom Toggle Switch */}
                <button 
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isPublic ? 'bg-[#FF6B2C]' : 'bg-[#E6DFD5]'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isPublic ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Extra spacer for scroll padding at the bottom */}
              <div className="h-2 w-full shrink-0"></div>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                  className="px-4 sm:px-6"
                >
                  <div className="flex items-center gap-2 p-2.5 sm:p-3 mb-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold shadow-2xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Actions */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[#E6DFD5] bg-white flex items-center justify-between gap-2 relative z-10 rounded-b-3xl shrink-0">
              {existingEntry ? (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => onDelete(existingEntry.id)}
                  className="relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 text-xs font-bold shadow-2xs cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </motion.button>
              ) : (
                <div />
              )}
              
              <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={onClose}
                  className="relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-[#E6DFD5] bg-white text-[#7A7268] hover:border-[#C8BFB2] hover:text-[#1E1C1A] text-xs font-bold shadow-2xs cursor-pointer transition-colors whitespace-nowrap"
                >
                  <span>Cancel</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={handleSave}
                  className="relative inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl border border-[#FF6B2C] bg-gradient-to-r from-[#FF6B2C] to-[#FF7744] text-white text-xs font-bold shadow-xs hover:brightness-105 cursor-pointer group whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="tracking-wide">{existingEntry ? 'Update' : 'Save Entry'}</span>
                </motion.button>
              </div>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
