import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
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
    View,
    Image
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import AppText from '../../../../components/AppText';
import Calendar from '../../../../components/ui/Calendar';
import api, { BASE_URL } from '../../../../config/api.config';
import UploadsIcon from '../../../../assets/uploads.svg';

interface Student {
    id: string;
    _id?: string;
    name: string;
    fullname?: string;
    studentName?: string;
    avatarUrl?: string;
    user?: {
        avatarUrl?: string;
    };
}

interface LeaveRequest {
    studentId: string;
    studentName: string;
    reason: string;
    description: string;
    startDate: Date;
    endDate: Date;
    sessionType: string; // 'cả ngày', 'buổi sáng', 'buổi chiều'
    documents: any[];
}

const CreateLeaveRequest = () => {
    const navigation = useNavigation();
    const [currentStep, setCurrentStep] = useState(1);
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
    const [studentAvatars, setStudentAvatars] = useState<{[key: string]: string}>({});
    const [formData, setFormData] = useState<LeaveRequest>({
        studentId: '',
        studentName: '',
        reason: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(),
        sessionType: 'cả ngày',
        documents: []
    });


    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [uploadingDocs, setUploadingDocs] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reasonOptions = [
        'Con bị ốm',
        'Gia đình có việc bận',
        'Gia đình có việc hiếu',
        'Lý do khác'
    ];

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const parentStr = await AsyncStorage.getItem('parent');
            console.log('Parent data from AsyncStorage:', parentStr);
            
            if (!parentStr) {
                console.log('No parent data found in AsyncStorage');
                return;
            }
            
            const parentObj = JSON.parse(parentStr);
            console.log('Parent object:', parentObj);
            
            if (parentObj.students && parentObj.students.length > 0) {
                console.log('Students found:', parentObj.students);
                setStudents(parentObj.students);
                await fetchStudentAvatars(parentObj.students);
            } else {
                console.log('No students found in parent data');
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchStudentAvatars = async (studentList: any[]) => {
        const avatars: {[key: string]: string} = {};
        
        for (const student of studentList) {
            try {
                const studentId = student.id || student._id;
                const studentName = student.name || student.fullname || student.studentName || 'Unknown';
                
                // Thử lấy avatar từ Photo model trước
                const response = await api.get(`/students/${studentId}/photo/current`);
                if (response.data && response.data.photoUrl) {
                    avatars[studentId] = `${BASE_URL}${response.data.photoUrl}`;
                } else {
                    // Fallback về Student.avatarUrl hoặc default
                    avatars[studentId] = student.avatarUrl 
                        ? `${BASE_URL}${encodeURI(student.avatarUrl)}`
                        : student.user?.avatarUrl
                            ? `${BASE_URL}${encodeURI(student.user.avatarUrl)}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=E0E0E0&color=757575&size=128`;
                }
            } catch (error) {
                // Nếu API lỗi, dùng fallback
                const studentId = student.id || student._id;
                const studentName = student.name || student.fullname || student.studentName || 'Unknown';
                
                avatars[studentId] = student.avatarUrl 
                    ? `${BASE_URL}${encodeURI(student.avatarUrl)}`
                    : student.user?.avatarUrl
                        ? `${BASE_URL}${encodeURI(student.user.avatarUrl)}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=E0E0E0&color=757575&size=128`;
            }
        }
        
        setStudentAvatars(avatars);
    };

    const getAvatarUrl = (student: Student, avatarCache: {[key: string]: string}) => {
        const studentId = student.id || student._id || '';
        const studentName = student.name || student.fullname || student.studentName || 'Unknown';
        return avatarCache[studentId] || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=E0E0E0&color=757575&size=128`;
    };

    const handleNext = () => {
        if (currentStep === 1 && selectedStudents.length === 0) {
            Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một học sinh');
            return;
        }
        if (currentStep === 2 && !formData.reason) {
            Alert.alert('Lỗi', 'Vui lòng chọn lý do nghỉ học');
            return;
        }
        if (currentStep === 2 && formData.reason === 'Lý do khác' && !formData.description.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập mô tả chi tiết');
            return;
        }
        if (currentStep === 3 && selectedDates.length === 0) {
            Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một ngày nghỉ');
            return;
        }
        
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            navigation.goBack();
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            // Validate required fields
            if (selectedStudents.length === 0) {
                Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một học sinh');
                return;
            }
            
            if (!formData.reason) {
                Alert.alert('Lỗi', 'Vui lòng chọn lý do nghỉ học');
                return;
            }
            
            if (selectedDates.length === 0) {
                Alert.alert('Lỗi', 'Vui lòng chọn ngày nghỉ');
                return;
            }

            // Get parent data
            const parentStr = await AsyncStorage.getItem('parent');
            if (!parentStr) {
                Alert.alert('Lỗi', 'Không tìm thấy thông tin phụ huynh');
                return;
            }
            
            const parentObj = JSON.parse(parentStr);
            const parentId = parentObj._id || parentObj.id;

            // Map reason to backend enum
            const reasonMap: {[key: string]: string} = {
                'Con bị ốm': 'sick',
                'Gia đình có việc bận': 'family',
                'Gia đình có việc hiếu': 'bereavement',
                'Lý do khác': 'other'
            };

            // Map session type to backend enum
            const sessionTypeMap: {[key: string]: string} = {
                'Cả ngày': 'full_day',
                'Buổi sáng': 'morning',
                'Buổi chiều': 'afternoon'
            };

            // Sort selected dates
            const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
            const startDate = sortedDates[0];
            const endDate = sortedDates[sortedDates.length - 1];

            // Create leave request for each selected student
            const promises = selectedStudents.map(async (student) => {
                const leaveRequestData = {
                    student: student.id || student._id,
                    reason: reasonMap[formData.reason] || 'other',
                    description: formData.description || formData.reason,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    leaveType: sessionTypeMap[formData.sessionType] || 'full_day',
                    createdBy: parentId
                };

                const response = await api.post('/leave-requests', leaveRequestData);
                
                // Upload attachments if any
                if (formData.documents.length > 0 && response.data.data._id) {
                    await uploadAttachments(response.data.data._id, formData.documents);
                }
                
                return response.data;
            });

            await Promise.all(promises);
            
            // Show success step
            setCurrentStep(5);
            
        } catch (error: any) {
            console.error('Error submitting leave request:', error);
            Alert.alert(
                'Lỗi', 
                error.response?.data?.message || 'Có lỗi xảy ra khi gửi đơn xin nghỉ'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const uploadAttachments = async (leaveRequestId: string, documents: any[]) => {
        try {
            const formData = new FormData();
            
            documents.forEach((doc, index) => {
                formData.append('attachments', {
                    uri: doc.uri,
                    type: doc.mimeType || 'application/octet-stream',
                    name: doc.name
                } as any);
            });

            const response = await api.post(`/leave-requests/${leaveRequestId}/attachments`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error uploading attachments:', error);
            throw error;
        }
    };

    const handleSelectStudent = (student: Student) => {
        const isSelected = selectedStudents.some(s => s.id === student.id);
        if (isSelected) {
            // Bỏ chọn học sinh
            setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
        } else {
            // Chọn thêm học sinh
            setSelectedStudents([...selectedStudents, student]);
        }
        
        // Cập nhật formData với danh sách học sinh đã chọn
        const updatedStudents = isSelected 
            ? selectedStudents.filter(s => s.id !== student.id)
            : [...selectedStudents, student];
            
        setFormData({
            ...formData,
            studentId: updatedStudents.map(s => s.id).join(','),
            studentName: updatedStudents.map(s => s.name || s.fullname || s.studentName || '').join(', ')
        });
    };

    const handleSelectReason = (reason: string) => {
        setFormData({ ...formData, reason });
    };



    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const newDoc = result.assets[0];
                
                // Add to uploading docs first
                const uploadingDoc = {
                    ...newDoc,
                    id: Date.now(),
                    progress: 0
                };
                setUploadingDocs(prev => [...prev, uploadingDoc]);
                
                // Simulate upload progress
                const progressInterval = setInterval(() => {
                    setUploadingDocs(prev => 
                        prev.map(doc => 
                            doc.id === uploadingDoc.id 
                                ? { ...doc, progress: Math.min(doc.progress + 10, 100) }
                                : doc
                        )
                    );
                }, 200);
                
                // After 2 seconds, move to completed documents
                setTimeout(() => {
                    clearInterval(progressInterval);
                    setUploadingDocs(prev => prev.filter(doc => doc.id !== uploadingDoc.id));
                    setFormData({
                        ...formData,
                        documents: [...formData.documents, newDoc]
                    });
                }, 2000);
            }
        } catch (error) {
            console.error('Error picking document:', error);
        }
    };

    const removeDocument = (index: number) => {
        const newDocs = formData.documents.filter((_, i) => i !== index);
        setFormData({ ...formData, documents: newDocs });
    };

    const renderStep1 = () => (
        <View style={{ flex: 1 }}>
            <AppText style={{
                fontSize: 20,
                fontWeight: '600',
                color: '#002855',
                textAlign: 'center',
                marginBottom: 8
            }}>
                Wiser không tới trường
            </AppText>
            
            <AppText style={{
                fontSize: 14,
                color: '#666',
                textAlign: 'center',
                marginBottom: 30
            }}>
                Chọn học sinh cần xin nghỉ phép
            </AppText>

            {students.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <AppText style={{ fontSize: 16, color: '#666' }}>
                        Đang tải danh sách học sinh...
                    </AppText>
                </View>
            ) : (
                <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 30,
                    paddingVertical: 20
                }}>
                    {students.map((student) => {
                        console.log('Rendering student:', student);
                        const isSelected = selectedStudents.some(s => s.id === student.id);
                    return (
                        <TouchableOpacity
                            key={student.id}
                            style={{
                                alignItems: 'center',
                                marginBottom: 20
                            }}
                            onPress={() => handleSelectStudent(student)}
                        >
                            <View style={{
                                position: 'relative',
                                marginBottom: 8
                            }}>
                                <Image
                                    source={{ uri: getAvatarUrl(student, studentAvatars) }}
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        borderWidth: isSelected ? 4 : 2,
                                        borderColor: isSelected ? '#F05023' : '#E0E0E0',
                                        backgroundColor: '#F0F0F0'
                                    }}
                                    onError={(error) => {
                                        console.log('Image load error:', error.nativeEvent.error);
                                    }}
                                    onLoad={() => {
                                        console.log('Image loaded successfully for:', student.name);
                                    }}
                                />
                                {isSelected && (
                                    <View style={{
                                        position: 'absolute',
                                        top: -5,
                                        right: -5,
                                        backgroundColor: '#F05023',
                                        borderRadius: 15,
                                        width: 30,
                                        height: 30,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderWidth: 2,
                                        borderColor: 'white'
                                    }}>
                                        <Ionicons name="checkmark" size={16} color="white" />
                                    </View>
                                )}
                            </View>
                            <AppText style={{
                                fontSize: 14,
                                fontWeight: isSelected ? '700' : '500',
                                color: isSelected ? '#002855' : '#666',
                                textAlign: 'center',
                                maxWidth: 100
                            }} numberOfLines={2}>
                                {student.name || student.fullname || student.studentName}
                            </AppText>
                        </TouchableOpacity>
                    );
                })}
            </View>
            )}
        </View>
    );

    const renderStep2 = () => (
        <View style={{ flex: 1 }}>
            <AppText style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#002855',
                textAlign: 'center',
                marginBottom: 10
            }}>
                Chuyện gì khiến con nghỉ học hôm nay thế?
            </AppText>

            <View style={{ marginBottom: 30, marginLeft: 10 }}>
                {reasonOptions.map((reason) => (
                    <TouchableOpacity
                        key={reason}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 15,
                            paddingHorizontal: 5
                        }}
                        onPress={() => handleSelectReason(reason)}
                    >
                        <View style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: formData.reason === reason ? 9 : 1,
                            borderColor: formData.reason === reason ? '#F05023' : '#BEBEBE',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 15
                        }}>
                            {formData.reason === reason && (
                                <View style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 5,
                                    backgroundColor: '#fff'
                                }} />
                            )}
                        </View>
                        <AppText style={{
                            color: '#333',
                            fontSize: 16,
                            fontWeight: '400',
                            flex: 1
                        }}>
                            {reason}
                        </AppText>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Mô tả chi tiết - chỉ hiện khi chọn "Lý do khác" */}
            {formData.reason === 'Lý do khác' && (
                <View>
                    <AppText style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: '#002855',
                        marginBottom: 15,
                        marginLeft: 10
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
                            height: 100,
                            textAlignVertical: 'top',
                            marginLeft: 10
                        }}
                        placeholder="Nhập mô tả chi tiết lý do nghỉ học..."
                        multiline
                        numberOfLines={4}
                        value={formData.description}
                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                    />
                </View>
            )}
        </View>
    );

    const calculateDaysFromSelectedDates = () => {
        if (selectedDates.length === 0) return 0;
        
        // Sort dates and calculate total days
        const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
        
        // Update formData with first and last selected dates
        if (sortedDates.length > 0) {
            const firstDate = sortedDates[0];
            const lastDate = sortedDates[sortedDates.length - 1];
            
            // Update formData if dates have changed
            if (formData.startDate.toDateString() !== firstDate.toDateString() || 
                formData.endDate.toDateString() !== lastDate.toDateString()) {
                setFormData(prev => ({
                    ...prev,
                    startDate: firstDate,
                    endDate: lastDate
                }));
            }
        }
        
        return selectedDates.length;
    };

    const totalDays = calculateDaysFromSelectedDates();

    const sessionOptions = [
        'Cả ngày',
        'Buổi sáng', 
        'Buổi chiều'
    ];

    const renderStep3 = () => (
        <View style={{ flex: 1 }}>
            <AppText style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#002855',
                textAlign: 'left',
                marginBottom: 15
            }}>
                Con nghỉ học hôm nào đó
            </AppText>

            {/* Calendar Component */}
            <Calendar
                selectedDates={selectedDates}
                onDatesChange={setSelectedDates}
                multiSelect={true}
            />

            {/* Summary */}
            {totalDays > 0 && (
                <View style={{ 
                    borderRadius: 8,
                    marginTop: 15,
                    marginBottom: 30,
                    alignItems: 'flex-start',
                }}>
                    <AppText style={{
                        fontSize: 14,
                        color: '#666',
                        textAlign: 'left'
                    }}>
                        Tổng số buổi nghỉ: {totalDays}
                    </AppText>
                </View>
            )}

            {/* Session Type Selection - only show when total days > 2 */}
            {totalDays < 2 && (
                <View>
                    <AppText style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: '#002855',
                        marginTop: 20,
                        marginBottom: 10,
                    }}>
                        Con nghỉ học buổi nào đó
                    </AppText>

                    <View style={{ marginLeft: 10 }}>
                        {sessionOptions.map((session) => (
                            <TouchableOpacity
                                key={session}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 15,
                                    paddingHorizontal: 5
                                }}
                                onPress={() => setFormData({ ...formData, sessionType: session })}
                            >
                                <View style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    borderWidth: formData.sessionType === session ? 9 : 1,
                                    borderColor: formData.sessionType === session ? '#F05023' : '#BEBEBE',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 15
                                }}>
                                    {formData.sessionType === session && (
                                        <View style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 5,
                                            backgroundColor: '#fff'
                                        }} />
                                    )}
                                </View>
                                <AppText style={{
                                    color: '#333',
                                    fontSize: 16,
                                    fontWeight: '400',
                                    flex: 1
                                }}>
                                    {session}
                                </AppText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );

    const renderStep4 = () => (
        <View style={{ flex: 1 }}>
            <AppText style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#002855',
                textAlign: 'left',
                marginBottom: 20
            }}>
                Hình ảnh, giấy tờ đính kèm (nếu có)
            </AppText>

            <TouchableOpacity
                style={{
                    backgroundColor: 'white',
                    borderRadius: 15,
                    borderStyle: 'dashed',
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    padding: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 10,
                    elevation: 2
                }}
                onPress={pickDocument}
            >
                <UploadsIcon width={70} height={70} color="#F05023" style={{ marginRight: 20 }} />
                <View style={{ flex: 1 }}>
                    <AppText style={{ 
                        fontSize: 16, 
                        fontWeight: '500',
                        color: '#333',
                        marginBottom: 2
                    }}>
                        Tải tài liệu
                    </AppText>
                   
                </View>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                 <AppText style={{ 
                        fontSize: 12, 
                        color: '#757575',
                        fontStyle: 'italic'  
                    }}>
                        Định dạng hỗ trợ: ảnh, tài liệu
                    </AppText>

            <AppText style={{
                fontSize: 12,
                color: '#757575',
                textAlign: 'left',
                fontStyle: 'italic'  

            }}>
                Dung lượng tối đa: 10 MB
            </AppText>
            </View>

            {/* Uploading Documents */}
            {uploadingDocs.length > 0 && (
                <ScrollView style={{ marginTop: 20 }}>
                    {uploadingDocs.map((doc, index) => (
                        <View key={doc.id} style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 15,
                            backgroundColor: 'white',
                            borderRadius: 12,
                            marginBottom: 10,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 2
                        }}>
                            {/* File Icon */}
                            <View style={{
                                width: 40,
                                height: 40,
                                backgroundColor: '#002855',
                                borderRadius: 8,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 12
                            }}>
                                <Ionicons name="document-text" size={20} color="white" />
                            </View>

                            {/* File Info */}
                            <View style={{ flex: 1 }}>
                                <AppText style={{ 
                                    fontSize: 14, 
                                    fontWeight: '500',
                                    color: '#333',
                                    marginBottom: 4
                                }} numberOfLines={1}>
                                    {doc.name}
                                </AppText>
                                
                                {/* Upload Progress */}
                                <AppText style={{ 
                                    fontSize: 12, 
                                    color: '#FF9800',
                                    fontWeight: '500'
                                }}>
                                    Đang tải lên... {doc.progress}%
                                </AppText>
                                
                                {/* Progress Bar */}
                                <View style={{
                                    width: '100%',
                                    height: 10,
                                    backgroundColor: '#E0E0E0',
                                    borderRadius: 10,
                                    marginTop: 8,
                                    overflow: 'hidden'
                                }}>
                                    <LinearGradient
                                        colors={['#BED232', '#009483']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{
                                            width: `${doc.progress}%`,
                                            height: '100%',
                                            borderRadius: 3
                                        }}
                                    />
                                </View>
                            </View>

                            {/* Remove Button */}
                            <TouchableOpacity 
                                onPress={() => setUploadingDocs(prev => prev.filter(d => d.id !== doc.id))}
                                style={{ padding: 4 }}
                            >
                                <Ionicons name="close" size={20} color="#999" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Document List */}
            {formData.documents.length > 0 && (
                <ScrollView style={{ marginTop: 20 }}>
                    {formData.documents.map((doc, index) => (
                        <View key={index} style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 15,
                            backgroundColor: 'white',
                            borderRadius: 12,
                            marginBottom: 10,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 2
                        }}>
                            {/* File Icon */}
                            <View style={{
                                width: 40,
                                height: 40,
                                backgroundColor: '#002855',
                                borderRadius: 8,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 12
                            }}>
                                <Ionicons name="document-text" size={20} color="white" />
                            </View>

                            {/* File Info */}
                            <View style={{ flex: 1 }}>
                                <AppText style={{ 
                                    fontSize: 14, 
                                    fontWeight: '500',
                                    color: '#333',
                                    marginBottom: 4
                                }} numberOfLines={1}>
                                    {doc.name}
                                </AppText>
                                
                                {/* Upload Status */}
                                <AppText style={{ 
                                    fontSize: 12, 
                                    color: '#4CAF50',
                                    fontWeight: '600'
                                }}>
                                    Tải lên thành công
                                </AppText>
                            </View>
                            {/* Remove Button */}
                            <TouchableOpacity 
                                onPress={() => removeDocument(index)}
                                style={{ padding: 4 }}
                            >
                                <Ionicons name="close" size={20} color="#999" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    const renderStep5 = () => (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: '#4CAF50',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 30
            }}>
                <Ionicons name="checkmark" size={60} color="white" />
            </View>
            
            <AppText style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#002855',
                textAlign: 'center',
                marginBottom: 15
            }}>
                Thành công!
            </AppText>
            
            <AppText style={{
                fontSize: 16,
                color: '#666',
                textAlign: 'center',
                lineHeight: 24
            }}>
                Đơn xin nghỉ học đã được{'\n'}gửi thành công
            </AppText>
        </View>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            case 5: return renderStep5();
            default: return renderStep1();
        }
    };

    return (
        <LinearGradient
            colors={['#FDF4E5', '#F8DFB6']}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle="dark-content" />
                
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    {/* Header */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                    }}>
                        <TouchableOpacity onPress={handleBack} style={{ padding: 8 }}>
                            <Ionicons name="chevron-back" size={24} color="#333" />
                        </TouchableOpacity>
                     
                    </View>


                    {/* Content */}
                    <View style={{ flex: 1, paddingHorizontal: 20 }}>
                        {renderStepContent()}
                    </View>

                    {/* Bottom Buttons */}
                    {currentStep < 5 && (
                        <View style={{
                            paddingHorizontal: 30,
                            paddingBottom: 30,
                            paddingTop: 20
                        }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: isSubmitting ? '#ccc' : '#F05023',
                                    paddingVertical: 16,
                                    borderRadius: 30,
                                    alignItems: 'center',
                                    marginBottom: 12,
                                    opacity: isSubmitting ? 0.7 : 1
                                }}
                                onPress={currentStep === 4 ? handleSubmit : handleNext}
                                disabled={isSubmitting}
                            >
                                <AppText style={{
                                    color: 'white',
                                    fontSize: 16,
                                    fontWeight: '700'
                                }}>
                                    {isSubmitting ? 'Đang gửi...' : (currentStep === 4 ? 'Gửi đơn' : 'Tiếp tục')}
                                </AppText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: 'white',
                                    paddingVertical: 16,
                                    borderRadius: 30,
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    borderColor: '#E0E0E0'
                                }}
                                onPress={handleBack}
                            >
                                <AppText style={{
                                    color: '#666',
                                    fontSize: 16,
                                    fontWeight: '500'
                                }}>
                                    {currentStep === 1 ? 'Hủy' : 'Quay lại'}
                                </AppText>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Success Step Button */}
                    {currentStep === 5 && (
                        <View style={{
                            paddingHorizontal: 20,
                            paddingBottom: 30,
                            paddingTop: 20
                        }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#F05023',
                                    paddingVertical: 16,
                                    borderRadius: 12,
                                    alignItems: 'center'
                                }}
                                onPress={() => navigation.navigate('Absence' as never)}
                            >
                                <AppText style={{
                                    color: 'white',
                                    fontSize: 16,
                                    fontWeight: '700'
                                }}>
                                    Về trang chủ
                                </AppText>
                            </TouchableOpacity>
                        </View>
                    )}


                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default CreateLeaveRequest; 