import { useState, useEffect, useCallback } from 'react';
import { inventoryApi } from '../services/api';
import { useDateRange } from '../context/DateRangeContext';

export function useInventory(filters = {}) {
  const { refreshTrigger } = useDateRange();
  const [inventory, setInventory] = useState([]);
  const [meta, setMeta] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [stockoutRisks, setStockoutRisks] = useState([]);
  const [healthSummary, setHealthSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, lowStockRes, riskRes, healthRes] = await Promise.all([
        inventoryApi.getInventory(filters),
        inventoryApi.getLowStock(),
        inventoryApi.getStockoutRisk(),
        inventoryApi.getHealthSummary()
      ]);

      setInventory(listRes.data || []);
      setMeta(listRes.meta || null);
      setLowStock(lowStockRes.data || []);
      setStockoutRisks(riskRes.data || []);
      setHealthSummary(healthRes.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory, refreshTrigger]);

  return {
    inventory,
    meta,
    lowStock,
    stockoutRisks,
    healthSummary,
    loading,
    error,
    refetch: fetchInventory
  };
}
