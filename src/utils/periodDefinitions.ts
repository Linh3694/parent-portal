// Định nghĩa tiết học (period) trong ngày cho từng khối gradeLevel
// Có thể mở rộng thêm các khối khác nếu cần

export type PeriodDefinition = {
    periodNumber: number;
    startTime: string; // "HH:mm"
    endTime: string;   // "HH:mm"
    label?: string;    // Nhãn hiển thị nếu muốn
    type?: string;     // Type của period: 'regular', 'lunch', 'nap', etc.
};

export const periodDefinitionsByGradeLevel: {
    [key: string]: PeriodDefinition[];
} = {
    '1-5': [
        // Fallback periods - sẽ được thay thế bởi API
        { periodNumber: 1, startTime: '07:00', endTime: '07:45', label: 'Tiết 1', type: 'regular' },
        { periodNumber: 2, startTime: '07:50', endTime: '08:35', label: 'Tiết 2', type: 'regular' },
        { periodNumber: 3, startTime: '08:40', endTime: '09:25', label: 'Tiết 3', type: 'regular' },
        { periodNumber: 4, startTime: '09:40', endTime: '10:25', label: 'Tiết 4', type: 'regular' },
        { periodNumber: 5, startTime: '10:30', endTime: '11:15', label: 'Tiết 5', type: 'regular' },
        { periodNumber: 6, startTime: '13:00', endTime: '13:45', label: 'Tiết 6', type: 'regular' },
        { periodNumber: 7, startTime: '13:50', endTime: '14:35', label: 'Tiết 7', type: 'regular' },
        { periodNumber: 8, startTime: '14:40', endTime: '15:25', label: 'Tiết 8', type: 'regular' },
        { periodNumber: 9, startTime: '15:40', endTime: '16:25', label: 'Tiết 9', type: 'regular' },
        { periodNumber: 10, startTime: '16:30', endTime: '17:15', label: 'Tiết 10', type: 'regular' },
    ],
    '6-9': [
        // Fallback cho khối 6-9 - sẽ được thay thế bởi API
        { periodNumber: 1, startTime: '07:00', endTime: '07:45', label: 'Tiết 1', type: 'regular' },
        { periodNumber: 2, startTime: '07:50', endTime: '08:35', label: 'Tiết 2', type: 'regular' },
        { periodNumber: 3, startTime: '08:40', endTime: '09:25', label: 'Tiết 3', type: 'regular' },
        { periodNumber: 4, startTime: '09:40', endTime: '10:25', label: 'Tiết 4', type: 'regular' },
        { periodNumber: 5, startTime: '10:30', endTime: '11:15', label: 'Tiết 5', type: 'regular' },
        { periodNumber: 6, startTime: '13:00', endTime: '13:45', label: 'Tiết 6', type: 'regular' },
        { periodNumber: 7, startTime: '13:50', endTime: '14:35', label: 'Tiết 7', type: 'regular' },
        { periodNumber: 8, startTime: '14:40', endTime: '15:25', label: 'Tiết 8', type: 'regular' },
        { periodNumber: 9, startTime: '15:40', endTime: '16:25', label: 'Tiết 9', type: 'regular' },
        { periodNumber: 10, startTime: '16:30', endTime: '17:15', label: 'Tiết 10', type: 'regular' },
    ],
    '10-12': [
        // Fallback cho khối 10-12 - sẽ được thay thế bởi API
        { periodNumber: 1, startTime: '07:00', endTime: '07:45', label: 'Tiết 1', type: 'regular' },
        { periodNumber: 2, startTime: '07:50', endTime: '08:35', label: 'Tiết 2', type: 'regular' },
        { periodNumber: 3, startTime: '08:40', endTime: '09:25', label: 'Tiết 3', type: 'regular' },
        { periodNumber: 4, startTime: '09:40', endTime: '10:25', label: 'Tiết 4', type: 'regular' },
        { periodNumber: 5, startTime: '10:30', endTime: '11:15', label: 'Tiết 5', type: 'regular' },
        { periodNumber: 6, startTime: '13:00', endTime: '13:45', label: 'Tiết 6', type: 'regular' },
        { periodNumber: 7, startTime: '13:50', endTime: '14:35', label: 'Tiết 7', type: 'regular' },
        { periodNumber: 8, startTime: '14:40', endTime: '15:25', label: 'Tiết 8', type: 'regular' },
        { periodNumber: 9, startTime: '15:40', endTime: '16:25', label: 'Tiết 9', type: 'regular' },
        { periodNumber: 10, startTime: '16:30', endTime: '17:15', label: 'Tiết 10', type: 'regular' },
    ]
};

// Hàm lấy danh sách tiết học theo gradeLevel
export function getPeriodDefinitionsForGradeLevel(gradeLevel: number): PeriodDefinition[] {
    if (gradeLevel >= 1 && gradeLevel <= 5) return periodDefinitionsByGradeLevel['1-5'];
    if (gradeLevel >= 6 && gradeLevel <= 9) return periodDefinitionsByGradeLevel['6-9'];
    if (gradeLevel >= 10 && gradeLevel <= 12) return periodDefinitionsByGradeLevel['10-12'];
    return [];
} 