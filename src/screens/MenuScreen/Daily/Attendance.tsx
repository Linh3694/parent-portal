import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    SafeAreaView,
    RefreshControl,
    Alert
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import AppText from '../../../components/AppText';
import Calendar from '../../../components/ui/Calendar';
import api, { API_URL, BASE_URL } from '../../../config/api.config';
import { 
    Attendance,
    LeaveRequest,
    TimeAttendance
} from '../../../types';
import { PeriodDefinition, ProcessedPeriod } from '../../../types/period';
import { useStudentSelector } from '../../../hooks/useStudentSelector';
import StudentSelector from '../../../components/StudentSelector';
import {
    calculateAttendanceRate,
    createAttendanceSummary,
    formatTime,
    getStatusText,
    getStatusColor,
    hasLeaveRequestForDate,
    formatLeaveReason,
    formatLeaveType,
    sortAttendancesByPeriod,
    getTimeAttendanceInfoForStudent,
    createAttendanceItems,
    getAttendancePeriodLabel
} from '../../../utils/attendanceHelpers';
import { processPeriodDefinitions } from '../../../utils/periodHelpers';

// Component nút back
const BackButton = ({ onGoBack }: { onGoBack: () => void }) => (
    <TouchableOpacity 
        onPress={onGoBack}
        className="p-2"
    >
        <Ionicons name="arrow-back" size={24} color="#333" />
    </TouchableOpacity>
);

// Component tiêu đề
const Title = () => (
    <Text className="text-xl font-bold text-[#002855] ml-16">Điểm danh</Text>
);

// Component chọn học sinh tùy chỉnh cho Attendance
const AttendanceStudentSelector = ({ 
    students, 
    activeIndex, 
    studentAvatars, 
    onStudentSelect 
}: {
    students: any[];
    activeIndex: number;
    studentAvatars: any;
    onStudentSelect: (index: number) => void;
}) => {
    return (
        <View className="flex-row">
            {students.map((student, index) => {
                const isSelected = index === activeIndex;
                return (
                    <TouchableOpacity
                        key={student.id || student._id}
                        onPress={() => onStudentSelect(index)}
                        className={`ml-2 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                    >
                        <Image
                            source={{ 
                                uri: student.avatarUrl 
                                    ? `${BASE_URL}${encodeURI(student.avatarUrl)}`
                                    : student.user?.avatarUrl
                                        ? `${BASE_URL}${encodeURI(student.user.avatarUrl)}`
                                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || student.fullname || 'Unknown')}&background=E0E0E0&color=757575&size=128`
                            }}
                            className="w-8 h-8 rounded-full"
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const AttendanceCalendar = React.memo(({ 
    selectedDate, 
    onDateSelect 
}: {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}) => (
    <View className="p-4">
        <Calendar
            selectedDate={selectedDate}
            onDateChange={onDateSelect}
            highlightedDates={[]}
            customContainerStyle={{
                borderColor: '#00687F',
                backgroundColor: '#F4FCFE',
            }}
        />
    </View>
));

interface AttendanceScreenProps {
    navigation: NavigationProp<RootStackParamList>;
}

const AttendanceScreen = ({ navigation }: AttendanceScreenProps) => {
    // Sử dụng custom hook để quản lý việc chọn học sinh
    const {
        parent,
        students,
        activeIndex,
        activeStudent,
        studentAvatars,
        setActiveIndex,
        refreshStudents,
        loading: studentsLoading
    } = useStudentSelector();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [timeAttendanceData, setTimeAttendanceData] = useState<{ [studentCode: string]: TimeAttendance }>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [enrichedStudents, setEnrichedStudents] = useState<any[]>([]);
    const [periodDefinitions, setPeriodDefinitions] = useState<PeriodDefinition[]>([]);

    // Memoize selectedStudent ID để tránh re-render không cần thiết
    const selectedStudentId = useMemo(() => {
        const id = activeStudent?.id || activeStudent?._id;
        return id;
    }, [activeStudent?.id, activeStudent?._id, activeStudent?.name, activeStudent?.fullname]);

    // Memoize selectedDate string để tránh tạo mới mỗi lần render
    const selectedDateString = useMemo(() => 
        format(selectedDate, 'yyyy-MM-dd'), 
        [selectedDate]
    );

    // Fetch thông tin student đầy đủ nếu thiếu studentCode
    const fetchStudentDetails = useCallback(async () => {
        if (!students.length) return;

        try {
            const enrichedStudentPromises = students.map(async (student) => {
                // Nếu đã có studentCode, return student hiện tại
                if (student.studentCode) {
                    return student;
                }

                // Nếu không có studentCode, fetch từ API
                const studentId = student.id || student._id;
                if (!studentId) return student;

                try {
                    const response = await api.get(`/students/${studentId}`);
                    return {
                        ...student,
                        studentCode: response.data.studentCode,
                        name: response.data.name || student.name,
                        fullname: response.data.name || student.fullname,
                    };
                } catch (error) {
                    return student;
                }
            });

            const enrichedStudentsList = await Promise.all(enrichedStudentPromises);
            setEnrichedStudents(enrichedStudentsList);
        } catch (error) {
            setEnrichedStudents(students);
        }
    }, [students]);

    // Fetch enriched students khi students thay đổi
    useEffect(() => {
        fetchStudentDetails();
    }, [students, fetchStudentDetails]);

    // Lấy activeStudent từ enrichedStudents
    const currentActiveStudent = useMemo(() => {
        if (!enrichedStudents.length || activeIndex >= enrichedStudents.length) {
            return activeStudent;
        }
        return enrichedStudents[activeIndex];
    }, [enrichedStudents, activeIndex, activeStudent]);

    // Fetch periods khi có attendance data
    const fetchPeriodsFromAttendance = useCallback(async (attendanceData: Attendance[]) => {
        if (!attendanceData.length) return;
        
        try {
            // Lấy classId từ attendance đầu tiên
            const firstAttendance = attendanceData[0];
            const classId = firstAttendance.class?._id || firstAttendance.class;
            
            if (classId) {
                // Thử lấy schoolYear từ student data trước
                let schoolYear = null;
                
                // Lấy thông tin student để có schoolYear
                if (currentActiveStudent?.id || currentActiveStudent?._id) {
                    try {
                        const studentResponse = await api.get(`/students/${currentActiveStudent.id || currentActiveStudent._id}`);
                        const studentData = studentResponse.data;
                        
                        // Lấy schoolYear từ student class
                        if (studentData.class && Array.isArray(studentData.class) && studentData.class.length > 0) {
                            const classData = studentData.class[0];
                            schoolYear = classData.schoolYear?._id || classData.schoolYear;
                        }
                    } catch (studentError) {
                        console.error('Error fetching student data:', studentError);
                    }
                }
                
                // Fallback: sử dụng năm hiện tại
                if (!schoolYear) {
                    const currentYear = new Date().getFullYear();
                    schoolYear = `${currentYear}-${currentYear + 1}`;
                }
                
                try {
                    // Thử sử dụng endpoint periods trực tiếp
                    const periodsResponse = await api.get(`/attendances/periods/${classId}/${schoolYear}`);
                    const periodsData = periodsResponse.data.periods || [];
                    setPeriodDefinitions(periodsData);
                } catch (periodsError) {
                    console.error('Error fetching periods directly:', periodsError);
                    // Fallback: set empty periods để sử dụng default behavior
                    setPeriodDefinitions([]);
                }
            } else {
                setPeriodDefinitions([]);
            }
        } catch (error) {
            console.error('Error fetching periods from attendance:', error);
            // Nếu không fetch được periods, set empty array
            setPeriodDefinitions([]);
        }
    }, [currentActiveStudent]);

    const fetchAttendanceData = useCallback(async () => {
        if (!selectedStudentId || !currentActiveStudent) return;
        try {
            setLoading(true);
            
            // Fetch attendances
            const attendanceResponse = await api.get(`/attendances/student/${selectedStudentId}/${selectedDateString}`);
            const attendanceData = Array.isArray(attendanceResponse.data) 
                ? attendanceResponse.data 
                : attendanceResponse.data.data || [];
            setAttendances(sortAttendancesByPeriod(attendanceData));
            
            // Fetch periods từ attendance data
            await fetchPeriodsFromAttendance(attendanceData);
            
            // Fetch time attendance data sử dụng enrichedStudents
            const studentCodes = enrichedStudents.map(s => s.studentCode).filter(Boolean);
            
            const timeAttendanceResponse = await api.get('/attendances/time-attendance-by-date', {
                params: {
                    date: selectedDateString,
                    studentCodes: studentCodes.join(',')
                }
            });
            setTimeAttendanceData(timeAttendanceResponse.data || {});
            
            // Fetch leave requests
            const leaveResponse = await api.get('/leave-requests', {
                params: {
                    studentId: selectedStudentId,
                    limit: 1000
                }
            });
            const leaveData = (Array.isArray(leaveResponse.data) 
                ? leaveResponse.data 
                : leaveResponse.data.docs || leaveResponse.data.data || [])
                .filter((lr: any) =>
                    String(lr.student) === String(selectedStudentId) ||
                    String(lr.student?._id) === String(selectedStudentId)
                );
            setLeaveRequests(leaveData);
        } catch (error) {
            // Error handling
        } finally {
            setLoading(false);
        }
    }, [selectedStudentId, selectedDateString, currentActiveStudent, enrichedStudents, fetchPeriodsFromAttendance]);

    useEffect(() => {
        if (selectedStudentId && currentActiveStudent && enrichedStudents.length > 0) {
            fetchAttendanceData();
        }
    }, [selectedStudentId, selectedDateString, fetchAttendanceData, currentActiveStudent, enrichedStudents]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchAttendanceData();
        setRefreshing(false);
    }, [fetchAttendanceData]);

    const handleDateSelect = useCallback((date: Date) => {
        setSelectedDate(date);
    }, []);

    const handleStudentSelect = useCallback((index: number) => {
        setActiveIndex(index);
    }, [setActiveIndex]);

    const attendanceSummary = useMemo(() => {
        if (!attendances.length) return null;
        return createAttendanceSummary(attendances, selectedDateString);
    }, [attendances, selectedDateString]);

    const leaveRequestForDate = useMemo(() => {
        return hasLeaveRequestForDate(
            leaveRequests.filter((lr: any) =>
                String(lr.student) === String(selectedStudentId) ||
                String(lr.student?._id) === String(selectedStudentId)
            ),
            selectedDateString
        );
    }, [leaveRequests, selectedStudentId, selectedDateString]);

    const timeAttendanceInfo = useMemo(() => {
        if (!currentActiveStudent?.studentCode) {
            return { checkIn: '', checkOut: '' };
        }
        
        const result = getTimeAttendanceInfoForStudent(currentActiveStudent.studentCode, timeAttendanceData);
        return result;
    }, [currentActiveStudent, timeAttendanceData]);

    // Process periods từ periodDefinitions
    const processedPeriods = useMemo((): ProcessedPeriod[] => {
        return processPeriodDefinitions(periodDefinitions);
    }, [periodDefinitions]);

    const regularPeriods = useMemo((): ProcessedPeriod[] => {
        return processedPeriods.filter(p => p.isRegular);
    }, [processedPeriods]);

    const specialPeriods = useMemo((): ProcessedPeriod[] => {
        return processedPeriods.filter(p => !p.isRegular);
    }, [processedPeriods]);

    const getStatusStyle = useCallback((status: string) => {
        switch (status) {
            case 'present':
                return {
                    bg: '#ECFDF5',
                    color: '#10B981',
                    dot: '#10B981',
                };
            case 'late':
                return {
                    bg: '#FEF7E6',
                    color: '#F59E0B',
                    dot: '#F59E0B',
                };
            case 'absent':
                return {
                    bg: '#FEF2F2',
                    color: '#EF4444',
                    dot: '#EF4444',
                };
            case 'excused':
                return {
                    bg: '#FFFAF3',
                    color: '#F59E0B',
                    dot: '#F59E0B',
                };
            default:
                return {
                    bg: '#F3F4F6',
                    color: '#6B7280',
                    dot: '#6B7280',
                };
        }
    }, []);

    const attendanceItems = useMemo(() => {
        if (leaveRequestForDate) return [];
        
        // Sử dụng helper function mới để tạo attendance items
        return createAttendanceItems(attendances, timeAttendanceInfo, periodDefinitions);
    }, [leaveRequestForDate, attendances, timeAttendanceInfo, periodDefinitions]);

    const renderAttendanceList = useCallback(() => {
        if (leaveRequestForDate) {
            return (
                <View className="flex-row items-center rounded-full px-6 py-3 mb-3 bg-yellow-50">
                    <View style={{ backgroundColor: '#F59E0B', width: 12, height: 12, borderRadius: 6, marginRight: 18 }} />
                    <Text style={{ color: '#F59E0B', fontSize: 16, fontWeight: '500' }}>Học sinh nghỉ học có phép</Text>
                </View>
            );
        }
        
        // Kiểm tra xem có dữ liệu điểm danh nào không
        if (attendanceItems.length === 0) {
            return (
                <View className="flex-row items-center justify-center px-6 py-8">
                    <Text style={{ color: '#6B7280', fontSize: 16 }}>Không có dữ liệu điểm danh cho ngày này</Text>
                </View>
            );
        }
        
        // Reverse the order để hiển thị theo thứ tự từ trên xuống: Checkout -> Tiết 3 -> Tiết 2 -> Tiết 1 -> Checkin
        const reversedItems = [...attendanceItems].reverse();
        
        return (
            <View>
                {reversedItems.map((item, idx) => {
                    const style = getStatusStyle(item.status);
                    const isPeriod = item.type === 'period';
                    const isCheckinCheckout = item.type === 'checkin' || item.type === 'checkout';
                    const isSpecialPeriod = item.type === 'special';
                    
                    // Hiển thị tiết đặc biệt khác biệt
                    if (isSpecialPeriod) {
                        return (
                            <View
                                key={idx}
                                className="flex-row items-center rounded-full px-6 py-3 mb-3 mx-4"
                                style={{ backgroundColor: '#FFF7ED' }}
                            >
                                <View style={{ backgroundColor: '#FB923C', width: 12, height: 12, borderRadius: 40, marginRight: 18 }} />
                                <Text style={{ color: '#222', fontSize: 14, flex: 1 }}>{item.label}</Text>
                                {item.time && (
                                    <Text style={{ color: '#FB923C', fontSize: 14 }}>{item.time}</Text>
                                )}
                            </View>
                        );
                    }
                    
                    // Lấy text hiển thị phù hợp
                    let displayText = '';
                    if (isPeriod) {
                        // Hiển thị trạng thái cho tiết học
                        switch (item.status) {
                            case 'present':
                                displayText = 'Có mặt';
                                break;
                            case 'absent':
                                displayText = 'Vắng mặt';
                                break;
                            case 'late':
                                displayText = 'Vào muộn';
                                break;
                            case 'excused':
                                displayText = 'Vắng có phép';
                                break;
                            default:
                                displayText = item.note || 'Có mặt';
                        }
                    } else if (isCheckinCheckout) {
                        // Hiển thị thời gian cho check-in/check-out
                        displayText = item.time || '';
                    }
                    
                    return (
                        <View
                            key={idx}
                            style={{ backgroundColor: style.bg }}
                            className="flex-row items-center rounded-full px-6 py-3 mb-3 mx-4"
                        >
                            <View style={{ backgroundColor: style.dot, width: 12, height: 12, borderRadius: 40, marginRight: 18 }} />
                            <Text style={{ color: '#222', fontSize: 14, flex: 1 }}>{item.label}</Text>
                            {displayText && (
                                <Text style={{ color: style.color, fontSize: 14 , fontWeight: 700 }}>{displayText}</Text>
                            )}
                        </View>
                    );
                })}
            </View>
        );
    }, [leaveRequestForDate, attendanceItems, getStatusStyle]);

    const handleGoBack = useCallback(() => {
        if (navigation) {
            try {
                navigation.goBack();
            } catch (error) {
                console.warn('Navigation error:', error);
            }
        }
    }, [navigation]);

    // --- return UI, kiểm tra điều kiện ở đây ---
    return (
        <SafeAreaView className="flex-1 bg-white">
            {(!parent) ? (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500">Không có dữ liệu phụ huynh</Text>
                </View>
            ) : (!currentActiveStudent || (!currentActiveStudent.id && !currentActiveStudent._id)) ? (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500">Không có dữ liệu học sinh hợp lệ</Text>
                </View>
            ) : (
                <>
                    <View className="flex-row items-center justify-between p-4 bg-white ">
                        <BackButton onGoBack={handleGoBack} />
                        <Title />
                        <StudentSelector
                            students={enrichedStudents}
                            activeIndex={activeIndex}
                            studentAvatars={studentAvatars}
                            onStudentSelect={handleStudentSelect}
                            size={32}
                        />
                    </View>
                    <ScrollView
                        className="bg-white"
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    >
                        <AttendanceCalendar
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                        />
                        
                        {renderAttendanceList()}
                    </ScrollView>
                </>
            )}
        </SafeAreaView>
    );
};

export default AttendanceScreen;