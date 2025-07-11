import api from '../config/api.config';
import { API_ENDPOINTS } from '../config/api.endpoints';

export const attendanceService = {
  /**
   * Lấy dữ liệu điểm danh theo ngày và lớp
   * @param classId ID của lớp
   * @param date Ngày cần lấy dữ liệu (format: YYYY-MM-DD)
   */
  getAttendanceByDate: async (classId: string, date: string) => {
    if (!classId || !date) {
      throw new Error('Thiếu thông tin lớp học hoặc ngày');
    }
    
    try {
      const response = await api.get(API_ENDPOINTS.ATTENDANCE.GET_BY_DATE, {
        params: {
          class: classId,
          date,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi lấy dữ liệu điểm danh cho lớp ${classId} ngày ${date}:`, error);
      throw error;
    }
  },

  /**
   * Lấy dữ liệu thời khóa biểu và điểm danh theo lớp và ngày
   * @param classId ID của lớp
   * @param date Ngày cần lấy dữ liệu (format: YYYY-MM-DD)
   */
  getAttendanceByClassDate: async (classId: string, date: string) => {
    if (!classId || !date) {
      throw new Error('Thiếu thông tin lớp học hoặc ngày');
    }
    
    try {
      const url = API_ENDPOINTS.ATTENDANCE.GET_BY_CLASS_DATE
        .replace(':classId', classId)
        .replace(':date', date);
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi lấy thời khóa biểu cho lớp ${classId} ngày ${date}:`, error);
      throw error;
    }
  },

  /**
   * Lấy dữ liệu chấm công theo ngày và mã học sinh
   * @param date Ngày cần lấy dữ liệu (format: YYYY-MM-DD)
   * @param studentCodes Mảng mã học sinh
   */
  getTimeAttendance: async (date: string, studentCodes: string[]) => {
    if (!date || !studentCodes.length) {
      throw new Error('Thiếu thông tin ngày hoặc mã học sinh');
    }
    
    try {
      const response = await api.get(API_ENDPOINTS.ATTENDANCE.GET_TIME_ATTENDANCE, {
        params: {
          date,
          studentCodes: studentCodes.join(','),
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi lấy dữ liệu chấm công ngày ${date}:`, error);
      throw error;
    }
  },
}; 