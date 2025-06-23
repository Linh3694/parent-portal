import React from 'react';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "../../global.css";
import { Slot } from 'expo-router';


export default function Layout() {
    const [fontsLoaded] = useFonts({
        'Mulish-Regular': require('../assets/fonts/Mulish-Regular.ttf'),
        'Mulish-Bold': require('../assets/fonts/Mulish-Bold.ttf'),
    });
    if (!fontsLoaded) {
        return <AppLoading />;
    }
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <GluestackUIProvider config={config}>
                <Slot />
            </GluestackUIProvider>
        </GestureHandlerRootView>
    );
} 