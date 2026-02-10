import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MockConversation } from '@/lib/mock-chat-data';

interface ConversationListItemProps {
  conversation: MockConversation;
  isActive?: boolean;
}

export function ConversationListItem({
  conversation,
  isActive = false,
}: ConversationListItemProps) {
  return (
    <Link
      href={`/search-agent/${conversation.id}`}
      className={cn(
        'block px-3 py-2.5 rounded-md transition-colors hover:bg-slate-800',
        isActive && 'bg-blue-600 hover:bg-blue-600'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'font-semibold text-sm truncate',
              isActive ? 'text-white' : 'text-white'
            )}
          >
            {conversation.title}
          </h3>
          <p
            className={cn(
              'text-xs truncate mt-0.5',
              isActive ? 'text-blue-100' : 'text-slate-400'
            )}
          >
            {conversation.preview}
          </p>
        </div>
        {conversation.isFavorite && (
          <Star className={cn('h-3 w-3 flex-shrink-0 mt-1', isActive ? 'text-yellow-300' : 'text-yellow-500')} fill="currentColor" />
        )}
      </div>
      <p
        className={cn(
          'text-xs mt-1.5',
          isActive ? 'text-blue-200' : 'text-slate-500'
        )}
      >
        {formatDistanceToNow(conversation.lastActivityAt, { addSuffix: true })}
      </p>
    </Link>
  );
}
