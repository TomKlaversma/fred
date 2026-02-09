import type {
  ITransformer,
  TransformerConfig,
} from "../interfaces/transformer.interface";

/**
 * Shape of raw enrichment data coming from enrichment providers.
 */
export interface RawEnrichmentData {
  leadId: string;
  provider: string;
  data: Record<string, unknown>;
  enrichedAt?: string;
}

/**
 * Shape of structured enrichment output to be merged into a lead's enrichment_data.
 */
export interface StructuredEnrichmentData {
  provider: string;
  data: Record<string, unknown>;
  enrichedAt: string;
}

/**
 * V1 Enrichment Transformer (Stub).
 *
 * Takes raw enrichment data from various providers and normalizes it
 * for merging into an existing lead's enrichment_data field.
 *
 * TODO: Implement provider-specific field normalization
 * TODO: Add conflict resolution for overlapping enrichment data
 * TODO: Add confidence scoring for enrichment fields
 * TODO: Support batch enrichment merging
 */
export class EnrichmentTransformer
  implements ITransformer<RawEnrichmentData, StructuredEnrichmentData>
{
  readonly entityType = "enrichment";
  readonly version = "1.0.0";
  readonly config: TransformerConfig;

  constructor(overrides?: Partial<TransformerConfig>) {
    this.config = {
      entityType: this.entityType,
      sourceTable: "raw_records",
      targetTable: "leads",
      version: this.version,
      fieldMappings: [],
      ...overrides,
    };
  }

  /**
   * Transform raw enrichment data into a structured format suitable for
   * merging into a lead's enrichment_data field.
   *
   * TODO: Implement provider-specific normalization logic
   * TODO: Add field-level confidence scoring
   */
  async transform(
    rawData: RawEnrichmentData,
  ): Promise<StructuredEnrichmentData> {
    return {
      provider: rawData.provider,
      data: rawData.data,
      enrichedAt: rawData.enrichedAt ?? new Date().toISOString(),
    };
  }

  /**
   * Validate the structured enrichment data.
   *
   * TODO: Add Zod schema validation
   * TODO: Validate provider-specific data shapes
   */
  async validate(
    data: StructuredEnrichmentData,
  ): Promise<StructuredEnrichmentData> {
    if (!data.provider) {
      throw new Error("Enrichment data must include a provider");
    }
    if (!data.data || typeof data.data !== "object") {
      throw new Error("Enrichment data must include a data object");
    }
    return data;
  }
}
