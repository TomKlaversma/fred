import { describe, it, expect } from "vitest";
import {
  trim,
  lowercase,
  uppercase,
  normalize_phone,
  parse_date,
  to_number,
} from "../transforms/transforms";

describe("trim", () => {
  it("removes leading whitespace", () => {
    expect(trim("  hello")).toBe("hello");
  });

  it("removes trailing whitespace", () => {
    expect(trim("hello  ")).toBe("hello");
  });

  it("removes leading and trailing whitespace", () => {
    expect(trim("  hello  ")).toBe("hello");
  });

  it("handles strings with no extra whitespace", () => {
    expect(trim("hello")).toBe("hello");
  });

  it("handles empty strings", () => {
    expect(trim("")).toBe("");
  });

  it("handles whitespace-only strings", () => {
    expect(trim("   ")).toBe("");
  });
});

describe("lowercase", () => {
  it("converts uppercase to lowercase", () => {
    expect(lowercase("HELLO")).toBe("hello");
  });

  it("converts mixed case to lowercase", () => {
    expect(lowercase("Hello World")).toBe("hello world");
  });

  it("handles already lowercase strings", () => {
    expect(lowercase("hello")).toBe("hello");
  });
});

describe("uppercase", () => {
  it("converts lowercase to uppercase", () => {
    expect(uppercase("hello")).toBe("HELLO");
  });

  it("converts mixed case to uppercase", () => {
    expect(uppercase("Hello World")).toBe("HELLO WORLD");
  });

  it("handles already uppercase strings", () => {
    expect(uppercase("HELLO")).toBe("HELLO");
  });
});

describe("normalize_phone", () => {
  it("handles number with + prefix", () => {
    expect(normalize_phone("+1234567890")).toBe("+1234567890");
  });

  it("handles formatted US phone number with parentheses", () => {
    expect(normalize_phone("(123) 456-7890")).toBe("+1234567890");
  });

  it("handles dashed phone number", () => {
    expect(normalize_phone("123-456-7890")).toBe("+1234567890");
  });

  it("handles phone number with spaces", () => {
    expect(normalize_phone("123 456 7890")).toBe("+1234567890");
  });

  it("handles international format with + prefix", () => {
    expect(normalize_phone("+44 20 7946 0958")).toBe("+442079460958");
  });

  it("handles plain digits", () => {
    expect(normalize_phone("1234567890")).toBe("+1234567890");
  });

  it("returns empty string for empty input", () => {
    expect(normalize_phone("")).toBe("");
  });
});

describe("parse_date", () => {
  it("parses ISO 8601 date strings", () => {
    const result = parse_date("2024-01-15T10:30:00.000Z");
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe("2024-01-15T10:30:00.000Z");
  });

  it("parses date-only ISO strings", () => {
    const result = parse_date("2024-01-15");
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
  });

  it("throws on invalid date strings", () => {
    expect(() => parse_date("not-a-date")).toThrow("Invalid date value");
  });
});

describe("to_number", () => {
  it("converts numeric strings", () => {
    expect(to_number("42")).toBe(42);
  });

  it("converts decimal strings", () => {
    expect(to_number("3.14")).toBe(3.14);
  });

  it("throws on non-numeric strings", () => {
    expect(() => to_number("abc")).toThrow("Cannot convert to number");
  });
});
