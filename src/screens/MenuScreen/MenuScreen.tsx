import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, SafeAreaView } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import StudentInfo from '../../assets/StudentInfo.svg';
import OnlineAccount from '../../assets/OnlineAccount.svg';
import Timetable from '../../assets/Timetable.svg';
import ContactBook from '../../assets/ContactBook.svg';
import Attendance from '../../assets/Attendance.svg';
import StudyReport from '../../assets/StudyReport.svg';
import Absence from '../../assets/Absence.svg';
import MenuService from '../../assets/MenuService.svg';
import Health from '../../assets/Health.svg';
import Bus from '../../assets/Bus.svg';

const MENU_GROUPS = [
    {
        title: 'Thông tin cơ bản',
        items: [
            { label: 'Thông tin học sinh', screen: 'StudentInfo', icon: 'StudentInfo' },
            // { label: 'Tài khoản online', screen: 'OnlineAccount', icon: 'OnlineAccount' },
            { label: 'Thời khóa biểu', screen: 'Timetable', icon: 'Timetable' },
        ],
    },
    {
        title: 'Hàng ngày',
        items: [
            { label: 'Sổ liên lạc', screen: 'ContactBook', icon: 'ContactBook' },
            { label: 'Điểm danh', screen: 'Attendance', icon: 'Attendance' },
            { label: 'Báo cáo học tập', screen: 'StudyReport', icon: 'StudyReport' },
            { label: 'Nghỉ phép', screen: 'Absence', icon: 'Absence' },
        ],
    },
    {
        title: 'Dịch vụ học sinh',
        items: [
            { label: 'Thực đơn', screen: 'MenuService', icon: 'MenuService' },
            { label: 'Y tế', screen: 'Health', icon: 'Health' },
            { label: 'Bus', screen: 'Bus', icon: 'Bus' },
        ],
    },
];

const MenuScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList, 'MenuScreen'>>();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View className="flex bg-white p-5">
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
                                        <View className="w-20 h-20 rounded-2xl bg-[#FAF9F2] mb-2 justify-center items-center">
                                            {item.icon === 'StudentInfo' && <StudentInfo width={40} height={40} />}
                                            {item.icon === 'OnlineAccount' && <OnlineAccount width={40} height={40} />}
                                            {item.icon === 'Timetable' && <Timetable width={40} height={40} />}
                                            {item.icon === 'ContactBook' && <ContactBook width={40} height={40} />}
                                            {item.icon === 'Attendance' && <Attendance width={40} height={40} />}
                                            {item.icon === 'StudyReport' && <StudyReport width={40} height={40} />}
                                            {item.icon === 'Absence' && <Absence width={40} height={40} />}
                                            {item.icon === 'MenuService' && <MenuService width={40} height={40} />}
                                            {item.icon === 'Health' && <Health width={40} height={40} />}
                                            {item.icon === 'Bus' && <Bus width={40} height={40} />}
                                        </View>
                                        <Text className="text-center text-base text-[#3F4246] font-medium mt-1">
                                            {(() => {
                                                const words = item.label.split(' ');
                                                if (words.length > 2) {
                                                    return words.slice(0, 2).join(' ') + '\n' + words.slice(2).join(' ');
                                                }
                                                return item.label;
                                            })()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

export default MenuScreen;
