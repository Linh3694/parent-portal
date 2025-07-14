import { BASE_URL } from '../config/api.config';
import { 
    Student, 
    StudentAvatarCache, 
    Period, 
    SpecialLesson, 
    ClassInfo, 
    TimetableEntry,
    DateDisplay
} from '../types';

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Helper function để tạo avatar URL nhất quán
export const getAvatarUrl = (student: Student, avatarCache: StudentAvatarCache) => {
    const studentId = student.id || student._id;
    const studentName = student.name || student.fullname || student.studentName || 'Unknown';
    return avatarCache[studentId || ''] || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=E0E0E0&color=757575&size=128`;
};

export function mergePeriodsAndSpecialLessons(
    periods: TimetableEntry[],
    specialLessons: SpecialLesson[],
    dayOfWeek: string
): TimetableEntry[] {
    // Lấy periods và specialLessons của ngày này
    const periodsOfDay = periods.map(p => ({ ...p, dayOfWeek }));
    const specialsOfDay = specialLessons
        .filter(s => s.dayOfWeek === dayOfWeek || s.dayOfWeek === 'All')
        .map(s => ({ ...s, periodNumber: undefined }));

    // Gộp và sort theo startTime
    const all = [...periodsOfDay, ...specialsOfDay].sort(
        (a, b) => (a.startTime || '').localeCompare(b.startTime || '')
    );

    // Nếu muốn ưu tiên period, loại bỏ specialLesson trùng time với period
    const result: TimetableEntry[] = [];
    for (let i = 0; i < all.length; i++) {
        const cur = all[i];
        // Nếu là specialLesson, kiểm tra có period nào trùng time không
        if (!cur.periodNumber) {
            const overlap = periodsOfDay.find(
                p =>
                    p.startTime && cur.startTime && p.endTime &&
                    (p.startTime <= cur.startTime && cur.startTime < p.endTime) ||
                    (cur.startTime && p.startTime && cur.startTime <= p.startTime && p.startTime < cur.startTime)
            );
            if (overlap) continue; // bỏ qua specialLesson trùng period
        }
        result.push(cur as TimetableEntry);
    }
    return result;
}

export function extractGradeLevel(classInfo: ClassInfo | null): number | null {
    if (!classInfo || !classInfo.gradeLevel) return null;
    if (typeof classInfo.gradeLevel === 'object') {
        const code = classInfo.gradeLevel.code || classInfo.gradeLevel.name;
        if (typeof code === 'string') {
            const match = code.match(/\d+/);
            if (match) return parseInt(match[0], 10);
        }
    }
    if (typeof classInfo.gradeLevel === 'number') return classInfo.gradeLevel;
    if (typeof classInfo.gradeLevel === 'string' && /^\d+$/.test(classInfo.gradeLevel)) {
        return parseInt(classInfo.gradeLevel, 10);
    }
    return null;
}

export function insertBreaksToTimetable(timetable: TimetableEntry[]): TimetableEntry[] {
    let result: TimetableEntry[] = [];
    for (const day of DAYS_OF_WEEK) {
        const lessons = timetable.filter(item =>
            (item.timeSlot?.dayOfWeek || item.dayOfWeek) === day
        ).sort((a, b) => {
            const aStart = a.timeSlot?.startTime || a.startTime;
            const bStart = b.timeSlot?.startTime || b.startTime;
            return (aStart || '').localeCompare(bStart || '');
        });

        for (let i = 0; i < lessons.length; i++) {
            result.push(lessons[i]);
            if (i < lessons.length - 1) {
                const endCurrent = lessons[i].timeSlot?.endTime || lessons[i].endTime;
                const startNext = lessons[i + 1].timeSlot?.startTime || lessons[i + 1].startTime;
                // Kiểm tra có specialLesson nào trùng khoảng này không
                const hasSpecial = lessons.some(
                    (l, idx) =>
                        idx !== i &&
                        (l.startTime || l.timeSlot?.startTime) === endCurrent &&
                        (l.endTime || l.timeSlot?.endTime) === startNext
                );
                if (endCurrent && startNext && endCurrent !== startNext && !hasSpecial) {
                    result.push({
                        name: "Nghỉ giữa giờ",
                        dayOfWeek: day,
                        startTime: endCurrent,
                        endTime: startNext,
                        description: "Nghỉ giải lao giữa các tiết"
                    });
                }
            }
        }
    }
    return result;
}

export const getCurrentLesson = (timetable: TimetableEntry[]): TimetableEntry | null => {
    if (!timetable || timetable.length === 0) {
        return null;
    }

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Chỉ xử lý ngày học (Monday-Friday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return null; // Cuối tuần không có tiết học
    }
    
    const currentDay = DAYS_OF_WEEK[dayOfWeek - 1]; // Convert to Monday=0, Tuesday=1, etc.
    const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    const currentLesson = timetable.find(lesson => {
        const day = lesson.timeSlot?.dayOfWeek || lesson.dayOfWeek;
        const startTime = lesson.timeSlot?.startTime || lesson.startTime;
        const endTime = lesson.timeSlot?.endTime || lesson.endTime;

        const isRightDay = day === currentDay;
        const isInTime = startTime && endTime && startTime <= currentTime && currentTime <= endTime;

        return isRightDay && isInTime;
    });

    return currentLesson || null;
};

export function mergeTimetableData(periods: Period[], timetable: TimetableEntry[], dayOfWeek: string): TimetableEntry[] {
    const merged = periods.map(period => {
        // Tìm entry thực tế trong timetable ứng với period này
        const realLesson = timetable.find(
            t =>
                (t.timeSlot?.dayOfWeek || t.dayOfWeek) === dayOfWeek &&
                (t.timeSlot?.startTime || t.startTime) === period.startTime &&
                (t.timeSlot?.endTime || t.endTime) === period.endTime
        );
        
        if (realLesson) {
            return {
                ...period,
                subject: realLesson.subject, // subject là object { name, ... }
                teachers: realLesson.teachers,
                timeSlot: realLesson.timeSlot,
            } as TimetableEntry;
        }
        return period as TimetableEntry;
    });
    
    return merged;
}

// Thêm hàm tính phần trăm tiến trình thời gian trong ngày
export function getDayProgress(now: Date): number {
    // Giới hạn thời gian trong khoảng 08:00 - 16:15
    const start = new Date(now);
    start.setHours(8, 0, 0, 0);
    const end = new Date(now);
    end.setHours(16, 15, 0, 0);
    if (now < start) return 0;
    if (now > end) return 100;
    const total = end.getTime() - start.getTime();
    const current = now.getTime() - start.getTime();
    return Math.min(100, Math.max(0, (current / total) * 100));
}

// Helper function để tạo danh sách ngày gần nhất
export function getRecentDates(): DateDisplay[] {
    const days: DateDisplay[] = [];
    let d = new Date();
    while (days.length < 3) {
        const dow = d.getDay();          // 0 = Sun … 6 = Sat
        if (dow !== 0 && dow !== 6) {    // Bỏ T7‑CN
            const iso = d.toISOString().split('T')[0];                    // yyyy‑MM‑dd
            const display = d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'numeric' }); // 07/5
            days.push({ date: iso, display });
        }
        d.setDate(d.getDate() - 1);
    }
    return days;
}

// Helper function để tạo avatar URL từ student data
export function createStudentAvatarUrl(student: Student): string {
    const studentName = student.name || student.fullname || student.studentName || 'Unknown';
    
    if (student.avatarUrl && student.avatarUrl.trim()) {
        return student.avatarUrl.startsWith('http') 
            ? student.avatarUrl 
            : `${BASE_URL}${encodeURI(student.avatarUrl)}`;
    }
    
    if (student.user?.avatarUrl && student.user.avatarUrl.trim()) {
        return student.user.avatarUrl.startsWith('http') 
            ? student.user.avatarUrl 
            : `${BASE_URL}${encodeURI(student.user.avatarUrl)}`;
    }
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=E0E0E0&color=757575&size=128`;
} 