import { useState, useEffect, useCallback } from 'react';
import { paymentsApi } from '../services/api';
import { useDateRange } from '../context/DateRangeContext';

export function usePayments(filters = {}) {
  const { queryParams, refreshTrigger } = useDateRange();
  const [payments, setPayments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mergedParams = {
        ...queryParams,
        ...filters
      };

      const [listRes, summaryRes, trendsRes] = await Promise.all([
        paymentsApi.getPayments(mergedParams),
        paymentsApi.getSummary(queryParams),
        paymentsApi.getFailureTrends(queryParams)
      ]);

      setPayments(listRes.data || []);
      setMeta(listRes.meta || null);
      setSummary(summaryRes.data || null);
      setTrends(trendsRes.data?.trends || []);
    } catch (err) {
      setError(err.message || 'Failed to load payments telemetry');
    } finally {
      setLoading(false);
    }
  }, [queryParams, JSON.stringify(filters)]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments, refreshTrigger]);

  return {
    payments,
    meta,
    summary,
    trends,
    loading,
    error,
    refetch: fetchPayments
  };
}
