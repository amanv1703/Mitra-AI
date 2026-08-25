import { useState, useEffect, useCallback } from 'react';
import { refundsApi } from '../services/api';
import { useDateRange } from '../context/DateRangeContext';

export function useRefunds(filters = {}) {
  const { queryParams, refreshTrigger } = useDateRange();
  const [refunds, setRefunds] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mergedParams = {
        ...queryParams,
        ...filters
      };

      const [listRes, summaryRes, trendsRes] = await Promise.all([
        refundsApi.getRefunds(mergedParams),
        refundsApi.getSummary(queryParams),
        refundsApi.getTrends(queryParams)
      ]);

      setRefunds(listRes.data || []);
      setMeta(listRes.meta || null);
      setSummary(summaryRes.data || null);
      setTrends(trendsRes.data?.trends || []);
    } catch (err) {
      setError(err.message || 'Failed to load refunds analytics');
    } finally {
      setLoading(false);
    }
  }, [queryParams, JSON.stringify(filters)]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds, refreshTrigger]);

  return {
    refunds,
    meta,
    summary,
    trends,
    loading,
    error,
    refetch: fetchRefunds
  };
}
