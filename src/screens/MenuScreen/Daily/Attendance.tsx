import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Calendar from '../../../components/ui/Calendar';
import { AttendanceItem } from '../../../components/ui/AttendanceItem';
import { useAttendance } from '../../../hooks/useAttendance';
import { AttendanceRecord, AttendanceStatus, AttendanceStatusColors } from '../../../types/attendance';

interface Student {
  _id: string;
  name: string;
  studentCode: string;
  class?: {
    _id: string;
    name: string;
  };
}

interface Parent {
  _id: string;
  students: Student[];
}

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  // Lấy thông tin phụ huynh và học sinh từ AsyncStorage
  useEffect(() => {
    const fetchParentAndStudents = async () => {
      try {
        const parentStr = await AsyncStorage.getItem('parent');
        if (!parentStr) {
          console.log('Không tìm thấy thông tin phụ huynh');
          setLoading(false);
          return;
        }
        
        const parentObj: Parent = JSON.parse(parentStr);
        console.log('Thông tin phụ huynh:', parentObj);
        
        if (parentObj.students && parentObj.students.length > 0) {
          setStudents(parentObj.students);
          // Tự động chọn học sinh đầu tiên
          setSelectedStudent(parentObj.students[0]);
        } else {
          console.log('Không có học sinh nào trong tài khoản phụ huynh');
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin phụ huynh:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParentAndStudents();
  }, []);

  // Sử dụng hook useAttendance với thông tin học sinh thực
  const { loading: attendanceLoading, error, attendanceRecords, timeAttendanceRecords, refreshData } = useAttendance({
    classId: selectedStudent?.class?._id,
    date: selectedDate,
    studentCodes: selectedStudent ? [selectedStudent.studentCode] : [],
  });

  // Nhóm các bản ghi điểm danh theo ngày
  const groupedByDate: Record<string, AttendanceRecord[]> = {};
  attendanceRecords.forEach((record) => {
    const dateStr = format(new Date(record.date), 'yyyy-MM-dd');
    if (!groupedByDate[dateStr]) {
      groupedByDate[dateStr] = [];
    }
    groupedByDate[dateStr].push(record);
  });

  // Lấy danh sách các ngày có điểm danh
  const datesWithAttendance = Object.keys(groupedByDate).map((dateStr) => new Date(dateStr));

  // Lọc các bản ghi điểm danh cho ngày đã chọn
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const recordsForSelectedDate = groupedByDate[selectedDateStr] || [];

  // Sắp xếp theo số tiết
  recordsForSelectedDate.sort((a, b) => a.periodNumber - b.periodNumber);

  // Tính toán thống kê trạng thái điểm danh
  const statusCounts: Record<AttendanceStatus, number> = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  };

  recordsForSelectedDate.forEach((record) => {
    statusCounts[record.status]++;
  });

  // Hiển thị trạng thái mặc định nếu không có dữ liệu
  const showDefaultStatus = recordsForSelectedDate.length === 0;

  // Hiển thị loading khi đang lấy thông tin phụ huynh
  if (loading) {
    return (
      <View className="flex-1 bg-gray-100">
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-lg font-bold text-center">Điểm danh</Text>
        </View>
        <View className="p-5 items-center">
          <ActivityIndicator size="large" color="#E53935" />
          <Text className="mt-2.5 text-gray-600 text-sm">Đang tải thông tin...</Text>
        </View>
      </View>
    );
  }

  // Hiển thị thông báo nếu không có học sinh
  if (students.length === 0) {
    return (
      <View className="flex-1 bg-gray-100">
        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-lg font-bold text-center">Điểm danh</Text>
        </View>
        <View className="p-5 items-center">
          <Text className="text-gray-600 text-center">Không có học sinh nào trong tài khoản</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      <View className="bg-white p-4 border-b border-gray-200">
        <Text className="text-lg font-bold text-center">Điểm danh</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Chọn học sinh nếu có nhiều hơn 1 học sinh */}
        {students.length > 1 && (
          <View className="mb-4">
            <Text className="text-sm font-bold text-gray-800 mb-2">Chọn học sinh:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {students.map((student) => (
                <TouchableOpacity
                  key={student._id}
                  className={`px-3 py-2 rounded-full mr-2 ${
                    selectedStudent?._id === student._id 
                      ? 'bg-red-600' 
                      : 'bg-gray-200'
                  }`}
                  onPress={() => setSelectedStudent(student)}
                >
                  <Text className={`text-sm ${
                    selectedStudent?._id === student._id 
                      ? 'text-white font-bold' 
                      : 'text-gray-800'
                  }`}>
                    {student.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Hiển thị thông tin học sinh được chọn */}
        {selectedStudent && (
          <View className="bg-white p-3 rounded-lg mb-4 shadow-sm">
            <Text className="text-sm font-bold text-gray-800">
              {selectedStudent.name} - {selectedStudent.class?.name || 'Chưa có thông tin lớp'}
            </Text>
          </View>
        )}

        <View className="mb-4">
          <Calendar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            highlightedDates={datesWithAttendance}
            multiSelect={false}
          />
        </View>

        <View className="mb-4">
          <Text className="text-base font-bold text-gray-800">
            {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
          </Text>
        </View>

        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          {(showDefaultStatus || statusCounts.present > 0) && (
            <View className="flex-row items-center mb-2.5">
              <View 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: AttendanceStatusColors.present }} 
              />
              <Text className="flex-1 text-sm">Có mặt {showDefaultStatus ? 0 : statusCounts.present}</Text>
              <Text className="text-sm text-gray-600">07:19</Text>
            </View>
          )}
          
          {(showDefaultStatus || statusCounts.late > 0) && (
            <View className="flex-row items-center mb-2.5">
              <View 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: AttendanceStatusColors.late }} 
              />
              <Text className="flex-1 text-sm">Đi muộn {showDefaultStatus ? 0 : statusCounts.late}</Text>
              <Text className="text-sm text-gray-600">Vắng có phép</Text>
            </View>
          )}
          
          {(showDefaultStatus || statusCounts.absent > 0) && (
            <View className="flex-row items-center mb-2.5">
              <View 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: AttendanceStatusColors.absent }} 
              />
              <Text className="flex-1 text-sm">Vắng {showDefaultStatus ? 0 : statusCounts.absent}</Text>
              <Text className="text-sm text-gray-600">Vắng không phép</Text>
            </View>
          )}
          
          {(showDefaultStatus || statusCounts.excused > 0) && (
            <View className="flex-row items-center mb-2.5">
              <View 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: AttendanceStatusColors.excused }} 
              />
              <Text className="flex-1 text-sm">Có phép {showDefaultStatus ? 0 : statusCounts.excused}</Text>
              <Text className="text-sm text-gray-600">07:19</Text>
            </View>
          )}
        </View>

        {attendanceLoading ? (
          <View className="p-5 items-center">
            <ActivityIndicator size="large" color="#E53935" />
          </View>
        ) : error ? (
          <View className="p-5 items-center">
            <Text className="text-red-600 mb-2.5 text-center">{error}</Text>
            <TouchableOpacity 
              className="bg-red-600 px-5 py-2.5 rounded" 
              onPress={refreshData}
            >
              <Text className="text-white font-bold">Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : recordsForSelectedDate.length === 0 ? (
          <View className="p-5 items-center">
            <Text className="text-gray-600 text-center">Không có dữ liệu điểm danh cho ngày này</Text>
          </View>
        ) : (
          <View className="mt-2.5">
            {recordsForSelectedDate.map((record) => (
              <AttendanceItem
                key={record._id}
                attendance={record}
                timeAttendance={
                  record.student.studentCode && timeAttendanceRecords[record.student.studentCode]
                    ? timeAttendanceRecords[record.student.studentCode]
                    : undefined
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Attendance;
