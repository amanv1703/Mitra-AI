/**
 * MITRA AI — Temporal Event Correlation
 */

class TemporalCorrelation {
  /**
   * Correlates sequential events occurring within a configurable window (default 7 days)
   */
  correlateTemporalSequence(events = [], windowDays = 7) {
    if (!events || events.length < 2) return [];

    const sorted = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const chains = [];

    for (let i = 0; i < sorted.length; i++) {
      const currentChain = [sorted[i]];
      const startTime = new Date(sorted[i].timestamp).getTime();

      for (let j = i + 1; j < sorted.length; j++) {
        const nextTime = new Date(sorted[j].timestamp).getTime();
        const diffDays = (nextTime - startTime) / (1000 * 60 * 60 * 24);

        if (diffDays <= windowDays) {
          currentChain.push(sorted[j]);
        }
      }

      if (currentChain.length >= 2) {
        chains.push({
          type: 'TEMPORAL_CHAIN',
          timeWindowDays: windowDays,
          eventCount: currentChain.length,
          events: currentChain,
          summary: `${currentChain.length} events occurred in sequence within ${windowDays} days.`
        });
      }
    }

    return chains;
  }
}

module.exports = new TemporalCorrelation();
