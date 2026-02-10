import { jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { agentConversations } from "./agent-conversations";

export const agentConversationMessages = pgTable("agent_conversation_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => agentConversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // 'user' | 'assistant' | 'system'
  content: text("content").notNull(),
  metadata: jsonb("metadata")
    .$type<{
      tokens?: number;
      model?: string;
      searchParams?: Record<string, any>;
      leadPreviewIds?: string[];
    }>()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AgentConversationMessage = typeof agentConversationMessages.$inferSelect;
export type NewAgentConversationMessage = typeof agentConversationMessages.$inferInsert;
