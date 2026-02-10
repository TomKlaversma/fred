import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and, sql, desc, ne } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { DrizzleDB } from '../../database/database.provider';
import {
  agentConversations,
  agentConversationMessages,
  agentConversationsMeta,
} from '@app/db';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

type Conversation = typeof agentConversations.$inferSelect;
type ConversationMeta = typeof agentConversationsMeta.$inferSelect;
type Message = typeof agentConversationMessages.$inferSelect;

interface FindAllOptions {
  page?: number;
  limit?: number;
  status?: string;
  isPublic?: boolean;
}

@Injectable()
export class AgentConversationsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * Find all conversations for a user with pagination
   */
  async findAll(
    userId: string,
    companyId: string,
    options: FindAllOptions = {},
  ) {
    const { page = 1, limit = 25, status = 'active', isPublic } = options;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [
      eq(agentConversationsMeta.userId, userId),
      eq(agentConversationsMeta.companyId, companyId),
    ];

    if (status) {
      conditions.push(eq(agentConversationsMeta.status, status));
    }

    if (isPublic !== undefined) {
      conditions.push(eq(agentConversationsMeta.isPublic, isPublic));
    }

    const whereClause = and(...conditions);

    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(agentConversationsMeta)
      .where(whereClause);
    const count = countResult[0]?.count ?? 0;

    // Get paginated results with conversation details
    const results = await this.db
      .select({
        conversation: agentConversations,
        meta: agentConversationsMeta,
      })
      .from(agentConversationsMeta)
      .innerJoin(
        agentConversations,
        eq(agentConversationsMeta.conversationId, agentConversations.id),
      )
      .where(whereClause)
      .orderBy(desc(agentConversationsMeta.lastActivityAt))
      .limit(limit)
      .offset(offset);

    const data = results.map((row) => ({
      ...row.conversation,
      meta: row.meta,
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Create a new conversation with initial welcome message
   */
  async create(userId: string, companyId: string, dto: CreateConversationDto) {
    const title = dto.title || 'New Conversation';
    const isPublic = dto.isPublic ?? false;

    // Create conversation
    const [conversation] = await this.db
      .insert(agentConversations)
      .values({
        title,
      })
      .returning();

    // Create meta record
    const [meta] = await this.db
      .insert(agentConversationsMeta)
      .values({
        conversationId: conversation.id,
        companyId,
        userId,
        isPublic,
        status: 'active',
        messageCount: 1, // Initial welcome message
        lastActivityAt: new Date(),
      })
      .returning();

    // Create initial welcome message
    const welcomeMessage = `Hello! I am your AI Lead Generation Assistant. Describe your ideal customer profile (ICP), and I will help you build a targeted search query.

**To get started, please tell me:**

1. What **job titles** or **roles** are you targeting?
   *e.g., Marketing Director, CTO, HR Manager*

2. Which **industries** or **company types** interest you?
   *e.g., SaaS, E-commerce, Healthcare*

3. Any **specific companies** you'd like to target?

4. What **company size** are you focusing on?
   *e.g., 50-200 employees, 500+*

5. Any **location** preferences?
   *e.g., United States, Europe, Remote*

Feel free to answer just a few questions to start! 🚀`;

    const [message] = await this.db
      .insert(agentConversationMessages)
      .values({
        conversationId: conversation.id,
        role: 'assistant',
        content: welcomeMessage,
        metadata: {},
      })
      .returning();

    return {
      ...conversation,
      meta,
      messages: [message],
    };
  }

  /**
   * Get a single conversation with all messages
   */
  async findOne(id: string, userId: string, companyId: string) {
    // Get conversation with meta
    const [result] = await this.db
      .select({
        conversation: agentConversations,
        meta: agentConversationsMeta,
      })
      .from(agentConversationsMeta)
      .innerJoin(
        agentConversations,
        eq(agentConversationsMeta.conversationId, agentConversations.id),
      )
      .where(
        and(
          eq(agentConversations.id, id),
          eq(agentConversationsMeta.userId, userId),
          eq(agentConversationsMeta.companyId, companyId),
        ),
      )
      .limit(1);

    if (!result) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // Get all messages
    const messages = await this.db
      .select()
      .from(agentConversationMessages)
      .where(eq(agentConversationMessages.conversationId, id))
      .orderBy(agentConversationMessages.createdAt);

    return {
      ...result.conversation,
      meta: result.meta,
      messages,
    };
  }

  /**
   * Update conversation or meta properties
   */
  async update(
    id: string,
    userId: string,
    companyId: string,
    dto: UpdateConversationDto,
  ) {
    // Verify ownership (throws if not found)
    await this.findOne(id, userId, companyId);

    // Update conversation title if provided
    if (dto.title !== undefined) {
      await this.db
        .update(agentConversations)
        .set({ title: dto.title })
        .where(eq(agentConversations.id, id));
    }

    // Update meta fields if provided
    const metaUpdates: Partial<ConversationMeta> = {};
    if (dto.isPublic !== undefined) metaUpdates.isPublic = dto.isPublic;
    if (dto.status !== undefined) metaUpdates.status = dto.status;
    if (dto.isFavorite !== undefined) metaUpdates.isFavorite = dto.isFavorite;
    if (dto.tags !== undefined) metaUpdates.tags = dto.tags;

    if (Object.keys(metaUpdates).length > 0) {
      await this.db
        .update(agentConversationsMeta)
        .set(metaUpdates)
        .where(eq(agentConversationsMeta.conversationId, id));
    }

    // Return updated conversation
    return this.findOne(id, userId, companyId);
  }

  /**
   * Soft delete a conversation (set status to 'deleted')
   */
  async remove(id: string, userId: string, companyId: string): Promise<void> {
    // Verify ownership
    await this.findOne(id, userId, companyId);

    // Soft delete by updating status
    await this.db
      .update(agentConversationsMeta)
      .set({ status: 'deleted' })
      .where(eq(agentConversationsMeta.conversationId, id));
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    companyId: string,
    dto: SendMessageDto,
  ) {
    // Verify ownership
    await this.findOne(conversationId, userId, companyId);

    // Insert user message
    const [message] = await this.db
      .insert(agentConversationMessages)
      .values({
        conversationId,
        role: 'user',
        content: dto.content,
        metadata: dto.metadata || {},
      })
      .returning();

    // Update meta: increment message count and update lastActivityAt
    await this.db
      .update(agentConversationsMeta)
      .set({
        messageCount: sql`${agentConversationsMeta.messageCount} + 1`,
        lastActivityAt: new Date(),
      })
      .where(eq(agentConversationsMeta.conversationId, conversationId));

    // TODO: Trigger N8N webhook for AI response
    // This is a stub - implement webhook call later

    return message;
  }

  /**
   * Regenerate conversation title from messages
   * Stub: Just generates from first messages for now
   */
  async regenerateTitle(conversationId: string, userId: string, companyId: string) {
    // Verify ownership (throws if not found)
    await this.findOne(conversationId, userId, companyId);

    // Get first few user messages
    const messages = await this.db
      .select()
      .from(agentConversationMessages)
      .where(
        and(
          eq(agentConversationMessages.conversationId, conversationId),
          eq(agentConversationMessages.role, 'user'),
        ),
      )
      .orderBy(agentConversationMessages.createdAt)
      .limit(3);

    // Generate simple title from first message
    let newTitle = 'New Conversation';
    if (messages.length > 0 && messages[0]) {
      const firstMessage = messages[0].content;
      // Take first 50 characters
      newTitle = firstMessage.length > 50
        ? firstMessage.substring(0, 50) + '...'
        : firstMessage;
    }

    // Update title
    await this.db
      .update(agentConversations)
      .set({ title: newTitle })
      .where(eq(agentConversations.id, conversationId));

    return { title: newTitle };
  }

  /**
   * Find public conversations from the same company
   */
  async findPublic(companyId: string, userId: string) {
    const results = await this.db
      .select({
        conversation: agentConversations,
        meta: agentConversationsMeta,
      })
      .from(agentConversationsMeta)
      .innerJoin(
        agentConversations,
        eq(agentConversationsMeta.conversationId, agentConversations.id),
      )
      .where(
        and(
          eq(agentConversationsMeta.companyId, companyId),
          eq(agentConversationsMeta.isPublic, true),
          eq(agentConversationsMeta.status, 'active'),
          ne(agentConversationsMeta.userId, userId), // Exclude user's own conversations
        ),
      )
      .orderBy(desc(agentConversationsMeta.lastActivityAt))
      .limit(50);

    return results.map((row) => ({
      ...row.conversation,
      meta: row.meta,
    }));
  }
}
