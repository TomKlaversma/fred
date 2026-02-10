import { describe, expect, it } from 'vitest';
import {
  UserRole,
  LeadStatus,
  CampaignStatus,
  CampaignLeadStatus,
  ProcessingStatus,
  IntegrationStatus,
  Channel,
  Provider,
} from '../constants';

describe('UserRole', () => {
  it('should define all expected roles', () => {
    expect(UserRole.OWNER).toBe('owner');
    expect(UserRole.ADMIN).toBe('admin');
    expect(UserRole.MEMBER).toBe('member');
  });

  it('should have exactly 3 values', () => {
    expect(Object.keys(UserRole)).toHaveLength(3);
  });

  it('should be frozen and immutable at runtime', () => {
    // Object.freeze() makes the object immutable at runtime
    expect(Object.isFrozen(UserRole)).toBe(true);

    // Attempting to mutate should throw in strict mode (which Vitest uses)
    expect(() => {
      (UserRole as Record<string, string>).OWNER = 'hacked';
    }).toThrow(/Cannot assign to read only property/);

    // The value should remain unchanged
    expect(UserRole.OWNER).toBe('owner');
  });
});

describe('LeadStatus', () => {
  it('should define all expected statuses', () => {
    expect(LeadStatus.NEW).toBe('new');
    expect(LeadStatus.CONTACTED).toBe('contacted');
    expect(LeadStatus.QUALIFIED).toBe('qualified');
    expect(LeadStatus.CONVERTED).toBe('converted');
    expect(LeadStatus.LOST).toBe('lost');
  });

  it('should have exactly 5 values', () => {
    expect(Object.keys(LeadStatus)).toHaveLength(5);
  });

  it('should contain all expected string values', () => {
    const values = Object.values(LeadStatus);
    expect(values).toContain('new');
    expect(values).toContain('contacted');
    expect(values).toContain('qualified');
    expect(values).toContain('converted');
    expect(values).toContain('lost');
  });
});

describe('CampaignStatus', () => {
  it('should define all expected statuses', () => {
    expect(CampaignStatus.DRAFT).toBe('draft');
    expect(CampaignStatus.ACTIVE).toBe('active');
    expect(CampaignStatus.PAUSED).toBe('paused');
    expect(CampaignStatus.COMPLETED).toBe('completed');
  });

  it('should have exactly 4 values', () => {
    expect(Object.keys(CampaignStatus)).toHaveLength(4);
  });
});

describe('CampaignLeadStatus', () => {
  it('should define all expected statuses', () => {
    expect(CampaignLeadStatus.PENDING).toBe('pending');
    expect(CampaignLeadStatus.SENT).toBe('sent');
    expect(CampaignLeadStatus.REPLIED).toBe('replied');
    expect(CampaignLeadStatus.BOUNCED).toBe('bounced');
  });

  it('should have exactly 4 values', () => {
    expect(Object.keys(CampaignLeadStatus)).toHaveLength(4);
  });
});

describe('ProcessingStatus', () => {
  it('should define all expected statuses', () => {
    expect(ProcessingStatus.PENDING).toBe('pending');
    expect(ProcessingStatus.PROCESSING).toBe('processing');
    expect(ProcessingStatus.PROCESSED).toBe('processed');
    expect(ProcessingStatus.FAILED).toBe('failed');
  });

  it('should have exactly 4 values', () => {
    expect(Object.keys(ProcessingStatus)).toHaveLength(4);
  });
});

describe('IntegrationStatus', () => {
  it('should define all expected statuses', () => {
    expect(IntegrationStatus.ACTIVE).toBe('active');
    expect(IntegrationStatus.EXPIRED).toBe('expired');
    expect(IntegrationStatus.REVOKED).toBe('revoked');
  });

  it('should have exactly 3 values', () => {
    expect(Object.keys(IntegrationStatus)).toHaveLength(3);
  });
});

describe('Channel', () => {
  it('should define all expected channels', () => {
    expect(Channel.EMAIL).toBe('email');
    expect(Channel.LINKEDIN).toBe('linkedin');
    expect(Channel.SMS).toBe('sms');
  });

  it('should have exactly 3 values', () => {
    expect(Object.keys(Channel)).toHaveLength(3);
  });
});

describe('Provider', () => {
  it('should define all expected providers', () => {
    expect(Provider.LINKEDIN).toBe('linkedin');
    expect(Provider.EMAIL_SMTP).toBe('email_smtp');
    expect(Provider.GOOGLE).toBe('google');
    expect(Provider.CUSTOM).toBe('custom');
  });

  it('should have exactly 4 values', () => {
    expect(Object.keys(Provider)).toHaveLength(4);
  });
});
