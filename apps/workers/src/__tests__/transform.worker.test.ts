import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Job } from "bullmq";
import {
  mapRawDataToLead,
  processTransformJob,
  structuredLeadSchema,
  type TransformJobData,
} from "../workers/transform.worker";

// ----------------------------------------------------------------
// Mock Drizzle DB
// ----------------------------------------------------------------

function createMockDb() {
  const selectResult = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn(),
  };

  const updateResult = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };

  const insertResult = {
    values: vi.fn().mockResolvedValue(undefined),
  };

  return {
    select: vi.fn(() => selectResult),
    update: vi.fn(() => updateResult),
    insert: vi.fn(() => insertResult),
    _selectResult: selectResult,
    _updateResult: updateResult,
    _insertResult: insertResult,
  };
}

function createMockJob(data: TransformJobData): Job<TransformJobData> {
  return {
    id: "test-job-1",
    data,
    attemptsMade: 0,
  } as unknown as Job<TransformJobData>;
}

// ----------------------------------------------------------------
// Tests: mapRawDataToLead
// ----------------------------------------------------------------

describe("mapRawDataToLead", () => {
  it("should map standard field names to structured lead fields", () => {
    const rawData = {
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Doe",
      jobTitle: "CTO",
      phone: "+15551234567",
      linkedinUrl: "https://linkedin.com/in/janedoe",
      source: "hubspot",
    };

    const result = mapRawDataToLead(rawData);

    expect(result).toEqual({
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Doe",
      jobTitle: "CTO",
      phone: "+15551234567",
      linkedinUrl: "https://linkedin.com/in/janedoe",
      source: "hubspot",
    });
  });

  it("should map snake_case field names", () => {
    const rawData = {
      email: "bob@example.com",
      first_name: "Bob",
      last_name: "Smith",
      job_title: "Engineer",
      phone_number: "+15559876543",
      linkedin_url: "https://linkedin.com/in/bobsmith",
    };

    const result = mapRawDataToLead(rawData);

    expect(result).toEqual({
      email: "bob@example.com",
      firstName: "Bob",
      lastName: "Smith",
      jobTitle: "Engineer",
      phone: "+15559876543",
      linkedinUrl: "https://linkedin.com/in/bobsmith",
    });
  });

  it("should map PascalCase field names", () => {
    const rawData = {
      Email: "alice@example.com",
      FirstName: "Alice",
      LastName: "Johnson",
    };

    const result = mapRawDataToLead(rawData);

    expect(result).toEqual({
      email: "alice@example.com",
      firstName: "Alice",
      lastName: "Johnson",
    });
  });

  it("should handle missing optional fields gracefully", () => {
    const rawData = {
      email: "minimal@example.com",
    };

    const result = mapRawDataToLead(rawData);

    expect(result).toEqual({
      email: "minimal@example.com",
    });
  });

  it("should skip null and undefined values", () => {
    const rawData = {
      email: "test@example.com",
      firstName: null,
      lastName: undefined,
      jobTitle: "Manager",
    };

    const result = mapRawDataToLead(rawData);

    expect(result).toEqual({
      email: "test@example.com",
      jobTitle: "Manager",
    });
  });

  it("should use the first matching field when multiple source fields exist", () => {
    const rawData = {
      email: "priority@example.com",
      firstName: "First",
      first_name: "ShouldBeIgnored",
    };

    const result = mapRawDataToLead(rawData);

    expect(result.firstName).toBe("First");
  });

  it("should handle tags array", () => {
    const rawData = {
      email: "tagged@example.com",
      tags: ["vip", "enterprise"],
    };

    const result = mapRawDataToLead(rawData);

    expect(result.tags).toEqual(["vip", "enterprise"]);
  });
});

// ----------------------------------------------------------------
// Tests: structuredLeadSchema validation
// ----------------------------------------------------------------

describe("structuredLeadSchema", () => {
  it("should validate a complete lead", () => {
    const data = {
      email: "valid@example.com",
      firstName: "Test",
      lastName: "User",
      jobTitle: "Developer",
      phone: "+15551234567",
      linkedinUrl: "https://linkedin.com/in/testuser",
      source: "api",
      tags: ["tag1", "tag2"],
    };

    const result = structuredLeadSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const data = {
      email: "not-an-email",
    };

    const result = structuredLeadSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should accept minimal lead with just email", () => {
    const data = {
      email: "minimal@example.com",
    };

    const result = structuredLeadSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should reject missing email", () => {
    const data = {
      firstName: "NoEmail",
    };

    const result = structuredLeadSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

// ----------------------------------------------------------------
// Tests: processTransformJob
// ----------------------------------------------------------------

describe("processTransformJob", () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    mockDb = createMockDb();
    vi.clearAllMocks();
  });

  it("should insert a new lead when no existing lead matches", async () => {
    const rawRecord = {
      id: "raw-1",
      companyId: "company-1",
      workflowId: null,
      entityType: "lead",
      rawData: {
        email: "new@example.com",
        first_name: "New",
        last_name: "Lead",
        job_title: "Developer",
      },
      metadata: {},
      processingStatus: "pending",
      processedAt: null,
      errorMessage: null,
      createdAt: new Date(),
    };

    // First select: fetch raw record
    let selectCallCount = 0;
    mockDb._selectResult.then.mockImplementation((fn: (rows: unknown[]) => unknown) => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // Fetch raw record
        return Promise.resolve(fn([rawRecord]));
      }
      // Check for existing lead by email - none found
      return Promise.resolve(fn([]));
    });

    const job = createMockJob({
      rawRecordId: "raw-1",
      sourceTable: "raw_leads",
      entityType: "lead",
      companyId: "company-1",
    });

    await processTransformJob(job, mockDb as never);

    // Should have called insert for the new lead
    expect(mockDb.insert).toHaveBeenCalled();
    // Should have updated raw record to 'processed'
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("should update an existing lead when email matches (dedup)", async () => {
    const rawRecord = {
      id: "raw-2",
      companyId: "company-1",
      workflowId: null,
      entityType: "lead",
      rawData: {
        email: "existing@example.com",
        first_name: "Updated",
        last_name: "Name",
      },
      metadata: {},
      processingStatus: "pending",
      processedAt: null,
      errorMessage: null,
      createdAt: new Date(),
    };

    const existingLead = {
      id: "lead-existing",
      companyId: "company-1",
      email: "existing@example.com",
      firstName: "Old",
      lastName: "Name",
      jobTitle: null,
      phone: null,
      linkedinUrl: null,
      source: null,
      sourceWorkflow: null,
      tags: [],
      status: "new",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let selectCallCount = 0;
    mockDb._selectResult.then.mockImplementation((fn: (rows: unknown[]) => unknown) => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return Promise.resolve(fn([rawRecord]));
      }
      // Existing lead found
      return Promise.resolve(fn([existingLead]));
    });

    const job = createMockJob({
      rawRecordId: "raw-2",
      sourceTable: "raw_leads",
      entityType: "lead",
      companyId: "company-1",
    });

    await processTransformJob(job, mockDb as never);

    // Should have called update (not insert) for the existing lead
    // update is called for: processing status, lead update, processed status
    expect(mockDb.update).toHaveBeenCalled();
    // Should NOT have called insert since lead already exists
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("should mark raw record as failed when a required field is missing", async () => {
    const rawRecord = {
      id: "raw-3",
      companyId: "company-1",
      workflowId: null,
      entityType: "lead",
      rawData: {
        // Missing email - required field
        first_name: "NoEmail",
        last_name: "Person",
      },
      metadata: {},
      processingStatus: "pending",
      processedAt: null,
      errorMessage: null,
      createdAt: new Date(),
    };

    let selectCallCount = 0;
    mockDb._selectResult.then.mockImplementation((fn: (rows: unknown[]) => unknown) => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return Promise.resolve(fn([rawRecord]));
      }
      return Promise.resolve(fn([]));
    });

    const job = createMockJob({
      rawRecordId: "raw-3",
      sourceTable: "raw_leads",
      entityType: "lead",
      companyId: "company-1",
    });

    await expect(processTransformJob(job, mockDb as never)).rejects.toThrow();

    // The last update call should have set processingStatus to 'failed'
    const lastUpdateSetCall =
      mockDb._updateResult.set.mock.calls[
        mockDb._updateResult.set.mock.calls.length - 1
      ];
    expect(lastUpdateSetCall[0]).toMatchObject({
      processingStatus: "failed",
    });
    expect(lastUpdateSetCall[0].errorMessage).toBeDefined();
  });

  it("should throw when raw record is not found", async () => {
    mockDb._selectResult.then.mockImplementation((fn: (rows: unknown[]) => unknown) => {
      return Promise.resolve(fn([]));
    });

    const job = createMockJob({
      rawRecordId: "nonexistent",
      sourceTable: "raw_leads",
      entityType: "lead",
      companyId: "company-1",
    });

    await expect(processTransformJob(job, mockDb as never)).rejects.toThrow(
      "Raw record not found: nonexistent",
    );
  });

  it("should throw for unsupported entity types", async () => {
    const rawRecord = {
      id: "raw-4",
      companyId: "company-1",
      workflowId: null,
      entityType: "contact",
      rawData: { email: "test@example.com" },
      metadata: {},
      processingStatus: "pending",
      processedAt: null,
      errorMessage: null,
      createdAt: new Date(),
    };

    let selectCallCount = 0;
    mockDb._selectResult.then.mockImplementation((fn: (rows: unknown[]) => unknown) => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return Promise.resolve(fn([rawRecord]));
      }
      return Promise.resolve(fn([]));
    });

    const job = createMockJob({
      rawRecordId: "raw-4",
      sourceTable: "raw_leads",
      entityType: "contact",
      companyId: "company-1",
    });

    await expect(processTransformJob(job, mockDb as never)).rejects.toThrow(
      "Unsupported entity type: contact",
    );
  });
});
