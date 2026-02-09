import type {
  FieldMapping,
  ITransformer,
  TransformerConfig,
} from "../interfaces/transformer.interface";
import { applyTransforms } from "../transforms/apply-transforms";
import { LeadSchema, type LeadRecord } from "../schemas/lead.schema";

/**
 * Default field mappings for transforming raw lead data into structured lead records.
 *
 * Supports common field name variations (e.g., firstName / first_name).
 * When multiple source paths could map to the same target, we use separate
 * mappings with the first match winning.
 */
const DEFAULT_FIELD_MAPPINGS: FieldMapping[] = [
  { source: "$.email", target: "email", required: true },
  { source: "$.firstName", target: "firstName", transform: "trim" },
  { source: "$.lastName", target: "lastName", transform: "trim" },
  { source: "$.phone", target: "phone", transform: "normalize_phone" },
  { source: "$.jobTitle", target: "jobTitle", transform: "trim" },
  { source: "$.linkedinUrl", target: "linkedinUrl" },
];

/**
 * Alternative field name mappings that are tried when the default source path
 * yields no value. Maps alternative source paths to the same target fields.
 */
const ALTERNATIVE_FIELD_MAPPINGS: FieldMapping[] = [
  { source: "$.first_name", target: "firstName", transform: "trim" },
  { source: "$.last_name", target: "lastName", transform: "trim" },
  { source: "$.job_title", target: "jobTitle", transform: "trim" },
  { source: "$.title", target: "jobTitle", transform: "trim" },
  { source: "$.linkedin_url", target: "linkedinUrl" },
  { source: "$.linkedin", target: "linkedinUrl" },
];

/**
 * Resolve a JSONPath-like expression against a data object.
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
 * V1 Lead Transformer.
 *
 * Transforms raw lead data (from webhooks, CSV imports, etc.) into structured
 * lead records matching the leads table schema.
 *
 * Features:
 * - Supports alternative field names (first_name vs firstName)
 * - Extracts company name into enrichmentData
 * - Validates output against LeadSchema (Zod)
 */
export class LeadTransformer
  implements ITransformer<Record<string, unknown>, LeadRecord>
{
  readonly entityType = "lead";
  readonly version = "1.0.0";
  readonly config: TransformerConfig;

  constructor(overrides?: Partial<TransformerConfig>) {
    this.config = {
      entityType: this.entityType,
      sourceTable: "raw_records",
      targetTable: "leads",
      version: this.version,
      fieldMappings: DEFAULT_FIELD_MAPPINGS,
      dedupKey: "email",
      onConflict: "merge",
      ...overrides,
    };
  }

  /**
   * Transform raw data into a structured lead record.
   *
   * 1. Apply default field mappings
   * 2. Fill in missing fields from alternative mappings
   * 3. Extract company name into enrichmentData
   */
  async transform(
    rawData: Record<string, unknown>,
  ): Promise<LeadRecord> {
    // Step 1: Apply the primary field mappings
    const result = applyTransforms(rawData, this.config.fieldMappings);

    // Step 2: Fill in any missing fields from alternative mappings
    for (const altMapping of ALTERNATIVE_FIELD_MAPPINGS) {
      if (result[altMapping.target] === undefined) {
        const value = resolvePath(rawData, altMapping.source);
        if (value !== undefined && value !== null) {
          // Apply transform if specified
          if (altMapping.transform) {
            const { transformFunctions } = await import(
              "../transforms/transforms"
            );
            const fn = transformFunctions[altMapping.transform];
            if (fn) {
              result[altMapping.target] = fn(value);
            }
          } else {
            result[altMapping.target] = value;
          }
        }
      }
    }

    // Step 3: Extract company name into enrichmentData
    const companyName = resolvePath(rawData, "$.company.name");
    if (companyName !== undefined && companyName !== null) {
      const enrichmentData =
        (result["enrichmentData"] as Record<string, unknown>) ?? {};
      enrichmentData["companyName"] = companyName;
      result["enrichmentData"] = enrichmentData;
    }

    // Step 4: Validate and return
    return this.validate(result as LeadRecord);
  }

  /**
   * Validate structured data against the LeadSchema.
   * Returns the parsed (and potentially defaulted) record.
   */
  async validate(data: LeadRecord): Promise<LeadRecord> {
    return LeadSchema.parse(data);
  }
}
