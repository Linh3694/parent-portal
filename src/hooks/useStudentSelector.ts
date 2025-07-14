import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { BASE_URL } from '../config/api.config';
import { Student, Parent, StudentAvatarCache } from '../types';

interface UseStudentSelectorReturn {
    parent: Parent | null;
    students: Student[];
    activeIndex: number;
    activeStudent: Student | null;
    studentAvatars: StudentAvatarCache;
    setActiveIndex: (index: number) => void;
    refreshStudents: () => Promise<void>;
    loading: boolean;
}

export const useStudentSelector = (): UseStudentSelectorReturn => {
    const [parent, setParent] = useState<Parent | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [studentAvatars, setStudentAvatars] = useState<StudentAvatarCache>({});
    const [loading, setLoading] = useState(true);

    const fetchStudentAvatars = useCallback(async (studentList: Student[]) => {
        const avatars: StudentAvatarCache = {};
        
        for (const student of studentList) {
            try {
                const studentId = student.id || student._id;
                const studentName = student.name || student.fullname || student.studentName || 'Unknown';
                
                // Thử lấy avatar từ Photo model trước
                const response = await api.get(`/students/${studentId}/photo/current`);
                if (response.data && response.data.photoUrl) {
                    avatars[studentId || ''] = `${BASE_URL}${response.data.photoUrl}`;
                } else {
                    // Fallback về Student.avatarUrl hoặc default
                    avatars[studentId || ''] = student.avatarUrl 
                        ? `${BASE_URL}${encodeURI(student.avatarUrl)}`
                        : student.user?.avatarUrl
                            ? `${BASE_URL}${encodeURI(student.user.avatarUrl)}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=E0E0E0&color=757575&size=128`;
                }
            } catch (error) {
                // Nếu API lỗi, dùng fallback
                const studentId = student.id || student._id;
                const studentName = student.name || student.fullname || student.studentName || 'Unknown';
                
                avatars[studentId || ''] = student.avatarUrl 
                    ? `${BASE_URL}${encodeURI(student.avatarUrl)}`
                    : student.user?.avatarUrl
                        ? `${BASE_URL}${encodeURI(student.user.avatarUrl)}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=E0E0E0&color=757575&size=128`;
            }
        }
        
        setStudentAvatars(avatars);
    }, []);

    const fetchParentAndStudents = useCallback(async () => {
        try {
            setLoading(true);
            const parentStr = await AsyncStorage.getItem('parent');
            if (!parentStr) {
                setLoading(false);
                return;
            }
            
            const parentObj = JSON.parse(parentStr);
            setParent(parentObj);
            
            if (parentObj.students && parentObj.students.length > 0) {
                setStudents(parentObj.students);
                await fetchStudentAvatars(parentObj.students);
            }
        } catch (error: any) {
            console.error('Error in fetchParentAndStudents:', error);
        } finally {
            setLoading(false);
        }
    }, [fetchStudentAvatars]);

    useEffect(() => {
        fetchParentAndStudents();
    }, [fetchParentAndStudents]);

    // Đảm bảo activeIndex không vượt quá số lượng students
    useEffect(() => {
        if (students.length > 0 && activeIndex >= students.length) {
            setActiveIndex(0);
        }
    }, [students.length, activeIndex]);

    const activeStudent = students.length > 0 && activeIndex < students.length 
        ? students[activeIndex] 
        : null;

    const refreshStudents = useCallback(async () => {
        await fetchParentAndStudents();
    }, [fetchParentAndStudents]);

    return {
        parent,
        students,
        activeIndex,
        activeStudent,
        studentAvatars,
        setActiveIndex,
        refreshStudents,
        loading
    };
}; 