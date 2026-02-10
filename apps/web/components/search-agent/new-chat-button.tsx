'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function NewChatButton() {
  const router = useRouter();

  const handleNewChat = () => {
    // In a real app, this would create a new conversation via API
    // For now, navigate to a mock new chat
    const newId = `conv-${Date.now()}`;
    router.push(`/search-agent/${newId}`);
  };

  return (
    <Button
      onClick={handleNewChat}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
    >
      <Plus className="mr-2 h-4 w-4" />
      New Chat
    </Button>
  );
}
