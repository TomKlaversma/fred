import { describe, it, expect } from "vitest";
import { applyTransforms } from "../transforms/apply-transforms";
import type { FieldMapping } from "../interfaces/transformer.interface";

describe("applyTransforms", () => {
  it("maps flat fields correctly", () => {
    const rawData = {
      email: "test@example.com",
      name: "John",
    };

    const mappings: FieldMapping[] = [
      { source: "$.email", target: "email" },
      { source: "$.name", target: "fullName" },
    ];

    const result = applyTransforms(rawData, mappings);

    expect(result).toEqual({
      email: "test@example.com",
      fullName: "John",
    });
  });

  it("handles nested paths ($.company.name)", () => {
    const rawData = {
      company: {
        name: "Acme Corp",
        address: {
          city: "New York",
        },
      },
    };

    const mappings: FieldMapping[] = [
      { source: "$.company.name", target: "companyName" },
      { source: "$.company.address.city", target: "city" },
    ];

    const result = applyTransforms(rawData, mappings);

    expect(result).toEqual({
      companyName: "Acme Corp",
      city: "New York",
    });
  });

  it("applies transform functions", () => {
    const rawData = {
      name: "  John  ",
      email: "JOHN@EXAMPLE.COM",
      phone: "(123) 456-7890",
    };

    const mappings: FieldMapping[] = [
      { source: "$.name", target: "name", transform: "trim" },
      { source: "$.email", target: "email", transform: "lowercase" },
      { source: "$.phone", target: "phone", transform: "normalize_phone" },
    ];

    const result = applyTransforms(rawData, mappings);

    expect(result).toEqual({
      name: "John",
      email: "john@example.com",
      phone: "+1234567890",
    });
  });

  it("handles missing optional fields by skipping them", () => {
    const rawData = {
      email: "test@example.com",
    };

    const mappings: FieldMapping[] = [
      { source: "$.email", target: "email" },
      { source: "$.phone", target: "phone" },
      { source: "$.name", target: "name" },
    ];

    const result = applyTransforms(rawData, mappings);

    expect(result).toEqual({
      email: "test@example.com",
    });
    expect(result).not.toHaveProperty("phone");
    expect(result).not.toHaveProperty("name");
  });

  it("throws on missing required fields", () => {
    const rawData = {
      name: "John",
    };

    const mappings: FieldMapping[] = [
      { source: "$.email", target: "email", required: true },
    ];

    expect(() => applyTransforms(rawData, mappings)).toThrow(
      'Required field "$.email" is missing from raw data',
    );
  });

  it("uses default values when source field is missing", () => {
    const rawData = {
      email: "test@example.com",
    };

    const mappings: FieldMapping[] = [
      { source: "$.email", target: "email" },
      { source: "$.status", target: "status", defaultValue: "new" },
      {
        source: "$.tags",
        target: "tags",
        defaultValue: [],
      },
    ];

    const result = applyTransforms(rawData, mappings);

    expect(result).toEqual({
      email: "test@example.com",
      status: "new",
      tags: [],
    });
  });

  it("throws for unknown transform functions", () => {
    const rawData = {
      name: "John",
    };

    const mappings: FieldMapping[] = [
      {
        source: "$.name",
        target: "name",
        transform: "nonexistent_transform",
      },
    ];

    expect(() => applyTransforms(rawData, mappings)).toThrow(
      'Unknown transform function: "nonexistent_transform"',
    );
  });

  it("handles paths without $. prefix", () => {
    const rawData = {
      email: "test@example.com",
    };

    const mappings: FieldMapping[] = [
      { source: "email", target: "email" },
    ];

    const result = applyTransforms(rawData, mappings);

    expect(result).toEqual({
      email: "test@example.com",
    });
  });
});
