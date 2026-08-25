import { useState, useEffect, useCallback } from 'react';
import { intelligenceApi } from '../services/api';
import { useDateRange } from '../context/DateRangeContext';

export function useIntelligence() {
  const { queryParams, refreshTrigger } = useDateRange();
  const [overview, setOverview] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIntelligence = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, insightsRes] = await Promise.all([
        intelligenceApi.getOverview(queryParams),
        intelligenceApi.getInsights(queryParams)
      ]);
      setOverview(overviewRes.data);
      setInsights(insightsRes.data || []);
    } catch (err) {
      console.error('Failed to load business intelligence:', err);
      setError(err.message || 'Failed to fetch business intelligence');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchIntelligence();
  }, [fetchIntelligence, refreshTrigger]);

  return {
    overview,
    businessHealth: overview?.businessHealth,
    domainRisks: overview?.domainRisks,
    revenueAtRisk: overview?.revenueAtRisk,
    insights,
    loading,
    error,
    refetch: fetchIntelligence
  };
}

export default useIntelligence;
