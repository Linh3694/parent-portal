export interface CommunicationBook {
    id?: string;
    _id?: string;
    date: string;
    content: string;
    studentId?: string;
    classId?: string;
    teacherId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface DateDisplay {
    date: string;
    display: string;
} 