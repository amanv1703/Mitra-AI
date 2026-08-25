import { useState, useEffect, useCallback } from 'react';
import { ordersApi } from '../services/api';
import { useDateRange } from '../context/DateRangeContext';

export function useOrders(filters = {}) {
  const { queryParams, refreshTrigger } = useDateRange();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mergedParams = {
        ...queryParams,
        ...filters
      };

      const [listRes, summaryRes] = await Promise.all([
        ordersApi.getOrders(mergedParams),
        ordersApi.getSummary(queryParams)
      ]);

      setOrders(listRes.data || []);
      setMeta(listRes.meta || null);
      setSummary(summaryRes.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load orders data');
    } finally {
      setLoading(false);
    }
  }, [queryParams, JSON.stringify(filters)]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, refreshTrigger]);

  return {
    orders,
    meta,
    summary,
    loading,
    error,
    refetch: fetchOrders
  };
}
