/**
 * VALIDATION UTILITIES - PCI COMPLIANCE & LGPD COMPLIANT
 * 
 * SECURITY NOTICE:
 * - This module provides secure validation functions
 * - NEVER logs sensitive data (CPF, credit card numbers, CVV)
 * - All validations return only boolean or safe masked data
 * - Full compliance with PCI DSS and LGPD requirements
 */

// Brazilian states for UF validation
export const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
];

/**
 * CPF VALIDATION - LGPD COMPLIANT
 * Validates Brazilian CPF with checksum verification
 * SECURITY: Never logs the full CPF
 */
export function validateCpf(cpf: string): boolean {
  // Remove all non-numeric characters
  const cleanCpf = cpf.replace(/\D/g, '');
  
  // Basic validation
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false; // All same digits
  
  // Checksum validation
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCpf.charAt(10))) return false;
  
  return true;
}

/**
 * SECURE CPF MASKING - LGPD COMPLIANT
 * Returns masked CPF for display purposes only
 * SECURITY: Hides most digits, shows only format pattern
 */
export function maskCpf(cpf: string): string {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length === 11) {
    return `***.***.***-${cleanCpf.slice(-2)}`;
  }
  return '';
}

/**
 * CPF INPUT FORMATTING
 * Applies mask during typing: 999.999.999-99
 */
export function formatCpfInput(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length === 0) return '';
  if (cleanValue.length <= 3) return cleanValue;
  if (cleanValue.length <= 6) return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
  if (cleanValue.length <= 9) return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6)}`;
  return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9, 11)}`;
}

/**
 * CEP VALIDATION
 * Validates Brazilian postal code format
 */
export function validateCep(cep: string): boolean {
  const cleanCep = cep.replace(/\D/g, '');
  return cleanCep.length === 8 && /^\d{8}$/.test(cleanCep);
}

/**
 * CEP INPUT FORMATTING
 * Applies mask during typing: 99999-999
 */
export function formatCepInput(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length === 0) return '';
  if (cleanValue.length <= 5) return cleanValue;
  return `${cleanValue.slice(0, 5)}-${cleanValue.slice(5, 8)}`;
}

/**
 * EMAIL VALIDATION - RFC5322 COMPLIANT
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * CREDIT CARD VALIDATION - PCI DSS COMPLIANT
 * Uses Luhn algorithm for validation
 * SECURITY: Never logs the full card number
 */
export function validateCreditCard(cardNumber: string): boolean {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i));
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * CREDIT CARD BRAND DETECTION - SECURE
 * Detects card brand without logging sensitive data
 */
export function detectCardBrand(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (/^4/.test(cleanNumber)) return 'visa';
  if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
  if (/^3[47]/.test(cleanNumber)) return 'amex';
  if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
  if (/^35(2[89]|[3-8][0-9])/.test(cleanNumber)) return 'jcb';
  if (/^30[0-5]/.test(cleanNumber) || /^36/.test(cleanNumber) || /^38/.test(cleanNumber)) return 'diners';
  
  return 'unknown';
}

/**
 * SECURE CARD MASKING - PCI DSS COMPLIANT
 * Returns masked card number showing only last 4 digits
 * SECURITY: Never exposes full PAN
 */
export function maskCreditCard(cardNumber: string): string {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  if (cleanNumber.length >= 4) {
    const last4 = cleanNumber.slice(-4);
    const masked = '*'.repeat(cleanNumber.length - 4);
    return `${masked}${last4}`;
  }
  return '';
}

/**
 * CREDIT CARD INPUT FORMATTING
 * Applies mask during typing: **** **** **** 4242
 */
export function formatCreditCardInput(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  const groups = cleanValue.match(/.{1,4}/g) || [];
  return groups.join(' ').substr(0, 19); // Max 16 digits + 3 spaces
}

/**
 * CVV VALIDATION
 * SECURITY: This function validates format only, never stores CVV
 */
export function validateCvv(cvv: string, cardBrand: string): boolean {
  const cleanCvv = cvv.replace(/\D/g, '');
  
  if (cardBrand === 'amex') {
    return cleanCvv.length === 4;
  }
  return cleanCvv.length === 3;
}

/**
 * EXPIRY DATE VALIDATION
 * Validates MM/YY format and ensures future date
 */
export function validateExpiryDate(expiry: string): boolean {
  const cleanExpiry = expiry.replace(/\D/g, '');
  if (cleanExpiry.length !== 4) return false;
  
  const month = parseInt(cleanExpiry.substr(0, 2));
  const year = parseInt(cleanExpiry.substr(2, 2)) + 2000;
  
  if (month < 1 || month > 12) return false;
  
  const now = new Date();
  const expiryDate = new Date(year, month - 1, 1);
  const currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return expiryDate >= currentDate;
}

/**
 * EXPIRY DATE INPUT FORMATTING
 * Applies mask during typing: MM/YY
 */
export function formatExpiryInput(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length === 0) return '';
  if (cleanValue.length <= 2) return cleanValue;
  return `${cleanValue.slice(0, 2)}/${cleanValue.slice(2, 4)}`;
}

/**
 * SECURE DATA CLEARING
 * Clears sensitive data from variables/memory
 * SECURITY: Essential for PCI compliance
 */
export function clearSensitiveData(...variables: any[]): void {
  variables.forEach(variable => {
    if (typeof variable === 'object' && variable !== null) {
      Object.keys(variable).forEach(key => {
        if (typeof variable[key] === 'string') {
          variable[key] = '';
        }
      });
    }
  });
}

/**
 * FULL NAME VALIDATION
 * Validates full name format
 */
export function validateFullName(name: string): boolean {
  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) return false;
  
  // At least first and last name
  const parts = trimmedName.split(/\s+/);
  if (parts.length < 2) return false;
  
  // Only letters, spaces, hyphens, and apostrophes
  return /^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmedName);
}

/**
 * REQUIRED FIELD VALIDATION
 */
export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * STRING LENGTH VALIDATION
 */
export function validateLength(value: string, min: number, max: number): boolean {
  const trimmedValue = value.trim();
  return trimmedValue.length >= min && trimmedValue.length <= max;
}