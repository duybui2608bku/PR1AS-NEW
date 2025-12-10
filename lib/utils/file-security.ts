/**
 * File Security Utilities
 * Enhanced file validation and malware scanning
 */

import { PROFILE_CONSTRAINTS, VALID_IMAGE_TYPES } from "@/lib/worker/constants";
import { IMAGE_MAX_SIZE } from "@/lib/utils/enums";

/**
 * File magic numbers (file signatures) for image validation
 * More secure than relying on MIME type alone
 */
const FILE_SIGNATURES: Record<string, number[][]> = {
  "image/jpeg": [
    [0xff, 0xd8, 0xff], // JPEG
  ],
  "image/png": [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  ],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  "image/webp": [
    [0x52, 0x49, 0x46, 0x46], // RIFF (WebP starts with RIFF)
  ],
};

/**
 * Validate file by checking magic numbers (file signatures)
 * More secure than relying on MIME type alone
 */
export async function validateFileSignature(
  file: File,
  expectedType: string
): Promise<boolean> {
  const signatures = FILE_SIGNATURES[expectedType];
  if (!signatures || signatures.length === 0) {
    return false;
  }

  // Read first bytes of file
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check against all possible signatures for this type
  for (const signature of signatures) {
    let matches = true;
    for (let i = 0; i < signature.length; i++) {
      if (bytes[i] !== signature[i]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return true;
    }
  }

  return false;
}

/**
 * Enhanced image file validation
 * Validates type, size, and file signature
 */
export async function validateImageFileSecure(
  file: File
): Promise<{ valid: boolean; error?: string }> {
  // Check file type
  if (!VALID_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
    };
  }

  // Check file size
  if (file.size > IMAGE_MAX_SIZE) {
    const maxSizeMB = IMAGE_MAX_SIZE / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }

  // Check file signature (magic numbers)
  const signatureValid = await validateFileSignature(file, file.type);
  if (!signatureValid) {
    return {
      valid: false,
      error: "File signature does not match declared file type. File may be corrupted or malicious.",
    };
  }

  // Check file name
  if (file.name) {
    const dangerousPatterns = [
      /\.\./g, // Path traversal
      /[<>:"|?*]/g, // Windows reserved characters
      /\.(exe|bat|cmd|com|scr|vbs|js|jar|app|deb|rpm|dmg)$/i, // Executable extensions
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(file.name)) {
        return {
          valid: false,
          error: "File name contains dangerous characters or extension.",
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Scan file for basic malware patterns
 * Note: This is a basic check. For production, use a dedicated malware scanning service
 */
export async function scanFileForMalware(file: File): Promise<{
  safe: boolean;
  threats?: string[];
}> {
  const threats: string[] = [];

  // Read file content
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check for common malware signatures (very basic check)
  // In production, use ClamAV or similar service
  const suspiciousPatterns = [
    // PE (Portable Executable) header - indicates executable file
    [0x4d, 0x5a], // MZ header (Windows executables)
    // ELF header - indicates Linux executable
    [0x7f, 0x45, 0x4c, 0x46], // ELF header
  ];

  for (const pattern of suspiciousPatterns) {
    for (let i = 0; i <= bytes.length - pattern.length; i++) {
      let matches = true;
      for (let j = 0; j < pattern.length; j++) {
        if (bytes[i + j] !== pattern[j]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        threats.push("File contains executable code signature");
        break;
      }
    }
  }

  // Check file size vs declared size (anomaly detection)
  if (file.size === 0) {
    threats.push("File is empty");
  }

  // Check for suspiciously large files
  if (file.size > IMAGE_MAX_SIZE * 2) {
    threats.push("File size is suspiciously large");
  }

  return {
    safe: threats.length === 0,
    threats: threats.length > 0 ? threats : undefined,
  };
}

/**
 * Validate image dimensions (if needed)
 * Can be used to ensure images meet minimum/maximum size requirements
 */
export function validateImageDimensions(
  width: number,
  height: number
): { valid: boolean; error?: string } {
  if (
    width < PROFILE_CONSTRAINTS.MIN_IMAGE_WIDTH ||
    width > PROFILE_CONSTRAINTS.MAX_IMAGE_WIDTH
  ) {
    return {
      valid: false,
      error: `Image width must be between ${PROFILE_CONSTRAINTS.MIN_IMAGE_WIDTH} and ${PROFILE_CONSTRAINTS.MAX_IMAGE_WIDTH} pixels`,
    };
  }

  if (
    height < PROFILE_CONSTRAINTS.MIN_IMAGE_HEIGHT ||
    height > PROFILE_CONSTRAINTS.MAX_IMAGE_HEIGHT
  ) {
    return {
      valid: false,
      error: `Image height must be between ${PROFILE_CONSTRAINTS.MIN_IMAGE_HEIGHT} and ${PROFILE_CONSTRAINTS.MAX_IMAGE_HEIGHT} pixels`,
    };
  }

  return { valid: true };
}

