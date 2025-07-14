import { BASE_URL } from '../config/api.config';
import { 
    Student, 
    StudentAvatarCache, 
    Period, 
    ClassInfo, 
    TimetableEntry,
    DateDisplay
} from '../types';
import { PERIOD_TYPE_LABELS } from '../types/period';

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Helper function để tạo avatar URL nhất quán
export const getAvatarUrl = (student: Student, avatarCache: StudentAvatarCache) => {
    const studentId = student.id || student._id;
    const studentName = student.name || student.fullname || student.studentName || 'Unknown';
    return avatarCache[studentId || ''] || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=E0E0E0&color=757575&size=128`;
};



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
                // Kiểm tra có period nào trùng khoảng này không
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
        console.log('🚫 No timetable data available for getCurrentLesson');
        return null;
    }

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Chỉ xử lý ngày học (Monday-Friday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        console.log('🚫 Weekend - no lessons');
        return null; // Cuối tuần không có tiết học
    }
    
    const currentDay = DAYS_OF_WEEK[dayOfWeek - 1]; // Convert to Monday=0, Tuesday=1, etc.
    const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    console.log('🔍 getCurrentLesson - Looking for lesson on:', currentDay, 'at:', currentTime);
    
    // Log all available lessons for debugging
    const todaysLessons = timetable.filter(lesson => {
        const day = lesson.timeSlot?.dayOfWeek || lesson.dayOfWeek;
        return day === currentDay;
    });
    
    console.log('📚 Available lessons today:', todaysLessons.map(lesson => ({
        subject: lesson.subject?.name || lesson.label || 'Unknown',
        startTime: lesson.timeSlot?.startTime || lesson.startTime,
        endTime: lesson.timeSlot?.endTime || lesson.endTime,
        periodNumber: lesson.periodNumber
    })));

    const currentLesson = timetable.find(lesson => {
        const day = lesson.timeSlot?.dayOfWeek || lesson.dayOfWeek;
        const startTime = lesson.timeSlot?.startTime || lesson.startTime;
        const endTime = lesson.timeSlot?.endTime || lesson.endTime;

        const isRightDay = day === currentDay;
        const isInTime = startTime && endTime && startTime <= currentTime && currentTime < endTime; // Thay đổi <= thành <

        if (isRightDay && isInTime) {
            console.log('✅ Found current lesson:', {
                subject: lesson.subject?.name || lesson.label || 'Unknown',
                startTime,
                endTime,
                currentTime
            });
        }

        return isRightDay && isInTime;
    });

    if (!currentLesson) {
        console.log('🚫 No current lesson found');
    }

    return currentLesson || null;
};

export function mergeTimetableData(periods: Period[], timetable: TimetableEntry[], dayOfWeek: string): TimetableEntry[] {
    console.log('🔄 Merging timetable data for day:', dayOfWeek);
    console.log('🔄 Available periods:', periods.length);
    console.log('🔄 Available timetable entries:', timetable.length);
    
    // Filter timetable for current day
    const dayTimetable = timetable.filter(t => {
        const day = t.timeSlot?.dayOfWeek || t.dayOfWeek;
        return day === dayOfWeek;
    });
    
    console.log('🔄 Timetable entries for', dayOfWeek, ':', dayTimetable.length);
    
    const merged = periods.map((period, index) => {
        // Thử nhiều cách matching khác nhau
        let realLesson = null;
        
        // 1. Match theo periodNumber nếu có
        if (period.periodNumber) {
            realLesson = dayTimetable.find(t => 
                t.periodNumber === period.periodNumber
            );
        }
        
        // 2. Match theo thời gian chính xác
        if (!realLesson) {
            realLesson = dayTimetable.find(t => {
                const tStartTime = t.timeSlot?.startTime || t.startTime;
                const tEndTime = t.timeSlot?.endTime || t.endTime;
                return tStartTime === period.startTime && tEndTime === period.endTime;
            });
        }
        
        // 3. Match theo thứ tự index (fallback khi không có periodNumber và thời gian không khớp)
        if (!realLesson && dayTimetable.length > index) {
            // Sắp xếp timetable theo thời gian và lấy theo index
            const sortedTimetable = [...dayTimetable].sort((a, b) => {
                const aStart = a.timeSlot?.startTime || a.startTime;
                const bStart = b.timeSlot?.startTime || b.startTime;
                return (aStart || '').localeCompare(bStart || '');
            });
            
            if (sortedTimetable[index]) {
                realLesson = sortedTimetable[index];
                console.log('📍 Using index-based matching for period', period.periodNumber, 'with lesson:', realLesson.subject?.name);
            }
        }
        
        // 4. Match theo khoảng thời gian overlap (linh hoạt hơn)
        if (!realLesson) {
            realLesson = dayTimetable.find(t => {
                const tStartTime = t.timeSlot?.startTime || t.startTime;
                const tEndTime = t.timeSlot?.endTime || t.endTime;
                
                if (!tStartTime || !tEndTime || !period.startTime || !period.endTime) return false;
                
                // Kiểm tra overlap: lesson bắt đầu trước period kết thúc và kết thúc sau period bắt đầu
                const lessonStart = tStartTime.replace(':', '');
                const lessonEnd = tEndTime.replace(':', '');
                const periodStart = period.startTime.replace(':', '');
                const periodEnd = period.endTime.replace(':', '');
                
                return lessonStart <= periodEnd && lessonEnd >= periodStart;
            });
        }
        
        if (realLesson) {
            console.log('✅ Found real lesson for period', period.periodNumber, ':', realLesson.subject?.name || 'Unknown subject');
            
            // Log để debug
            console.log('🔍 realLesson data:', {
                id: realLesson._id,
                subject: realLesson.subject?.name,
                timeSlot: realLesson.timeSlot,
                startTime: realLesson.startTime,
                endTime: realLesson.endTime
            });
            
            return {
                _id: realLesson._id,
                subject: realLesson.subject,
                teachers: realLesson.teachers,
                periodNumber: period.periodNumber,
                dayOfWeek: dayOfWeek,
                startTime: realLesson.timeSlot?.startTime || realLesson.startTime,
                endTime: realLesson.timeSlot?.endTime || realLesson.endTime,
                timeSlot: realLesson.timeSlot || {
                    dayOfWeek: dayOfWeek,
                    startTime: realLesson.startTime || period.startTime,
                    endTime: realLesson.endTime || period.endTime
                },
            } as TimetableEntry;
        }
        
        // Return period as empty timetable entry with subject name for special periods
        const periodName = period.label || (period.type !== 'regular' ? 
            (period.type && PERIOD_TYPE_LABELS[period.type]) || period.type : 
            `Tiết ${period.periodNumber}`);
        
        return {
            ...period,
            dayOfWeek: dayOfWeek,
            subject: {
                name: periodName,
                _id: `special-${period.periodNumber}`,
                code: period.type || 'special'
            },
            timeSlot: {
                dayOfWeek: dayOfWeek,
                startTime: period.startTime,
                endTime: period.endTime
            }
        } as TimetableEntry;
    });
    
    console.log('✅ Merged timetable entries:', merged.length);
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