'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from './chat-message';
import { MockMessage } from '@/lib/mock-chat-data';

interface ChatWindowProps {
  messages: MockMessage[];
}

export function ChatWindow({ messages }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          role={message.role}
          content={message.content}
          timestamp={message.createdAt}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
