import { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '../services/api';
import { useDateRange } from '../context/DateRangeContext';

export function useAnalytics(groupBy = 'day') {
  const { queryParams, refreshTrigger } = useDateRange();
  const [salesData, setSalesData] = useState(null);
  const [revenueAtRisk, setRevenueAtRisk] = useState(null);
  const [businessHealth, setBusinessHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, riskRes, healthRes] = await Promise.all([
        analyticsApi.getSales({ ...queryParams, groupBy }),
        analyticsApi.getRevenueAtRisk(queryParams),
        analyticsApi.getBusinessHealth(queryParams)
      ]);
      setSalesData(salesRes.data);
      setRevenueAtRisk(riskRes.data);
      setBusinessHealth(healthRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load analytics telemetry');
    } finally {
      setLoading(false);
    }
  }, [queryParams, groupBy]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, refreshTrigger]);

  return {
    sales: salesData,
    revenueAtRisk,
    businessHealth,
    loading,
    error,
    refetch: fetchAnalytics
  };
}
