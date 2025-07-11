export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
    },
    PARENT: {
        GET_PROFILE: '/parent/profile',
        UPDATE_PROFILE: '/parent/profile',
    },
    STUDENT: {
        GET_LIST: '/student/list',
        GET_DETAIL: '/student/:id',
    },
    CLASS: {
        GET_LIST: '/class/list',
        GET_DETAIL: '/class/:id',
    },
    ATTENDANCE: {
        GET_BY_DATE: '/attendance',
        GET_BY_CLASS_DATE: '/attendance/timetable-slots/:classId/:date',
        GET_TIME_ATTENDANCE: '/attendance/time-attendance-by-date',
    },
}; 