'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Send, UserPlus, CheckCircle2, AlertCircle, Link as LinkIcon, Copy, Smartphone, MessageSquare } from 'lucide-react';
import { sendTripInvite, generateTripInviteLink } from '../actions/invites';
import QRCode from 'react-qr-code';

const InviteModal = ({ isOpen, onClose, tripId, currentCollaborators = [] }) => {
  const [activeTab, setActiveTab] = useState('email'); // 'email' or 'link'
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState(null); // 'success', 'error', null
  const [errorMessage, setErrorMessage] = useState('');
  
  // Link sharing state
  const [shareLink, setShareLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setShareLink('');
      setInviteStatus(null);
      setErrorMessage('');
      setActiveTab('email');
    }
  }, [isOpen]);

  const handleEmailInvite = async (e) => {
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
          // Save invited collaborator locally so it dynamically updates the Expense Settlement card
          try {
            let existingCollabs = [];
            const raw = localStorage.getItem('tw_trip_collaborators');
            if (raw) existingCollabs = JSON.parse(raw);
            const nameFromEmail = email.split('@')[0];
            const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
            const newCollab = {
              email,
              name: formattedName,
              role,
              invitedAt: new Date().toISOString()
            };
            const updated = [newCollab, ...existingCollabs.filter(c => c.email !== email)];
            localStorage.setItem('tw_trip_collaborators', JSON.stringify(updated));
            // Trigger storage event so listening components update immediately
            window.dispatchEvent(new Event('storage'));
          } catch (err) {}

          setInviteStatus('success');
          setEmail('');
          
          setTimeout(() => {
            onClose();
            setInviteStatus(null);
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

  const handleGenerateLink = async () => {
    if (!tripId) {
      setErrorMessage('Please save your trip first.');
      return;
    }

    setIsGeneratingLink(true);
    setErrorMessage('');

    try {
      const result = await generateTripInviteLink(tripId, role);
      if (result.success) {
        setShareLink(result.inviteLink);
      }
    } catch (error) {
      console.error("Error generating link:", error);
      setErrorMessage(error.message || 'Failed to generate link.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareLink).catch(()=>{});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            className="relative bg-white/95 backdrop-blur-xl rounded-4xl w-full max-w-md shadow-[0_30px_60px_rgba(0,0,0,0.15)] border border-white/50 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Top decorative gradient */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-orange-400 via-[#FF6B2C] to-orange-500"></div>

            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#FF6B2C]" />
                </div>
                <h2 className="text-xl font-serif font-bold text-gray-900 tracking-tight">Invite Friends</h2>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-8 shrink-0">
              <div className="flex p-1 bg-gray-100/80 rounded-xl">
                <button
                  onClick={() => setActiveTab('email')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Mail className="w-4 h-4" /> Email
                </button>
                <button
                  onClick={() => setActiveTab('link')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'link' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" /> Share Link
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="px-8 py-6 overflow-y-auto min-h-75">
              
              <AnimatePresence mode="wait">
                {activeTab === 'email' ? (
                  <motion.form 
                    key="email-tab"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleEmailInvite} 
                    className="space-y-5"
                  >
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                      <div className="flex gap-2 relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#FF6B2C] transition-colors" />
                        </div>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="friend@example.com"
                          className="flex-1 block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/20 focus:border-[#FF6B2C] focus:bg-white transition-all text-sm"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`
                          relative flex flex-col p-3 rounded-xl border cursor-pointer transition-all
                          ${role === 'editor' ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-500' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}
                        `}>
                          <input type="radio" name="role" value="editor" checked={role === 'editor'} onChange={(e) => setRole(e.target.value)} className="sr-only" />
                          <span className={`text-sm font-semibold ${role === 'editor' ? 'text-orange-700' : 'text-gray-900'}`}>Editor</span>
                          <span className={`text-xs mt-1 ${role === 'editor' ? 'text-orange-600/80' : 'text-gray-500'}`}>Can edit itinerary</span>
                        </label>
                        <label className={`
                          relative flex flex-col p-3 rounded-xl border cursor-pointer transition-all
                          ${role === 'viewer' ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-500' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}
                        `}>
                          <input type="radio" name="role" value="viewer" checked={role === 'viewer'} onChange={(e) => setRole(e.target.value)} className="sr-only" />
                          <span className={`text-sm font-semibold ${role === 'viewer' ? 'text-orange-700' : 'text-gray-900'}`}>Viewer</span>
                          <span className={`text-xs mt-1 ${role === 'viewer' ? 'text-orange-600/80' : 'text-gray-500'}`}>Read-only access</span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !email}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#111827] text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-900/20 hover:bg-black hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none mt-2 group"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Sending...
                        </div>
                      ) : (
                        <>
                          <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                          Send Email Invite
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="link-tab"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-5"
                  >
                    {!shareLink ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <LinkIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Shareable Link</h3>
                        <p className="text-sm text-gray-500 mb-6 px-4">Generate a unique link that anyone can use to join your trip.</p>
                        
                        <button
                          onClick={handleGenerateLink}
                          disabled={isGeneratingLink}
                          className="flex items-center justify-center gap-2 py-3 px-6 bg-[#111827] text-white rounded-xl text-sm font-bold shadow-lg mx-auto hover:bg-black transition-all disabled:opacity-70"
                        >
                          {isGeneratingLink ? 'Generating...' : 'Generate Invite Link'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Link Box */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Share this link</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              readOnly 
                              value={shareLink} 
                              className="flex-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-sm focus:outline-none"
                            />
                            <button
                              onClick={handleCopyLink}
                              className={`flex items-center justify-center p-3 rounded-xl transition-all ${
                                copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        {/* Quick Share Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <a 
                            href={`https://wa.me/?text=Hey!%20I'm%20planning%20an%20awesome%20trip%20using%20TripWise%20%E2%9C%88%EF%B8%8F%20Check%20out%20the%20itinerary%20and%20join%20me%20here:%20${encodeURIComponent(shareLink)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 py-3 bg-[linear-gradient(to_right,#25D366,#1DA851)] text-white rounded-xl text-sm font-bold shadow-sm shadow-[#25D366]/20 hover:shadow-md hover:shadow-[#25D366]/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                          >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            WhatsApp
                          </a>
                          <a 
                            href={`sms:?&body=Hey!%20I'm%20planning%20an%20awesome%20trip%20using%20TripWise%20%E2%9C%88%EF%B8%8F%20Check%20out%20the%20itinerary%20and%20join%20me%20here:%20${encodeURIComponent(shareLink)}`}
                            className="flex items-center justify-center gap-2 py-3 bg-[linear-gradient(to_right,#0A7CFF,#0062D6)] text-white rounded-xl text-sm font-bold shadow-sm shadow-[#0A7CFF]/20 hover:shadow-md hover:shadow-[#0A7CFF]/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                          >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            SMS
                          </a>
                        </div>

                        {/* QR Code */}
                        <div className="border-t border-gray-100 pt-6 mt-2 flex flex-col items-center">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-3">
                            <span className="w-10 h-px bg-[linear-gradient(to_right,transparent,#E5E7EB)]"></span>
                            Scan with camera
                            <span className="w-10 h-px bg-[linear-gradient(to_left,transparent,#E5E7EB)]"></span>
                          </p>
                          <div className="p-1 bg-[linear-gradient(to_bottom,#F3F4F6,#FFFFFF)] border border-gray-200/60 rounded-4xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="bg-white p-4 rounded-[28px] group-hover:scale-[1.02] transition-transform">
                              <QRCode value={shareLink} size={130} fgColor="#111827" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status Messages */}
              <AnimatePresence mode="wait">
                {inviteStatus === 'success' && (
                  <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }} className="mt-6 p-4 bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-green-800">Invite Sent Successfully!</h4>
                      <p className="text-xs text-green-600 mt-1">They will receive an email shortly.</p>
                    </div>
                  </motion.div>
                )}
                {inviteStatus === 'error' && (
                  <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }} className="mt-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800">Couldn't Send Invite</h4>
                      <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Current Collaborators List */}
              {currentCollaborators.length > 0 && (
                <div className="pt-6 mt-6 border-t border-gray-100/80">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Current Collaborators</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {currentCollaborators.map((collab, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        key={i} 
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50/80 border border-transparent hover:border-gray-100 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${collab.role === 'owner' ? 'bg-linear-to-br from-orange-100 to-orange-200 text-orange-700' : 'bg-linear-to-br from-gray-50 to-gray-200 text-gray-700'}`}>
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
