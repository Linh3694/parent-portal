import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import AppText from '../../../../components/AppText';

interface LeaveRequest {
    studentName: string;
    reason: string;
    description: string;
    startDate: Date;
    endDate: Date;
    contactInfo: string;
}

const CreateLeaveRequest = () => {
    const [formData, setFormData] = useState<LeaveRequest>({
        studentName: '',
        reason: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(),
        contactInfo: ''
    });

    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');

    const reasonOptions = [
        'Ốm đau',
        'Việc gia đình',
        'Đi du lịch',
        'Lý do khác'
    ];

    const handleGoBack = () => {
        console.log('Go back');
        // Navigate back to Absence screen
    };

    const handleSubmit = () => {
        // Validate form
        if (!formData.studentName.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên học sinh');
            return;
        }
        if (!selectedReason) {
            Alert.alert('Lỗi', 'Vui lòng chọn lý do nghỉ học');
            return;
        }
        if (!formData.description.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập mô tả chi tiết');
            return;
        }

        // Submit form
        console.log('Submit form:', { ...formData, reason: selectedReason });
        Alert.alert(
            'Thành công', 
            'Đơn xin nghỉ học đã được gửi thành công!',
            [
                {
                    text: 'OK',
                    onPress: handleGoBack
                }
            ]
        );
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('vi-VN');
    };

    const onStartDateChange = (event: any, selectedDate?: Date) => {
        setShowStartDatePicker(false);
        if (selectedDate) {
            setFormData({ ...formData, startDate: selectedDate });
        }
    };

    const onEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndDatePicker(false);
        if (selectedDate) {
            setFormData({ ...formData, endDate: selectedDate });
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FDF4E5' }}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle="dark-content" />
                
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView 
                        style={{ flex: 1 }} 
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header */}
                        <LinearGradient
                            colors={['#FDF4E5', '#F8DFB6']}
                            style={{ 
                                borderBottomLeftRadius: 30, 
                                borderBottomRightRadius: 30,
                                paddingBottom: 30
                            }}
                        >
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                            }}>
                                <TouchableOpacity onPress={handleGoBack} style={{ padding: 8 }}>
                                    <Ionicons name="chevron-back" size={24} color="#333" />
                                </TouchableOpacity>
                                <AppText style={{
                                    fontSize: 18,
                                    fontWeight: '700',
                                    color: '#002855',
                                    flex: 1,
                                    textAlign: 'center',
                                    marginRight: 40
                                }}>
                                    Tạo đơn xin nghỉ
                                </AppText>
                            </View>
                        </LinearGradient>

                        {/* Form */}
                        <View style={{ padding: 20 }}>
                            {/* Student Name */}
                            <View style={{ marginBottom: 20 }}>
                                <AppText style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: '#002855',
                                    marginBottom: 8
                                }}>
                                    Tên học sinh <Text style={{ color: '#FF6B35' }}>*</Text>
                                </AppText>
                                <TextInput
                                    style={{
                                        borderWidth: 1,
                                        borderColor: '#E0E0E0',
                                        borderRadius: 12,
                                        paddingHorizontal: 16,
                                        paddingVertical: 12,
                                        fontSize: 16,
                                        backgroundColor: 'white'
                                    }}
                                    placeholder="Nhập tên học sinh"
                                    value={formData.studentName}
                                    onChangeText={(text) => setFormData({ ...formData, studentName: text })}
                                />
                            </View>

                            {/* Reason */}
                            <View style={{ marginBottom: 20 }}>
                                <AppText style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: '#002855',
                                    marginBottom: 8
                                }}>
                                    Lý do nghỉ học <Text style={{ color: '#FF6B35' }}>*</Text>
                                </AppText>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                    {reasonOptions.map((reason) => (
                                        <TouchableOpacity
                                            key={reason}
                                            style={{
                                                paddingHorizontal: 16,
                                                paddingVertical: 10,
                                                borderRadius: 20,
                                                borderWidth: 1,
                                                borderColor: selectedReason === reason ? '#F05023' : '#E0E0E0',
                                                backgroundColor: selectedReason === reason ? '#F05023' : 'white'
                                            }}
                                            onPress={() => setSelectedReason(reason)}
                                        >
                                            <AppText style={{
                                                color: selectedReason === reason ? 'white' : '#666',
                                                fontSize: 14,
                                                fontWeight: '500'
                                            }}>
                                                {reason}
                                            </AppText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Date Range */}
                            <View style={{ marginBottom: 20 }}>
                                <AppText style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: '#002855',
                                    marginBottom: 8
                                }}>
                                    Thời gian nghỉ <Text style={{ color: '#FF6B35' }}>*</Text>
                                </AppText>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            borderWidth: 1,
                                            borderColor: '#E0E0E0',
                                            borderRadius: 12,
                                            paddingHorizontal: 16,
                                            paddingVertical: 12,
                                            backgroundColor: 'white',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                        onPress={() => setShowStartDatePicker(true)}
                                    >
                                        <AppText style={{ fontSize: 16, color: '#333' }}>
                                            {formatDate(formData.startDate)}
                                        </AppText>
                                        <Ionicons name="calendar-outline" size={20} color="#666" />
                                    </TouchableOpacity>
                                    
                                    <View style={{ justifyContent: 'center', paddingHorizontal: 10 }}>
                                        <AppText style={{ color: '#666' }}>đến</AppText>
                                    </View>
                                    
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            borderWidth: 1,
                                            borderColor: '#E0E0E0',
                                            borderRadius: 12,
                                            paddingHorizontal: 16,
                                            paddingVertical: 12,
                                            backgroundColor: 'white',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                        onPress={() => setShowEndDatePicker(true)}
                                    >
                                        <AppText style={{ fontSize: 16, color: '#333' }}>
                                            {formatDate(formData.endDate)}
                                        </AppText>
                                        <Ionicons name="calendar-outline" size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Description */}
                            <View style={{ marginBottom: 20 }}>
                                <AppText style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: '#002855',
                                    marginBottom: 8
                                }}>
                                    Mô tả chi tiết <Text style={{ color: '#FF6B35' }}>*</Text>
                                </AppText>
                                <TextInput
                                    style={{
                                        borderWidth: 1,
                                        borderColor: '#E0E0E0',
                                        borderRadius: 12,
                                        paddingHorizontal: 16,
                                        paddingVertical: 12,
                                        fontSize: 16,
                                        backgroundColor: 'white',
                                        height: 100,
                                        textAlignVertical: 'top'
                                    }}
                                    placeholder="Nhập mô tả chi tiết lý do nghỉ học..."
                                    multiline
                                    numberOfLines={4}
                                    value={formData.description}
                                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                                />
                            </View>

                            {/* Contact Info */}
                            <View style={{ marginBottom: 30 }}>
                                <AppText style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: '#002855',
                                    marginBottom: 8
                                }}>
                                    Thông tin liên hệ
                                </AppText>
                                <TextInput
                                    style={{
                                        borderWidth: 1,
                                        borderColor: '#E0E0E0',
                                        borderRadius: 12,
                                        paddingHorizontal: 16,
                                        paddingVertical: 12,
                                        fontSize: 16,
                                        backgroundColor: 'white'
                                    }}
                                    placeholder="Số điện thoại hoặc email liên hệ"
                                    value={formData.contactInfo}
                                    onChangeText={(text) => setFormData({ ...formData, contactInfo: text })}
                                />
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#F05023',
                                    paddingVertical: 16,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    marginBottom: 50
                                }}
                                onPress={handleSubmit}
                            >
                                <AppText style={{
                                    color: 'white',
                                    fontSize: 16,
                                    fontWeight: '700'
                                }}>
                                    Gửi đơn xin nghỉ
                                </AppText>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Date Pickers */}
                {showStartDatePicker && (
                    <DateTimePicker
                        value={formData.startDate}
                        mode="date"
                        display="default"
                        onChange={onStartDateChange}
                        minimumDate={new Date()}
                    />
                )}
                
                {showEndDatePicker && (
                    <DateTimePicker
                        value={formData.endDate}
                        mode="date"
                        display="default"
                        onChange={onEndDateChange}
                        minimumDate={formData.startDate}
                    />
                )}
            </SafeAreaView>
        </View>
    );
};

export default CreateLeaveRequest; 