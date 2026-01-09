/**
 * Validation utilities
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  value?: number;
}

/**
 * Validate payment amount
 */
export function validateAmount(amount: string | number): ValidationResult {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, error: 'Amount must be a positive number' };
  }
  
  if (numAmount < 1) {
    return { valid: false, error: 'Minimum amount is NPR 1' };
  }
  
  if (numAmount > 1000000) {
    return { valid: false, error: 'Maximum amount is NPR 1,000,000' };
  }
  
  return { valid: true, value: numAmount };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Validate post content
 */
export function validatePostContent(title: string, content: string): ValidationResult {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Title is required' };
  }
  
  if (title.length > 200) {
    return { valid: false, error: 'Title must be less than 200 characters' };
  }
  
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Content is required' };
  }
  
  if (content.length > 50000) {
    return { valid: false, error: 'Content must be less than 50,000 characters' };
  }
  
  return { valid: true };
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): ValidationResult {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  const fileExt = fileName.split('.').pop() || '';

  const isAllowed = allowedTypes.some(type => {
    const normalizedType = type.toLowerCase();
    return fileType.includes(normalizedType) || 
           fileExt === normalizedType.replace('.', '') ||
           fileName.endsWith(normalizedType);
  });

  if (!isAllowed) {
    return { 
      valid: false, 
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }

  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSize: number): ValidationResult {
  if (size <= 0) {
    return { valid: false, error: 'File size must be greater than 0' };
  }

  if (size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return { 
      valid: false, 
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB` 
    };
  }

  return { valid: true };
}

