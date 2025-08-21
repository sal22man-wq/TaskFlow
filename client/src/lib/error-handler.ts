import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

export interface ErrorInfo {
  code?: string;
  status?: number;
  message?: string;
  details?: any;
}

// Error codes and their corresponding translation keys
export const ERROR_CODES = {
  NETWORK_ERROR: 'error.network',
  UNAUTHORIZED: 'error.unauthorized',
  FORBIDDEN: 'error.forbidden',
  NOT_FOUND: 'error.notFound',
  VALIDATION_ERROR: 'error.validation',
  SERVER_ERROR: 'error.server',
  TIMEOUT: 'error.timeout',
  DATABASE_ERROR: 'error.database',
  SESSION_EXPIRED: 'error.session',
  FILE_UPLOAD_ERROR: 'error.fileUpload',
  INVALID_FORMAT: 'error.invalidFormat',
  TOO_MANY_REQUESTS: 'error.tooManyRequests',
  GENERIC_ERROR: 'error.generic',
} as const;

// Custom hook for error handling
export function useErrorHandler() {
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleError = (error: any, options?: { 
    title?: string; 
    description?: string;
    action?: () => void;
    actionLabel?: string;
  }) => {
    let translationKey: string = ERROR_CODES.GENERIC_ERROR;
    let customMessage = '';

    // Determine error type and get appropriate translation
    if (error?.message) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        translationKey = ERROR_CODES.UNAUTHORIZED;
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        translationKey = ERROR_CODES.FORBIDDEN;
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        translationKey = ERROR_CODES.NOT_FOUND;
      } else if (error.message.includes('500') || error.message.includes('Server Error')) {
        translationKey = ERROR_CODES.SERVER_ERROR;
      } else if (error.message.includes('timeout')) {
        translationKey = ERROR_CODES.TIMEOUT;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        translationKey = ERROR_CODES.NETWORK_ERROR;
      } else if (error.message.includes('validation')) {
        translationKey = ERROR_CODES.VALIDATION_ERROR;
      } else if (error.message.includes('429')) {
        translationKey = ERROR_CODES.TOO_MANY_REQUESTS;
      }
      customMessage = error.message;
    }

    // Show toast with localized error message
    toast({
      title: options?.title || t('error.generic'),
      description: options?.description || t(translationKey) || customMessage,
      variant: "destructive",
    });

    // Log error for debugging
    console.error('Error handled:', {
      error,
      translationKey,
      message: t(translationKey),
      customMessage,
    });
  };

  const handleSuccess = (messageKey: string, options?: {
    title?: string;
    description?: string;
  }) => {
    toast({
      title: options?.title || t('common.success'),
      description: options?.description || t(messageKey),
      variant: "default",
    });
  };

  return {
    handleError,
    handleSuccess,
    t, // Expose translation function for convenience
  };
}

// Utility function to get localized validation message
export function getValidationMessage(field: string, type: string, params?: any): string {
  const messageKey = `validation.${type}`;
  
  // Replace placeholders in message (e.g., {min}, {max})
  let message = messageKey;
  if (params) {
    Object.keys(params).forEach(key => {
      message = message.replace(`{${key}}`, params[key]);
    });
  }
  
  return message;
}

// Utility to format error for display
export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error?.message) return error.error.message;
  return 'An unexpected error occurred';
}

// HTTP status code to error code mapping
export function getErrorCodeFromStatus(status: number): keyof typeof ERROR_CODES {
  switch (status) {
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'TOO_MANY_REQUESTS';
    case 500:
    case 502:
    case 503:
      return 'SERVER_ERROR';
    case 408:
      return 'TIMEOUT';
    default:
      return 'GENERIC_ERROR';
  }
}

// Enhanced error boundary for React components
export class ErrorBoundary extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ErrorBoundary';
  }
}