/**
 * Mask a Saudi National ID / Iqama number.
 * "1023456789" → "******6789"
 */
export function maskNationalId(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return "******" + value.slice(-4);
}

/**
 * Mask a phone number.
 * "0501234567" → "******4567"
 */
export function maskPhone(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return "******" + value.slice(-4);
}

/**
 * Mask an email address.
 * "user@example.com" → "u***@example.com"
 */
export function maskEmail(value: string | null | undefined): string {
  if (!value) return "";
  const atIndex = value.indexOf("@");
  if (atIndex <= 1) return "***" + value.slice(atIndex);
  return value[0] + "***" + value.slice(atIndex);
}

/**
 * Apply PII masking to a customer object based on whether the user has PII access.
 */
export function maskCustomerPii<T extends Record<string, any>>(
  customer: T,
  hasPiiAccess: boolean
): T {
  if (hasPiiAccess || !customer) return customer;

  return {
    ...customer,
    nationalId: customer.nationalId ? maskNationalId(customer.nationalId) : customer.nationalId,
    phone: customer.phone ? maskPhone(customer.phone) : customer.phone,
    email: customer.email ? maskEmail(customer.email) : customer.email,
    address: customer.address ? { masked: true } : customer.address,
    documentInfo: customer.documentInfo ? { masked: true } : customer.documentInfo,
    dateOfBirth: customer.dateOfBirth ? null : customer.dateOfBirth,
    dateOfBirthHijri: customer.dateOfBirthHijri ? "****" : customer.dateOfBirthHijri,
  };
}
