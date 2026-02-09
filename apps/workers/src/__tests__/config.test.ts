import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../config";

describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should load config with valid environment variables", () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/fred";

    const config = loadConfig();

    expect(config.REDIS_URL).toBe("redis://localhost:6379");
    expect(config.DATABASE_URL).toBe(
      "postgresql://postgres:postgres@localhost:5432/fred",
    );
  });

  it("should use default REDIS_URL when not provided", () => {
    delete process.env.REDIS_URL;
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/fred";

    const config = loadConfig();

    expect(config.REDIS_URL).toBe("redis://localhost:6379");
  });

  it("should use default DATABASE_URL when not provided", () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    delete process.env.DATABASE_URL;

    const config = loadConfig();

    expect(config.DATABASE_URL).toBe(
      "postgresql://postgres:postgres@localhost:5432/fred",
    );
  });

  it("should use all defaults when no env vars are set", () => {
    delete process.env.REDIS_URL;
    delete process.env.DATABASE_URL;

    const config = loadConfig();

    expect(config.REDIS_URL).toBe("redis://localhost:6379");
    expect(config.DATABASE_URL).toBe(
      "postgresql://postgres:postgres@localhost:5432/fred",
    );
  });

  it("should accept custom Redis URL", () => {
    process.env.REDIS_URL = "redis://redis-host:6380";
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/fred";

    const config = loadConfig();

    expect(config.REDIS_URL).toBe("redis://redis-host:6380");
  });

  it("should accept custom database URL", () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.DATABASE_URL =
      "postgresql://admin:secret@db-host:5433/fred_production";

    const config = loadConfig();

    expect(config.DATABASE_URL).toBe(
      "postgresql://admin:secret@db-host:5433/fred_production",
    );
  });
});
