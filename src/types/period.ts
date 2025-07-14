export interface PeriodDefinition {
  _id: string;
  periodNumber: number;
  label?: string;
  type: 'regular' | 'lunch' | 'nap' | 'break' | 'assembly' | 'other';
  startTime: string;
  endTime: string;
  schoolYear: string;
  school: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProcessedPeriod {
  number: number;
  label: string;
  time?: string;
  type: string;
  start: string;
  end: string;
  uniqueKey: string;
  isRegular: boolean;
}

export const PERIOD_TYPE_LABELS: { [key: string]: string } = {
  regular: 'Tiết học',
  lunch: 'Ăn trưa',
  nap: 'Ngủ trưa',
  break: 'Giải lao',
  assembly: 'Chào cờ',
  other: 'Khác'
};

export const DAY_OF_WEEK_LABELS: { [key: string]: string } = {
  Monday: 'Thứ 2',
  Tuesday: 'Thứ 3',  
  Wednesday: 'Thứ 4',
  Thursday: 'Thứ 5',
  Friday: 'Thứ 6',
  Saturday: 'Thứ 7',
  Sunday: 'Chủ nhật'
}; 