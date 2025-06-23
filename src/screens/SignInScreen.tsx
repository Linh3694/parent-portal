import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api.config';
import logo from '../assets/wellspring-logo.png';

const schema = yup.object().shape({
    phone: yup.string().required('Số điện thoại là bắt buộc'),
    password: yup.string().required('Mật khẩu là bắt buộc'),
});

const SignInScreen = () => {
    const navigation = useNavigation();
    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema),
    });
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    const onSubmit = async (data: any) => {
        setLoading(true);
        setLoginError('');
        try {
            const response = await fetch(`${API_URL}/auth/parent/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: data.phone, password: data.password })
            });
            const resData = await response.json();
            if (!response.ok) {
                setLoginError(resData.message || 'Đăng nhập thất bại');
            } else {
                await AsyncStorage.setItem('token', resData.token);
                await AsyncStorage.setItem('parent', JSON.stringify(resData.parent));
                // Chuyển sang màn hình chính hoặc màn hình khác
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            }
        } catch (err) {
            setLoginError('Lỗi kết nối máy chủ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white items-center">
            <View className="w-full mt-[15%] p-5">
                {/* Logo và tiêu đề */}
                <Image source={logo} className="w-[30%] h-16 mb-6" resizeMode="cover" />
                <Text className="font-bold text-xl text-[#002855] self-start">Đăng nhập</Text>
                {/* Phone */}
                <Text className="self-start mt-6 text-[#002855]">Số điện thoại <Text className="text-red-500">*</Text></Text>
                <Controller
                    control={control}
                    name="phone"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            className="w-full h-12 border border-[#ddd] rounded-xl px-3 mt-2 bg-white"
                            placeholder="0912345678"
                            autoCapitalize="none"
                            keyboardType="phone-pad"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                        />
                    )}
                />
                {errors.phone && <Text className="text-red-500 self-start ml-2">{errors.phone.message}</Text>}
                {/* Password */}
                <Text className="self-start mt-4 text-[#002855]">Mật khẩu <Text className="text-red-500">*</Text></Text>
                <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            className="w-full h-12 border border-[#ddd] rounded-xl px-3 mt-2 bg-white"
                            placeholder="Nhập mật khẩu"
                            secureTextEntry
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                        />
                    )}
                />
                {errors.password && <Text className="text-red-500 self-start ml-2">{errors.password.message}</Text>}
                {loginError ? <Text className="text-red-500 text-center mt-2">{loginError}</Text> : null}
                {/* Nút đăng nhập */}
                <TouchableOpacity
                    className="w-full bg-[#F05023] rounded-full py-3 items-center mt-6"
                    onPress={handleSubmit(onSubmit)}
                    disabled={loading}
                >
                    <Text className="text-white font-bold text-base">{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</Text>
                </TouchableOpacity>
                {/* Quên mật khẩu */}
                <TouchableOpacity className="w-full items-center mt-4">
                    <Text className="text-[#757575] text-base">Quên mật khẩu?</Text>
                </TouchableOpacity>
            </View>
            <View className="absolute bottom-12 w-full items-center mt-4">
                <Text className="text-[#686868] text-xs text-center mt-8">
                    © Copyright 2025 Wellspring International Bilingual Schools.{"\n"}All Rights Reserved.
                </Text>
            </View>
        </View>
    );
};

export default SignInScreen; 