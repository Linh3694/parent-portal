import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../AppText';

interface CalendarProps {
    selectedDates: Date[];
    onDatesChange: (dates: Date[]) => void;
    multiSelect?: boolean;
    rangeSelect?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ 
    selectedDates, 
    onDatesChange, 
    multiSelect = true,
    rangeSelect = false
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const months = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Get first day of week (Monday = 0, Sunday = 6)
        let firstDayOfWeek = firstDay.getDay() - 1;
        if (firstDayOfWeek === -1) firstDayOfWeek = 6; // Sunday becomes 6

        const days = [];
        
        // Add days from previous month
        if (firstDayOfWeek > 0) {
            for (let i = firstDayOfWeek; i > 0; i--) {
                const prevDate = new Date(year, month, 1 - i);
                days.push(prevDate);
            }
        }
        
        // Add days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        
        // Add days from next month to fill the grid (only if needed)
        const totalCells = 42; // 6 rows x 7 days
        const remainingCells = totalCells - days.length;
        if (remainingCells > 0) {
            for (let day = 1; day <= remainingCells; day++) {
                const nextDate = new Date(year, month + 1, day);
                days.push(nextDate);
            }
        }
        
        return days;
    };

    const isDateSelected = (date: Date | null) => {
        if (!date) return false;
        return selectedDates.some(selectedDate => 
            selectedDate.toDateString() === date.toDateString()
        );
    };



    const isCurrentMonth = (date: Date | null) => {
        if (!date) return false;
        return date.getMonth() === currentDate.getMonth() && 
               date.getFullYear() === currentDate.getFullYear();
    };

    const handleDatePress = (date: Date | null) => {
        if (!date) return;
        
        // If date is not in current month, navigate to that month
        if (!isCurrentMonth(date)) {
            setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
            return;
        }
        
        if (multiSelect) {
            const isSelected = isDateSelected(date);
            if (isSelected) {
                // Remove date from selection
                const newDates = selectedDates.filter(selectedDate => 
                    selectedDate.toDateString() !== date.toDateString()
                );
                onDatesChange(newDates);
            } else {
                // Add date to selection
                onDatesChange([...selectedDates, date]);
            }
        } else {
            // Single select
            onDatesChange([date]);
        }
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };

    const days = getDaysInMonth(currentDate);

    return (
        <View style={{
            borderRadius: 12,
            borderWidth: 2,
            borderColor: '#DDDDDD',
            padding: 5,
            elevation: 3
        }}>
            {/* Header with month navigation */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10
            }}>
                <TouchableOpacity 
                    onPress={() => navigateMonth('prev')}
                    style={{ padding: 5 }}
                >
                    <Ionicons name="chevron-back" size={20} color="#666" />
                </TouchableOpacity>
                
                <AppText style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#333'
                }}>
                    {months[currentDate.getMonth()]}/{currentDate.getFullYear()}
                </AppText>
                
                <TouchableOpacity 
                    onPress={() => navigateMonth('next')}
                    style={{ padding: 5 }}
                >
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Week days header */}
            <View style={{
                flexDirection: 'row',
                marginBottom: 8
            }}>
                {weekDays.map((day, index) => (
                    <View key={day} style={{ flex: 1, alignItems: 'center' }}>
                        <AppText style={{
                            fontSize: 11,
                            fontWeight: '500',
                            color: '#666'
                        }}>
                            {day}
                        </AppText>
                    </View>
                ))}
            </View>

            {/* Calendar grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {days.map((date, index) => {
                    const isSelected = isDateSelected(date);
                    const isToday = date && date.toDateString() === new Date().toDateString();
                    const isCurrentMonthDate = isCurrentMonth(date);
                    
                    return (
                        <View key={index} style={{ width: '14.28%', aspectRatio: 2 }}>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginVertical: 0,
                                    marginHorizontal: 1,
                                }}
                                onPress={() => handleDatePress(date)}
                            >
                                <View style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: isSelected ? '#F05023' : 'transparent',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <AppText style={{
                                        fontSize: 13,
                                        fontWeight: isSelected ? '700' : '400',
                                        color: isSelected ? 'white' : 
                                               isToday ? '#F05023' : 
                                               isCurrentMonthDate ? '#333' : '#999',
                                        opacity: isCurrentMonthDate ? 1 : 0.5
                                    }}>
                                        {date.getDate()}
                                    </AppText>
                                </View>
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

export default Calendar; 