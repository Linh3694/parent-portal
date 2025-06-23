import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const MENU_GROUPS = [
    {
        title: 'Thông tin cơ bản',
        items: [
            { label: 'Thông tin học sinh', screen: 'StudentInfo' },
            { label: 'Tài khoản online', screen: 'OnlineAccount' },
            { label: 'Thời khóa biểu', screen: 'Timetable' },
        ],
    },
    {
        title: 'Hàng ngày',
        items: [
            { label: 'Sổ liên lạc', screen: 'ContactBook' },
            { label: 'Điểm danh', screen: 'Attendance' },
            { label: 'Báo cáo học tập', screen: 'StudyReport' },
            { label: 'Nghỉ phép', screen: 'Absence' },
        ],
    },
    {
        title: 'Dịch vụ học sinh',
        items: [
            { label: 'Thực đơn', screen: 'MenuService' },
            { label: 'Y tế', screen: 'Health' },
            { label: 'Bus', screen: 'Bus' },
        ],
    },
];

const MenuScreen = () => {
    const navigation = useNavigation();

    return (
        <View className="flex-1 bg-[#FAF3EF]">
            <View className="bg-white rounded-3xl flex-1 mx-2 mt-8 mb-2 p-4">
                {/* Header */}
                <View className="flex-row items-center mb-4">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text className="text-2xl mr-2">←</Text>
                    </TouchableOpacity>
                    <Text className="flex-1 text-center text-xl font-semibold">Menu</Text>
                </View>
                {/* Search */}
                <View className="mb-4">
                    <TextInput
                        className="bg-[#F5F5F5] rounded-xl px-4 py-2 text-base"
                        placeholder="Tìm kiếm"
                        placeholderTextColor="#999"
                    />
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {MENU_GROUPS.map((group, idx) => (
                        <View key={group.title} className="mb-6">
                            <Text className="text-lg font-bold text-[#0A285F] mb-3">{group.title}</Text>
                            <View className="flex-row flex-wrap">
                                {group.items.map((item, i) => (
                                    <TouchableOpacity
                                        key={item.label}
                                        className="w-1/3 items-center mb-6"
                                        onPress={() => navigation.navigate(item.screen as never)}
                                    >
                                        <View className="w-20 h-20 rounded-2xl bg-[#FAF9F2] mb-2 justify-center items-center" />
                                        <Text className="text-center text-base text-[#3F4246] font-medium mt-1">{item.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
};

export default MenuScreen;
