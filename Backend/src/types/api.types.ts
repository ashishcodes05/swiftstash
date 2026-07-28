
export interface ApiResponse<T = undefined> {
    success: boolean;
    message: string;
    data?: T;
}

export interface ApiErrorResponse {
    success: boolean;
    error: string;
}