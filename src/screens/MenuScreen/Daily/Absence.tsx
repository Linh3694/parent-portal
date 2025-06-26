import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    TouchableOpacity,
    View
} from 'react-native';
import LeavesIcon from '../../../assets/leaves.svg';
import AppText from '../../../components/AppText';

interface AbsenceRequest {
    id: string;
    date: string;
    studentName: string;
    reason: string;
    description: string;
    timeOff: string;
    timestamp: string;
}

const Absence = () => {
    const [selectedMonth, setSelectedMonth] = useState('Tháng này');
    
    // Mock data - trong thực tế sẽ fetch từ API
    const absenceRequests: AbsenceRequest[] = [
        {
            id: '1',
            date: '16/4/2025',
            studentName: 'Trần Ngọc Julianne Khánh An',
            reason: 'Lý do khác',
            description: 'Mẹ cầm chìa khóa nhà con không đi học được',
            timeOff: 'Thời gian nghỉ',
            timestamp: '12 - 14/03/2025'
        },
        {
            id: '2',
            date: '16/4/2025',
            studentName: 'Trần Ngọc Julianne Khánh An',
            reason: 'Lý do khác',
            description: 'Mẹ cầm chìa khóa nhà con không đi học được',
            timeOff: 'Thời gian nghỉ',
            timestamp: '12 - 14/03/2025'
        },
        {
            id: '3',
            date: '16/4/2025',
            studentName: 'Trần Ngọc Julianne Khánh An',
            reason: 'Lý do khác',
            description: 'Mẹ cầm chìa khóa nhà con không đi học được',
            timeOff: 'Thời gian nghỉ',
            timestamp: '12 - 14/03/2025'
        },
        {
            id: '4',
            date: '16/4/2025',
            studentName: 'Trần Ngọc Julianne Khánh An',
            reason: 'Lý do khác',
            description: 'Mẹ cầm chìa khóa nhà con không đi học được',
            timeOff: 'Thời gian nghỉ',
            timestamp: '12 - 14/03/2025'
        }
    ];

    const handleCreateRequest = () => {
        // Navigate to create request screen
        console.log('Navigate to create request');
    };

    const handleGoBack = () => {
        // Navigate back
        console.log('Go back');
    };

    const renderAbsenceItem = (item: AbsenceRequest, index: number) => (
        <View key={item.id} style={{
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
            <AppText style={{ fontSize: 14, fontWeight: '700', color: '#FF6B35', marginBottom: 8 }}>
                {item.date}
            </AppText>
            
            <AppText style={{ fontSize: 12, fontWeight: '600', color: '#002855', marginBottom: 8 }}>
                {item.studentName}
            </AppText>
            
            <View style={{ flex: 1, marginBottom: 8 }}>
                <AppText style={{ fontSize: 14, color: '#666', fontWeight: '500' }}>
                    {item.reason}
                </AppText>
                <AppText style={{ fontSize: 14, color: '#333', marginTop: 4 }}>
                    {item.description}
                </AppText>
            </View>
            
            <View style={{ marginTop: 'auto' }}>
                <AppText style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                    {item.timeOff}
                </AppText>
                <AppText style={{ fontSize: 12, color: '#999' }}>
                    {item.timestamp}
                </AppText>
            </View>
        </View>
    );

    const renderAbsenceRow = (items: AbsenceRequest[], startIndex: number) => (
        <View key={startIndex} style={{ flexDirection: 'row', paddingHorizontal: 8 }}>
            {items.map((item, index) => renderAbsenceItem(item, startIndex + index))}
            {items.length === 1 && <View style={{ flex: 1, margin: 8 }} />}
        </View>
    );

    return (
        <View style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF4E5' }}>
                <StatusBar barStyle="dark-content" />
                
                <ScrollView 
                    style={{ flex: 1 }} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
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
                                
                                <TouchableOpacity style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: 40,
                                    borderWidth: 1,
                                    borderColor: '#E0E0E0',
                                    marginTop: 20,
                                    backgroundColor: 'white'
                                }}>
                                    <AppText style={{
                                        fontSize: 14,
                                        color: '#333',
                                        marginRight: 4
                                    }}>
                                        {selectedMonth}
                                    </AppText>
                                    <Ionicons name="chevron-down" size={16} color="#666" />
                                </TouchableOpacity>
                            </View>

                            {/* Request List - Grid Layout */}
                            {Array.from({ length: Math.ceil(absenceRequests.length / 2) }, (_, i) => {
                                const startIndex = i * 2;
                                const rowItems = absenceRequests.slice(startIndex, startIndex + 2);
                                return renderAbsenceRow(rowItems, startIndex);
                            })}
                            
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