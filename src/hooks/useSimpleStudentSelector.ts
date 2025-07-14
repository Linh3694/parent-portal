import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Student, Parent } from '../types';

interface UseSimpleStudentSelectorReturn {
    parent: Parent | null;
    students: Student[];
    activeIndex: number;
    activeStudent: Student | null;
    setActiveIndex: (index: number) => void;
    refreshStudents: () => Promise<void>;
    loading: boolean;
}

export const useSimpleStudentSelector = (): UseSimpleStudentSelectorReturn => {
    const [parent, setParent] = useState<Parent | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(true);

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
            }
        } catch (error: any) {
            console.error('Error in fetchParentAndStudents:', error);
        } finally {
            setLoading(false);
        }
    }, []);

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
        setActiveIndex,
        refreshStudents,
        loading
    };
}; 