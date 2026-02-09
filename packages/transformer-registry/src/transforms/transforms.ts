/**
 * Built-in transform functions that can be referenced by name in FieldMapping.transform.
 */

export type TransformFn = (value: unknown) => unknown;

/** Remove leading/trailing whitespace from a string value. */
export function trim(value: unknown): string {
  return String(value).trim();
}

/** Convert a string value to lowercase. */
export function lowercase(value: unknown): string {
  return String(value).toLowerCase();
}

/** Convert a string value to uppercase. */
export function uppercase(value: unknown): string {
  return String(value).toUpperCase();
}

/**
 * Normalize a phone number: strip all non-digit characters (except leading +),
 * then ensure it has a + prefix.
 */
export function normalize_phone(value: unknown): string {
  const raw = String(value);
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return hasPlus ? `+${digits}` : `+${digits}`;
}

/**
 * Parse a date string into a Date object. Supports ISO 8601 strings
 * and common date formats.
 */
export function parse_date(value: unknown): Date {
  const date = new Date(String(value));
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${String(value)}`);
  }
  return date;
}

/**
 * Convert a value to a number. Throws if the result is NaN.
 */
export function to_number(value: unknown): number {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Cannot convert to number: ${String(value)}`);
  }
  return num;
}

/**
 * Map of all built-in transform functions, keyed by their string name.
 * These names are used in FieldMapping.transform to reference which
 * transform to apply.
 */
export const transformFunctions: Record<string, TransformFn> = {
  trim,
  lowercase,
  uppercase,
  normalize_phone,
  parse_date,
  to_number,
};
