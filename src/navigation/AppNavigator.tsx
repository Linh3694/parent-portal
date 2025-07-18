import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  Home: undefined;
  MenuScreen: undefined;
  StudentInfo: undefined;
  OnlineAccount: undefined;
  Timetable: undefined;
  ContactBook: undefined;
  Attendance: undefined;
  StudyReport: undefined;
  Absence: undefined;
  CreateLeaveRequest: undefined;
  MenuService: undefined;
  Health: undefined;
  Bus: undefined;
};
import WelcomeScreen from '../screens/WelcomeScreen';
import SignInScreen from '../screens/SignInScreen';
import MainTabNavigator from './MainTabNavigator';
import MenuScreen from '../screens/MenuScreen/MenuScreen';
// Import các trang con
import StudentInfo from '../screens/MenuScreen/Information/StudentInfo';
import OnlineAccount from '../screens/MenuScreen/Information/OnlineAccount';
import Timetable from '../screens/MenuScreen/Information/Timetable';
import ContactBook from '../screens/MenuScreen/Daily/ContactBook';
import Attendance from '../screens/MenuScreen/Daily/Attendance';
import StudyReport from '../screens/MenuScreen/Daily/StudyReport';
import Absence from '../screens/MenuScreen/Daily/Absence';
import CreateLeaveRequest from '../screens/MenuScreen/Daily/Component/CreateLeaveRequest';
import MenuService from '../screens/MenuScreen/Service/MenuService';
import Health from '../screens/MenuScreen/Service/Health';
import Bus from '../screens/MenuScreen/Service/Bus';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
    return (
        <Stack.Navigator 
            screenOptions={{ headerShown: false }}
            initialRouteName="Welcome"
        >
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="Home" component={MainTabNavigator} />
            <Stack.Screen name="MenuScreen" component={MenuScreen} />
            <Stack.Screen name="StudentInfo" component={StudentInfo} />
            <Stack.Screen name="OnlineAccount" component={OnlineAccount} />
            <Stack.Screen name="Timetable" component={Timetable} />
            <Stack.Screen name="ContactBook" component={ContactBook} />
            <Stack.Screen name="Attendance" component={Attendance} />
            <Stack.Screen name="StudyReport" component={StudyReport} />
            <Stack.Screen name="Absence" component={Absence} />
            <Stack.Screen name="CreateLeaveRequest" component={CreateLeaveRequest} />
            <Stack.Screen name="MenuService" component={MenuService} />
            <Stack.Screen name="Health" component={Health} />
            <Stack.Screen name="Bus" component={Bus} />
        </Stack.Navigator>
    );
};

export default AppNavigator;