export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    status?: number;
}

export interface PaginatedResponse<T = any> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ErrorResponse {
    message: string;
    status: number;
    errors?: any[];
}

export interface LoadingState {
    loading: boolean;
    error: string | null;
}

export interface RefreshState {
    refreshing: boolean;
}

export interface NavigationProps {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
}

export interface AvatarProps {
    uri: string;
    size?: number;
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
} 