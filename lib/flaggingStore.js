/**
 * TripWise Crowd-Sourced Accuracy & Moderation Store
 */

const STORAGE_KEY = 'tw_accuracy_flags';

export const REASON_OPTIONS = [
  { id: 'closed', label: 'Permanently Closed', severity: 'high' },
  { id: 'hours_pricing', label: 'Hours or Pricing Changed', severity: 'medium' },
  { id: 'location', label: 'Incorrect Location / Address', severity: 'high' },
  { id: 'other', label: 'Other Outdated Information', severity: 'low' }
];

// Helper to load flags from localStorage
export function getStoredFlags() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getInitialMockFlags();
  } catch {
    return getInitialMockFlags();
  }
}

// Initial mock flags to demonstrate the feature out of the box
function getInitialMockFlags() {
  return [
    {
      id: 'flag_demo_1',
      placeId: 'stop_demo_closed',
      placeTitle: 'Old Town Heritage Cafe',
      reason: 'closed',
      reasonLabel: 'Permanently Closed',
      details: 'Venue shut down last month, building under renovation.',
      submitterName: 'Elena R. (Verified Paris Guide)',
      isTrustVerified: true,
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
      status: 'auto_warning', // Fast-tracked auto-warning
      lastVerifiedAt: '2026-07-15'
    }
  ];
}

export function saveStoredFlags(flags) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
    // Trigger custom window event so all UI components update live
    window.dispatchEvent(new Event('tw_flags_updated'));
  } catch (err) {
    console.warn('Failed to save flags:', err);
  }
}

/**
 * Submit a new accuracy report
 */
export function submitFlag({
  placeId,
  placeTitle,
  reason,
  details = '',
  submitterName = 'Anonymous Traveler',
  isTrustVerified = false // Verified Local or high rep user
}) {
  const flags = getStoredFlags();
  const reasonObj = REASON_OPTIONS.find(r => r.id === reason) || REASON_OPTIONS[3];

  // High-trust submitters trigger instant auto_warning status
  const status = isTrustVerified ? 'auto_warning' : 'pending';

  const newFlag = {
    id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    placeId: String(placeId),
    placeTitle: placeTitle || 'Travel Venue',
    reason,
    reasonLabel: reasonObj.label,
    details: details.trim(),
    submitterName,
    isTrustVerified,
    timestamp: new Date().toISOString(),
    status,
    lastVerifiedAt: new Date().toISOString().split('T')[0]
  };

  const updated = [newFlag, ...flags];
  saveStoredFlags(updated);
  return newFlag;
}

/**
 * Get active flags/warning for a specific place
 */
export function getPlaceAccuracyStatus(placeId, placeTitle = '') {
  const flags = getStoredFlags();
  const matching = flags.filter(
    f => (String(f.placeId) === String(placeId) || (placeTitle && f.placeTitle?.toLowerCase() === placeTitle.toLowerCase())) &&
    (f.status === 'auto_warning' || f.status === 'pending' || f.status === 'confirmed_closed')
  );

  const hasWarning = matching.length > 0;
  const topFlag = matching[0] || null;

  return {
    hasWarning,
    status: topFlag?.status || 'verified',
    flagCount: matching.length,
    topFlag,
    lastVerifiedAt: topFlag?.lastVerifiedAt || '2026-08-01'
  };
}

/**
 * Moderate a flag (Admin action)
 */
export function moderateFlag(flagId, action, resolutionNote = '') {
  const flags = getStoredFlags();
  const updated = flags.map(f => {
    if (f.id === flagId) {
      if (action === 'approve_close') {
        return { ...f, status: 'confirmed_closed', resolutionNote, resolvedAt: new Date().toISOString() };
      }
      if (action === 'approve_update') {
        return { ...f, status: 'resolved', resolutionNote, resolvedAt: new Date().toISOString(), lastVerifiedAt: new Date().toISOString().split('T')[0] };
      }
      if (action === 'dismiss') {
        return { ...f, status: 'dismissed', resolutionNote, resolvedAt: new Date().toISOString() };
      }
    }
    return f;
  });

  saveStoredFlags(updated);
}
