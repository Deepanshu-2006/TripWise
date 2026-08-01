import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, X, RefreshCw, ThermometerSun } from 'lucide-react';

export default function WeatherNudge({ show, nudgeData, onAdjust, onDismiss }) {
  if (!nudgeData) return null;
  const { activity, forecast } = nudgeData;
  const isExtremeTemp = forecast.type === 'extreme_temp';
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm"
        >
          <div className="bg-[#1E1C1A] text-white p-5 rounded-[2rem] shadow-2xl border border-gray-700 relative overflow-hidden">
            {/* Background glowing orb effect */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 pointer-events-none ${isExtremeTemp ? 'bg-amber-500' : 'bg-blue-500'}`} />
            
            <button 
              onClick={onDismiss}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isExtremeTemp ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
                {isExtremeTemp ? <ThermometerSun className="text-amber-500 w-5 h-5" /> : <CloudRain className="text-blue-500 w-5 h-5" />}
              </div>
              <div className="pt-1 pr-6">
                <h4 className="font-serif font-bold text-lg leading-tight mb-1">
                  {isExtremeTemp ? 'Extreme Weather Alert' : 'Rain Expected'}
                </h4>
                <p className="text-sm text-gray-300 font-sans leading-snug">
                  {isExtremeTemp ? 'Extreme temperatures' : 'Rain'} expected during your outdoor plan <strong>{activity.title}</strong>. Want us to swap it for an indoor alternative?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={onAdjust}
                className="flex-1 bg-white hover:bg-gray-200 text-[#1E1C1A] font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} />
                Yes, swap it
              </button>
              <button 
                onClick={onDismiss}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer"
              >
                No, keep as planned
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
