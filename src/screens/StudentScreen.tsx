import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, RefreshControl } from 'react-native';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MenuIcon from '../assets/menu.svg';
import api, { API_URL, BASE_URL } from '../config/api.config';
import { LinearGradient } from 'expo-linear-gradient';

import NewfeedBg from '../assets/newfeed.svg';
import AppText from '../components/AppText';
import FeaturedModulesModal, { ModuleItem, loadFeaturedModules, saveFeaturedModules } from '../components/FeaturedModulesModal';
import TimetableDebugger from '../components/TimetableDebugger';
// Import các icon SVG cho featured modules
import StudentInfo from '../assets/StudentInfo.svg';
import Timetable from '../assets/Timetable.svg';
import ContactBook from '../assets/ContactBook.svg';
import Attendance from '../assets/Attendance.svg';
import StudyReport from '../assets/StudyReport.svg';
import Absence from '../assets/Absence.svg';
import MenuService from '../assets/MenuService.svg';
import Health from '../assets/Health.svg';
import Bus from '../assets/Bus.svg';
import { 
    Period, 
    ClassInfo, 
    PeriodDefinition, 
    TimetableEntry,
    CommunicationBook,
    DateDisplay
} from '../types';
import { PERIOD_TYPE_LABELS } from '../types/period';
import {
    getAvatarUrl,
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
import { STANDARD_PERIODS, DAY_SCHEDULE } from '../constants/periods';

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
    
    // Featured modules state
    const [featuredModules, setFeaturedModules] = useState<ModuleItem[]>([]);
    const [showFeaturedModal, setShowFeaturedModal] = useState(false);
    
    // Debug state
    const [showDebugger, setShowDebugger] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Load featured modules khi component mount
    useEffect(() => {
        const loadModules = async () => {
            const modules = await loadFeaturedModules();
            setFeaturedModules(modules);
        };
        loadModules();
    }, []);

    const fetchClassAndTimetable = async (classId: string) => {
        try {
            // Kiểm tra classId hợp lệ
            if (!classId || classId.trim() === '') {
                console.warn('⚠️ ClassId is empty or invalid');
                return;
            }
            
            // Clear previous data để tránh cache cũ
            setTimetable([]);
            setClassInfo(null);
            setPeriodDefinitions([]);
            
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

            // Lấy thời khóa biểu - cải thiện logic fetch
            try {
                // Kiểm tra và lấy schoolYearId
                const schoolYearId = typeof classData.schoolYear === 'object'
                    ? classData.schoolYear._id
                    : classData.schoolYear;
                
                console.log('🔍 Fetching timetable with:', { classId, schoolYearId });
                
                let timetableData = [];
                let dataSource = 'none';
                
                // Thử endpoint chính trước
                try {
                    const timetableRes = await api.get(`/timetables/class/${classId}`);
                    timetableData = timetableRes.data || [];
                    dataSource = 'class-endpoint';
                    
                    console.log('📅 Class endpoint response:', {
                        status: timetableRes.status,
                        dataLength: timetableData.length,
                        sample: timetableData[0]
                    });
                } catch (oldError: any) {
                    console.warn('⚠️ Class endpoint failed:', oldError.response?.status);
                }
                
                // Nếu không có dữ liệu, thử alternative APIs
                if (timetableData.length === 0) {
                    console.log('🔄 Trying alternative timetable APIs...');
                    
                    // Try API with query parameter
                    try {
                        const altRes1 = await api.get(`/timetables?classId=${classId}`);
                        const altData = altRes1.data?.data || altRes1.data || [];
                        if (altData.length > 0) {
                            timetableData = altData;
                            dataSource = 'query-api';
                            console.log('📅 Query API success:', timetableData.length, 'entries');
                        }
                    } catch (altError) {
                        console.log('❌ Query API failed:', (altError as Error).message);
                    }
                    
                    // Try API with school year
                    if (timetableData.length === 0 && schoolYearId) {
                        try {
                            const altRes2 = await api.get(`/timetables?classId=${classId}&schoolYearId=${schoolYearId}`);
                            const altData = altRes2.data?.data || altRes2.data || [];
                            if (altData.length > 0) {
                                timetableData = altData;
                                dataSource = 'schoolyear-api';
                                console.log('📅 SchoolYear API success:', timetableData.length, 'entries');
                            }
                        } catch (altError) {
                            console.log('❌ SchoolYear API failed:', (altError as Error).message);
                        }
                    }
                    
                    // Try get all timetables and filter - chỉ dùng khi cần thiết
                    if (timetableData.length === 0) {
                        try {
                            const allRes = await api.get('/timetables');
                            const allTimetables = allRes.data?.data || allRes.data || [];
                            console.log('📅 All timetables count:', allTimetables.length);
                            
                            // Filter by class ID
                            const filteredData = allTimetables.filter((t: any) => 
                                (t.class?._id === classId || t.class === classId)
                            );
                            
                            if (filteredData.length > 0) {
                                timetableData = filteredData;
                                dataSource = 'filtered-all';
                                console.log('📅 Filtered data success:', timetableData.length, 'entries');
                            }
                        } catch (altError) {
                            console.log('❌ All timetables API failed:', (altError as Error).message);
                        }
                    }
                }
                
                // Validate và set timetable data
                if (timetableData.length > 0) {
                    console.log('✅ Using timetable data from:', dataSource);
                    // Validate data structure
                    const validData = timetableData.filter((item: any) => {
                        const hasTimeSlot = item.timeSlot?.startTime && item.timeSlot?.endTime;
                        const hasDirectTime = item.startTime && item.endTime;
                        return hasTimeSlot || hasDirectTime;
                    });
                    
                    if (validData.length > 0) {
                        console.log('📅 Valid timetable entries:', validData.length);
                        setTimetable(validData);
                        return; // Sử dụng dữ liệu đã tìm được
                    } else {
                        console.warn('⚠️ No valid timetable entries found');
                    }
                } else {
                    console.warn('⚠️ No timetable data found from any source');
                }
                
                // Nếu endpoint cũ không có dữ liệu, thử endpoint mới
                if (schoolYearId) {                  
                    const timetableRes = await api.get(`/timetables/grid/${schoolYearId}/${classId}`);
                    const timetableGridData = timetableRes.data?.data || {};
                    // Chuyển đổi grid data về format array cho mobile
                    const timetableArray = [];
                    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                    
                    for (const day of daysOfWeek) {
                        const dayData = timetableGridData[day] || {};
                        for (const [periodStr, entry] of Object.entries(dayData)) {
                            if (entry && typeof entry === 'object') {
                                const periodNumber = parseInt(periodStr);
                                const timetableEntry = entry as any;
                                
                                // Tìm period definition để lấy startTime và endTime
                                const periodDef = periodDefinitions.find(p => p.periodNumber === periodNumber);
                                const startTime = periodDef?.startTime || `${7 + periodNumber}:00`;
                                const endTime = periodDef?.endTime || `${7 + periodNumber}:45`;
                                
                                timetableArray.push({
                                    _id: timetableEntry.id,
                                    subject: { name: timetableEntry.subject },
                                    teachers: timetableEntry.teachers.split(', ').map((name: string) => ({ fullname: name.trim() })),
                                    room: { name: timetableEntry.room },
                                    timeSlot: {
                                        dayOfWeek: day,
                                        startTime,
                                        endTime
                                    },
                                    periodNumber
                                });
                            }
                        }
                    }
                    
                    setTimetable(timetableArray);
                } else {
                    console.warn('⚠️ No schoolYearId found, no data available');
                    setTimetable([]);
                }
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
                        
                        console.log('🔧 Fetching period definitions:', {
                            url: periodDefsUrl,
                            schoolYearId,
                            schoolId
                        });
                        
                        const periodDefsRes = await api.get(periodDefsUrl);
                        const periods = periodDefsRes.data.data || periodDefsRes.data || [];
                        
                        console.log('📊 Period definitions response:', {
                            status: periodDefsRes.status,
                            dataLength: periods.length,
                            sample: periods.slice(0, 3)
                        });
                        
                        setPeriodDefinitions(periods);
                    } else {
                        console.warn('⚠️ No schoolYearId for period definitions');
                    }
                } catch (periodsError: any) {
                    console.error('❌ Error fetching period definitions:', {
                        status: periodsError.response?.status,
                        data: periodsError.response?.data,
                        message: periodsError.message,
                        url: periodsError.config?.url
                    });
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
            
            console.log('🔄 Active student changed:', activeStudent?.name || activeStudent?.fullname);
            
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
                console.log('🔄 Fetching timetable for student:', activeStudent?.name || activeStudent?.fullname, 'classId:', classId);
                fetchClassAndTimetable(classId);
            } else {
                console.warn('⚠️ No classId found for student:', activeStudent?.name || activeStudent?.fullname);
                // Clear data if no classId
                setTimetable([]);
                setClassInfo(null);
                setPeriodDefinitions([]);
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

    // Sử dụng period definitions từ API (bao gồm cả regular và special periods)
    const periods: Period[] = periodDefinitions.length > 0 
        ? periodDefinitions
            .sort((a, b) => a.startTime.localeCompare(b.startTime)) // Sắp xếp theo thời gian
            .map(pd => ({
                periodNumber: pd.periodNumber,
                startTime: pd.startTime,
                endTime: pd.endTime,
                label: pd.label || (pd.type !== 'regular' ? (pd.type && PERIOD_TYPE_LABELS[pd.type]) || pd.type : `Tiết ${pd.periodNumber}`),
                type: pd.type
            }))
        : STANDARD_PERIODS; // Sử dụng constants chung

    // Debug logging cho periods
    console.log('📊 Periods being used:', {
        source: periodDefinitions.length > 0 ? 'API' : 'FALLBACK',
        count: periods.length,
        sample: periods.slice(0, 3),
        periodDefinitionsLength: periodDefinitions.length,
        regularCount: periodDefinitions.filter(pd => pd.type === 'regular').length,
        specialCount: periodDefinitions.filter(pd => pd.type !== 'regular').length
    });

    let fullTimetable: TimetableEntry[] = [];
    for (const day of DAYS_OF_WEEK) {
        // Merge timetable thực tế vào periods
        const periodsWithData = mergeTimetableData(
            periods.map(p => ({ ...p, dayOfWeek: day })), // gán dayOfWeek cho period
            timetable,
            day
        );
        
        // Thêm vào fullTimetable
        fullTimetable = [...fullTimetable, ...periodsWithData];
    }
    
    // Tìm lesson hiện tại từ fullTimetable TRƯỚC khi thêm breaks
    console.log('🔍 Full timetable entries:', fullTimetable.length);
    const currentLessonWithBreaks = getCurrentLesson(fullTimetable);
    
    // Nếu không tìm thấy lesson thực sự, mới thêm breaks để kiểm tra giờ nghỉ
    const timetableWithBreaks = currentLessonWithBreaks ? fullTimetable : insertBreaksToTimetable(fullTimetable);
    const finalCurrentLesson = currentLessonWithBreaks || getCurrentLesson(timetableWithBreaks);
    
    // Sử dụng lesson thực tế từ database
    const displayLesson = finalCurrentLesson;
    
    console.log('🎯 Display lesson:', displayLesson ? {
        subject: displayLesson.subject?.name,
        startTime: displayLesson.timeSlot?.startTime || displayLesson.startTime,
        endTime: displayLesson.timeSlot?.endTime || displayLesson.endTime,
        dayOfWeek: displayLesson.timeSlot?.dayOfWeek || displayLesson.dayOfWeek,
        periodNumber: displayLesson.periodNumber
    } : 'No lesson');
    



    const dates = communicationBooks.map(cb => ({
        date: cb.date,
        display: new Date(cb.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    }));

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshStudents();
        setRefreshing(false);
    };

    // Function để render icon cho featured modules
    const renderModuleIcon = (iconName: string) => {
        switch (iconName) {
            case 'StudentInfo': return <StudentInfo width={40} height={40} />;
            case 'Timetable': return <Timetable width={40} height={40} />;
            case 'ContactBook': return <ContactBook width={40} height={40} />;
            case 'Attendance': return <Attendance width={40} height={40} />;
            case 'StudyReport': return <StudyReport width={40} height={40} />;
            case 'Absence': return <Absence width={40} height={40} />;
            case 'MenuService': return <MenuService width={40} height={40} />;
            case 'Health': return <Health width={40} height={40} />;
            case 'Bus': return <Bus width={40} height={40} />;
            default: return null;
        }
    };

    // Handler cho việc save featured modules
    const handleSaveFeaturedModules = async (modules: ModuleItem[]) => {
        await saveFeaturedModules(modules);
        setFeaturedModules(modules);
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
                <View className="flex-1 items-center">
                    <AppText style={{ fontFamily: 'Medium' }} className="text-lg font-bold text-[#002855] text-center" numberOfLines={1}>
                        {activeStudent?.name || activeStudent?.fullname || activeStudent?.studentName || ''}
                    </AppText>
                    {/* Debug button */}
                    <TouchableOpacity onPress={() => setShowDebugger(true)} className="mt-1">
                        <Text className="text-xs text-blue-500">Debug</Text>
                    </TouchableOpacity>
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
                                {displayLesson ? 'Đang học' : 'Không có tiết học'}
                            </AppText>
                        </View>
                    </View>
                    {displayLesson ? (
                        <View className="h-full flex flex-col items-start justify-end">
                            {displayLesson.periodNumber && displayLesson.type === 'regular' && (
                                <AppText className="text-base text-gray-500 mb-1">
                                    {`Tiết ${displayLesson.periodNumber}`}
                                </AppText>
                            )}
                            <AppText className="text-2xl font-bold text-[#E4572E] mb-1">
                                {displayLesson.subject?.name || 'Tiết học'}
                            </AppText>
                            {/* Chỉ hiển thị teachers cho tiết học thông thường */}
                            {displayLesson.teachers && displayLesson.teachers.length > 0 && displayLesson.type === 'regular' && (
                                <>
                                    <AppText className="text-gray-500 text-base mb-2">
                                        {displayLesson.teachers.map((t: any) => t.fullname || t.name || 'Giáo viên').join(' / ')}
                                    </AppText>
                                    <View className="flex-row mt-1">
                                        {displayLesson.teachers.map((t: any, idx: number) => {
                                            let avatar: string;
                                            const teacherName = t.fullname || t.name || 'GV';
                                            
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
                                                avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=E0E0E0&color=757575&size=128`;
                                            }
                                            
                                            
                                            return (
                                                <Image
                                                    key={idx}
                                                    source={{ uri: avatar }}
                                                    className="w-11 h-11 rounded-full -mr-2 border border-gray-300"
                                                />
                                            );
                                        })}
                                    </View>
                                </>
                            )}
                            {/* Hiển thị thông tin thời gian cho special periods */}
                            {displayLesson.type !== 'regular' && (
                                <AppText className="text-gray-500 text-base mb-2">
                                    {displayLesson.timeSlot?.startTime || displayLesson.startTime} - {displayLesson.timeSlot?.endTime || displayLesson.endTime}
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
                <AppText style={{ fontFamily: 'Medium' }} className="w-16 text-[#4CAF50] font-bold text-base">{DAY_SCHEDULE.displayStart}</AppText>
                <AppText style={{ fontFamily: 'Medium' }} className="w-12 text-[#4CAF50] font-bold text-base text-right">{DAY_SCHEDULE.displayEnd}</AppText>
            </View>

            {/* Section Nổi bật */}
            <View className="px-4 mt-6">
                <View className="flex-row items-center justify-between mb-2">
                    <AppText style={{ fontFamily: 'Medium' }} className="text-lg font-bold text-[#0A285F]">Nổi bật</AppText>
                    <TouchableOpacity onPress={() => setShowFeaturedModal(true)}>
                        <AppText style={{ fontFamily: 'Medium' }} className="text-xs text-[#0A285F]">Thiết lập</AppText>
                    </TouchableOpacity>
                </View>
                <View className="flex-row justify-between">
                    {featuredModules.map((module, index) => (
                        <TouchableOpacity 
                            key={module.screen}
                            className="items-center flex-1" 
                            onPress={() => navigation.navigate(module.screen as never)}
                        >
                            <View className={`w-24 h-24 rounded-3xl bg-[#F9FBEB] justify-center items-center my-3 ${index === 1 ? 'mx-2' : ''}`}>
                                {renderModuleIcon(module.icon)}
                            </View>
                            <AppText style={{ fontFamily: 'Medium' }} className="text-center text-sm text-[#3F4246] font-semibold">
                                {(() => {
                                    const words = module.label.split(' ');
                                    if (words.length > 2) {
                                        return words.slice(0, 2).join(' ') + '\n' + words.slice(2).join(' ');
                                    }
                                    return module.label;
                                })()}
                            </AppText>
                        </TouchableOpacity>
                    ))}
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

            {/* Featured Modules Modal */}
            <FeaturedModulesModal
                visible={showFeaturedModal}
                onClose={() => setShowFeaturedModal(false)}
                onSave={handleSaveFeaturedModules}
                currentModules={featuredModules}
            />
            
            {/* Timetable Debugger */}
            <TimetableDebugger
                visible={showDebugger}
                onClose={() => setShowDebugger(false)}
                timetable={timetable}
                periodDefinitions={periodDefinitions}
                fullTimetable={fullTimetable}
                displayLesson={displayLesson}
            />
        </ScrollView>
    );
};

export default StudentScreen;
