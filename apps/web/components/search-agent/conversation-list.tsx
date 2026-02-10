import { ConversationListItem } from './conversation-list-item';
import { MockConversation } from '@/lib/mock-chat-data';

interface ConversationListProps {
  conversations: MockConversation[];
  activeConversationId?: string;
}

export function ConversationList({
  conversations,
  activeConversationId,
}: ConversationListProps) {
  return (
    <div className="space-y-1">
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          isActive={conversation.id === activeConversationId}
        />
      ))}
    </div>
  );
}
