import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Student, StudentAvatarCache } from '../types';
import { getAvatarUrl } from '../utils/studentHelpers';

interface StudentSelectorProps {
    students: Student[];
    activeIndex: number;
    studentAvatars: StudentAvatarCache;
    onStudentSelect: (index: number) => void;
    size?: number;
    showActiveIndicator?: boolean;
}

const StudentSelector: React.FC<StudentSelectorProps> = ({
    students,
    activeIndex,
    studentAvatars,
    onStudentSelect,
    size = 40,
    showActiveIndicator = true
}) => {
    return (
        <View className="flex-row items-center">
            {students.map((student, idx) => (
                <TouchableOpacity
                    key={student.id || student._id || idx}
                    onPress={() => onStudentSelect(idx)}
                    className={idx === 0 ? '' : '-ml-2'}
                >
                    {idx === activeIndex && showActiveIndicator ? (
                        <LinearGradient
                            colors={['#FF4500', '#FFD700']}
                            style={{ padding: 2, borderRadius: 999 }}
                        >
                            <Image
                                source={{ 
                                    uri: getAvatarUrl(student, studentAvatars)
                                }}
                                style={{ 
                                    width: size, 
                                    height: size, 
                                    borderRadius: size / 2 
                                }}
                                className="bg-white"
                            />
                        </LinearGradient>
                    ) : (
                        <View className="border border-gray-400 rounded-full p-0.5 bg-white">
                            <Image
                                source={{
                                    uri: getAvatarUrl(student, studentAvatars)
                                }}
                                style={{ 
                                    width: size, 
                                    height: size, 
                                    borderRadius: size / 2 
                                }}
                            />
                        </View>
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
};

export default StudentSelector; 