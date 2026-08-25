import { useState, useEffect, useCallback } from 'react';
import { detectionApi } from '../services/api';
import { useDateRange } from '../context/DateRangeContext';

export function useDetections() {
  const { refreshTrigger } = useDateRange();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await detectionApi.getAll();
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to evaluate anomaly detectors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDetections();
  }, [fetchDetections, refreshTrigger]);

  return {
    detections: data?.detections || [],
    activeCount: data?.activeAnomaliesCount || 0,
    totalCount: data?.totalDetectorsEvaluated || 0,
    timestamp: data?.timestamp,
    loading,
    error,
    refetch: fetchDetections
  };
}
