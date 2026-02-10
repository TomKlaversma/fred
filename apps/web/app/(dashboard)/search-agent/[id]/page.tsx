'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ChatLayout } from '@/components/search-agent/chat-layout';
import { ChatHeader } from '@/components/search-agent/chat-header';
import { ChatWindow } from '@/components/search-agent/chat-window';
import { ChatInput } from '@/components/search-agent/chat-input';
import { ChatWelcomeMessage } from '@/components/search-agent/chat-welcome-message';
import { mockConversations, mockMessages, MockMessage } from '@/lib/mock-chat-data';

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id as string;

  // Find the conversation
  const conversation = mockConversations.find((c) => c.id === conversationId);

  // Get messages for this conversation, or use welcome message for new chats
  const initialMessages = mockMessages[conversationId] || [];
  const [messages, setMessages] = useState<MockMessage[]>(initialMessages);

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: MockMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate assistant response after a delay
    setTimeout(() => {
      const assistantMessage: MockMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: `I understand you're looking for information about "${content}". Let me help you with that.

### Here's what I can do:
- Search our database for matching leads
- Refine criteria based on your needs
- Export results to your CRM

Would you like me to proceed with the search?`,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  // If conversation not found and no messages, show welcome
  const isNewChat = !conversation && messages.length === 0;
  const displayTitle = conversation?.title || 'New Conversation';
  const messageCount = messages.length;

  return (
    <ChatLayout
      conversations={mockConversations}
      activeConversationId={conversationId}
    >
      <ChatHeader
        title={displayTitle}
        messageCount={messageCount}
        isPublic={conversation?.isPublic}
        onEdit={() => console.log('Edit')}
        onRegenerate={() => console.log('Regenerate')}
        onArchive={() => console.log('Archive')}
        onDelete={() => console.log('Delete')}
      />

      {isNewChat ? (
        <div className="flex-1 overflow-y-auto">
          <ChatWelcomeMessage />
        </div>
      ) : (
        <ChatWindow messages={messages} />
      )}

      <ChatInput
        onSend={handleSendMessage}
        placeholder="Type your message..."
      />
    </ChatLayout>
  );
}
