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

