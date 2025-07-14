import { PeriodDefinition, ProcessedPeriod, PERIOD_TYPE_LABELS } from '../types/period';

/**
 * Xử lý danh sách period definitions để tạo ra danh sách periods được sắp xếp đúng logic
 * - Regular periods: được đánh số thứ tự từ 1-10
 * - Special periods: giữ nguyên periodNumber từ DB, có label riêng
 * - Tất cả được sắp xếp theo startTime
 */
export const processPeriodDefinitions = (periodDefinitions: PeriodDefinition[]): ProcessedPeriod[] => {
  if (!Array.isArray(periodDefinitions) || periodDefinitions.length === 0) {
    // Fallback khi không có period definitions - tạo 10 tiết regular
    return [...Array(10)].map((_, i) => ({
      number: i + 1,
      label: `Tiết ${i + 1}`,
      time: `${(i + 7).toString().padStart(2, '0')}:00 – ${(i + 8).toString().padStart(2, '0')}:00`,
      type: 'regular',
      start: `${(i + 7).toString().padStart(2, '0')}:00`,
      end: `${(i + 8).toString().padStart(2, '0')}:00`,
      uniqueKey: `regular-${i + 1}`,
      isRegular: true
    }));
  }

  // Tách biệt regular periods và special periods
  const regularPeriods: PeriodDefinition[] = [];
  const specialPeriods: PeriodDefinition[] = [];
  
  // Tạo map để xử lý duplicate periodNumbers cho special periods
  const specialMap = new Map<number, PeriodDefinition>();
  
  periodDefinitions.forEach((p) => {
    if (p.type === "regular") {
      regularPeriods.push(p);
    } else {
      const existing = specialMap.get(p.periodNumber);
      if (!existing) {
        specialMap.set(p.periodNumber, p);
        return;
      }

      // Chọn period có label hoặc có startTime sớm hơn
      const score = (pd: PeriodDefinition) => (pd.label ? 1 : 0);
      const existingScore = score(existing);
      const currentScore = score(p);

      if (
        currentScore > existingScore ||
        (currentScore === existingScore && p.startTime < existing.startTime)
      ) {
        specialMap.set(p.periodNumber, p);
      }
    }
  });

  // Lấy tất cả special periods
  specialPeriods.push(...specialMap.values());

  // Sắp xếp regular periods theo startTime
  regularPeriods.sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  // Tạo danh sách tất cả periods với unique keys
  const allPeriods: ProcessedPeriod[] = [];
  
  // Thêm regular periods với số thứ tự từ 1-10 và unique key
  regularPeriods.forEach((p, index) => {
    allPeriods.push({
      number: index + 1, // Đánh số từ 1-10 bất kể periodNumber trong DB
      label: `Tiết ${index + 1}`,
      time: `${p.startTime} – ${p.endTime}`,
      type: p.type,
      start: p.startTime,
      end: p.endTime,
      uniqueKey: `regular-${index + 1}`, // Unique key để tránh duplicate
      isRegular: true
    });
  });

  // Thêm special periods với unique key
  specialPeriods.forEach((p) => {
    allPeriods.push({
      number: p.periodNumber,
      label: p.label || PERIOD_TYPE_LABELS[p.type] || 'Khác',
      time: `${p.startTime} – ${p.endTime}`,
      type: p.type,
      start: p.startTime,
      end: p.endTime,
      uniqueKey: `special-${p.periodNumber}-${p.type}`, // Unique key để tránh duplicate
      isRegular: false
    });
  });

  // Sắp xếp tất cả theo startTime
  return allPeriods.sort((a, b) => a.start.localeCompare(b.start));
};

/**
 * Lấy danh sách chỉ regular periods (tiết học chính thức)
 */
export const getRegularPeriods = (periodDefinitions: PeriodDefinition[]): ProcessedPeriod[] => {
  const allPeriods = processPeriodDefinitions(periodDefinitions);
  return allPeriods.filter(p => p.isRegular);
};

/**
 * Lấy danh sách chỉ special periods (tiết đặc biệt)
 */
export const getSpecialPeriods = (periodDefinitions: PeriodDefinition[]): ProcessedPeriod[] => {
  const allPeriods = processPeriodDefinitions(periodDefinitions);
  return allPeriods.filter(p => !p.isRegular);
};

/**
 * Tìm period theo number và type
 */
export const findPeriodByNumber = (
  periodDefinitions: PeriodDefinition[], 
  periodNumber: number, 
  isRegular: boolean = true
): ProcessedPeriod | undefined => {
  const allPeriods = processPeriodDefinitions(periodDefinitions);
  return allPeriods.find(p => p.number === periodNumber && p.isRegular === isRegular);
};

/**
 * Chuyển đổi từ periodNumber trong DB sang display number
 * (chỉ dành cho regular periods)
 */
export const getDisplayPeriodNumber = (periodDefinitions: PeriodDefinition[], dbPeriodNumber: number): number => {
  const regularPeriods = periodDefinitions
    .filter(p => p.type === 'regular')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  const index = regularPeriods.findIndex(p => p.periodNumber === dbPeriodNumber);
  return index !== -1 ? index + 1 : dbPeriodNumber;
};

/**
 * Chuyển đổi từ display number sang periodNumber trong DB
 * (chỉ dành cho regular periods)
 */
export const getDbPeriodNumber = (periodDefinitions: PeriodDefinition[], displayNumber: number): number => {
  const regularPeriods = periodDefinitions
    .filter(p => p.type === 'regular')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  
  const period = regularPeriods[displayNumber - 1];
  return period ? period.periodNumber : displayNumber;
};

/**
 * Lấy thông tin thời gian của period
 */
export const getPeriodTime = (periodDefinitions: PeriodDefinition[], periodNumber: number, isRegular: boolean = true): string => {
  const period = findPeriodByNumber(periodDefinitions, periodNumber, isRegular);
  return period?.time || '';
};

/**
 * Kiểm tra xem một period có phải là regular period không
 */
export const isRegularPeriod = (periodDefinitions: PeriodDefinition[], periodNumber: number): boolean => {
  const period = findPeriodByNumber(periodDefinitions, periodNumber);
  return period?.isRegular || false;
}; 