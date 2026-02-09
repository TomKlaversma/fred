import type { FieldMapping } from "../interfaces/transformer.interface";
import { transformFunctions } from "./transforms";

/**
 * Resolve a JSONPath-like expression against a data object.
 *
 * Supports paths like:
 * - "$.email" -> data.email
 * - "$.company.name" -> data.company.name
 * - "$.addresses[0].city" is NOT supported (no array indexing)
 *
 * The leading "$." prefix is optional.
 */
function resolvePath(
  data: Record<string, unknown>,
  path: string,
): unknown {
  const normalizedPath = path.startsWith("$.") ? path.slice(2) : path;
  const segments = normalizedPath.split(".");

  let current: unknown = data;
  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

/**
 * Apply a set of field mappings to raw data, producing a transformed object.
 *
 * For each FieldMapping:
 * 1. Resolve the source path from raw data
 * 2. If the value is missing, use defaultValue or skip (unless required)
 * 3. Apply any named transform function
 * 4. Set the value on the output under the target key
 *
 * @throws Error if a required field is missing from the raw data
 */
export function applyTransforms(
  rawData: Record<string, unknown>,
  fieldMappings: FieldMapping[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const mapping of fieldMappings) {
    let value = resolvePath(rawData, mapping.source);

    // Handle missing values
    if (value === undefined || value === null) {
      if (mapping.defaultValue !== undefined) {
        value = mapping.defaultValue;
      } else if (mapping.required) {
        throw new Error(
          `Required field "${mapping.source}" is missing from raw data`,
        );
      } else {
        // Optional field with no default, skip it
        continue;
      }
    }

    // Apply transform function if specified
    if (mapping.transform) {
      const transformFn = transformFunctions[mapping.transform];
      if (!transformFn) {
        throw new Error(`Unknown transform function: "${mapping.transform}"`);
      }
      value = transformFn(value);
    }

    result[mapping.target] = value;
  }

  return result;
}
