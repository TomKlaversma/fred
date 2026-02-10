import { NewChatButton } from './new-chat-button';
import { ConversationList } from './conversation-list';
import { Separator } from '@/components/ui/separator';
import { MockConversation } from '@/lib/mock-chat-data';

interface ChatSidebarProps {
  conversations: MockConversation[];
  activeConversationId?: string;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
}: ChatSidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 overflow-hidden">
      <div className="p-4">
        <NewChatButton />
      </div>

      <Separator className="bg-slate-800" />

      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          History
        </h2>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
        />
      </div>
    </aside>
  );
}
