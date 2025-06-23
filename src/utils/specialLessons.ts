// Định nghĩa các tiết đặc biệt cho từng khối gradeLevel
// Có thể mở rộng thêm các khối khác nếu cần

export type SpecialLesson = {
    name: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    description?: string;
};

export const specialLessonsByGradeLevel: {
    [key: string]: SpecialLesson[];
} = {
    '1-5': [
        {
            name: 'Ăn sáng',
            dayOfWeek: 'All',
            startTime: '07:30',
            endTime: '07:55',
            description: 'Đón học sinh, ăn sáng'
        },
        {
            name: 'Ra chơi',
            dayOfWeek: 'All',
            startTime: '09:41',
            endTime: '09:59',
            description: 'Học sinh ra chơi'
        },
        {
            name: 'Ăn trưa',
            dayOfWeek: 'All',
            startTime: '11:01',
            endTime: '11:40',
            description: 'Ăn trưa'
        },
        {
            name: 'Ngủ trưa',
            dayOfWeek: 'All',
            startTime: '11:41',
            endTime: '12:40',
            description: 'Học sinh ngủ trưa'
        },
        {
            name: 'Ăn nhẹ',
            dayOfWeek: 'All',
            startTime: '14:00',
            endTime: '14:20',
            description: 'Ăn nhẹ'
        },
        {
            name: 'Sinh hoạt lớp',
            dayOfWeek: 'All',
            startTime: '16:00',
            endTime: '16:15',
            description: 'Sinh hoạt lớp'
        },
    ],
    '6-9': [
        // Thêm tiết đặc biệt cho khối 6-9 ở đây
    ],
    '10-12': [
        // Thêm tiết đặc biệt cho khối 10-12 ở đây
    ]
};

// Hàm lấy tiết đặc biệt theo gradeLevel
export function getSpecialLessonsForGradeLevel(gradeLevel: number): SpecialLesson[] {
    if (gradeLevel >= 1 && gradeLevel <= 5) return specialLessonsByGradeLevel['1-5'];
    if (gradeLevel >= 6 && gradeLevel <= 9) return specialLessonsByGradeLevel['6-9'];
    if (gradeLevel >= 10 && gradeLevel <= 12) return specialLessonsByGradeLevel['10-12'];
    return [];
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function expandSpecialLessons(specialLessons: SpecialLesson[]): SpecialLesson[] {
    const expanded: SpecialLesson[] = [];
    for (const lesson of specialLessons) {
        if (lesson.dayOfWeek === 'All') {
            daysOfWeek.forEach(day => {
                expanded.push({ ...lesson, dayOfWeek: day });
            });
        } else {
            expanded.push(lesson);
        }
    }
    return expanded;
} 