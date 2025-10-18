// API Error types
export interface ApiError {
  error: string;
  details?: string;
  statusCode?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  error: string;
  details?: string | ValidationError[];
  statusCode?: number;
}

// Axios error type
export interface AxiosErrorResponse {
  response?: {
    data: ErrorResponse;
    status: number;
    statusText: string;
  };
  message: string;
  status?: number;
}
