/**
 * TripWise Offline-First Travel Journal API
 */

export const getTripJournalEntries = (tripId = 'default_trip') => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(`tripwise_journal_${tripId}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error loading journal entries:', e);
    return [];
  }
};

export const saveTripJournalEntries = (tripId = 'default_trip', entries = []) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`tripwise_journal_${tripId}`, JSON.stringify(entries));
  } catch (e) {
    console.error('Error saving journal entries:', e);
  }
};

export const addJournalEntry = (tripId = 'default_trip', newEntry) => {
  const currentEntries = getTripJournalEntries(tripId);
  const entryWithMeta = {
    ...newEntry,
    id: newEntry.id || `journal_${Date.now()}`,
    createdAt: newEntry.createdAt || new Date().toISOString(),
    syncStatus: 'pending' // offline-first: start pending
  };
  
  // Replace if exists, else append
  const existingIndex = currentEntries.findIndex(e => e.id === entryWithMeta.id);
  if (existingIndex >= 0) {
    currentEntries[existingIndex] = entryWithMeta;
  } else {
    currentEntries.push(entryWithMeta);
  }
  
  saveTripJournalEntries(tripId, currentEntries);
  return currentEntries;
};

export const removeJournalEntry = (tripId = 'default_trip', entryId) => {
  const currentEntries = getTripJournalEntries(tripId);
  const updated = currentEntries.filter(e => e.id !== entryId);
  saveTripJournalEntries(tripId, updated);
  return updated;
};

/**
 * Offline Sync Queue Manager
 */
export const syncPendingJournalEntries = (tripId, entries) => {
  let hasChanges = false;
  const updated = entries.map(entry => {
    if (entry.syncStatus === 'pending') {
      hasChanges = true;
      return { ...entry, syncStatus: 'synced' };
    }
    return entry;
  });

  if (hasChanges) {
    saveTripJournalEntries(tripId, updated);
  }
  return updated;
};
