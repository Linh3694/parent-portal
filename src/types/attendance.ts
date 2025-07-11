export interface Student {
  _id: string;
  name: string;
  studentCode: string;
  avatarUrl?: string;
}

export interface Subject {
  _id: string;
  name: string;
}

export interface Teacher {
  _id: string;
  fullname: string;
}

export interface TimeAttendanceRecord {
  studentCode: string;
  checkIn: string | null;
  checkOut: string | null;
  totalCheckIns: number;
}

export interface AttendanceRecord {
  _id: string;
  student: Student;
  subject: Subject;
  teacher: Teacher;
  date: string;
  periodNumber: number;
  periodStartTime: string;
  periodEndTime: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkIn?: string;
  checkOut?: string;
  note?: string;
}

export interface TimetableSlot {
  _id: string;
  subject: Subject;
  teachers: Teacher[];
  timeSlot: {
    dayOfWeek: number;
    periodNumber: number;
    startTime: string;
    endTime: string;
  };
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export const AttendanceStatusLabels: Record<AttendanceStatus, string> = {
  present: 'Ra công',
  absent: 'Vắng không phép',
  late: 'Vắng có phép',
  excused: 'Tiết',
};

export const AttendanceStatusColors: Record<AttendanceStatus, string> = {
  present: '#4CAF50', // Xanh lá
  absent: '#F44336', // Đỏ
  late: '#FF9800', // Cam
  excused: '#2196F3', // Xanh dương
}; 