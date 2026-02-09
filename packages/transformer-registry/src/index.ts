// Interfaces
export type {
  FieldMapping,
  TransformerConfig,
  ITransformer,
} from "./interfaces/transformer.interface";

// Registry
export { TransformerRegistry } from "./registry/transformer-registry";

// Transform functions
export {
  trim,
  lowercase,
  uppercase,
  normalize_phone,
  parse_date,
  to_number,
  transformFunctions,
  type TransformFn,
} from "./transforms/transforms";
export { applyTransforms } from "./transforms/apply-transforms";

// Schemas
export {
  LeadSchema,
  type LeadRecord,
  LeadCompanySchema,
  type LeadCompanyRecord,
} from "./schemas";

// Transformers
export { LeadTransformer } from "./transformers/lead.transformer";
export {
  EnrichmentTransformer,
  type RawEnrichmentData,
  type StructuredEnrichmentData,
} from "./transformers/enrichment.transformer";
