// Định nghĩa tiết học (period) trong ngày cho từng khối gradeLevel
// Có thể mở rộng thêm các khối khác nếu cần

export type PeriodDefinition = {
    periodNumber: number;
    startTime: string; // "HH:mm"
    endTime: string;   // "HH:mm"
    label?: string;    // Nhãn hiển thị nếu muốn
};

export const periodDefinitionsByGradeLevel: {
    [key: string]: PeriodDefinition[];
} = {
    '1-5': [
        // Ví dụ:
        { periodNumber: 1, startTime: '08:00', endTime: '08:30' },
        { periodNumber: 2, startTime: '08:35', endTime: '09:05' },
        { periodNumber: 3, startTime: '09:10', endTime: '09:40' },
        { periodNumber: 4, startTime: '10:00', endTime: '10:30' },
        { periodNumber: 5, startTime: '10:35', endTime: '11:05' },
        { periodNumber: 6, startTime: '12:55', endTime: '13:25' },
        { periodNumber: 7, startTime: '13:30', endTime: '14:00' },
        { periodNumber: 8, startTime: '14:20', endTime: '14:50' },
        { periodNumber: 9, startTime: '14:55', endTime: '15:25' },
        { periodNumber: 10, startTime: '15:30', endTime: '16:00' },


    ],
    '6-9': [
        // Thêm tiết học cho khối 6-9 ở đây
    ],
    '10-12': [
        // Thêm tiết học cho khối 10-12 ở đây
    ]
};

// Hàm lấy danh sách tiết học theo gradeLevel
export function getPeriodDefinitionsForGradeLevel(gradeLevel: number): PeriodDefinition[] {
    if (gradeLevel >= 1 && gradeLevel <= 5) return periodDefinitionsByGradeLevel['1-5'];
    if (gradeLevel >= 6 && gradeLevel <= 9) return periodDefinitionsByGradeLevel['6-9'];
    if (gradeLevel >= 10 && gradeLevel <= 12) return periodDefinitionsByGradeLevel['10-12'];
    return [];
} 