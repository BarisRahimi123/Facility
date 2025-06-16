/**
 * Formats a phone number to E.164 format (e.g., +1234567890)
 * Assumes US numbers if no country code is provided
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // For US numbers (10 digits), add +1
  if (cleaned.length === 10) {
    return '+1' + cleaned;
  }
  
  // If already has country code (11 digits starting with 1)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return '+' + cleaned;
  }
  
  // Default case: just ensure it starts with +1
  return cleaned.startsWith('1') ? '+' + cleaned : '+1' + cleaned;
} 