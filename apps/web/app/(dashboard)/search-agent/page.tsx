import { ChatLayout } from '@/components/search-agent/chat-layout';
import { EmptyState } from '@/components/search-agent/empty-state';
import { mockConversations } from '@/lib/mock-chat-data';

export default function SearchAgentPage() {
  return (
    <ChatLayout conversations={mockConversations}>
      <EmptyState />
    </ChatLayout>
  );
}
