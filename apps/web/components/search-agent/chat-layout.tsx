'use client';

import { ChatSidebar } from './chat-sidebar';
import { MockConversation } from '@/lib/mock-chat-data';

interface ChatLayoutProps {
  conversations: MockConversation[];
  activeConversationId?: string;
  children: React.ReactNode;
}

export function ChatLayout({
  conversations,
  activeConversationId,
  children,
}: ChatLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
      />
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
}
