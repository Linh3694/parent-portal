import React from 'react';
import { View, TouchableOpacity, Image, Text } from 'react-native';
import { Student, StudentAvatarCache } from '../types';
import { getAvatarUrl } from '../utils/studentHelpers';

interface StudentPickerProps {
    students: Student[];
    selectedStudent: Student | null;
    studentAvatars: StudentAvatarCache;
    onStudentSelect: (student: Student) => void;
    size?: number;
    showName?: boolean;
    layout?: 'horizontal' | 'vertical';
}

const StudentPicker: React.FC<StudentPickerProps> = ({
    students,
    selectedStudent,
    studentAvatars,
    onStudentSelect,
    size = 25,
    showName = true,
    layout = 'horizontal'
}) => {
    const isSelected = (student: Student) => {
        const selectedId = selectedStudent?.id || selectedStudent?._id;
        const studentId = student.id || student._id;
        return selectedId === studentId;
    };

    return (
        <View className={`flex-${layout === 'horizontal' ? 'row' : 'col'} flex-wrap gap-3`}>
            {students.map((student) => {
                const selected = isSelected(student);
                return (
                    <TouchableOpacity
                        key={student.id || student._id}
                        onPress={() => onStudentSelect(student)}
                        className={`items-center p-2 rounded-lg ${
                            selected ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50 border border-gray-200'
                        }`}
                    >
                        <Image
                            source={{ uri: getAvatarUrl(student, studentAvatars) }}
                            style={{ 
                                width: size, 
                                height: size, 
                                borderRadius: size / 2 
                            }}
                            className="mb-2"
                        />
                        {showName && (
                            <Text className={`text-sm text-center ${
                                selected ? 'text-blue-600 font-semibold' : 'text-gray-600'
                            }`}>
                                {student.name || student.fullname || student.studentName || 'Unknown'}
                            </Text>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

export default StudentPicker; 