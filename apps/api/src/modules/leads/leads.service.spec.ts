import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { DRIZZLE } from '../../database/database.constants';

describe('LeadsService', () => {
  let service: LeadsService;

  // Mock database chain
  const mockSelectResult = jest.fn();
  const mockInsertResult = jest.fn();
  const mockUpdateResult = jest.fn();
  const mockDeleteResult = jest.fn();

  const mockDb = {
    select: jest.fn().mockImplementation((fields?: unknown) => ({
      from: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: mockSelectResult,
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
        where: jest.fn().mockReturnValue({
          limit: mockSelectResult,
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([]),
            }),
          }),
          groupBy: jest.fn().mockResolvedValue([]),
        }),
      }),
    })),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: mockInsertResult,
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: mockUpdateResult,
        }),
      }),
    }),
    delete: jest.fn().mockReturnValue({
      where: mockDeleteResult,
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        {
          provide: DRIZZLE,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should scope queries by companyId', async () => {
      const companyId = 'company-123';
      const userId = 'user-123';

      // Mock count query
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      // Mock data query with leftJoin
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await service.findAll(companyId, userId, { page: 1, limit: 20 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta.page).toBe(1);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should insert a lead with the correct companyId', async () => {
      const companyId = 'company-123';
      const dto = {
        email: 'lead@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const mockLead = {
        id: 'lead-uuid',
        companyId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInsertResult.mockResolvedValueOnce([mockLead]);

      const result = await service.create(companyId, dto);

      expect(result).toEqual(mockLead);
      expect(result.companyId).toBe(companyId);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a lead when found with correct companyId', async () => {
      const companyId = 'company-123';
      const leadId = 'lead-uuid';

      const mockLead = {
        id: leadId,
        companyId,
        email: 'lead@example.com',
        firstName: 'Jane',
        status: 'new',
        contactCount: 0,
        lastContactedAt: null,
        lastContactMethod: null,
        lastResponseAt: null,
      };

      // Mock the leftJoin query for findOne
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ lead: mockLead, assignedTo: null }]),
            }),
          }),
        }),
      });

      const result = await service.findOne(companyId, leadId);

      expect(result).toHaveProperty('id', leadId);
      expect(result).toHaveProperty('contactSummary');
      expect(result.contactSummary.contactCount).toBe(0);
    });

    it('should throw NotFoundException when lead not found', async () => {
      const companyId = 'company-123';
      const leadId = 'non-existent-id';

      // Mock the leftJoin query returning empty result
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      await expect(service.findOne(companyId, leadId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return null for a lead belonging to a different company', async () => {
      const companyId = 'company-123';
      const leadId = 'lead-uuid';

      // DB query with companyId filter returns nothing (lead belongs to different company)
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      await expect(service.findOne(companyId, leadId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
