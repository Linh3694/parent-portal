import React from 'react';
import Onboarding from 'react-native-onboarding-swiper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image, TouchableOpacity, Text, View, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
    Onboarding: undefined;
    Login: undefined;
    Main: undefined;
};

type OnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const { width, height } = Dimensions.get('window');

const SkipButton = (props: any) => (
    <TouchableOpacity
        className="px-6 py-2 rounded-lg mx-5"
        {...props}
    >
        <Text className="text-[#FF5722] font-semibold text-base">Bỏ qua</Text>
    </TouchableOpacity>
);

const NextButton = (props: any) => (
    <TouchableOpacity
        className="px-6 py-2 rounded-lg mx-5"
        {...props}
    >
        <Text className="text-[#002855] font-semibold text-base">{props.label || 'Tiếp'}</Text>
    </TouchableOpacity>
);

const DoneButton = (props: any) => (
    <TouchableOpacity
        className="px-6 py-2 rounded-lg mx-5"
        {...props}
    >
        <Text className="text-[#002855] font-semibold text-base">Xong</Text>
    </TouchableOpacity>
);

const OnboardingScreen = () => {
    const navigation = useNavigation<OnboardingScreenNavigationProp>();

    const handleDone = async () => {
        await AsyncStorage.setItem('onboardingComplete', 'true');
        navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
        });
    };

    return (
        <Onboarding
            onDone={handleDone}
            onSkip={handleDone}
            SkipButtonComponent={SkipButton}
            NextButtonComponent={NextButton}
            DoneButtonComponent={DoneButton}
            bottomBarColor="#fff"
            pages={[
                {
                    backgroundColor: '#fff',
                    image: (
                        <View style={{ width, height: height * 0.5 }}>
                            <Image
                                source={require('../assets/onboarding1.png')}
                                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                            />
                        </View>
                    ),
                    title: 'Chào mừng',
                    subtitle: 'Đây là ứng dụng của bạn',
                },
                {
                    backgroundColor: '#fff',
                    image: (
                        <View style={{ width, height: height * 0.5 }}>
                            <Image
                                source={require('../assets/onboarding2.png')}
                                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                            />
                        </View>
                    ),
                    title: 'Tính năng',
                    subtitle: 'Khám phá các tính năng tuyệt vời',
                },
                {
                    backgroundColor: '#fff',
                    image: (
                        <View style={{ width, height: height * 0.5 }}>
                            <Image
                                source={require('../assets/onboarding3.png')}
                                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                            />
                        </View>
                    ),
                    title: 'Bắt đầu',
                    subtitle: 'Hãy bắt đầu ngay bây giờ',
                },
            ]}
        />
    );
};

export default OnboardingScreen;