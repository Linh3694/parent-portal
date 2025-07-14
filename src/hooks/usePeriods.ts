import { useState, useEffect, useCallback } from 'react';
import { PeriodDefinition, ProcessedPeriod } from '../types/period';
import { processPeriodDefinitions } from '../utils/periodHelpers';
import api from '../config/api.config';

interface UsePeriodsProps {
  schoolYear?: string;
  school?: string;
  classId?: string;
  autoFetch?: boolean;
}

interface UsePeriodsReturn {
  periodDefinitions: PeriodDefinition[];
  processedPeriods: ProcessedPeriod[];
  regularPeriods: ProcessedPeriod[];
  specialPeriods: ProcessedPeriod[];
  loading: boolean;
  error: string | null;
  fetchPeriods: () => Promise<void>;
  refreshPeriods: () => Promise<void>;
}

export const usePeriods = ({
  schoolYear,
  school,
  classId,
  autoFetch = true
}: UsePeriodsProps = {}): UsePeriodsReturn => {
  const [periodDefinitions, setPeriodDefinitions] = useState<PeriodDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPeriods = useCallback(async () => {
    if (!schoolYear || !school) {
      setError('Thiếu thông tin năm học hoặc trường');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Nếu có classId, lấy periods theo class
      if (classId) {
        const response = await api.get(`/attendances/periods/${classId}/${schoolYear}`);
        setPeriodDefinitions(response.data.periods || []);
      } else {
        // Nếu không có classId, lấy periods theo school và schoolYear
        const response = await api.get(`/period-definitions/${schoolYear}`, {
          params: { schoolId: school }
        });
        setPeriodDefinitions(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching periods:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách tiết học');
      setPeriodDefinitions([]);
    } finally {
      setLoading(false);
    }
  }, [schoolYear, school, classId]);

  const refreshPeriods = useCallback(async () => {
    await fetchPeriods();
  }, [fetchPeriods]);

  // Auto fetch when dependencies change
  useEffect(() => {
    if (autoFetch && schoolYear && school) {
      fetchPeriods();
    }
  }, [autoFetch, schoolYear, school, classId, fetchPeriods]);

  // Process periods
  const processedPeriods = processPeriodDefinitions(periodDefinitions);
  const regularPeriods = processedPeriods.filter(p => p.isRegular);
  const specialPeriods = processedPeriods.filter(p => !p.isRegular);

  return {
    periodDefinitions,
    processedPeriods,
    regularPeriods,
    specialPeriods,
    loading,
    error,
    fetchPeriods,
    refreshPeriods
  };
};

// Hook đơn giản chỉ để xử lý periods từ data có sẵn
export const useProcessedPeriods = (periodDefinitions: PeriodDefinition[]) => {
  const processedPeriods = processPeriodDefinitions(periodDefinitions);
  const regularPeriods = processedPeriods.filter(p => p.isRegular);
  const specialPeriods = processedPeriods.filter(p => !p.isRegular);

  return {
    processedPeriods,
    regularPeriods,
    specialPeriods
  };
}; 