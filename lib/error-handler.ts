// Error handling utilities for production

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Only log errors in development or if explicitly enabled
const shouldLog = process.env.NODE_ENV === 'development' || process.env.ENABLE_ERROR_LOGGING === 'true';

export function logError(context: string, error: unknown): void {
  if (shouldLog) {
    console.error(`[${context}]`, error);
  }
  // In production, you would send this to a logging service like Sentry, LogRocket, etc.
  // Example: Sentry.captureException(error, { tags: { context } });
}

export function handleApiError(error: unknown, context: string): { 
  message: string; 
  statusCode: number;
  code?: string;
} {
  logError(context, error);

  if (error instanceof ApiError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code
    };
  }

  if (error instanceof Error) {
    return {
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An unexpected error occurred',
      statusCode: 500
    };
  }

  return {
    message: 'An unexpected error occurred',
    statusCode: 500
  };
}

// Supabase error handler
export function handleSupabaseError(error: { code?: string; message?: string }, defaultMessage: string = 'Database operation failed'): ApiError {
  // Map common Supabase error codes to user-friendly messages
  const errorMap: Record<string, { message: string; statusCode: number }> = {
    'PGRST116': { message: 'Resource not found', statusCode: 404 },
    '23505': { message: 'Resource already exists', statusCode: 409 },
    '23503': { message: 'Related resource not found', statusCode: 400 },
    '42501': { message: 'Permission denied', statusCode: 403 },
  };

  const mapped = errorMap[error?.code];
  if (mapped) {
    return new ApiError(mapped.message, mapped.statusCode, error.code);
  }

  return new ApiError(
    process.env.NODE_ENV === 'development' ? error?.message || defaultMessage : defaultMessage,
    500,
    error?.code
  );
}

// Validation error
export function createValidationError(message: string, details?: Record<string, unknown>): ApiError {
  return new ApiError(message, 400, 'VALIDATION_ERROR', details);
}

// Auth error
export function createAuthError(message: string = 'Authentication required'): ApiError {
  return new ApiError(message, 401, 'AUTH_ERROR');
}

// Permission error
export function createPermissionError(message: string = 'Permission denied'): ApiError {
  return new ApiError(message, 403, 'PERMISSION_ERROR');
}

// Not found error
export function createNotFoundError(resource: string = 'Resource'): ApiError {
  return new ApiError(`${resource} not found`, 404, 'NOT_FOUND');
}

