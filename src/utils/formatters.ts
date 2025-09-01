
export function formatVatNumber(input: string): string {
  // Remove all non-alphanumeric characters and convert to uppercase
  let cleaned = input.replace(/[^A-Z0-9]/g, '').toUpperCase();

  // If it starts with 'BE', remove it for now to process just the digits
  if (cleaned.startsWith('BE')) {
    cleaned = cleaned.substring(2);
  }

  // Ensure it's purely digits now
  let digits = cleaned.replace(/[^0-9]/g, '');

  // Pad with leading zeros if less than 10 digits, or truncate if more
  if (digits.length < 10) {
    digits = digits.padStart(10, '0');
  } else if (digits.length > 10) {
    digits = digits.substring(0, 10);
  }

  // Prepend "BE " and return
  return `BE ${digits}`;
}
