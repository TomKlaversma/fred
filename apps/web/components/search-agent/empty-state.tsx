import { MessageSquare } from 'lucide-react';
import { NewChatButton } from './new-chat-button';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-slate-400" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        No conversations yet
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-sm">
        Start a new conversation with the AI assistant to find leads and grow
        your business.
      </p>
      <div className="w-48">
        <NewChatButton />
      </div>
    </div>
  );
}
