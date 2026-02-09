import { z } from "zod";

const envSchema = z.object({
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://postgres:postgres@localhost:5432/fred"),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function loadConfig(): Config {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    const messages = Object.entries(formatted)
      .filter(([key]) => key !== "_errors")
      .map(([key, value]) => {
        const errors = (value as { _errors?: string[] })._errors ?? [];
        return `  ${key}: ${errors.join(", ")}`;
      })
      .join("\n");

    throw new Error(`Invalid environment variables:\n${messages}`);
  }

  _config = result.data;
  return _config;
}

export function getConfig(): Config {
  if (!_config) {
    return loadConfig();
  }
  return _config;
}
