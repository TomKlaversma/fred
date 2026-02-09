import type { ITransformer } from "../interfaces/transformer.interface";

/**
 * Registry for managing transformer instances by entity type and version.
 *
 * Transformers are organized in a two-level map: entityType -> version -> transformer.
 * The registry supports retrieving the latest version of a transformer for a given entity type.
 */
export class TransformerRegistry {
  private transformers = new Map<string, Map<string, ITransformer>>();

  /**
   * Register a transformer instance. Overwrites any existing transformer
   * with the same entityType and version.
   */
  register(transformer: ITransformer): void {
    const { entityType, version } = transformer;

    if (!this.transformers.has(entityType)) {
      this.transformers.set(entityType, new Map());
    }

    const versions = this.transformers.get(entityType)!;
    versions.set(version, transformer);
  }

  /**
   * Retrieve a transformer by entity type and optional version.
   * If no version is specified, returns the latest version.
   */
  get(entityType: string, version?: string): ITransformer | undefined {
    const versions = this.transformers.get(entityType);
    if (!versions) {
      return undefined;
    }

    if (version) {
      return versions.get(version);
    }

    return this.getLatest(entityType);
  }

  /**
   * Get the latest (highest semver) version of a transformer for the given entity type.
   */
  getLatest(entityType: string): ITransformer | undefined {
    const versions = this.transformers.get(entityType);
    if (!versions || versions.size === 0) {
      return undefined;
    }

    const sortedVersions = Array.from(versions.keys()).sort(
      this.compareSemver,
    );
    const latestVersion = sortedVersions[sortedVersions.length - 1]!;
    return versions.get(latestVersion);
  }

  /**
   * Check whether a transformer exists for the given entity type and optional version.
   */
  has(entityType: string, version?: string): boolean {
    const versions = this.transformers.get(entityType);
    if (!versions) {
      return false;
    }

    if (version) {
      return versions.has(version);
    }

    return versions.size > 0;
  }

  /**
   * List all registered entity types.
   */
  listEntityTypes(): string[] {
    return Array.from(this.transformers.keys());
  }

  /**
   * List all registered versions for a given entity type.
   */
  listVersions(entityType: string): string[] {
    const versions = this.transformers.get(entityType);
    if (!versions) {
      return [];
    }

    return Array.from(versions.keys()).sort(this.compareSemver);
  }

  /**
   * Compare two semver strings for sorting. Returns negative if a < b,
   * positive if a > b, and 0 if equal.
   */
  private compareSemver(a: string, b: string): number {
    const partsA = a.split(".").map(Number);
    const partsB = b.split(".").map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] ?? 0;
      const numB = partsB[i] ?? 0;
      if (numA !== numB) {
        return numA - numB;
      }
    }

    return 0;
  }
}
