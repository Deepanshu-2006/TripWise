'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Send, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { sendTripInvite } from '../actions/invites';

const InviteModal = ({ isOpen, onClose, tripId, currentCollaborators = [] }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState(null); // 'success', 'error', null
  const [errorMessage, setErrorMessage] = useState('');
  const [inviteToken, setInviteToken] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    
    if (!tripId) {
        setInviteStatus('error');
        setErrorMessage('Please save your trip first before inviting collaborators.');
        return;
    }
    
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);
    setInviteStatus(null);
    setErrorMessage('');

    try {
      const result = await sendTripInvite(tripId, email, role);
      
      if (result.success) {
          setInviteStatus('success');
          setEmail('');
          setInviteToken(result.token);
          
          setTimeout(() => {
            onClose();
            setInviteStatus(null);
            setInviteToken(null);
          }, 3000);
      } else {
          throw new Error('Failed to send invite');
      }
    } catch (error) {
      console.error("Error inviting user:", error);
      setInviteStatus('error');
      setErrorMessage(error.message || 'Failed to send invite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
            className="relative bg-white/95 backdrop-blur-xl rounded-[2rem] w-full max-w-md shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-white/50 overflow-hidden"
          >
            {/* Top decorative gradient */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-orange-400 via-[#FF6B2C] to-orange-500"></div>

            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#FF6B2C]" />
                </div>
                <h2 className="text-xl font-serif font-bold text-gray-900 tracking-tight">Invite to Trip</h2>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-8 pb-8 space-y-6">
              
              {/* Invite Form */}
              <form onSubmit={handleInvite} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="flex gap-2 relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF6B2C] transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input 
                      type="email" 
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="friend@example.com"
                      className="flex-1 pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/20 focus:border-[#FF6B2C] transition-all text-sm shadow-sm"
                      required
                    />
                    <select 
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/20 focus:border-[#FF6B2C] transition-all text-sm shadow-sm cursor-pointer font-medium text-gray-700 appearance-none min-w-[100px]"
                      style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "2.5rem" }}
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !email}
                  className="group relative w-full bg-[#1F1F1F] hover:bg-black text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none shadow-md hover:shadow-xl hover:shadow-gray-900/10 hover:-translate-y-0.5 overflow-hidden flex items-center justify-center gap-2 text-sm tracking-wider uppercase"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                  {isSubmitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <>
                      Send Invite <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
                
                <AnimatePresence mode="wait">
                  {inviteStatus === 'success' && (
                    <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-center gap-2 text-sm text-emerald-600 bg-emerald-50 py-2.5 rounded-xl font-medium border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4" /> Invite sent successfully!
                    </motion.div>
                  )}
                  {inviteStatus === 'error' && (
                    <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 py-2.5 rounded-xl font-medium border border-red-100">
                      <AlertCircle className="w-4 h-4 shrink-0" /> <span className="truncate">{errorMessage || 'Failed to send invite.'}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              {/* Current Collaborators List */}
              {currentCollaborators.length > 0 && (
                <div className="pt-6 mt-6 border-t border-gray-100/80">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Current Collaborators</h3>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {currentCollaborators.map((collab, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        key={i} 
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50/80 border border-transparent hover:border-gray-100 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${collab.role === 'owner' ? 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700' : 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-700'}`}>
                            {collab.name ? collab.name.charAt(0).toUpperCase() : (collab.email ? collab.email.charAt(0).toUpperCase() : 'U')}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 leading-none mb-1">{collab.name || collab.email || (collab.user_id ? `User (${collab.user_id.slice(5, 9)})` : 'Collaborator')}</p>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{collab.role} {collab.status === 'pending' ? '(Pending)' : ''}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InviteModal;
