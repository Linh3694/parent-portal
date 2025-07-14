import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, RefreshControl } from 'react-native';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MenuIcon from '../assets/menu.svg';
import api, { API_URL, BASE_URL } from '../config/api.config';
import { LinearGradient } from 'expo-linear-gradient';
import { getSpecialLessonsForGradeLevel, expandSpecialLessons } from '../utils/specialLessons';
import NewfeedBg from '../assets/newfeed.svg';
import AppText from '../components/AppText';
import { 
    Period, 
    SpecialLesson, 
    ClassInfo, 
    PeriodDefinition, 
    TimetableEntry,
    CommunicationBook,
    DateDisplay
} from '../types';
import {
    getAvatarUrl,
    mergePeriodsAndSpecialLessons,
    extractGradeLevel,
    insertBreaksToTimetable,
    getCurrentLesson,
    mergeTimetableData,
    getDayProgress,
    getRecentDates,
    DAYS_OF_WEEK
} from '../utils/studentHelpers';
import { useStudentSelector } from '../hooks/useStudentSelector';
import StudentSelector from '../components/StudentSelector';

const AVATAR_SIZE = 48;
const AVATAR_BORDER = 3;

const StudentScreen = () => {
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

    const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [now, setNow] = useState(new Date());
    const [periodDefinitions, setPeriodDefinitions] = useState<PeriodDefinition[]>([]);
    const [communicationBooks, setCommunicationBooks] = useState<CommunicationBook[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const today = new Date();
        return today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');
    });
    // Các ngày gần nhất (3 ngày học gần nhất, bỏ cuối tuần) – tính sẵn để không tạo lại mỗi render
    const recentDates = React.useMemo(() => getRecentDates(), []);

    const handleSelectDate = React.useCallback((date: string) => {
        setSelectedDate(date);
    }, []);
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchClassAndTimetable = async (classId: string) => {
        try {
            // Kiểm tra classId hợp lệ
            if (!classId || classId.trim() === '') {
                console.warn('⚠️ ClassId is empty or invalid');
                return;
            }
            let classData = null;

            // Lấy thông tin lớp với populate để có đầy đủ thông tin gradeLevel và school
            try {
                const classRes = await api.get(`/classes/${classId}?populate=gradeLevel.school`);
                classData = classRes.data;
                setClassInfo(classData);
            } catch (classError: any) {
                console.error('❌ Error fetching class info:', classError.response?.status, classError.response?.data);
                return;
            }

            // Lấy thời khóa biểu
            try {
                const timetableRes = await api.get(`/timetables/class/${classId}`);
                setTimetable(timetableRes.data || []);
            } catch (timetableError: any) {
                console.error('❌ Error fetching timetable:', timetableError.response?.status, timetableError.response?.data);
                setTimetable([]);
            }

            // Lấy period definitions từ schoolYear của lớp - SỬA: sử dụng classData trực tiếp
            if (classData && classData.schoolYear) {
                try {
                    // Kiểm tra và lấy ID của schoolYear
                    const schoolYearId = typeof classData.schoolYear === 'object'
                        ? classData.schoolYear._id
                        : classData.schoolYear;

                    // Lấy school ID từ gradeLevel.school
                    const schoolId = classData.gradeLevel?.school?._id 
                        || classData.gradeLevel?.school 
                        || null;


                    if (schoolYearId) {
                        // Gọi API với schoolId param như web version
                        const periodDefsUrl = schoolId 
                            ? `/timetables/period-definitions/${schoolYearId}?schoolId=${schoolId}`
                            : `/timetables/period-definitions/${schoolYearId}`;
                        
                        const periodDefsRes = await api.get(periodDefsUrl);
                        const periods = periodDefsRes.data.data || periodDefsRes.data || [];
                        setPeriodDefinitions(periods);
                    }
                } catch (periodsError: any) {
                    console.error('❌ Error fetching period definitions:', periodsError.response?.status, periodsError.response?.data);
                }
            } else {
                console.warn('⚠️ No schoolYear found in class data');
            }
        } catch (error: any) {
            console.error('❌ General error in fetchClassAndTimetable:', error);
        }
    };

    useEffect(() => {
        if (students.length > 0 && activeIndex < students.length) {
            const activeStudent = students[activeIndex];

            
            // Kiểm tra các cách lấy classId khác nhau
            let classId = null;
            
            if (activeStudent?.class && Array.isArray(activeStudent.class) && activeStudent.class.length > 0) {
                classId = activeStudent.class[0];
            } else if (activeStudent?.classId) {
                classId = activeStudent.classId;
            } else if (activeStudent?.enrollment && Array.isArray(activeStudent.enrollment) && activeStudent.enrollment.length > 0) {
                classId = activeStudent.enrollment[0].class;
            }
            
            if (classId) {
                fetchClassAndTimetable(classId);
            } else {
                console.warn('⚠️ No classId found for student:', activeStudent?.name || activeStudent?.fullname);
            }
        }
    }, [activeIndex, students]);

    useEffect(() => {
        if (!students[activeIndex]?.id) return;
        const fetchData = async () => {
            const res = await api.get(`/communications/student/${students[activeIndex].id}`);
            setCommunicationBooks(res.data);
        };
        fetchData();
    }, [activeIndex, students]);

    if (!parent) return null;

    // Lấy special lessons dựa vào grade level
    const gradeLevel = extractGradeLevel(classInfo);
    const specialLessons = expandSpecialLessons(getSpecialLessonsForGradeLevel(gradeLevel || 1));

    // Sử dụng period definitions từ API thay vì hardcode
    const periods: Period[] = periodDefinitions.length > 0 
        ? periodDefinitions.map(pd => ({
            periodNumber: pd.periodNumber,
            startTime: pd.startTime,
            endTime: pd.endTime,
            label: pd.label
        }))
        : [
            // Fallback periods nếu không load được từ API
            { periodNumber: 1, startTime: "07:00", endTime: "07:45", label: "Tiết 1" },
            { periodNumber: 2, startTime: "07:50", endTime: "08:35", label: "Tiết 2" },
            { periodNumber: 3, startTime: "08:40", endTime: "09:25", label: "Tiết 3" },
            { periodNumber: 4, startTime: "09:40", endTime: "10:25", label: "Tiết 4" },
            { periodNumber: 5, startTime: "10:30", endTime: "11:15", label: "Tiết 5" },
            { periodNumber: 6, startTime: "13:00", endTime: "13:45", label: "Tiết 6" },
            { periodNumber: 7, startTime: "13:50", endTime: "14:35", label: "Tiết 7" },
            { periodNumber: 8, startTime: "14:40", endTime: "15:25", label: "Tiết 8" },
            { periodNumber: 9, startTime: "15:40", endTime: "16:25", label: "Tiết 9" },
            { periodNumber: 10, startTime: "16:30", endTime: "17:15", label: "Tiết 10" }
        ];

    let fullTimetable: TimetableEntry[] = [];
    for (const day of DAYS_OF_WEEK) {
        // 1. Merge timetable thực tế vào periods
        const periodsWithData = mergeTimetableData(
            periods.map(p => ({ ...p, dayOfWeek: day })), // gán dayOfWeek cho period
            timetable,
            day
        );
        
        // 2. Merge với specialLessons
        const mergedLessons = mergePeriodsAndSpecialLessons(periodsWithData, specialLessons, day);
        fullTimetable = [...fullTimetable, ...mergedLessons];
    }
    
    // Tìm lesson hiện tại từ fullTimetable TRƯỚC khi thêm breaks
    const currentLessonWithBreaks = getCurrentLesson(fullTimetable);
    
    // Nếu không tìm thấy lesson thực sự, mới thêm breaks để kiểm tra giờ nghỉ
    const timetableWithBreaks = currentLessonWithBreaks ? fullTimetable : insertBreaksToTimetable(fullTimetable);
    const finalCurrentLesson = currentLessonWithBreaks || getCurrentLesson(timetableWithBreaks);
    



    const dates = communicationBooks.map(cb => ({
        date: cb.date,
        display: new Date(cb.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    }));

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshStudents();
        setRefreshing(false);
    };

    const filteredBooks = communicationBooks.filter(cb => {
        if (!cb.date) return false;
        const cbDate = new Date(cb.date);
        const cbDateStr = cbDate.getFullYear() + '-' +
            String(cbDate.getMonth() + 1).padStart(2, '0') + '-' +
            String(cbDate.getDate()).padStart(2, '0');
        return cbDateStr === selectedDate;
    });

    return (
        <ScrollView
            className="flex-1 bg-white"
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View className="flex-row items-center px-5 pt-[18%] pb-3 w-full">
                {/* Nút Menu bên trái */}
                <TouchableOpacity onPress={() => navigation.navigate('MenuScreen' as never)}>
                    <MenuIcon width={36} height={36} />
                </TouchableOpacity>

                {/* Tên học sinh căn giữa */}
                <View className="flex-1 items-end">
                    <AppText style={{ fontFamily: 'Medium' }} className="text-lg font-bold text-[#002855] text-center" numberOfLines={1}>
                        {activeStudent?.name || activeStudent?.fullname || activeStudent?.studentName || ''}
                    </AppText>
                </View>

                {/* Avatars bên phải, số lượng linh hoạt */}
                <View className="flex-row items-center ml-2">
                    <StudentSelector
                        students={students}
                        activeIndex={activeIndex}
                        studentAvatars={studentAvatars}
                        onStudentSelect={setActiveIndex}
                        size={32}
                    />
                </View>
            </View>

            {/* Card tiết học hiện tại */}
            <View className="h-[35%] mx-4 mt-4 rounded-2xl overflow-hidden shadow-md relative">
                {/* Ảnh nền SVG */}
                <View className="absolute inset-0">
                    <NewfeedBg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
                </View>
                <View className="p-5 relative">
                    <View className="absolute top-4 left-4 flex-row items-center">
                        <View className="flex-row items-center bg-white rounded-2xl px-4 py-1 mr-1.5">
                            <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                            <AppText style={{ fontFamily: 'Medium' }} className="text-[#3F4246] font-semibold text-sm">
                                {finalCurrentLesson ? 'Đang học' : 'Không có tiết học'}
                            </AppText>
                        </View>
                    </View>
                    {finalCurrentLesson ? (
                        <View className="h-full flex flex-col items-start justify-end">
                            {finalCurrentLesson.periodNumber && (
                                <AppText className="text-base text-gray-500 mb-1">
                                    {`Tiết ${finalCurrentLesson.periodNumber}`}
                                </AppText>
                            )}
                            <AppText className="text-2xl font-bold text-[#E4572E] mb-1">
                                {finalCurrentLesson.subject?.name
                                    || finalCurrentLesson.name
                                    || finalCurrentLesson.label
                                    || 'Tiết học'}
                            </AppText>
                            {finalCurrentLesson.teachers && finalCurrentLesson.teachers.length > 0 && (
                                <>
                                    <AppText className="text-gray-500 text-base mb-2">
                                        {finalCurrentLesson.teachers.map((t: any) => t.fullname).join(' / ')}
                                    </AppText>
                                    <View className="flex-row mt-1">
                                        {finalCurrentLesson.teachers.map((t: any, idx: number) => {
                                            let avatar: string;
                                            
                                            // Xử lý avatarUrl từ teacher trực tiếp
                                            if (t.avatarUrl && t.avatarUrl.trim()) {
                                                avatar = t.avatarUrl.startsWith('http') 
                                                    ? t.avatarUrl 
                                                    : `${BASE_URL}${t.avatarUrl.startsWith('/') ? '' : '/uploads/Avatar/'}${encodeURI(t.avatarUrl)}`;
                                            }
                                            // Xử lý avatarUrl từ user
                                            else if (t.user?.avatarUrl && t.user.avatarUrl.trim()) {
                                                avatar = t.user.avatarUrl.startsWith('http') 
                                                    ? t.user.avatarUrl 
                                                    : `${BASE_URL}${t.user.avatarUrl.startsWith('/') ? '' : '/uploads/Avatar/'}${encodeURI(t.user.avatarUrl)}`;
                                            }
                                            // Fallback to generated avatar
                                            else {
                                                avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.fullname || 'GV')}&background=E0E0E0&color=757575&size=128`;
                                            }
                                            
                                            
                                            return (
                                                <Image
                                                    key={idx}
                                                    source={{ uri: avatar }}
                                                    className="w-11 h-11 rounded-full mr-2 border border-gray-300"
                                                />
                                            );
                                        })}
                                    </View>
                                </>
                            )}
                            {/* Debug info - có thể xóa sau */}
                            {__DEV__ && (
                                <AppText className="text-xs text-gray-400 mt-2">
                                    {finalCurrentLesson.timeSlot?.startTime || finalCurrentLesson.startTime} - {finalCurrentLesson.timeSlot?.endTime || finalCurrentLesson.endTime}
                                </AppText>
                            )}
                        </View>
                    ) : (
                        <View className="h-full flex flex-col items-start justify-end">
                            <AppText className="text-lg text-gray-400">Hiện tại không có tiết học nào</AppText>
                        </View>
                    )}
                </View>
            </View>

            {/* Process Bar thời gian trong ngày */}
            <View className="flex-row items-center px-2 mt-5 mb-2">
                {/* Thanh process bar */}
                <View className="flex-1 h-6 justify-center mx-2 relative">
                    <View className="w-full h-4 rounded-2xl bg-[#F3F3F3] overflow-hidden">
                        <LinearGradient
                            colors={['#B5C048', '#219A7A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ width: `${getDayProgress(now)}%`, height: '100%', borderRadius: 8, position: 'absolute', left: 0, top: 0 }}
                        />
                    </View>
                </View>
            </View>
            <View className="flex flex-row px-4 items-center justify-between">
                <AppText style={{ fontFamily: 'Medium' }} className="w-16 text-[#4CAF50] font-bold text-base">08:00</AppText>
                <AppText style={{ fontFamily: 'Medium' }} className="w-12 text-[#4CAF50] font-bold text-base text-right">16:15</AppText>
            </View>

            {/* Section Nổi bật */}
            <View className="px-4 mt-6">
                <View className="flex-row items-center justify-between mb-2">
                    <AppText style={{ fontFamily: 'Medium' }} className="text-lg font-bold text-[#0A285F]">Nổi bật</AppText>
                    <TouchableOpacity onPress={() => alert('Tính năng thiết lập mục nổi bật sẽ sớm có!')}>
                        <AppText style={{ fontFamily: 'Medium' }} className="text-xs text-[#0A285F]">Thiết lập</AppText>
                    </TouchableOpacity>
                </View>
                <View className="flex-row justify-between">
                    <TouchableOpacity className="items-center flex-1" onPress={() => navigation.navigate('Timetable' as never)}>
                        <View className="w-24 h-24 rounded-3xl bg-[#F9FBEB] justify-center items-center my-3" />
                        <AppText style={{ fontFamily: 'Medium' }} className="text-center text-sm text-[#3F4246] font-semibold">Thời khóa biểu</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity className="items-center flex-1" onPress={() => navigation.navigate('Absence' as never)}>
                        <View className="w-24 h-24 rounded-3xl bg-[#F9FBEB] justify-center items-center my-3 mx-2" />
                        <AppText style={{ fontFamily: 'Medium' }} className="text-center text-sm text-[#3F4246] font-semibold">Nghỉ phép</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity className="items-center flex-1" onPress={() => navigation.navigate('StudyReport' as never)}>
                        <View className="w-24 h-24 rounded-3xl bg-[#F9FBEB] justify-center items-center my-3" />
                        <AppText style={{ fontFamily: 'Medium' }} className="text-center text-sm text-[#3F4246] font-semibold">Báo cáo học tập</AppText>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Section Sổ liên lạc */}
            <View className="px-4 mt-6">
                <AppText style={{ fontFamily: 'Medium' }} className="text-lg font-bold text-[#0A285F] mb-2">Sổ liên lạc</AppText>
                <View className="flex-row p-0 mt-2">
                    {/* Cột ngày */}
                    <View className="w-20">
                        {recentDates.map(item => (
                            <Pressable
                                key={item.date}
                                onPress={() => handleSelectDate(item.date)}
                                hitSlop={8}
                            >
                                <View className="flex-row items-center mb-4 gap-1">
                                    {selectedDate === item.date ? (
                                        <View className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-t-transparent border-b-transparent border-l-[#219A7A] mr-1.5" />
                                    ) : (
                                        <View className="w-2 h-2 mr-1.5" />
                                    )}
                                    <AppText
                                        style={{ fontFamily: 'Medium' }}
                                        className={selectedDate === item.date ? "text-[#219A7A] font-bold text-xl" : "text-[#BDBDBD] text-lg"}
                                    >
                                        {item.display}
                                    </AppText>
                                </View>
                            </Pressable>
                        ))}
                    </View>

                    {/* Nội dung chi tiết */}
                    <View className="flex-1 bg-[#FAFBEF] rounded-3xl p-5 justify-start ml-4 text-base">
                        {filteredBooks.map(cb => (
                            <View key={cb._id}>
                                {cb.content.split('\n').map((line: string, idx: number) => (
                                    <View key={idx} className="flex-row items-start mb-1.5">
                                        <AppText className="text-base text-[#444] mr-2">•</AppText>
                                        <AppText className="text-base text-[#444] flex-1">{line.trim()}</AppText>
                                    </View>
                                ))}
                            </View>
                        ))}
                        {filteredBooks.length === 0 && (
                            <AppText className="text-[#aaa] text-base text-center">Không có liên lạc cho ngày này</AppText>
                        )}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

export default StudentScreen;
