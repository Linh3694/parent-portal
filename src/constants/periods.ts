// Centralized period definitions để đảm bảo consistency
// Thay thế tất cả hardcoded fallback periods

export const STANDARD_PERIODS = [
    { periodNumber: 1, startTime: "07:00", endTime: "07:45", label: "Tiết 1" },
    { periodNumber: 2, startTime: "07:50", endTime: "08:35", label: "Tiết 2" },
    { periodNumber: 3, startTime: "08:40", endTime: "09:25", label: "Tiết 3" },
    { periodNumber: 4, startTime: "09:40", endTime: "10:25", label: "Tiết 4" },
    { periodNumber: 5, startTime: "10:30", endTime: "11:15", label: "Tiết 5" },
    { periodNumber: 6, startTime: "13:00", endTime: "13:45", label: "Tiết 6" },
    { periodNumber: 7, startTime: "13:50", endTime: "14:35", label: "Tiết 7" },
    { periodNumber: 8, startTime: "14:40", endTime: "15:25", label: "Tiết 8" },
    { periodNumber: 9, startTime: "15:40", endTime: "16:25", label: "Tiết 9" },
    { periodNumber: 10, startTime: "16:30", endTime: "17:15", label: "Tiết 10" }
];

// Thời gian biểu rút gọn cho một số màn hình (nếu cần)
export const COMPACT_PERIODS = [
    { periodNumber: 1, startTime: "08:00", endTime: "08:45", label: "Tiết 1", type: 'regular' },
    { periodNumber: 2, startTime: "08:50", endTime: "09:35", label: "Tiết 2", type: 'regular' },
    { periodNumber: 3, startTime: "09:40", endTime: "10:25", label: "Tiết 3", type: 'regular' },
    { periodNumber: 4, startTime: "10:30", endTime: "11:15", label: "Tiết 4", type: 'regular' },
    { periodNumber: 5, startTime: "11:20", endTime: "12:05", label: "Tiết 5", type: 'regular' },
    { periodNumber: 6, startTime: "13:00", endTime: "13:45", label: "Tiết 6", type: 'regular' },
    { periodNumber: 7, startTime: "13:50", endTime: "14:35", label: "Tiết 7", type: 'regular' },
    { periodNumber: 8, startTime: "14:40", endTime: "15:25", label: "Tiết 8", type: 'regular' },
    { periodNumber: 9, startTime: "15:30", endTime: "16:15", label: "Tiết 9", type: 'regular' },
];

// Thời gian cho progress bar
export const DAY_SCHEDULE = {
    startTime: "07:00",
    endTime: "17:15",
    displayStart: "07:00",
    displayEnd: "16:15"
};

// Helper functions
export const getStandardPeriods = () => STANDARD_PERIODS;
export const getCompactPeriods = () => COMPACT_PERIODS;
export const getDaySchedule = () => DAY_SCHEDULE; 