import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../services/api';
import { useDateRange } from '../context/DateRangeContext';

export function useDashboard() {
  const { queryParams, refreshTrigger } = useDateRange();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getSummary(queryParams);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, refreshTrigger]);

  return {
    dashboard: data,
    loading,
    error,
    refetch: fetchDashboard
  };
}
