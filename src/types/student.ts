export interface Student {
    id?: string;
    _id?: string;
    name?: string;
    fullname?: string;
    studentName?: string;
    studentCode?: string;
    avatarUrl?: string;
    classId?: string;
    class?: string[];
    enrollment?: Array<{
        class: string;
    }>;
    user?: {
        avatarUrl?: string;
    };
}

export interface Parent {
    id?: string;
    _id?: string;
    name?: string;
    fullname?: string;
    students?: Student[];
}

export interface StudentAvatarCache {
    [key: string]: string;
} 