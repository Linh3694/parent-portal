import { useState, useEffect } from 'react';
import { attendanceService } from '../services/attendanceService';
import { AttendanceRecord, TimeAttendanceRecord } from '../types/attendance';
import { format } from 'date-fns';
import { AxiosError } from 'axios';

interface UseAttendanceProps {
  classId?: string;
  date?: Date;
  studentCodes?: string[];
}

interface UseAttendanceResult {
  loading: boolean;
  error: string | null;
  attendanceRecords: AttendanceRecord[];
  timeAttendanceRecords: Record<string, TimeAttendanceRecord>;
  refreshData: () => Promise<void>;
}

export const useAttendance = ({
  classId,
  date = new Date(),
  studentCodes = [],
}: UseAttendanceProps): UseAttendanceResult => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [timeAttendanceRecords, setTimeAttendanceRecords] = useState<Record<string, TimeAttendanceRecord>>({});

  const formattedDate = format(date, 'yyyy-MM-dd');

  const fetchData = async () => {
    // Kiểm tra xem classId có tồn tại không
    if (!classId) {
      setLoading(false);
      setError('Thiếu thông tin lớp học');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Lấy dữ liệu điểm danh
      const attendanceData = await attendanceService.getAttendanceByDate(classId, formattedDate);
      setAttendanceRecords(attendanceData);

      // Lấy dữ liệu chấm công nếu có mã học sinh
      if (studentCodes.length > 0) {
        try {
          const timeAttendanceData = await attendanceService.getTimeAttendance(formattedDate, studentCodes);
          setTimeAttendanceRecords(timeAttendanceData);
        } catch (timeErr) {
          console.error('Error fetching time attendance data:', timeErr);
          // Không hiển thị lỗi này cho người dùng, chỉ ghi log
        }
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      
      // Xử lý lỗi chi tiết hơn
      if (err instanceof AxiosError) {
        if (err.response?.status === 404) {
          setError('Không tìm thấy dữ liệu điểm danh. Vui lòng kiểm tra lại thông tin lớp học và học sinh.');
        } else if (err.response?.status === 401) {
          setError('Bạn không có quyền truy cập dữ liệu này.');
        } else if (err.response?.status === 500) {
          setError('Máy chủ gặp sự cố. Vui lòng thử lại sau.');
        } else if (err.code === 'ERR_NETWORK') {
          setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
        } else {
          setError(`Không thể tải dữ liệu điểm danh (${err.response?.status || 'Lỗi kết nối'}). Vui lòng thử lại sau.`);
        }
      } else {
        setError('Không thể tải dữ liệu điểm danh. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classId, formattedDate]);

  return {
    loading,
    error,
    attendanceRecords,
    timeAttendanceRecords,
    refreshData: fetchData,
  };
}; 