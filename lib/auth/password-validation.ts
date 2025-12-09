/**
 * Password Validation Utility
 * 
 * Validates password strength according to security requirements
 */

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
}

export interface PasswordRequirements {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  maxLength?: number;
}

const DEFAULT_REQUIREMENTS: Required<PasswordRequirements> = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Validate password strength
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = {}
): PasswordValidationResult {
  const req = { ...DEFAULT_REQUIREMENTS, ...requirements };
  const errors: string[] = [];

  // Check length
  if (password.length < req.minLength) {
    errors.push(`Password must be at least ${req.minLength} characters long`);
  }

  if (req.maxLength && password.length > req.maxLength) {
    errors.push(`Password must be no more than ${req.maxLength} characters long`);
  }

  // Check uppercase
  if (req.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Check lowercase
  if (req.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Check numbers
  if (req.requireNumbers && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Check special characters
  if (req.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  // Calculate strength
  let strength: "weak" | "medium" | "strong" = "weak";
  if (errors.length === 0) {
    // Strong: meets all requirements and is 12+ chars
    if (password.length >= 12) {
      strength = "strong";
    }
    // Medium: meets all requirements but less than 12 chars
    else {
      strength = "medium";
    }
  } else {
    // Check partial strength
    const metRequirements = [
      password.length >= req.minLength,
      req.requireUppercase ? /[A-Z]/.test(password) : true,
      req.requireLowercase ? /[a-z]/.test(password) : true,
      req.requireNumbers ? /[0-9]/.test(password) : true,
      req.requireSpecialChars ? /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) : true,
    ].filter(Boolean).length;

    if (metRequirements >= 3) {
      strength = "medium";
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Get password strength message
 */
export function getPasswordStrengthMessage(strength: "weak" | "medium" | "strong"): string {
  switch (strength) {
    case "strong":
      return "Strong password";
    case "medium":
      return "Medium strength password";
    case "weak":
      return "Weak password";
  }
}

/**
 * Common password validation (for API use)
 */
export function validatePasswordForAPI(password: string): {
  valid: boolean;
  message?: string;
} {
  const result = validatePassword(password);
  
  if (!result.valid) {
    return {
      valid: false,
      message: result.errors.join(". "),
    };
  }

  return { valid: true };
}

