import { describe, it, expect, beforeEach } from "vitest";
import { TransformerRegistry } from "../registry/transformer-registry";
import type { ITransformer, TransformerConfig } from "../interfaces/transformer.interface";

/**
 * Create a mock transformer for testing purposes.
 */
function createMockTransformer(
  entityType: string,
  version: string,
): ITransformer {
  const config: TransformerConfig = {
    entityType,
    sourceTable: "raw_records",
    targetTable: `${entityType}s`,
    version,
    fieldMappings: [],
  };

  return {
    entityType,
    version,
    config,
    transform: async (data: Record<string, unknown>) => data,
    validate: async (data: Record<string, unknown>) => data,
  };
}

describe("TransformerRegistry", () => {
  let registry: TransformerRegistry;

  beforeEach(() => {
    registry = new TransformerRegistry();
  });

  describe("register and get", () => {
    it("registers and retrieves a transformer by entity type and version", () => {
      const transformer = createMockTransformer("lead", "1.0.0");
      registry.register(transformer);

      const result = registry.get("lead", "1.0.0");
      expect(result).toBe(transformer);
    });

    it("returns undefined for unknown entity types", () => {
      const result = registry.get("unknown");
      expect(result).toBeUndefined();
    });

    it("returns undefined for unknown versions", () => {
      const transformer = createMockTransformer("lead", "1.0.0");
      registry.register(transformer);

      const result = registry.get("lead", "2.0.0");
      expect(result).toBeUndefined();
    });

    it("returns the latest version when no version is specified", () => {
      const v1 = createMockTransformer("lead", "1.0.0");
      const v2 = createMockTransformer("lead", "2.0.0");
      registry.register(v1);
      registry.register(v2);

      const result = registry.get("lead");
      expect(result).toBe(v2);
    });

    it("overwrites existing transformer with same entity type and version", () => {
      const original = createMockTransformer("lead", "1.0.0");
      const replacement = createMockTransformer("lead", "1.0.0");
      registry.register(original);
      registry.register(replacement);

      const result = registry.get("lead", "1.0.0");
      expect(result).toBe(replacement);
    });
  });

  describe("getLatest", () => {
    it("returns the highest version transformer", () => {
      const v1 = createMockTransformer("lead", "1.0.0");
      const v2 = createMockTransformer("lead", "2.0.0");
      const v1_1 = createMockTransformer("lead", "1.1.0");

      // Register in non-sorted order
      registry.register(v2);
      registry.register(v1);
      registry.register(v1_1);

      const result = registry.getLatest("lead");
      expect(result).toBe(v2);
    });

    it("returns undefined for unknown entity types", () => {
      const result = registry.getLatest("unknown");
      expect(result).toBeUndefined();
    });

    it("handles patch version ordering", () => {
      const v1_0_0 = createMockTransformer("lead", "1.0.0");
      const v1_0_1 = createMockTransformer("lead", "1.0.1");
      const v1_0_10 = createMockTransformer("lead", "1.0.10");

      registry.register(v1_0_0);
      registry.register(v1_0_10);
      registry.register(v1_0_1);

      const result = registry.getLatest("lead");
      expect(result).toBe(v1_0_10);
    });
  });

  describe("has", () => {
    it("returns true for registered entity type", () => {
      const transformer = createMockTransformer("lead", "1.0.0");
      registry.register(transformer);

      expect(registry.has("lead")).toBe(true);
    });

    it("returns true for registered entity type and version", () => {
      const transformer = createMockTransformer("lead", "1.0.0");
      registry.register(transformer);

      expect(registry.has("lead", "1.0.0")).toBe(true);
    });

    it("returns false for unknown entity type", () => {
      expect(registry.has("unknown")).toBe(false);
    });

    it("returns false for unknown version of known entity type", () => {
      const transformer = createMockTransformer("lead", "1.0.0");
      registry.register(transformer);

      expect(registry.has("lead", "2.0.0")).toBe(false);
    });
  });

  describe("listEntityTypes", () => {
    it("returns empty array when no transformers registered", () => {
      expect(registry.listEntityTypes()).toEqual([]);
    });

    it("lists all registered entity types", () => {
      registry.register(createMockTransformer("lead", "1.0.0"));
      registry.register(createMockTransformer("company", "1.0.0"));
      registry.register(createMockTransformer("enrichment", "1.0.0"));

      const types = registry.listEntityTypes();
      expect(types).toContain("lead");
      expect(types).toContain("company");
      expect(types).toContain("enrichment");
      expect(types).toHaveLength(3);
    });

    it("does not duplicate entity types with multiple versions", () => {
      registry.register(createMockTransformer("lead", "1.0.0"));
      registry.register(createMockTransformer("lead", "2.0.0"));

      const types = registry.listEntityTypes();
      expect(types).toEqual(["lead"]);
    });
  });

  describe("listVersions", () => {
    it("returns empty array for unknown entity type", () => {
      expect(registry.listVersions("unknown")).toEqual([]);
    });

    it("lists all versions sorted in semver order", () => {
      registry.register(createMockTransformer("lead", "2.0.0"));
      registry.register(createMockTransformer("lead", "1.0.0"));
      registry.register(createMockTransformer("lead", "1.1.0"));

      const versions = registry.listVersions("lead");
      expect(versions).toEqual(["1.0.0", "1.1.0", "2.0.0"]);
    });
  });
});
