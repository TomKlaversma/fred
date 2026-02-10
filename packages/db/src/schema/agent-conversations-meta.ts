import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { agentConversations } from "./agent-conversations";
import { companies } from "./companies";
import { users } from "./users";

export const agentConversationsMeta = pgTable(
  "agent_conversations_meta",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => agentConversations.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Sharing & Status
    isPublic: boolean("is_public").default(false),
    status: varchar("status", { length: 50 }).default("active").notNull(), // active, archived, deleted

    // Organization
    tags: text("tags").array().default([]),
    isFavorite: boolean("is_favorite").default(false),

    // Cached stats
    messageCount: integer("message_count").default(0),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).defaultNow(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("idx_conversation_meta_unique").on(table.conversationId),
    index("idx_conversation_meta_user").on(table.userId, table.lastActivityAt),
    index("idx_conversation_meta_company_public").on(
      table.companyId,
      table.isPublic,
      table.status,
    ),
  ],
);

export type AgentConversationMeta = typeof agentConversationsMeta.$inferSelect;
export type NewAgentConversationMeta = typeof agentConversationsMeta.$inferInsert;
