export interface Period {
    periodNumber: number;
    startTime: string;
    endTime: string;
    label?: string;
    type?: 'regular' | 'morning' | 'lunch' | 'nap' | 'snack' | 'dismissal';
    dayOfWeek?: string;
}



export interface Teacher {
    id?: string;
    _id?: string;
    fullname: string;
    avatarUrl?: string;
    user?: {
        avatarUrl?: string;
    };
}

export interface Subject {
    id?: string;
    _id?: string;
    name: string;
    code?: string;
}

export interface TimeSlot {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
}

export interface TimetableEntry {
    id?: string;
    _id?: string;
    subject?: Subject;
    teachers?: Teacher[];
    timeSlot?: TimeSlot;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    periodNumber?: number;
    label?: string;
    name?: string;
    description?: string;
    type?: 'regular' | 'morning' | 'lunch' | 'nap' | 'snack' | 'dismissal';
}

export interface ClassInfo {
    id?: string;
    _id?: string;
    name?: string;
    gradeLevel?: {
        id?: string;
        _id?: string;
        name?: string;
        code?: string;
        school?: {
            id?: string;
            _id?: string;
            name?: string;
        };
    } | string | number;
    schoolYear?: {
        id?: string;
        _id?: string;
        name?: string;
    } | string;
}

export interface PeriodDefinition {
    id?: string;
    _id?: string;
    periodNumber: number;
    startTime: string;
    endTime: string;
    label?: string;
    type?: 'regular' | 'morning' | 'lunch' | 'nap' | 'snack' | 'dismissal';
    school?: string;
    schoolYear?: string;
} 