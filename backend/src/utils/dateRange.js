/**
 * MITRA AI — Reusable Date Range Parsing & Timezone Utilities
 */

/**
 * Parses query date parameters (from/to, range preset)
 * Default: Last 30 days from current date
 */
function parseDateRange(query = {}) {
  const { from, to, range } = query;

  const now = new Date();
  let startDate = null;
  let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  if (range) {
    switch (range.toLowerCase()) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case '7d':
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '90d':
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '30d':
      case '30days':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
    }
  } else if (from) {
    startDate = new Date(from);
    if (isNaN(startDate.getTime())) {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    startDate.setHours(0, 0, 0, 0);

    if (to) {
      endDate = new Date(to);
      if (isNaN(endDate.getTime())) {
        endDate = new Date();
      }
      endDate.setHours(23, 59, 59, 999);
    }
  } else {
    // Default 30-day window
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
  }

  const fromFormatted = startDate.toISOString().split('T')[0];
  const toFormatted = endDate.toISOString().split('T')[0];

  return {
    startDate,
    endDate,
    from: fromFormatted,
    to: toFormatted,
    fromSql: `${fromFormatted} 00:00:00`,
    toSql: `${toFormatted} 23:59:59`
  };
}

module.exports = {
  parseDateRange
};
