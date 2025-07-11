import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Calendar from '../../../components/ui/Calendar';
import { AttendanceItem } from '../../../components/ui/AttendanceItem';
import { useAttendance } from '../../../hooks/useAttendance';
import { AttendanceRecord, AttendanceStatus, AttendanceStatusColors } from '../../../types/attendance';
import { useNavigation } from '@react-navigation/native';
import AppText from '../../../components/AppText';
import api from '../../../config/api.config';

interface Student {
  _id: string;
  name: string;
  studentCode: string;
  avatarUrl?: string;
  class?: any;
  classId?: string;
  enrollment?: any[];
}

interface Parent {
  _id: string;
  students: Student[];
}

const getAvatarUrl = (student: Student) => {
  const studentName = student.name || 'Unknown';
  if (student.avatarUrl) {
    return student.avatarUrl;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=E0E0E0&color=757575&size=128`;
};

const Attendance = () => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [fetchingClass, setFetchingClass] = useState(false);
  const [classError, setClassError] = useState<string | null>(null);

  // Lấy thông tin phụ huynh và học sinh từ AsyncStorage
  useEffect(() => {
    const fetchParentAndStudents = async () => {
      try {
        const parentStr = await AsyncStorage.getItem('parent');
        if (!parentStr) {
          setLoading(false);
          return;
        }
        const parentObj: Parent = JSON.parse(parentStr);
        if (parentObj.students && parentObj.students.length > 0) {
          setStudents(parentObj.students);
          setSelectedStudent(parentObj.students[0]);
        }
      } catch (error) {
        //
      } finally {
        setLoading(false);
      }
    };
    fetchParentAndStudents();
  }, []);

  // Refactor lấy classId và fetch class info mỗi khi selectedStudent thay đổi
  useEffect(() => {
    const fetchClassInfo = async () => {
      setClassInfo(null);
      setClassError(null);
      if (!selectedStudent) return;
      let classId = null;
      if (selectedStudent.class && Array.isArray(selectedStudent.class) && selectedStudent.class.length > 0) {
        classId = selectedStudent.class[0];
      } else if (selectedStudent.classId) {
        classId = selectedStudent.classId;
      } else if (selectedStudent.class && typeof selectedStudent.class === 'object' && selectedStudent.class._id) {
        classId = selectedStudent.class._id;
      } else if (selectedStudent.enrollment && Array.isArray(selectedStudent.enrollment) && selectedStudent.enrollment.length > 0) {
        classId = selectedStudent.enrollment[0].class;
      }
      if (!classId) {
        setClassError('Thiếu thông tin lớp học');
        return;
      }
      setFetchingClass(true);
      try {
        const res = await api.get(`/classes/${classId}?populate=gradeLevel.school`);
        setClassInfo(res.data);
      } catch (err) {
        setClassError('Thiếu thông tin lớp học');
      } finally {
        setFetchingClass(false);
      }
    };
    fetchClassInfo();
  }, [selectedStudent]);

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

  // Thay header mới
  const renderHeader = () => (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
      <TouchableOpacity onPress={() => navigation.goBack()} className="pr-4">
        <Text className="text-2xl">←</Text>
      </TouchableOpacity>
      <View className="flex-1 items-center">
        <AppText style={{ fontSize: 18, fontWeight: 'bold', color: '#3F4246' }}>Điểm danh</AppText>
      </View>
      {selectedStudent && (
        <Image
          source={{ uri: getAvatarUrl(selectedStudent) }}
          style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#FFB300' }}
        />
      )}
    </View>
  );

  // Hiển thị loading khi đang lấy thông tin phụ huynh
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        {renderHeader()}
        <View className="p-5 items-center">
          <ActivityIndicator size="large" color="#E53935" />
          <Text className="mt-2.5 text-gray-600 text-sm">Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Hiển thị thông báo nếu không có học sinh
  if (students.length === 0) {
    return (
      <SafeAreaView className="flex-1">
        {renderHeader()}
        <View className="p-5 items-center">
          <Text className="text-gray-600 text-center">Không có học sinh nào trong tài khoản</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {renderHeader()}
      {/* Thông tin học sinh và lớp */}
      {selectedStudent && (
        <View className="bg-white rounded-xl mx-4 mt-4 mb-2 p-3 flex-row items-center shadow-sm">
          <AppText className="flex-1 text-base font-bold text-[#3F4246]">
            {selectedStudent.name} - {fetchingClass ? 'Đang tải lớp...' : classInfo?.name || 'Chưa có thông tin lớp'}
          </AppText>
        </View>
      )}
      {classError && (
        <View className="items-center my-2">
          <Text className="text-red-500 mb-2">{classError}</Text>
          <TouchableOpacity className="bg-red-600 px-5 py-2.5 rounded" onPress={() => setSelectedStudent(selectedStudent)}>
            <Text className="text-white font-bold">Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}
      <ScrollView className="flex-1 p-4">
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
    </SafeAreaView>
  );
};

export default Attendance;
