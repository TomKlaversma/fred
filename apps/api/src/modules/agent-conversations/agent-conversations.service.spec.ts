import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AgentConversationsService } from './agent-conversations.service';
import { DRIZZLE } from '../../database/database.constants';

describe('AgentConversationsService', () => {
  let service: AgentConversationsService;

  const mockUserId = '00000000-0000-0000-0000-000000000001';
  const mockCompanyId = '00000000-0000-0000-0000-000000000002';
  const mockConversationId = '00000000-0000-0000-0000-000000000003';

  // Mock database results
  const mockSelectResult = jest.fn();
  const mockInsertResult = jest.fn();
  const mockUpdateResult = jest.fn();

  const mockDb = {
    select: jest.fn().mockImplementation((fields?: unknown) => {
      const chain = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: mockSelectResult,
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
          orderBy: jest.fn().mockResolvedValue([]),
        }),
      };
      return chain;
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: mockInsertResult,
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: mockUpdateResult,
      }),
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentConversationsService,
        {
          provide: DRIZZLE,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<AgentConversationsService>(AgentConversationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a conversation with welcome message', async () => {
      const mockConversation = {
        id: mockConversationId,
        title: 'Test Conversation',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMeta = {
        id: '00000000-0000-0000-0000-000000000004',
        conversationId: mockConversationId,
        companyId: mockCompanyId,
        userId: mockUserId,
        isPublic: false,
        status: 'active',
        tags: [],
        isFavorite: false,
        messageCount: 1,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMessage = {
        id: '00000000-0000-0000-0000-000000000005',
        conversationId: mockConversationId,
        role: 'assistant',
        content: 'Hello! I am your AI Lead Generation Assistant...',
        metadata: {},
        createdAt: new Date(),
      };

      mockInsertResult
        .mockResolvedValueOnce([mockConversation])
        .mockResolvedValueOnce([mockMeta])
        .mockResolvedValueOnce([mockMessage]);

      const result = await service.create(mockUserId, mockCompanyId, {
        title: 'Test Conversation',
      });

      expect(result).toHaveProperty('id', mockConversationId);
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('messages');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('assistant');
    });
  });

  describe('findAll', () => {
    it('should return paginated conversations', async () => {
      const mockResults = [
        {
          conversation: {
            id: mockConversationId,
            title: 'Test',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          meta: {
            id: '123',
            conversationId: mockConversationId,
            companyId: mockCompanyId,
            userId: mockUserId,
            isPublic: false,
            status: 'active',
            tags: [],
            isFavorite: false,
            messageCount: 3,
            lastActivityAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      // Mock count query
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });

      // Mock data query
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(mockResults),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await service.findAll(mockUserId, mockCompanyId, {
        page: 1,
        limit: 25,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta.total).toBe(5);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(25);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when conversation not found', async () => {
      mockSelectResult.mockResolvedValueOnce([]);

      await expect(
        service.findOne(mockConversationId, mockUserId, mockCompanyId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return conversation with messages', async () => {
      const mockResult = {
        conversation: {
          id: mockConversationId,
          title: 'Test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        meta: {
          id: '123',
          conversationId: mockConversationId,
          companyId: mockCompanyId,
          userId: mockUserId,
          isPublic: false,
          status: 'active',
          tags: [],
          isFavorite: false,
          messageCount: 2,
          lastActivityAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const mockMessages = [
        {
          id: '1',
          conversationId: mockConversationId,
          role: 'assistant',
          content: 'Hello',
          metadata: {},
          createdAt: new Date(),
        },
        {
          id: '2',
          conversationId: mockConversationId,
          role: 'user',
          content: 'Hi',
          metadata: {},
          createdAt: new Date(),
        },
      ];

      // Mock conversation query with join
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockResult]),
            }),
          }),
        }),
      });

      // Mock messages query
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockMessages),
          }),
        }),
      });

      const result = await service.findOne(
        mockConversationId,
        mockUserId,
        mockCompanyId,
      );

      expect(result).toHaveProperty('id', mockConversationId);
      expect(result).toHaveProperty('messages');
      expect(result.messages).toHaveLength(2);
    });
  });

  describe('sendMessage', () => {
    it('should create a message and update meta', async () => {
      const mockConversation = {
        id: mockConversationId,
        title: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMeta = {
        id: '123',
        conversationId: mockConversationId,
        companyId: mockCompanyId,
        userId: mockUserId,
        isPublic: false,
        status: 'active',
        tags: [],
        isFavorite: false,
        messageCount: 1,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMessage = {
        id: 'msg-123',
        conversationId: mockConversationId,
        role: 'user',
        content: 'Test message',
        metadata: {},
        createdAt: new Date(),
      };

      // Mock findOne (conversation query)
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ conversation: mockConversation, meta: mockMeta }]),
            }),
          }),
        }),
      });

      // Mock findOne (messages query)
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Mock message insert
      mockInsertResult.mockResolvedValueOnce([mockMessage]);

      // Mock meta update
      mockUpdateResult.mockResolvedValueOnce(undefined);

      const result = await service.sendMessage(
        mockConversationId,
        mockUserId,
        mockCompanyId,
        { content: 'Test message' },
      );

      expect(result).toHaveProperty('id', 'msg-123');
      expect(result.role).toBe('user');
      expect(result.content).toBe('Test message');
    });
  });

  describe('remove', () => {
    it('should soft delete by updating status to deleted', async () => {
      const mockConversation = {
        id: mockConversationId,
        title: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMeta = {
        id: '123',
        conversationId: mockConversationId,
        companyId: mockCompanyId,
        userId: mockUserId,
        isPublic: false,
        status: 'active',
        tags: [],
        isFavorite: false,
        messageCount: 1,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock findOne (conversation query)
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ conversation: mockConversation, meta: mockMeta }]),
            }),
          }),
        }),
      });

      // Mock findOne (messages query)
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Mock update
      mockUpdateResult.mockResolvedValueOnce(undefined);

      await service.remove(mockConversationId, mockUserId, mockCompanyId);

      expect(mockDb.update).toHaveBeenCalled();
    });
  });
});
