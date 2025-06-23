import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import StudentScreen from '../screens/StudentScreen';
import NewsScreen from '../screens/NewsScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Text, View } from 'react-native';
// Import SVG icons
import StudentIcon from '../assets/student.svg';
import NewsIcon from '../assets/news.svg';
import ChatIcon from '../assets/chat.svg';
import ProfileIcon from '../assets/profile.svg';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused }) => {
                let IconComponent = null;
                if (route.name === 'Student') {
                    IconComponent = StudentIcon;
                } else if (route.name === 'News') {
                    IconComponent = NewsIcon;
                } else if (route.name === 'Chat') {
                    IconComponent = ChatIcon;
                } else if (route.name === 'Profile') {
                    IconComponent = ProfileIcon;
                }
                return (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <IconComponent width={32} height={32} />
                    </View>
                );
            },
            tabBarLabel: ({ focused }) => {
                let label = '';
                if (route.name === 'Student') label = 'Học sinh';
                if (route.name === 'News') label = 'Bảng tin';
                if (route.name === 'Chat') label = 'Trao đổi';
                if (route.name === 'Profile') label = 'Hồ sơ';
                return (
                    <Text style={{
                        color: focused ? '#1A237E' : '#BDBDBD',
                        fontWeight: focused ? 'bold' : 'normal',
                        fontSize: 14,
                        marginTop: 4,
                    }}>
                        {label}
                    </Text>
                );
            },
            tabBarStyle: {
                height: 100,
                paddingBottom: 12,
                paddingTop: 8,
            },
        })}
    >
        <Tab.Screen name="Student" component={StudentScreen} />
        <Tab.Screen name="News" component={NewsScreen} />
        <Tab.Screen name="Chat" component={ChatScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
);

export default MainTabNavigator;
