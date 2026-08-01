import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowRight, Clock, MapPin, Check } from 'lucide-react';

export default function LiveAssistantProposalModal({ show, proposal, onAccept, onReject, isApplying }) {
  if (!show || !proposal) return null;

  const { updatedDay, explanation } = proposal;
  const newActivities = updatedDay?.activities || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onReject}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#FAF6F0] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#E6DFD5] bg-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-[#1E1C1A] text-xl">Adjusted Schedule</h3>
                  <p className="text-xs font-sans text-[#7A7268] mt-0.5">AI-powered day-of re-planning</p>
                </div>
              </div>
              <button
                onClick={onReject}
                className="p-2 rounded-full bg-[#FAF6F0] text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* AI Explanation Banner */}
            <div className="mt-5 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                {explanation || "We've adjusted your remaining stops so you won't feel rushed."}
              </p>
            </div>
          </div>

          {/* New Itinerary Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#FAF6F0]">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#7A7268] mb-4">Proposed Timeline</h4>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-indigo-200 before:to-transparent">
              {newActivities.map((act, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Timeline Node */}
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-[#FAF6F0] bg-indigo-500 text-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-x-1/2"></div>
                  
                  {/* Card */}
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl bg-white border border-[#E6DFD5] shadow-sm ml-10 md:ml-0">
                    <div className="flex items-center gap-2 mb-2 text-indigo-600 font-mono text-[10px] font-bold">
                      <Clock className="w-3 h-3" />
                      {act.time}
                    </div>
                    <h5 className="font-serif font-bold text-[#1E1C1A] text-sm mb-1">{act.title}</h5>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-[#7A7268]">
                      {act.duration && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {act.duration}</span>
                      )}
                      {act.category && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {act.category}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 bg-white border-t border-[#E6DFD5] flex gap-3">
            <button
              onClick={onReject}
              disabled={isApplying}
              className="flex-1 py-3.5 rounded-xl border border-[#E6DFD5] text-[#1E1C1A] font-bold text-sm hover:bg-[#FAF6F0] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onAccept}
              disabled={isApplying}
              className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isApplying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Apply Update
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
