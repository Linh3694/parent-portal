import React, { useLayoutEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
// PNG banner đã xuất phẳng
import BannerPng from '../assets/welcome.png';

const WelcomeScreen = () => {
    const navigation = useNavigation();
    const { handleSubmit } = useForm();
    const { width: screenWidth } = Dimensions.get('window');
    const BANNER_WIDTH = 1100;
    const BANNER_HEIGHT = 480;

    const translateX = useRef(new Animated.Value(0)).current;

    useLayoutEffect(() => {
        let isMounted = true;
        const animate = () => {
            if (!isMounted) return;
            translateX.setValue(0);
            Animated.timing(translateX, {
                toValue: -BANNER_WIDTH,
                duration: 18000,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start(() => {
                if (isMounted) animate();
            });
        };
        animate();
        return () => { isMounted = false; };
    }, [translateX]);

    const onSubmit = (data: any) => {
        navigation.navigate('SignIn');
    };

    return (
        <View className="flex-1 bg-white">
            <View className="flex-1 justify-center mb-[20%] items-center">
                <View className="w-full items-center space-y-5">
                    <View className=" mb-5">
                        <Text className="text-lg font-bold text-[#1A237E] text-center mb-5 ">
                            Chào mừng quý Phụ huynh đến với
                        </Text>
                        <Text className="text-5xl font-extrabold text-[#F05023] text-center mb-5 ">
                            WISer Portal
                        </Text>
                        <Text className="text-sm text-[#333] mb-5  text-center">
                            Đồng hành cùng thế hệ tương lai
                        </Text>
                    </View>
                    {/* Banner động */}
                    <View
                        style={{
                            width: screenWidth,
                            height: BANNER_HEIGHT,
                            overflow: 'hidden',
                            alignItems: 'center',
                            justifyContent: 'center',
                            alignSelf: 'center',
                        }}
                    >
                        <Animated.View
                            style={{
                                flexDirection: 'row',
                                width: BANNER_WIDTH * 3,
                                height: BANNER_HEIGHT,
                                transform: [{ translateX }],
                            }}
                        >
                            <Animated.Image
                                source={BannerPng}
                                resizeMode="cover"
                                style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }}
                            />
                            <Animated.Image
                                source={BannerPng}
                                resizeMode="cover"
                                style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }}
                            />
                            <Animated.Image
                                source={BannerPng}
                                resizeMode="cover"
                                style={{ width: BANNER_WIDTH, height: BANNER_HEIGHT }}
                            />
                        </Animated.View>
                    </View>
                </View>
            </View>
            <View className="absolute bottom-12 w-full items-center">
                <TouchableOpacity
                    className="w-4/5 rounded-full bg-[#F05023] py-4 items-center"
                    onPress={handleSubmit(onSubmit)}
                >
                    <Text className="text-white font-bold text-lg">Đăng nhập</Text>
                </TouchableOpacity>
                <Text className="mt-4 text-[#757575] text-base font-semibold">Quên mật khẩu?</Text>
            </View>
        </View>
    );
};

export default WelcomeScreen; 