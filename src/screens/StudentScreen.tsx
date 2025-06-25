import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, RefreshControl } from 'react-native';
import { Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import MenuIcon from '../assets/menu.svg';
import api, { API_URL, BASE_URL } from '../config/api.config';
import { LinearGradient } from 'expo-linear-gradient';
import { getSpecialLessonsForGradeLevel, expandSpecialLessons } from '../utils/specialLessons';
import NewfeedBg from '../assets/newfeed.svg';
import AppText from '../components/AppText';
const AVATAR_SIZE = 48;
const AVATAR_BORDER = 3;

// Helper function để tạo avatar URL nhất quán
const getAvatarUrl = (student: any, avatarCache: {[key: string]: string}) => {
    const studentId = student.id || student._id;
    const studentName = student.name || student.fullname || student.studentName || 'Unknown';
    return avatarCache[studentId] || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=E0E0E0&color=757575&size=128`;
};

type Period = {
    periodNumber: number;
    startTime: string;
    endTime: string;
    label?: string;
    dayOfWeek?: string;
};

type SpecialLesson = {
    name: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    description?: string;
};

function mergePeriodsAndSpecialLessons(
    periods: Period[],
    specialLessons: SpecialLesson[],
    dayOfWeek: string
) {
    // Lấy periods và specialLessons của ngày này
    const periodsOfDay = periods.map(p => ({ ...p, dayOfWeek }));
    const specialsOfDay = specialLessons
        .filter(s => s.dayOfWeek === dayOfWeek || s.dayOfWeek === 'All')
        .map(s => ({ ...s, periodNumber: undefined }));

    // Gộp và sort theo startTime
    const all = [...periodsOfDay, ...specialsOfDay].sort(
        (a, b) => (a.startTime || '').localeCompare(b.startTime || '')
    );

    // Nếu muốn ưu tiên period, loại bỏ specialLesson trùng time với period
    const result: any[] = [];
    for (let i = 0; i < all.length; i++) {
        const cur = all[i];
        // Nếu là specialLesson, kiểm tra có period nào trùng time không
        if (!cur.periodNumber) {
            const overlap = periodsOfDay.find(
                p =>
                    (p.startTime <= cur.startTime && cur.startTime < p.endTime) ||
                    (cur.startTime <= p.startTime && p.startTime < cur.endTime)
            );
            if (overlap) continue; // bỏ qua specialLesson trùng period
        }
        result.push(cur);
    }
    return result;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const StudentScreen = () => {
    const [parent, setParent] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [classInfo, setClassInfo] = useState<any>(null);
    const [timetable, setTimetable] = useState<any[]>([]);
    const [now, setNow] = useState(new Date());
    const [periodDefinitions, setPeriodDefinitions] = useState<any[]>([]);
    const [communicationBooks, setCommunicationBooks] = useState<any[]>([]);
    const [studentAvatars, setStudentAvatars] = useState<{[key: string]: string}>({});
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const today = new Date();
        return today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');
    });
    // Các ngày gần nhất (3 ngày học gần nhất, bỏ cuối tuần) – tính sẵn để không tạo lại mỗi render
    const recentDates = React.useMemo(() => {
        const days: { date: string; display: string }[] = [];
        let d = new Date();
        while (days.length < 3) {
            const dow = d.getDay();          // 0 = Sun … 6 = Sat
            if (dow !== 0 && dow !== 6) {    // Bỏ T7‑CN
                const iso = d.toISOString().split('T')[0];                    // yyyy‑MM‑dd
                const display = d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'numeric' }); // 07/5
                days.push({ date: iso, display });
            }
            d.setDate(d.getDate() - 1);
        }
        return days;
    }, []);

    const handleSelectDate = React.useCallback((date: string) => {
        setSelectedDate(date);
    }, []);
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchParentAndStudents();
    }, []);

    const fetchParentAndStudents = async () => {
        try {
            const parentStr = await AsyncStorage.getItem('parent');
            if (!parentStr) return;
            
            const parentObj = JSON.parse(parentStr);
            setParent(parentObj);
            
            if (parentObj.students && parentObj.students.length > 0) {
                setStudents(parentObj.students);
                await fetchStudentAvatars(parentObj.students);
            }
        } catch (error: any) {
            console.error('Error in fetchParentAndStudents:', error);
        }
    };

    const fetchStudentAvatars = async (studentList: any[]) => {
        const avatars: {[key: string]: string} = {};
        
        for (const student of studentList) {
            try {
                const studentId = student.id || student._id;
                const studentName = student.name || student.fullname || student.studentName || 'Unknown';
                
                // Thử lấy avatar từ Photo model trước
                const response = await api.get(`/students/${studentId}/photo/current`);
                if (response.data && response.data.photoUrl) {
                    avatars[studentId] = `${BASE_URL}${response.data.photoUrl}`;
                } else {
                    // Fallback về Student.avatarUrl hoặc default
                    avatars[studentId] = student.avatarUrl 
                        ? `${BASE_URL}${encodeURI(student.avatarUrl)}`
                        : student.user?.avatarUrl
                            ? `${BASE_URL}${encodeURI(student.user.avatarUrl)}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=E0E0E0&color=757575&size=128`;
                }
            } catch (error) {
                // Nếu API lỗi, dùng fallback
                const studentId = student.id || student._id;
                const studentName = student.name || student.fullname || student.studentName || 'Unknown';
                
                avatars[studentId] = student.avatarUrl 
                    ? `${BASE_URL}${encodeURI(student.avatarUrl)}`
                    : student.user?.avatarUrl
                        ? `${BASE_URL}${encodeURI(student.user.avatarUrl)}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=E0E0E0&color=757575&size=128`;
            }
        }
        
        setStudentAvatars(avatars);
    };

    const fetchClassAndTimetable = async (classId: string) => {
        try {

            // Lấy thông tin lớp
            const classRes = await api.get(`/classes/${classId}`);
            setClassInfo(classRes.data);

            // Lấy thời khóa biểu
            const timetableRes = await api.get(`/timetables/class/${classId}`);
            setTimetable(timetableRes.data);

            // Lấy period definitions từ schoolYear của lớp
            if (classRes.data.schoolYear) {
                // Kiểm tra và lấy ID của schoolYear
                const schoolYearId = typeof classRes.data.schoolYear === 'object'
                    ? classRes.data.schoolYear._id
                    : classRes.data.schoolYear;

                if (schoolYearId) {
                    const periodDefsRes = await api.get(`/timetables/period-definitions/${schoolYearId}`);
                    setPeriodDefinitions(periodDefsRes.data.data);
                }
            }
        } catch (error: any) { // Thêm type any để fix linter error
        }
    };

    useEffect(() => {
        if (students.length > 0 && students[activeIndex]?.class?.length > 0) {
            const classId = students[activeIndex].class[0]; // lấy class đầu tiên
            fetchClassAndTimetable(classId);
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

    const activeStudent = students[activeIndex];

    // Lấy special lessons dựa vào grade level
    const gradeLevel = extractGradeLevel(classInfo);
    const specialLessons = expandSpecialLessons(getSpecialLessonsForGradeLevel(gradeLevel || 1));

    // Sử dụng period definitions từ API thay vì hardcode
    const periods = periodDefinitions.map(pd => ({
        periodNumber: pd.periodNumber,
        startTime: pd.startTime,
        endTime: pd.endTime,
        label: pd.label
    }));

    let fullTimetable: any[] = [];
    for (const day of DAYS_OF_WEEK) {
        // 1. Merge timetable thực tế vào periods
        const periodsWithData = mergeTimetableData(
            periods.map(p => ({ ...p, dayOfWeek: day })), // gán dayOfWeek cho period
            timetable,
            day
        );
        // 2. Merge với specialLessons
        fullTimetable = [
            ...fullTimetable,
            ...mergePeriodsAndSpecialLessons(periodsWithData, specialLessons, day)
        ];
    }

    const timetableWithBreaks = insertBreaksToTimetable(fullTimetable);
    const currentLessonWithBreaks = getCurrentLesson(timetableWithBreaks);


    const dates = communicationBooks.map(cb => ({
        date: cb.date,
        display: new Date(cb.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    }));

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchParentAndStudents();
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
                    {students.map((stu: any, idx: number) => (
                        <TouchableOpacity
                            key={stu.id || stu._id || idx}
                            onPress={() => setActiveIndex(idx)}
                            className={idx === 0 ? '' : '-ml-2'}
                        >
                            {idx === activeIndex ? (
                                <LinearGradient
                                    colors={['#FF4500', '#FFD700']}
                                    style={{ padding: 2, borderRadius: 999 }}
                                >
                                    <Image
                                        source={{ 
                                            uri: getAvatarUrl(stu, studentAvatars)
                                        }}
                                        className="w-10 h-10 rounded-full bg-white"
                                    />
                                </LinearGradient>
                            ) : (
                                <View className="border border-gray-400 rounded-full p-0.5 bg-white">
                                    <Image
                                        source={{
                                            uri: getAvatarUrl(stu, studentAvatars)
                                        }}
                                        className="w-10 h-10 rounded-full"
                                    />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
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
                                {currentLessonWithBreaks ? 'Đang học' : 'Không có tiết học'}
                            </AppText>
                        </View>
                    </View>
                    {currentLessonWithBreaks ? (
                        <View className="h-full flex flex-col items-start justify-end">
                            {currentLessonWithBreaks.periodNumber && (
                                <AppText className="text-base text-gray-500 mb-1">
                                    {`Tiết ${currentLessonWithBreaks.periodNumber}`}
                                </AppText>
                            )}
                            <AppText className="text-2xl font-bold text-[#E4572E] mb-1">
                                {currentLessonWithBreaks.subject?.name
                                    || currentLessonWithBreaks.name
                                    || currentLessonWithBreaks.label
                                    || ''}
                            </AppText>
                            {currentLessonWithBreaks.teachers && currentLessonWithBreaks.teachers.length > 0 && (
                                <>
                                    <AppText className="text-gray-500 text-base mb-2">
                                        {currentLessonWithBreaks.teachers.map((t: any) => t.fullname).join(' / ')}
                                    </AppText>
                                    <View className="flex-row mt-1">
                                        {currentLessonWithBreaks.teachers.map((t: any, idx: number) => {
                                            let avatar = t.avatarUrl
                                                ? `${BASE_URL}${encodeURI(t.avatarUrl)}`
                                                : t.user?.avatarUrl
                                                    ? `${BASE_URL}${encodeURI(t.user.avatarUrl)}`
                                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(t.fullname || 'GV')}&background=E0E0E0&color=757575&size=128`;
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

function extractGradeLevel(classInfo: any): number | null {
    if (!classInfo || !classInfo.gradeLevel) return null;
    if (typeof classInfo.gradeLevel === 'object') {
        const code = classInfo.gradeLevel.code || classInfo.gradeLevel.name;
        if (typeof code === 'string') {
            const match = code.match(/\d+/);
            if (match) return parseInt(match[0], 10);
        }
    }
    if (typeof classInfo.gradeLevel === 'number') return classInfo.gradeLevel;
    if (typeof classInfo.gradeLevel === 'string' && /^\d+$/.test(classInfo.gradeLevel)) {
        return parseInt(classInfo.gradeLevel, 10);
    }
    return null;
}

function insertBreaksToTimetable(timetable: any[]): any[] {
    let result: any[] = [];
    for (const day of DAYS_OF_WEEK) {
        const lessons = timetable.filter(item =>
            (item.timeSlot?.dayOfWeek || item.dayOfWeek) === day
        ).sort((a, b) => {
            const aStart = a.timeSlot?.startTime || a.startTime;
            const bStart = b.timeSlot?.startTime || b.startTime;
            return aStart.localeCompare(bStart);
        });

        for (let i = 0; i < lessons.length; i++) {
            result.push(lessons[i]);
            if (i < lessons.length - 1) {
                const endCurrent = lessons[i].timeSlot?.endTime || lessons[i].endTime;
                const startNext = lessons[i + 1].timeSlot?.startTime || lessons[i + 1].startTime;
                // Kiểm tra có specialLesson nào trùng khoảng này không
                const hasSpecial = lessons.some(
                    (l, idx) =>
                        idx !== i &&
                        (l.startTime || l.timeSlot?.startTime) === endCurrent &&
                        (l.endTime || l.timeSlot?.endTime) === startNext
                );
                if (endCurrent && startNext && endCurrent !== startNext && !hasSpecial) {
                    result.push({
                        name: "Nghỉ giữa giờ",
                        dayOfWeek: day,
                        startTime: endCurrent,
                        endTime: startNext,
                        description: "Nghỉ giải lao giữa các tiết"
                    });
                }
            }
        }
    }
    return result;
}

const getCurrentLesson = (timetable: any[]) => {
    if (!timetable || timetable.length === 0) return null;

    const now = new Date();
    const currentDay = DAYS_OF_WEEK[now.getDay() - 1]; // -1 vì getDay() trả về 0-6, với 0 là Chủ nhật
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false });

    return timetable.find(lesson => {
        const day = lesson.timeSlot?.dayOfWeek || lesson.dayOfWeek;
        const startTime = lesson.timeSlot?.startTime || lesson.startTime;
        const endTime = lesson.timeSlot?.endTime || lesson.endTime;

        return day === currentDay &&
            startTime <= currentTime &&
            currentTime <= endTime;
    });
};

function mergeTimetableData(periods: Period[], timetable: any[], dayOfWeek: string) {
    return periods.map(period => {
        // Tìm entry thực tế trong timetable ứng với period này
        const realLesson = timetable.find(
            t =>
                (t.timeSlot?.dayOfWeek || t.dayOfWeek) === dayOfWeek &&
                (t.timeSlot?.startTime || t.startTime) === period.startTime &&
                (t.timeSlot?.endTime || t.endTime) === period.endTime
        );
        if (realLesson) {
            return {
                ...period,
                subject: realLesson.subject, // subject là object { name, ... }
                teachers: realLesson.teachers,
                timeSlot: realLesson.timeSlot,
            };
        }
        return period;
    });
}

// Thêm hàm tính phần trăm tiến trình thời gian trong ngày
function getDayProgress(now: Date): number {
    // Giới hạn thời gian trong khoảng 08:00 - 16:15
    const start = new Date(now);
    start.setHours(8, 0, 0, 0);
    const end = new Date(now);
    end.setHours(16, 15, 0, 0);
    if (now < start) return 0;
    if (now > end) return 100;
    const total = end.getTime() - start.getTime();
    const current = now.getTime() - start.getTime();
    return Math.min(100, Math.max(0, (current / total) * 100));
}

export default StudentScreen;
