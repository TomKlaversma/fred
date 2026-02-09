import { describe, it, expect } from "vitest";
import { LeadTransformer } from "../transformers/lead.transformer";

describe("LeadTransformer", () => {
  const transformer = new LeadTransformer();

  it("has correct entityType and version", () => {
    expect(transformer.entityType).toBe("lead");
    expect(transformer.version).toBe("1.0.0");
  });

  it("transforms a complete raw lead record correctly", async () => {
    const rawData = {
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
      phone: "(555) 123-4567",
      jobTitle: "  Software Engineer  ",
      linkedinUrl: "https://linkedin.com/in/johndoe",
    };

    const result = await transformer.transform(rawData);

    expect(result.email).toBe("john@example.com");
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
    expect(result.phone).toBe("+5551234567");
    expect(result.jobTitle).toBe("Software Engineer");
    expect(result.linkedinUrl).toBe("https://linkedin.com/in/johndoe");
    expect(result.status).toBe("new");
  });

  it("handles alternative field names (first_name vs firstName)", async () => {
    const rawData = {
      email: "jane@example.com",
      first_name: "Jane",
      last_name: "Smith",
      job_title: "Product Manager",
      linkedin_url: "https://linkedin.com/in/janesmith",
    };

    const result = await transformer.transform(rawData);

    expect(result.email).toBe("jane@example.com");
    expect(result.firstName).toBe("Jane");
    expect(result.lastName).toBe("Smith");
    expect(result.jobTitle).toBe("Product Manager");
    expect(result.linkedinUrl).toBe("https://linkedin.com/in/janesmith");
  });

  it("handles the 'title' alternative for jobTitle", async () => {
    const rawData = {
      email: "bob@example.com",
      title: "CEO",
    };

    const result = await transformer.transform(rawData);

    expect(result.email).toBe("bob@example.com");
    expect(result.jobTitle).toBe("CEO");
  });

  it("handles the 'linkedin' alternative for linkedinUrl", async () => {
    const rawData = {
      email: "alice@example.com",
      linkedin: "https://linkedin.com/in/alice",
    };

    const result = await transformer.transform(rawData);

    expect(result.linkedinUrl).toBe("https://linkedin.com/in/alice");
  });

  it("extracts company name into enrichmentData", async () => {
    const rawData = {
      email: "contact@example.com",
      firstName: "Test",
      company: {
        name: "Acme Corp",
      },
    };

    const result = await transformer.transform(rawData);

    expect(result.enrichmentData).toBeDefined();
    expect(result.enrichmentData["companyName"]).toBe("Acme Corp");
  });

  it("validates output against Zod schema", async () => {
    const rawData = {
      email: "valid@example.com",
    };

    const result = await transformer.transform(rawData);

    // Schema should set defaults
    expect(result.status).toBe("new");
    expect(result.enrichmentData).toEqual({});
    expect(result.tags).toEqual([]);
  });

  it("rejects invalid email when required", async () => {
    const rawData = {
      email: "not-an-email",
    };

    await expect(transformer.transform(rawData)).rejects.toThrow();
  });

  it("throws when email is missing (required field)", async () => {
    const rawData = {
      firstName: "John",
      lastName: "Doe",
    };

    await expect(transformer.transform(rawData)).rejects.toThrow(
      'Required field "$.email" is missing from raw data',
    );
  });

  it("handles minimal raw data (email only)", async () => {
    const rawData = {
      email: "minimal@example.com",
    };

    const result = await transformer.transform(rawData);

    expect(result.email).toBe("minimal@example.com");
    expect(result.status).toBe("new");
    expect(result.tags).toEqual([]);
    expect(result.enrichmentData).toEqual({});
  });

  it("prefers primary field names over alternatives", async () => {
    const rawData = {
      email: "test@example.com",
      firstName: "Primary",
      first_name: "Alternative",
    };

    const result = await transformer.transform(rawData);

    expect(result.firstName).toBe("Primary");
  });
});
