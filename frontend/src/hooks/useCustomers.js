import { useState, useEffect, useCallback } from 'react';
import { customersApi } from '../services/api';
import { useDateRange } from '../context/DateRangeContext';

export function useCustomers(filters = {}) {
  const { refreshTrigger } = useDateRange();
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [atRiskData, setAtRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, atRiskRes] = await Promise.all([
        customersApi.getCustomers(filters),
        customersApi.getAtRisk()
      ]);

      setCustomers(listRes.data || []);
      setMeta(listRes.meta || null);
      setAtRiskData(atRiskRes.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load customer telemetry');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers, refreshTrigger]);

  return {
    customers,
    meta,
    atRiskData,
    loading,
    error,
    refetch: fetchCustomers
  };
}
