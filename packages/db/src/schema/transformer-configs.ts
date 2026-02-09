import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const transformerConfigs = pgTable("transformer_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  entityType: text("entity_type").notNull(),
  sourceTable: text("source_table").notNull(),
  targetTable: text("target_table").notNull(),
  version: text("version").notNull(),
  fieldMappings: jsonb("field_mappings").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type TransformerConfig = typeof transformerConfigs.$inferSelect;
export type NewTransformerConfig = typeof transformerConfigs.$inferInsert;
