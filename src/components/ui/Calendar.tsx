import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../AppText';
import { format, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

interface CalendarProps {
    // Chế độ chọn một ngày
    selectedDate?: Date;
    onDateChange?: (date: Date) => void;
    
    // Chế độ chọn nhiều ngày
    selectedDates?: Date[];
    onDatesChange?: (dates: Date[]) => void;
    
    // Các props chung
    multiSelect?: boolean;
    rangeSelect?: boolean;
    highlightedDates?: Date[];
}

const Calendar: React.FC<CalendarProps> = ({ 
    selectedDate,
    onDateChange,
    selectedDates = [],
    onDatesChange,
    multiSelect = true,
    rangeSelect = false,
    highlightedDates = []
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Xác định chế độ hoạt động dựa trên props được truyền vào
    const isSingleSelectMode = !!onDateChange;
    const isMultiSelectMode = !!onDatesChange;
    
    // Đảm bảo selectedDates luôn là một mảng hợp lệ
    const effectiveSelectedDates = isSingleSelectMode && selectedDate 
        ? [selectedDate] 
        : selectedDates || [];

    useEffect(() => {
        // Nếu có selectedDate, đặt currentDate về tháng của selectedDate
        if (selectedDate) {
            setCurrentDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
        } else if (selectedDates && selectedDates.length > 0) {
            // Nếu có selectedDates, đặt currentDate về tháng của ngày đầu tiên được chọn
            setCurrentDate(new Date(selectedDates[0].getFullYear(), selectedDates[0].getMonth(), 1));
        }
    }, []);

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
        return effectiveSelectedDates.some(selectedDate => 
            isSameDay(selectedDate, date)
        );
    };

    const isDateHighlighted = (date: Date | null) => {
        if (!date || !highlightedDates || highlightedDates.length === 0) return false;
        return highlightedDates.some(highlightedDate => 
            isSameDay(highlightedDate, date)
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
        
        // Xử lý cho chế độ chọn một ngày
        if (isSingleSelectMode && onDateChange) {
            onDateChange(date);
            return;
        }
        
        // Xử lý cho chế độ chọn nhiều ngày
        if (isMultiSelectMode && onDatesChange) {
            if (multiSelect) {
                const isSelected = isDateSelected(date);
                if (isSelected) {
                    // Remove date from selection
                    const newDates = effectiveSelectedDates.filter(selectedDate => 
                        !isSameDay(selectedDate, date)
                    );
                    onDatesChange(newDates);
                } else {
                    // Add date to selection
                    onDatesChange([...effectiveSelectedDates, date]);
                }
            } else {
                // Single select mode
                onDatesChange([date]);
            }
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
        <View style={styles.container}>
            {/* Header with month navigation */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigateMonth('prev')}
                    style={styles.navButton}
                >
                    <Ionicons name="chevron-back" size={20} color="#666" />
                </TouchableOpacity>
                
                <AppText style={styles.monthTitle}>
                    {months[currentDate.getMonth()]}/{currentDate.getFullYear()}
                </AppText>
                
                <TouchableOpacity 
                    onPress={() => navigateMonth('next')}
                    style={styles.navButton}
                >
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Week days header */}
            <View style={styles.weekDaysContainer}>
                {weekDays.map((day) => (
                    <View key={day} style={styles.weekDay}>
                        <AppText style={styles.weekDayText}>
                            {day}
                        </AppText>
                    </View>
                ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.calendarGrid}>
                {days.map((date, index) => {
                    const isSelected = isDateSelected(date);
                    const isHighlighted = isDateHighlighted(date);
                    const isToday = date && isSameDay(date, new Date());
                    const isCurrentMonthDate = isCurrentMonth(date);
                    
                    return (
                        <View key={index} style={styles.dayCell}>
                            <TouchableOpacity
                                style={styles.dayButton}
                                onPress={() => handleDatePress(date)}
                            >
                                <View style={[
                                    styles.dayCircle,
                                    isSelected && styles.selectedDay,
                                    isHighlighted && !isSelected && styles.highlightedDay
                                ]}>
                                    <AppText style={[
                                        styles.dayText,
                                        isSelected && styles.selectedDayText,
                                        isHighlighted && !isSelected && styles.highlightedDayText,
                                        isToday && !isSelected && styles.todayText,
                                        !isCurrentMonthDate && styles.otherMonthText
                                    ]}>
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

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#DDDDDD',
        padding: 5,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    navButton: {
        padding: 5
    },
    monthTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333'
    },
    weekDaysContainer: {
        flexDirection: 'row',
        marginBottom: 8
    },
    weekDay: {
        flex: 1,
        alignItems: 'center'
    },
    weekDayText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#666'
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 2
    },
    dayButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 0,
        marginHorizontal: 1
    },
    dayCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center'
    },
    selectedDay: {
        backgroundColor: '#F05023'
    },
    highlightedDay: {
        backgroundColor: '#FFD54F'
    },
    dayText: {
        fontSize: 13,
        fontWeight: '400',
        color: '#333'
    },
    selectedDayText: {
        color: 'white',
        fontWeight: '700'
    },
    highlightedDayText: {
        fontWeight: '700'
    },
    todayText: {
        color: '#F05023'
    },
    otherMonthText: {
        color: '#999',
        opacity: 0.5
    }
});

export default Calendar; 