const HISTORY_KEY = 'defixs_recent_history';
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function getHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  
  try {
    let history = JSON.parse(raw);
    const now = Date.now();
    
    // Filter out items older than 3 days
    history = history.filter(item => (now - item.timestamp) < THREE_DAYS_MS);
    
    // Deduplicate (in case older versions have duplicates)
    // We sort by newest first to ensure we keep the most recent entry
    history.sort((a,b) => b.timestamp - a.timestamp);
    const seen = new Set();
    const deduplicated = history.filter(item => {
      if (seen.has(item.buggyCode)) return false;
      seen.add(item.buggyCode);
      return true;
    });

    // If we cleaned up any duplicates or old items, update localStorage
    if (deduplicated.length !== JSON.parse(raw).length) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(deduplicated));
    }
    
    return deduplicated;
  } catch (e) {
    console.error('Error parsing history:', e);
    return [];
  }
}

export function saveToHistory(item) {
  const history = getHistory();
  
  // Filter out any existing item with the same buggyCode to avoid duplicates
  // This ensures the entry is updated with a fresh timestamp and moved to the top
  const filteredHistory = history.filter(h => h.buggyCode !== item.buggyCode);
  
  const newItem = {
    ...item,
    id: Date.now().toString(),
    timestamp: Date.now()
  };
  
  const updated = [newItem, ...filteredHistory].slice(0, 10);
  
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteHistoryItem(id) {
  const history = getHistory();
  const updated = history.filter(item => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function formatTimestamp(ts) {
  const now = Date.now();
  const diff = now - ts;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
