import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import AppText from './AppText';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import các icon SVG
import StudentInfo from '../assets/StudentInfo.svg';
import OnlineAccount from '../assets/OnlineAccount.svg';
import Timetable from '../assets/Timetable.svg';
import ContactBook from '../assets/ContactBook.svg';
import Attendance from '../assets/Attendance.svg';
import StudyReport from '../assets/StudyReport.svg';
import Absence from '../assets/Absence.svg';
import MenuService from '../assets/MenuService.svg';
import Health from '../assets/Health.svg';
import Bus from '../assets/Bus.svg';

export interface ModuleItem {
    label: string;
    screen: string;
    icon: string;
}

const AVAILABLE_MODULES: ModuleItem[] = [
    { label: 'Thông tin học sinh', screen: 'StudentInfo', icon: 'StudentInfo' },
    { label: 'Thời khóa biểu', screen: 'Timetable', icon: 'Timetable' },
    { label: 'Sổ liên lạc', screen: 'ContactBook', icon: 'ContactBook' },
    { label: 'Điểm danh', screen: 'Attendance', icon: 'Attendance' },
    { label: 'Báo cáo học tập', screen: 'StudyReport', icon: 'StudyReport' },
    { label: 'Nghỉ phép', screen: 'Absence', icon: 'Absence' },
    { label: 'Thực đơn', screen: 'MenuService', icon: 'MenuService' },
    { label: 'Y tế', screen: 'Health', icon: 'Health' },
    { label: 'Bus', screen: 'Bus', icon: 'Bus' },
];

const STORAGE_KEY = 'featured_modules';

interface FeaturedModulesModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (selectedModules: ModuleItem[]) => void;
    currentModules: ModuleItem[];
}

const FeaturedModulesModal: React.FC<FeaturedModulesModalProps> = ({
    visible,
    onClose,
    onSave,
    currentModules
}) => {
    const [selectedModules, setSelectedModules] = useState<ModuleItem[]>(currentModules);

    useEffect(() => {
        setSelectedModules(currentModules);
    }, [currentModules]);

    const handleModuleToggle = (module: ModuleItem) => {
        const isSelected = selectedModules.some(m => m.screen === module.screen);
        
        if (isSelected) {
            // Bỏ chọn module
            setSelectedModules(selectedModules.filter(m => m.screen !== module.screen));
        } else {
            // Chọn module
            if (selectedModules.length < 3) {
                setSelectedModules([...selectedModules, module]);
            } else {
                Alert.alert('Thông báo', 'Bạn chỉ có thể chọn tối đa 3 module');
            }
        }
    };

    const handleSave = () => {
        if (selectedModules.length === 0) {
            Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 module');
            return;
        }
        onSave(selectedModules);
        onClose();
    };

    const renderIcon = (iconName: string) => {
        switch (iconName) {
            case 'StudentInfo': return <StudentInfo width={40} height={40} />;
            case 'OnlineAccount': return <OnlineAccount width={40} height={40} />;
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

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-4">
                        <AppText style={{ fontFamily: 'Medium' }} className="text-lg font-bold text-[#0A285F]">
                            Chọn module nổi bật
                        </AppText>
                        <TouchableOpacity onPress={onClose}>
                            <AppText className="text-gray-500 text-lg">✕</AppText>
                        </TouchableOpacity>
                    </View>

                    <AppText className="text-gray-600 mb-4">
                        Chọn tối đa 3 module để hiển thị trong phần nổi bật ({selectedModules.length}/3)
                    </AppText>

                    {/* Danh sách modules */}
                    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                        <View className="flex-row flex-wrap">
                            {AVAILABLE_MODULES.map((module) => {
                                const isSelected = selectedModules.some(m => m.screen === module.screen);
                                
                                return (
                                    <TouchableOpacity
                                        key={module.screen}
                                        className="w-1/3 items-center mb-6"
                                        onPress={() => handleModuleToggle(module)}
                                    >
                                        <View className={`w-20 h-20 rounded-2xl mb-2 justify-center items-center ${
                                            isSelected 
                                                ? 'bg-[#219A7A] shadow-lg' 
                                                : 'bg-[#FAF9F2] border border-gray-200'
                                        }`}>
                                            {renderIcon(module.icon)}
                                        </View>
                                        <AppText 
                                            style={{ fontFamily: 'Medium' }}
                                            className={`text-center text-sm font-medium ${
                                                isSelected ? 'text-[#219A7A]' : 'text-[#3F4246]'
                                            }`}
                                        >
                                            {module.label}
                                        </AppText>
                                        {isSelected && (
                                            <View className="absolute top-0 right-2 w-6 h-6 bg-[#219A7A] rounded-full items-center justify-center">
                                                <AppText className="text-white text-xs">✓</AppText>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    {/* Buttons */}
                    <View className="flex-row justify-between pt-4 border-t border-gray-200">
                        <TouchableOpacity
                            className="flex-1 bg-gray-100 py-3 rounded-xl mr-2"
                            onPress={onClose}
                        >
                            <AppText style={{ fontFamily: 'Medium' }} className="text-center text-gray-600 font-medium">
                                Hủy
                            </AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 bg-[#219A7A] py-3 rounded-xl ml-2"
                            onPress={handleSave}
                        >
                            <AppText style={{ fontFamily: 'Medium' }} className="text-center text-white font-medium">
                                Lưu
                            </AppText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default FeaturedModulesModal;

// Utility functions để lưu/load settings
export const saveFeaturedModules = async (modules: ModuleItem[]) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
    } catch (error) {
        console.error('Error saving featured modules:', error);
    }
};

export const loadFeaturedModules = async (): Promise<ModuleItem[]> => {
    try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
        // Default modules nếu chưa có settings
        return [
            { label: 'Thời khóa biểu', screen: 'Timetable', icon: 'Timetable' },
            { label: 'Nghỉ phép', screen: 'Absence', icon: 'Absence' },
            { label: 'Báo cáo học tập', screen: 'StudyReport', icon: 'StudyReport' },
        ];
    } catch (error) {
        console.error('Error loading featured modules:', error);
        return [
            { label: 'Thời khóa biểu', screen: 'Timetable', icon: 'Timetable' },
            { label: 'Nghỉ phép', screen: 'Absence', icon: 'Absence' },
            { label: 'Báo cáo học tập', screen: 'StudyReport', icon: 'StudyReport' },
        ];
    }
}; 