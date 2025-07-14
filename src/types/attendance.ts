export interface Attendance {
    _id?: string;
    student: {
        _id: string;
        name: string;
        studentCode: string;
        avatarUrl?: string;
    };
    class: {
        _id: string;
        className: string;
    };
    teacher: {
        _id: string;
        fullname: string;
    };
    subject: {
        _id: string;
        name: string;
    };
    date: string;
    periodNumber: number;
    periodStartTime: string;
    periodEndTime: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    note?: string;
    checkIn?: string;
    checkOut?: string;
    absenceType?: 'full_day' | 'morning' | 'afternoon';
    leaveRequest?: {
        _id: string;
        reason: string;
        description?: string;
        leaveType: 'full_day' | 'morning' | 'afternoon';
    };
    createdAt: string;
    updatedAt: string;
}

export interface AttendanceSummary {
    date: string;
    totalPeriods: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
}

export interface AttendanceByDate {
    date: string;
    attendances: Attendance[];
    summary: AttendanceSummary;
}

export interface TimeAttendance {
    studentCode: string;
    checkIn?: string;
    checkOut?: string;
    totalCheckIns: number;
}

export interface LeaveRequest {
    _id: string;
    student: {
        _id: string;
        name: string;
        studentCode: string;
    };
    reason: string;
    description?: string;
    startDate: string;
    endDate: string;
    leaveType: 'full_day' | 'morning' | 'afternoon';
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
} 