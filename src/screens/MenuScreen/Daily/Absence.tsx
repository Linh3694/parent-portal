import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    TouchableOpacity,
    View,
    RefreshControl,
    ActivityIndicator,
    Modal,
    FlatList
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LeavesIcon from '../../../assets/leaves.svg';
import AppText from '../../../components/AppText';
import api from '../../../config/api.config';

interface LeaveRequest {
    _id: string;
    student: {
        _id: string;
        name: string;
        studentCode: string;
        class: string;
    };
    reason: string;
    description: string;
    startDate: string;
    endDate: string;
    leaveType: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    approvalNote?: string;
    approvedBy?: {
        fullname: string;
    };
    attachments?: Array<{
        fileName: string;
        fileUrl: string;
        fileType: string;
        fileSize: number;
    }>;
}

const Absence = () => {
    const navigation = useNavigation();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const months = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    const fetchLeaveRequests = async () => {
        try {
            const parentStr = await AsyncStorage.getItem('parent');
            if (!parentStr) {
                console.log('No parent data found');
                return;
            }
            
            const parentObj = JSON.parse(parentStr);
            const parentId = parentObj._id || parentObj.id;
            
            // Create date filter for selected month/year
            const startDate = new Date(selectedYear, selectedMonth, 1);
            const endDate = new Date(selectedYear, selectedMonth + 1, 0);
            
            const response = await api.get(`/leave-requests/parent/${parentId}`, {
                params: {
                    limit: 50,
                    sort: '-createdAt',
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }
            });
            
            if (response.data && response.data.docs) {
                setLeaveRequests(response.data.docs);
            }
        } catch (error) {
            console.error('Error fetching leave requests:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchLeaveRequests();
    };

    // Fetch data on component mount and when month/year changes
    useEffect(() => {
        fetchLeaveRequests();
    }, [selectedMonth, selectedYear]);

    // Refresh data when screen comes into focus (after creating new request)
    useFocusEffect(
        React.useCallback(() => {
            fetchLeaveRequests();
        }, [selectedMonth, selectedYear])
    );

    const handleCreateRequest = () => {
        // Navigate to create request screen
        navigation.navigate('CreateLeaveRequest' as never);
    };

    const handleGoBack = () => {
        // Navigate back
        navigation.goBack();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const getReasonText = (reason: string) => {
        const reasonMap: {[key: string]: string} = {
            'sick': 'Con bị ốm',
            'family': 'Gia đình có việc',
            'other': 'Lý do khác'
        };
        return reasonMap[reason] || reason;
    };

    const getLeaveTypeText = (leaveType: string) => {
        const typeMap: {[key: string]: string} = {
            'full_day': 'Cả ngày',
            'morning': 'Buổi sáng',
            'afternoon': 'Buổi chiều'
        };
        return typeMap[leaveType] || leaveType;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return '#4CAF50';
            case 'rejected': return '#F44336';
            default: return '#FF9800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'approved': return 'Đã duyệt';
            case 'rejected': return 'Từ chối';
            default: return 'Chờ duyệt';
        }
    };

    const getReasonDisplay = (reason: string, description: string): { isOther: boolean; reasonText: string; description?: string } => {
        const reasonMap: {[key: string]: string} = {
            'sick': 'Con bị ốm',
            'family': 'Gia đình có việc bận',
            'bereavement': 'Gia đình có việc hiếu',
            'other': 'Lý do khác'
        };
        
        const reasonText = reasonMap[reason] || reason;
        
        // Nếu là "Lý do khác" thì trả về object để render riêng biệt
        if (reason === 'other' && description) {
            return { isOther: true, reasonText, description };
        }
        
        // Các lý do khác chỉ hiển thị tên lý do
        return { isOther: false, reasonText };
    };

    const getTimeDisplay = (startDate: string, endDate: string, leaveType: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Tính số ngày
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        if (diffDays >= 2) {
            // Nhiều ngày: hiển thị start date -> end date
            return `${formatDate(startDate)} → ${formatDate(endDate)}`;
        } else {
            // 1 ngày: hiển thị ngày + loại nghỉ
            const leaveTypeText = getLeaveTypeText(leaveType);
            return `${formatDate(startDate)} (${leaveTypeText})`;
        }
    };

    const renderAbsenceItem = (item: LeaveRequest, index: number) => (
        <View key={item._id} style={{
            backgroundColor: '#FFFAF6',
            margin: 8,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            borderWidth: 1,
            borderColor: '#E0E0E0',
            borderRadius: 12,
            elevation: 5,
            flex: 1,
            minHeight: 180
        }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View>
                    <AppText style={{ fontSize: 14, fontWeight: '700', color: '#FF6B35' }}>
                        {formatDate(item.createdAt)}
                    </AppText>
                    <AppText style={{ fontSize: 12, fontWeight: '600', color: '#002855', marginTop: 4 }}>
                        {item.student.name}
                    </AppText>
                </View>
                {item.status !== 'pending' && (
                    <View style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor: getStatusColor(item.status) + '20'
                    }}>
                        <AppText style={{ 
                            fontSize: 10, 
                            fontWeight: '600', 
                            color: getStatusColor(item.status)
                        }}>
                            {getStatusText(item.status)}
                        </AppText>
                    </View>
                )}
            </View>
            
            <View style={{ flex: 1, marginBottom: 8 }}>
                {(() => {
                    const reasonDisplay = getReasonDisplay(item.reason, item.description);
                    if (reasonDisplay.isOther) {
                        return (
                            <>
                                <AppText style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>
                                    {reasonDisplay.reasonText}
                                </AppText>
                                <AppText style={{ fontSize: 13, color: '#666', marginTop: 2 }} numberOfLines={2}>
                                    {reasonDisplay.description}
                                </AppText>
                            </>
                        );
                    } else {
                        return (
                            <AppText style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>
                                {reasonDisplay.reasonText}
                            </AppText>
                        );
                    }
                })()}
            </View>
            
            <View style={{ marginTop: 'auto' }}>
                <AppText style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                    Thời gian nghỉ
                </AppText>
                <AppText style={{ fontSize: 12, color: '#999' }}>
                    {getTimeDisplay(item.startDate, item.endDate, item.leaveType)}
                </AppText>
            </View>
        </View>
    );

    const renderAbsenceRow = (items: LeaveRequest[], startIndex: number) => (
        <View key={startIndex} style={{ flexDirection: 'row', paddingHorizontal: 8 }}>
            {items.map((item, index) => renderAbsenceItem(item, startIndex + index))}
            {items.length === 1 && <View style={{ flex: 1, margin: 8 }} />}
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            {/* Month/Year Picker Modal */}
            <Modal
                visible={showMonthPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowMonthPicker(false)}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'flex-end'
                }}>
                    <View style={{
                        backgroundColor: 'white',
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        paddingTop: 20,
                        maxHeight: '70%'
                    }}>
                        {/* Header */}
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingHorizontal: 20,
                            paddingBottom: 20,
                            borderBottomWidth: 1,
                            borderBottomColor: '#E0E0E0'
                        }}>
                            <AppText style={{
                                fontSize: 18,
                                fontWeight: '700',
                                color: '#333'
                            }}>
                                Chọn tháng/năm
                            </AppText>
                            <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Year Selector */}
                        <View style={{ paddingHorizontal: 20, paddingVertical: 15 }}>
                            <AppText style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: '#333',
                                marginBottom: 10
                            }}>
                                Năm
                            </AppText>
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                style={{ marginBottom: 20 }}
                            >
                                {years.map((year) => (
                                    <TouchableOpacity
                                        key={year}
                                        style={{
                                            paddingHorizontal: 20,
                                            paddingVertical: 10,
                                            marginRight: 10,
                                            borderRadius: 20,
                                            backgroundColor: selectedYear === year ? '#F05023' : '#F5F5F5',
                                            borderWidth: selectedYear === year ? 0 : 1,
                                            borderColor: '#E0E0E0'
                                        }}
                                        onPress={() => setSelectedYear(year)}
                                    >
                                        <AppText style={{
                                            fontSize: 14,
                                            fontWeight: '600',
                                            color: selectedYear === year ? 'white' : '#333'
                                        }}>
                                            {year}
                                        </AppText>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Month List */}
                        <View style={{ flex: 1 }}>
                            <AppText style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: '#333',
                                marginBottom: 10,
                                paddingHorizontal: 20
                            }}>
                                Tháng
                            </AppText>
                            <FlatList
                                data={months}
                                numColumns={3}
                                keyExtractor={(item, index) => index.toString()}
                                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            margin: 5,
                                            paddingVertical: 15,
                                            borderRadius: 12,
                                            backgroundColor: selectedMonth === index ? '#F05023' : '#F5F5F5',
                                            borderWidth: selectedMonth === index ? 0 : 1,
                                            borderColor: '#E0E0E0',
                                            alignItems: 'center'
                                        }}
                                        onPress={() => {
                                            setSelectedMonth(index);
                                            setShowMonthPicker(false);
                                        }}
                                    >
                                        <AppText style={{
                                            fontSize: 14,
                                            fontWeight: '600',
                                            color: selectedMonth === index ? 'white' : '#333'
                                        }}>
                                            {item}
                                        </AppText>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF4E5' }}>
                <StatusBar barStyle="dark-content" />
                
                <ScrollView 
                    style={{ flex: 1 }} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#F05023']}
                            tintColor="#F05023"
                        />
                    }
                >
                    <LinearGradient
                        colors={['#FDF4E5', '#F8DFB6']}
                        style={{ 
                            borderBottomLeftRadius: 30, 
                            borderBottomRightRadius: 30,
                           
                        }}
                    >
                        {/* Header - Inside gradient */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            zIndex: 1
                        }}>
                            <TouchableOpacity onPress={handleGoBack} style={{ padding: 8 }}>
                                <Ionicons name="chevron-back" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {/* Top Section with Illustration */}
                        <View style={{
                            alignItems: 'center',
                            paddingHorizontal: 20,
                            paddingVertical: 30,
                        }}>
                            {/* Illustration */}
                            <View style={{
                                width: 200,
                                height: 200,
                                borderRadius: 100,
                                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 24,
                                marginTop: 40
                            }}>
                                <LeavesIcon width={300} height={300} />
                            </View>
                            
                            <AppText style={{
                                fontSize: 20,
                                fontWeight: '700',
                                color: '#002855',
                                textAlign: 'center',
                                marginBottom: 10,
                                marginTop: 50
                            }}>
                                Lỡ hẹn với Wellspring mất rồi
                            </AppText>
                            
                            <AppText style={{
                                fontSize: 14,
                                color: '#666',
                                textAlign: 'center',
                                lineHeight: 22,
                                marginBottom: 10,
                                marginTop: 10
                            }}>
                                Phụ huynh tạo đơn để Wisers bớt hụt hẳng nhé.
                            </AppText>
                        </View>

                        {/* Create Request Button */}
                        <View style={{ paddingHorizontal: 40, paddingBottom: 50 }}>
                            <TouchableOpacity
                                onPress={handleCreateRequest}
                                style={{
                                    backgroundColor: '#F05023',
                                    paddingVertical: 15,
                                    borderRadius: 30,
                                    alignItems: 'center'
                                }}
                            >
                                <AppText style={{
                                    color: 'white',
                                    fontSize: 16,
                                    fontWeight: '800'
                                }}>
                                    Tạo đơn
                                </AppText>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                    
                    {/* Second Section - Request List */}
                    <View style={{ 
                        flex: 1,
                        paddingTop: 30
                    }}>
                        <View>
                            {/* List Header */}
                            <View style={{
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingHorizontal: 20,
                                marginBottom: 20,
                            }}>
                                <AppText style={{
                                    fontSize: 20,
                                    fontWeight: '700',
                                    color: '#333'
                                }}>
                                    Danh sách đơn
                                </AppText>
                                
                                <TouchableOpacity 
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        borderRadius: 40,
                                        borderWidth: 1,
                                        borderColor: '#E0E0E0',
                                        marginTop: 20,
                                        backgroundColor: 'white'
                                    }}
                                    onPress={() => setShowMonthPicker(true)}
                                >
                                    <AppText style={{
                                        fontSize: 14,
                                        color: '#333',
                                        marginRight: 4
                                    }}>
                                        {months[selectedMonth]} {selectedYear}
                                    </AppText>
                                    <Ionicons name="chevron-down" size={16} color="#666" />
                                </TouchableOpacity>
                            </View>

                            {/* Request List - Grid Layout */}
                            {loading ? (
                                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                                    <ActivityIndicator size="large" color="#F05023" />
                                    <AppText style={{ 
                                        fontSize: 14, 
                                        color: '#666', 
                                        marginTop: 10 
                                    }}>
                                        Đang tải danh sách đơn...
                                    </AppText>
                                </View>
                            ) : leaveRequests.length === 0 ? (
                                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                                    <AppText style={{ 
                                        fontSize: 16, 
                                        color: '#666',
                                        textAlign: 'center'
                                    }}>
                                        Chưa có đơn xin nghỉ nào
                                    </AppText>
                                    <AppText style={{ 
                                        fontSize: 14, 
                                        color: '#999',
                                        textAlign: 'center',
                                        marginTop: 8
                                    }}>
                                        Tạo đơn mới để bắt đầu
                                    </AppText>
                                </View>
                            ) : (
                                Array.from({ length: Math.ceil(leaveRequests.length / 2) }, (_, i) => {
                                    const startIndex = i * 2;
                                    const rowItems = leaveRequests.slice(startIndex, startIndex + 2);
                                    return renderAbsenceRow(rowItems, startIndex);
                                })
                            )}
                            
                            {/* Bottom padding */}
                            <View style={{ height: 100 }} />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default Absence; 