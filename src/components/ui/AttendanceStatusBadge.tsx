import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AttendanceStatus, AttendanceStatusLabels, AttendanceStatusColors } from '../../types/attendance';

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  time?: string;
}

export const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({ status, time }) => {
  return (
    <View style={[styles.container, { backgroundColor: AttendanceStatusColors[status] }]}>
      <Text style={styles.text}>{AttendanceStatusLabels[status]}</Text>
      {time && <Text style={styles.timeText}>{time}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  timeText: {
    color: 'white',
    fontSize: 10,
    marginTop: 2,
  },
}); 