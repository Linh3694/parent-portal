import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, addDays, subDays, isToday, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import TeacherIcon from '../../../assets/teacher-icon.svg';
import RoomIcon from '../../../assets/room-icon.svg';

import { useStudentSelector } from '../../../hooks/useStudentSelector';
import StudentSelector from '../../../components/StudentSelector';
import AppText from '../../../components/AppText';
import api from '../../../config/api.config';
import { TimetableEntry, ClassInfo } from '../../../types';
import { PeriodDefinition } from '../../../types/period';
import { getCurrentLesson, DAYS_OF_WEEK } from '../../../utils/studentHelpers';

// Back button component
const BackButton = ({ onGoBack }: { onGoBack: () => void }) => (
    <TouchableOpacity
        onPress={onGoBack}
        className="w-10 h-10 rounded-full items-center justify-center"
    >
        <Ionicons name="chevron-back" size={20} color="#666" />
    </TouchableOpacity>
);

// Title component
const Title = () => (
    <View className="flex items-center ml-16">
        <AppText className="text-xl font-bold text-[#002855]">
            Thời khóa biểu
        </AppText>
    </View>
);

// Date navigation component
const DateNavigation = ({ 
    selectedDate, 
    onDateChange 
}: { 
    selectedDate: Date; 
    onDateChange: (date: Date) => void;
}) => {
    const goToPrevious = () => {
        onDateChange(subDays(selectedDate, 1));
    };

    const goToNext = () => {
        onDateChange(addDays(selectedDate, 1));
    };

    const goToToday = () => {
        onDateChange(new Date());
    };

    return (
        <View className="flex-row items-center justify-center px-6 py-4 bg-white">
            <TouchableOpacity
                onPress={goToPrevious}
                className="p-2"
            >
                <Ionicons name="chevron-back" size={40} color="#BEBEBE" />
            </TouchableOpacity>

            <TouchableOpacity
                onPress={goToToday}
                className="flex items-center"
            >
                <Text className="text-center text-2xl font-bold text-[#F05023]">
                    {format(selectedDate, 'EEEE', { locale: vi }).replace('Thứ ', 'Thứ ')}
                </Text>
                <Text className="text-center text-base text-gray-600 mt-1">
                    {format(selectedDate, 'dd MMMM', { locale: vi })}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={goToNext}
                className="p-2"
            >
                <Ionicons name="chevron-forward" size={40} color="#BEBEBE" />
            </TouchableOpacity>
        </View>
    );
};

// Timetable card component
const TimetableCard = ({ 
    entry, 
    isCurrentLesson,
    periodInfo 
}: { 
    entry: TimetableEntry | null;
    isCurrentLesson: boolean;
    periodInfo: { startTime: string; endTime: string; label?: string };
}) => {
    if (!entry || !entry.subject) {
        return (
            <View className="mx-4 mb-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                        <Text className="ml-2 text-gray-500 font-medium">
                            {periodInfo.startTime} - {periodInfo.endTime}
                        </Text>
                    </View>
                    <Text className="text-gray-400 text-sm">
                        {periodInfo.label || 'Tiết học'}
                    </Text>
                </View>
                <Text className="text-center text-gray-400 mt-3">
                    Không có tiết học
                </Text>
            </View>
        );
    }

    const subjectName = typeof entry.subject === 'string' ? entry.subject : entry.subject.name;
    const teachers = entry.teachers || [];
    const teacherNames = teachers.map(t => 
        typeof t === 'string' ? t : t.fullname
    ).join(', ');

    return (
        <View className={`mx-4 mb-3 rounded-lg border-2 overflow-hidden ${
            isCurrentLesson 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white'
        }`}>
            {isCurrentLesson && (
                <LinearGradient
                    colors={['#3B82F6', '#1D4ED8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="px-3 py-1"
                >
                    <Text className="text-white text-sm font-medium text-center">
                        🔥 Tiết học hiện tại
                    </Text>
                </LinearGradient>
            )}
            
            <View className="p-4">
                <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text className="ml-2 text-gray-600 font-medium">
                            {periodInfo.startTime} - {periodInfo.endTime}
                        </Text>
                    </View>
                    <Text className="text-gray-500 text-sm">
                        {periodInfo.label || 'Tiết học'}
                    </Text>
                </View>

                <View className="flex-row items-center mb-2">
                    <Text className="ml-2 text-lg font-semibold text-[#002855]">
                        {subjectName}
                    </Text>
                </View>

                {teacherNames && (
                    <View className="flex-row items-center mb-2">
                        <TeacherIcon />
                        <Text className="ml-2 text-gray-600">
                            {teacherNames}
                        </Text>
                    </View>
                )}

                <View className="flex-row items-center">
                    <RoomIcon/>
                    <Text className="ml-2 text-gray-600">
                        Lớp học
                    </Text>
                </View>
            </View>
        </View>
    );
};

const TimetableScreen = () => {
    const navigation = useNavigation();
    const {
        students,
        activeIndex,
        activeStudent,
        studentAvatars,
        setActiveIndex,
        refreshStudents,
        loading: studentsLoading
    } = useStudentSelector();

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [periodDefinitions, setPeriodDefinitions] = useState<PeriodDefinition[]>([]);
    const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Get current day of week
    const selectedDayOfWeek = useMemo(() => {
        const dayIndex = selectedDate.getDay();
        if (dayIndex === 0 || dayIndex === 6) return null; // Weekend
        return DAYS_OF_WEEK[dayIndex - 1]; // Convert to Monday=0, Tuesday=1, etc.
    }, [selectedDate]);

    // Get class ID from active student
    const classId = useMemo(() => {
        if (!activeStudent) return null;
        
        if (activeStudent.class && Array.isArray(activeStudent.class) && activeStudent.class.length > 0) {
            return activeStudent.class[0];
        } else if (activeStudent.classId) {
            return activeStudent.classId;
        } else if (activeStudent.enrollment && Array.isArray(activeStudent.enrollment) && activeStudent.enrollment.length > 0) {
            return activeStudent.enrollment[0].class;
        }
        return null;
    }, [activeStudent]);

    // Fetch class info and timetable
    const fetchTimetableData = useCallback(async () => {
        if (!classId) return;

        try {
            setLoading(true);
            console.log('🔍 Fetching timetable data for classId:', classId);
            console.log('🔍 Active student:', activeStudent);

            // Fetch class info
            const classRes = await api.get(`/classes/${classId}?populate=gradeLevel.school`);
            const classData = classRes.data;
            console.log('📚 Class data received:', classData);
            setClassInfo(classData);

            // Fetch timetable
            console.log('🔍 Fetching timetable with URL:', `/timetables/class/${classId}`);
            const timetableRes = await api.get(`/timetables/class/${classId}`);
            console.log('📅 Full timetable response:', timetableRes);
            
            let timetableData = timetableRes.data || [];
            console.log('📅 Timetable data received:', timetableData);
            console.log('📅 Timetable count:', timetableData.length);
            
            // Nếu không có dữ liệu, thử API khác
            if (timetableData.length === 0) {
                console.log('🔄 Trying alternative timetable APIs...');
                
                // Try API with query parameter
                try {
                    const altRes1 = await api.get(`/timetables?classId=${classId}`);
                    console.log('📅 Alternative API 1 response:', altRes1);
                    timetableData = altRes1.data?.data || altRes1.data || [];
                    console.log('📅 Alternative timetable data 1:', timetableData);
                } catch (altError) {
                    console.log('❌ Alternative API 1 failed:', (altError as Error).message);
                }
                
                // Try API with school year
                if (timetableData.length === 0 && classData?.schoolYear) {
                    try {
                        const schoolYearId = typeof classData.schoolYear === 'object' 
                            ? classData.schoolYear._id 
                            : classData.schoolYear;
                        const altRes2 = await api.get(`/timetables?classId=${classId}&schoolYearId=${schoolYearId}`);
                        console.log('📅 Alternative API 2 response:', altRes2);
                        timetableData = altRes2.data?.data || altRes2.data || [];
                        console.log('📅 Alternative timetable data 2:', timetableData);
                    } catch (altError) {
                        console.log('❌ Alternative API 2 failed:', (altError as Error).message);
                    }
                }
                
                // Try get all timetables and filter
                if (timetableData.length === 0) {
                    try {
                        const allRes = await api.get(`/timetables`);
                        console.log('📅 All timetables response:', allRes);
                        const allTimetables = allRes.data?.data || allRes.data || [];
                        console.log('📅 All timetables count:', allTimetables.length);
                        
                        if (allTimetables.length > 0) {
                            console.log('📅 Sample all timetable entry:', allTimetables[0]);
                            // Try to filter by class
                            timetableData = allTimetables.filter((item: any) => 
                                item.class === classId || 
                                item.classId === classId ||
                                item.class?._id === classId
                            );
                            console.log('📅 Filtered timetable data:', timetableData);
                        }
                    } catch (altError) {
                        console.log('❌ All timetables API failed:', (altError as Error).message);
                    }
                }
            }
            
            if (timetableData.length > 0) {
                console.log('📅 Sample timetable entry:', timetableData[0]);
            }
            setTimetable(timetableData);

            // Fetch period definitions
            if (classData && classData.schoolYear) {
                const schoolYearId = typeof classData.schoolYear === 'object'
                    ? classData.schoolYear._id
                    : classData.schoolYear;

                const schoolId = classData.gradeLevel?.school?._id 
                    || classData.gradeLevel?.school 
                    || null;

                console.log('🏫 School data - SchoolYearId:', schoolYearId, 'SchoolId:', schoolId);

                if (schoolYearId) {
                    const periodDefsUrl = schoolId 
                        ? `/timetables/period-definitions/${schoolYearId}?schoolId=${schoolId}`
                        : `/timetables/period-definitions/${schoolYearId}`;
                    
                    console.log('🕐 Fetching periods from:', periodDefsUrl);
                    const periodDefsRes = await api.get(periodDefsUrl);
                    const periods = periodDefsRes.data.data || periodDefsRes.data || [];
                    console.log('🕐 Period definitions received:', periods);
                    setPeriodDefinitions(periods);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching timetable data:', error);
        } finally {
            setLoading(false);
        }
    }, [classId]);

    // Get timetable for selected day
    const dayTimetable = useMemo(() => {
        if (!selectedDayOfWeek || !timetable.length) {
            console.log('🚫 No day selected or no timetable data:', { selectedDayOfWeek, timetableLength: timetable.length });
            return [];
        }
        
        console.log('🔍 Filtering timetable for day:', selectedDayOfWeek);
        console.log('🔍 Available timetable entries:', timetable.map(entry => ({
            dayOfWeek: entry.timeSlot?.dayOfWeek || entry.dayOfWeek,
            startTime: entry.timeSlot?.startTime || entry.startTime,
            subject: entry.subject
        })));
        
        const filtered = timetable.filter(entry => {
            const dayOfWeek = entry.timeSlot?.dayOfWeek || entry.dayOfWeek;
            const matches = dayOfWeek === selectedDayOfWeek;
            if (matches) {
                console.log('✅ Found matching entry for', selectedDayOfWeek, ':', entry);
            }
            return matches;
        }).sort((a, b) => {
            const aTime = a.timeSlot?.startTime || a.startTime || '';
            const bTime = b.timeSlot?.startTime || b.startTime || '';
            return aTime.localeCompare(bTime);
        });
        
        console.log('📅 Filtered timetable for', selectedDayOfWeek, ':', filtered);
        return filtered;
    }, [timetable, selectedDayOfWeek]);

    // Get regular periods for display
    const regularPeriods = useMemo(() => {
        if (!periodDefinitions.length) {
            console.log('🚫 No period definitions available, using fallback');
            // Return fallback periods matching the image
            return [
                { _id: '1', periodNumber: 1, startTime: "08:00", endTime: "08:30", label: "Tiết 1", type: 'regular' },
                { _id: '2', periodNumber: 2, startTime: "08:35", endTime: "09:05", label: "Tiết 2", type: 'regular' },
                { _id: '3', periodNumber: 3, startTime: "09:10", endTime: "09:40", label: "Tiết 3", type: 'regular' },
                { _id: '4', periodNumber: 4, startTime: "10:00", endTime: "10:30", label: "Tiết 4", type: 'regular' },
                { _id: '5', periodNumber: 5, startTime: "10:35", endTime: "11:05", label: "Tiết 5", type: 'regular' },
                { _id: '6', periodNumber: 8, startTime: "12:55", endTime: "13:25", label: "Tiết 8", type: 'regular' },
                { _id: '7', periodNumber: 9, startTime: "13:30", endTime: "14:00", label: "Tiết 9", type: 'regular' },
            ];
        }
        
        console.log('🕐 Processing period definitions:', periodDefinitions);
        const filtered = periodDefinitions
            .filter(p => (p as any).type === 'regular' || !('type' in p)) // Handle both timetable.ts and period.ts PeriodDefinition
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        console.log('🕐 Regular periods:', filtered);
        return filtered;
    }, [periodDefinitions]);

    // Get current lesson
    const currentLesson = useMemo(() => {
        if (!isSameDay(selectedDate, new Date())) return null;
        return getCurrentLesson(timetable);
    }, [timetable, selectedDate]);

    // Create timetable entries with periods
    const timetableEntries = useMemo(() => {
        if (!regularPeriods.length) return [];

        return regularPeriods.map((period, index) => {
            const timetableEntry = dayTimetable.find(entry => {
                const startTime = entry.timeSlot?.startTime || entry.startTime;
                return startTime === period.startTime;
            });

            const isCurrentLesson = currentLesson && timetableEntry && 
                currentLesson._id === timetableEntry._id;

            return {
                period: {
                    ...period,
                    label: period.label || `Tiết ${index + 1}`
                },
                entry: timetableEntry || null,
                isCurrentLesson: !!isCurrentLesson
            };
        });
    }, [regularPeriods, dayTimetable, currentLesson]);

    // Effects
    useEffect(() => {
        if (classId) {
            fetchTimetableData();
        }
    }, [classId, fetchTimetableData]);

    // Handlers
    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleStudentSelect = (index: number) => {
        setActiveIndex(index);
    };

    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([
            refreshStudents(),
            fetchTimetableData()
        ]);
        setRefreshing(false);
    }, [refreshStudents, fetchTimetableData]);

    // Loading state
    if (studentsLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center">
                    <Ionicons name="refresh-outline" size={32} color="#002855" />
                    <Text className="mt-2 text-gray-600">Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // No students state
    if (!students.length) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center">
                    <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                    <Text className="mt-4 text-gray-500 text-center">
                        Không tìm thấy thông tin học sinh
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 bg-white">
                <BackButton onGoBack={handleGoBack} />
                <Title />
                <StudentSelector
                    students={students}
                    activeIndex={activeIndex}
                    studentAvatars={studentAvatars}
                    onStudentSelect={handleStudentSelect}
                    size={32}
                />
            </View>

            {/* Date Navigation */}
            <DateNavigation
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
            />

            {/* Content */}
            <ScrollView
                className="flex-1 bg-gray-50"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {selectedDayOfWeek === null ? (
                    // Weekend message
                    <View className="flex-1 justify-center items-center py-20">
                        <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
                        <Text className="mt-4 text-gray-500 text-center">
                            Cuối tuần không có tiết học
                        </Text>
                    </View>
                ) : loading ? (
                    // Loading state
                    <View className="flex-1 justify-center items-center py-20">
                        <Ionicons name="refresh-outline" size={32} color="#002855" />
                        <Text className="mt-2 text-gray-600">Đang tải thời khóa biểu...</Text>
                    </View>
                ) : !timetableEntries.length ? (
                    // No timetable data
                    <View className="flex-1 justify-center items-center py-20">
                        <Ionicons name="book-outline" size={48} color="#9CA3AF" />
                        <Text className="mt-4 text-gray-500 text-center">
                            Không có thời khóa biểu cho ngày này
                        </Text>
                        <Text className="mt-2 text-xs text-gray-400 text-center">
                            ClassId: {classId}
                        </Text>
                        <Text className="mt-1 text-xs text-gray-400 text-center">
                            Lớp: {(classInfo as any)?.className}
                        </Text>
                    </View>
                ) : (
                    // Timetable entries
                    <View className="py-4">
                        {timetableEntries.map((item, index) => (
                            <TimetableCard
                                key={index}
                                entry={item.entry}
                                isCurrentLesson={item.isCurrentLesson}
                                periodInfo={item.period}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default TimetableScreen;
