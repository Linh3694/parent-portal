import { Attendance, AttendanceSummary, TimeAttendance, LeaveRequest } from '../types';
import { PeriodDefinition, ProcessedPeriod } from '../types/period';
import { processPeriodDefinitions, getDisplayPeriodNumber } from './periodHelpers';

// Helper để tính tỷ lệ điểm danh
export const calculateAttendanceRate = (attendances: Attendance[]): number => {
    if (attendances.length === 0) return 0;
    
    const presentCount = attendances.filter(a => a.status === 'present').length;
    return Math.round((presentCount / attendances.length) * 100);
};

// Helper để tạo summary cho một ngày
export const createAttendanceSummary = (attendances: Attendance[], date: string): AttendanceSummary => {
    const present = attendances.filter(a => a.status === 'present').length;
    const absent = attendances.filter(a => a.status === 'absent').length;
    const late = attendances.filter(a => a.status === 'late').length;
    const excused = attendances.filter(a => a.status === 'excused').length;
    const totalPeriods = attendances.length;
    
    return {
        date,
        totalPeriods,
        present,
        absent,
        late,
        excused,
        attendanceRate: calculateAttendanceRate(attendances)
    };
};

// Helper để format thời gian
export const formatTime = (time: string): string => {
    if (!time) return '';
    return time.slice(0, 5); // Lấy HH:MM
};

// Helper để lấy status text
export const getStatusText = (status: string): string => {
    const statusMap: { [key: string]: string } = {
        'present': 'Có mặt',
        'absent': 'Vắng mặt',
        'late': 'Đi muộn',
        'excused': 'Có phép'
    };
    return statusMap[status] || status;
};

// Helper để lấy status color
export const getStatusColor = (status: string): string => {
    const colorMap: { [key: string]: string } = {
        'present': '#10B981', // green
        'absent': '#EF4444', // red
        'late': '#F59E0B', // yellow
        'excused': '#8B5CF6' // purple
    };
    return colorMap[status] || '#6B7280';
};

// Helper để kiểm tra xem có leave request cho ngày này không
export const hasLeaveRequestForDate = (leaveRequests: LeaveRequest[], date: string): LeaveRequest | null => {
    return leaveRequests.find(lr => {
        const startDate = new Date(lr.startDate);
        const endDate = new Date(lr.endDate);
        const checkDate = new Date(date);
        
        return checkDate >= startDate && checkDate <= endDate;
    }) || null;
};

// Helper để format lý do nghỉ phép
export const formatLeaveReason = (leaveRequest: LeaveRequest): string => {
    const reasonMap: { [key: string]: string } = {
        'sick': 'Con bị ốm',
        'family': 'Gia đình có việc bận',
        'bereavement': 'Gia đình có việc hiếu',
        'other': 'Lý do khác'
    };
    
    const reason = reasonMap[leaveRequest.reason] || leaveRequest.reason;
    
    if (leaveRequest.reason === 'other' && leaveRequest.description) {
        return `${reason}: ${leaveRequest.description}`;
    }
    
    return reason;
};

// Helper để format loại nghỉ phép
export const formatLeaveType = (leaveType: string): string => {
    const typeMap: { [key: string]: string } = {
        'full_day': 'Cả ngày',
        'morning': 'Buổi sáng',
        'afternoon': 'Buổi chiều'
    };
    return typeMap[leaveType] || leaveType;
};

// Helper để sắp xếp attendances theo thứ tự tiết học
export const sortAttendancesByPeriod = (attendances: Attendance[]): Attendance[] => {
    return [...attendances].sort((a, b) => a.periodNumber - b.periodNumber);
};

// Helper để sắp xếp attendances theo thứ tự tiết học với period definitions
export const sortAttendancesByPeriodWithDefinitions = (
    attendances: Attendance[], 
    periodDefinitions: PeriodDefinition[]
): Attendance[] => {
    const processedPeriods = processPeriodDefinitions(periodDefinitions);
    
    return [...attendances].sort((a, b) => {
        const periodA = processedPeriods.find(p => 
            p.isRegular && p.number === getDisplayPeriodNumber(periodDefinitions, a.periodNumber)
        );
        const periodB = processedPeriods.find(p => 
            p.isRegular && p.number === getDisplayPeriodNumber(periodDefinitions, b.periodNumber)
        );
        
        if (!periodA || !periodB) {
            return a.periodNumber - b.periodNumber;
        }
        
        return periodA.start.localeCompare(periodB.start);
    });
};

// Helper để tạo attendance items cho hiển thị với period definitions
export const createAttendanceItems = (
    attendances: Attendance[],
    timeAttendanceInfo: { checkIn: string; checkOut: string },
    periodDefinitions: PeriodDefinition[]
): Array<{
    type: 'checkin' | 'checkout' | 'period' | 'special';
    label: string;
    time?: string;
    status: string;
    note?: string;
    sortOrder: number;
    periodData?: ProcessedPeriod;
}> => {
    const items: Array<any> = [];
    const processedPeriods = processPeriodDefinitions(periodDefinitions);
    
    // 1. Thêm Check-in đầu tiên nếu có
    if (timeAttendanceInfo.checkIn && timeAttendanceInfo.checkIn.trim() !== '') {
        items.push({
            type: 'checkin',
            label: 'Checkin',
            time: timeAttendanceInfo.checkIn,
            status: 'present',
            sortOrder: 0 // Đảm bảo luôn đầu tiên
        });
    }
    
    // 2. Thêm các tiết học theo thứ tự từ processedPeriods
    const sortedAttendances = [...attendances].sort((a, b) => a.periodNumber - b.periodNumber);
    
    // Lặp qua tất cả processed periods để đảm bảo thứ tự đúng
    processedPeriods.forEach((period) => {
        if (period.isRegular) {
            // Tìm attendance tương ứng với period này
            const attendance = sortedAttendances.find(a => 
                getDisplayPeriodNumber(periodDefinitions, a.periodNumber) === period.number
            );
            
            if (attendance) {
                items.push({
                    type: 'period',
                    label: period.label,
                    time: attendance.status === 'present' || attendance.status === 'late' ? attendance.periodStartTime : undefined,
                    status: attendance.status,
                    note: attendance.status === 'excused' ? 'Vắng có phép' : attendance.status === 'absent' ? 'Vắng không phép' : undefined,
                    sortOrder: 1000 + period.number,
                    periodData: period
                });
            }
        } else {
            // Tiết đặc biệt - hiển thị thông tin period
            items.push({
                type: 'special',
                label: period.label,
                time: period.time,
                status: 'special',
                sortOrder: 1000 + period.number,
                periodData: period
            });
        }
    });
    
    // 3. Thêm Check-out cuối cùng nếu có
    if (timeAttendanceInfo.checkOut && timeAttendanceInfo.checkOut.trim() !== '') {
        items.push({
            type: 'checkout',
            label: 'Checkout',
            time: timeAttendanceInfo.checkOut,
            status: 'present',
            sortOrder: 9999 // Đảm bảo luôn cuối cùng
        });
    }
    
    // Sắp xếp theo sortOrder
    return items.sort((a, b) => a.sortOrder - b.sortOrder);
};

// Helper để lấy period label cho attendance
export const getAttendancePeriodLabel = (
    attendance: Attendance,
    periodDefinitions: PeriodDefinition[]
): string => {
    if (!periodDefinitions.length) {
        return `Tiết ${attendance.periodNumber}`;
    }
    
    const displayNumber = getDisplayPeriodNumber(periodDefinitions, attendance.periodNumber);
    return `Tiết ${displayNumber}`;
};

// Helper để lấy thông tin check-in/check-out từ time attendance
export const getTimeAttendanceInfoForStudent = (
    studentCode: string, 
    timeAttendanceData: { [studentCode: string]: TimeAttendance }
): { checkIn: string; checkOut: string } => {
    const timeAttendance = timeAttendanceData[studentCode];
    
    // Kiểm tra xem có dữ liệu không
    if (!timeAttendance) {
        return { checkIn: '', checkOut: '' };
    }
    
    return {
        checkIn: timeAttendance.checkIn || '',
        checkOut: timeAttendance.checkOut || ''
    };
}; 