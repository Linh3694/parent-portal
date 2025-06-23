// Hàm xác định tiết học hiện tại dựa trên thời gian thực và thời khoá biểu
// timetable: mảng các tiết học, mỗi tiết có timeSlot.dayOfWeek, timeSlot.startTime, timeSlot.endTime
// timeSlot.startTime, endTime dạng "HH:mm" (VD: "07:00")
export function getCurrentLesson(timetable: any[]): any | null {
    const now = new Date();

    // Map JS getDay() sang tên tiếng Anh
    const daysOfWeek = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ];
    const today = daysOfWeek[now.getDay()];

    // Giờ hiện tại dạng "HH:mm"
    const pad = (n: number) => n.toString().padStart(2, '0');
    const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // Lọc tiết học đúng thứ và đúng khoảng thời gian
    for (const lesson of timetable) {
        const lessonDay = lesson.timeSlot?.dayOfWeek || lesson.dayOfWeek;
        const startTime = lesson.timeSlot?.startTime || lesson.startTime;
        const endTime = lesson.timeSlot?.endTime || lesson.endTime;
        if (lessonDay === today && startTime && endTime && currentTime >= startTime && currentTime < endTime) {
            return lesson;
        }
    }
    return null;
} 