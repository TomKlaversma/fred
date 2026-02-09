export interface FieldMapping {
  /** JSONPath in raw data (e.g., "$.email", "$.company.name") */
  source: string;
  /** Column name in structured table */
  target: string;
  /** Whether this field is required */
  required?: boolean;
  /** Default value if source field is missing */
  defaultValue?: unknown;
  /** Transform function name: 'trim', 'lowercase', 'normalize_phone', 'parse_date', etc. */
  transform?: string;
}

export interface TransformerConfig {
  entityType: string;
  sourceTable: string;
  targetTable: string;
  version: string;
  fieldMappings: FieldMapping[];
  /** Field name to deduplicate on (e.g., 'email') */
  dedupKey?: string;
  /** Strategy when a duplicate is found */
  onConflict?: "merge" | "skip" | "replace";
}

export interface ITransformer<
  TRaw = Record<string, unknown>,
  TStructured = Record<string, unknown>,
> {
  readonly entityType: string;
  readonly version: string;
  readonly config: TransformerConfig;

  transform(rawData: TRaw): Promise<TStructured>;
  validate(data: TStructured): Promise<TStructured>;
}
