/**
 * MITRA AI — Formatting Utilities
 * Standardized INR currency, percentage, and date formatters for merchant telemetry
 */

/**
 * Format currency in Indian Rupees (INR)
 * @param {number} amount
 * @param {boolean} compact - If true, formats large amounts like ₹1.55 Cr or ₹8.42 L
 */
export function formatCurrency(amount, compact = false) {
  const num = Number(amount) || 0;
  
  if (compact) {
    if (Math.abs(num) >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(num) >= 100000) {
      return `₹${(num / 100000).toFixed(2)} L`;
    }
    if (Math.abs(num) >= 1000) {
      return `₹${(num / 1000).toFixed(1)} K`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(num);
}

/**
 * Format standard integers with Indian comma notation
 */
export function formatNumber(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Format percentage with sign
 */
export function formatPercent(value, includeSign = false) {
  const num = Number(value) || 0;
  const formatted = `${num.toFixed(1)}%`;
  if (includeSign && num > 0) return `+${formatted}`;
  return formatted;
}

/**
 * Format ISO dates into human-readable merchant format (e.g. 24 Aug 2026)
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Format ISO datetime into (e.g. 24 Aug, 05:30 PM)
 */
export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return dateString;
  }
}
