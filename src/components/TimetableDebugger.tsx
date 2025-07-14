import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { TimetableEntry, PeriodDefinition } from '../types';
import AppText from './AppText';

interface TimetableDebuggerProps {
    timetable: TimetableEntry[];
    periodDefinitions: PeriodDefinition[];
    fullTimetable: TimetableEntry[];
    displayLesson: TimetableEntry | null;
    visible: boolean;
    onClose: () => void;
}

const TimetableDebugger: React.FC<TimetableDebuggerProps> = ({
    timetable,
    periodDefinitions,
    fullTimetable,
    displayLesson,
    visible,
    onClose
}) => {
    if (!visible) return null;

    const now = new Date();
    const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const dayOfWeek = now.getDay();
    const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];

    return (
        <View className="absolute inset-0 bg-white z-50 pt-10">
            <View className="flex-row justify-between items-center px-4 mb-4">
                <AppText className="text-lg font-bold">Timetable Debugger</AppText>
                <TouchableOpacity onPress={onClose} className="bg-red-500 px-3 py-1 rounded">
                    <Text className="text-white">Close</Text>
                </TouchableOpacity>
            </View>
            
            <ScrollView className="flex-1 px-4">
                {/* Current Time Info */}
                <View className="mb-4 p-3 bg-blue-50 rounded">
                    <AppText className="font-bold text-blue-800">Current Time Info:</AppText>
                    <AppText className="text-blue-700">Time: {currentTime}</AppText>
                    <AppText className="text-blue-700">Day: {currentDay} (index: {dayOfWeek})</AppText>
                </View>

                {/* Display Lesson */}
                <View className="mb-4 p-3 bg-green-50 rounded">
                    <AppText className="font-bold text-green-800">Display Lesson:</AppText>
                    {displayLesson ? (
                        <View>
                            <AppText className="text-green-700">Subject: {displayLesson.subject?.name || 'Unknown'}</AppText>
                            <AppText className="text-green-700">Start: {displayLesson.timeSlot?.startTime || displayLesson.startTime}</AppText>
                            <AppText className="text-green-700">End: {displayLesson.timeSlot?.endTime || displayLesson.endTime}</AppText>
                            <AppText className="text-green-700">Day: {displayLesson.timeSlot?.dayOfWeek || displayLesson.dayOfWeek}</AppText>
                            <AppText className="text-green-700">Period: {displayLesson.periodNumber}</AppText>
                        </View>
                    ) : (
                        <AppText className="text-green-700">None</AppText>
                    )}
                </View>

                {/* Raw Timetable Data */}
                <View className="mb-4 p-3 bg-gray-50 rounded">
                    <AppText className="font-bold text-gray-800">Raw Timetable Data ({timetable.length} entries):</AppText>
                    {timetable.slice(0, 5).map((entry, index) => (
                        <View key={index} className="mt-2 p-2 bg-white rounded">
                            <AppText className="text-gray-700">#{index + 1}: {entry.subject?.name || 'Unknown'}</AppText>
                            <AppText className="text-gray-600 text-sm">
                                {entry.timeSlot?.dayOfWeek || entry.dayOfWeek} | 
                                {entry.timeSlot?.startTime || entry.startTime} - 
                                {entry.timeSlot?.endTime || entry.endTime}
                            </AppText>
                            <AppText className="text-gray-600 text-sm">Period: {entry.periodNumber}</AppText>
                        </View>
                    ))}
                    {timetable.length > 5 && (
                        <AppText className="text-gray-500 text-sm mt-2">... and {timetable.length - 5} more entries</AppText>
                    )}
                </View>

                {/* Period Definitions */}
                <View className="mb-4 p-3 bg-yellow-50 rounded">
                    <AppText className="font-bold text-yellow-800">Period Definitions ({periodDefinitions.length} entries):</AppText>
                    {periodDefinitions.slice(0, 5).map((period, index) => (
                        <View key={index} className="mt-1">
                            <AppText className="text-yellow-700 text-sm">
                                Period {period.periodNumber}: {period.startTime} - {period.endTime} ({period.label})
                            </AppText>
                        </View>
                    ))}
                    {periodDefinitions.length > 5 && (
                        <AppText className="text-yellow-600 text-sm mt-2">... and {periodDefinitions.length - 5} more periods</AppText>
                    )}
                </View>

                {/* Full Timetable (after merge) */}
                <View className="mb-4 p-3 bg-purple-50 rounded">
                    <AppText className="font-bold text-purple-800">Full Timetable (after merge) - Today&apos;s lessons:</AppText>
                    {fullTimetable
                        .filter(entry => (entry.timeSlot?.dayOfWeek || entry.dayOfWeek) === currentDay)
                        .map((entry, index) => {
                            const startTime = entry.timeSlot?.startTime || entry.startTime;
                            const endTime = entry.timeSlot?.endTime || entry.endTime;
                            
                            return (
                                <View key={index} className="mt-2 p-2 bg-white rounded">
                                    <AppText className="text-purple-700">
                                        Period {entry.periodNumber}: {entry.subject?.name || 'Empty'}
                                    </AppText>
                                    <AppText className="text-purple-600 text-sm">
                                        {startTime} - {endTime}
                                    </AppText>
                                    {/* Check if this is current lesson */}
                                    {startTime && endTime ? (
                                        <AppText className="text-purple-600 text-sm">
                                            Is current: {
                                                startTime <= currentTime && currentTime < endTime ? 'YES' : 'NO'
                                            }
                                        </AppText>
                                    ) : null}
                                </View>
                            );
                        })}
                </View>
            </ScrollView>
        </View>
    );
};

export default TimetableDebugger; 