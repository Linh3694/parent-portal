import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AttendanceRecord, TimeAttendanceRecord } from '../../types/attendance';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';

interface AttendanceItemProps {
  attendance: AttendanceRecord;
  timeAttendance?: TimeAttendanceRecord;
}

export const AttendanceItem: React.FC<AttendanceItemProps> = ({ attendance, timeAttendance }) => {
  const { periodNumber, periodStartTime, periodEndTime, subject, status } = attendance;

  return (
    <View style={styles.container}>
      <View style={styles.periodInfo}>
        <Text style={styles.periodNumber}>Tiết {periodNumber}</Text>
        <Text style={styles.periodTime}>
          {periodStartTime} - {periodEndTime}
        </Text>
      </View>

      <View style={styles.subjectInfo}>
        <Text style={styles.subjectName}>{subject.name}</Text>
        <Text style={styles.teacherName}>{attendance.teacher.fullname}</Text>
      </View>

      <View style={styles.statusContainer}>
        <AttendanceStatusBadge status={status} />
        
        {timeAttendance && (
          <View style={styles.timeAttendanceContainer}>
            {timeAttendance.checkIn && (
              <Text style={styles.timeAttendanceText}>
                Vào: {timeAttendance.checkIn}
              </Text>
            )}
            {timeAttendance.checkOut && (
              <Text style={styles.timeAttendanceText}>
                Ra: {timeAttendance.checkOut}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodInfo: {
    width: 60,
    marginRight: 10,
  },
  periodNumber: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  periodTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  teacherName: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timeAttendanceContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  timeAttendanceText: {
    fontSize: 12,
    color: '#666',
  },
}); 