// Mobile/src/app/index.tsx
import React, { useRef } from 'react';
import { Text, TextInput, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import AppNavigator from '../navigation/AppNavigator';
import '../../global.css';

SplashScreen.preventAutoHideAsync();

export default function Page() {
    const [fontsLoaded] = useFonts({
        'Mulish-Regular': require('../assets/fonts/Mulish-Regular.ttf'),
        'Mulish-Bold': require('../assets/fonts/Mulish-Bold.ttf'),
        'Mulish-Italic': require('../assets/fonts/Mulish-Italic.ttf'),
        'Mulish-BoldItalic': require('../assets/fonts/Mulish-BoldItalic.ttf'),
    });
    const didSetGlobalFont = useRef(false);

    /** GÁN FONT TOÀN CỤC trước khi render giao diện */
    if (fontsLoaded && !didSetGlobalFont.current) {
        // @ts-ignore
        if (!Text.defaultProps) Text.defaultProps = {};
        // @ts-ignore
        if (!TextInput.defaultProps) TextInput.defaultProps = {};
        // @ts-ignore
        Text.defaultProps.style = { ...(Text.defaultProps.style || {}), fontFamily: 'Mulish-Regular' };
        // @ts-ignore
        TextInput.defaultProps.style = { ...(TextInput.defaultProps.style || {}), fontFamily: 'Mulish-Regular' };
        didSetGlobalFont.current = true;
        SplashScreen.hideAsync();
    }

    // Chờ font xong rồi mới render app
    if (!fontsLoaded) return null;

    return (
        <View style={{ flex: 1 }}>
            <AppNavigator />
        </View>
    );
}