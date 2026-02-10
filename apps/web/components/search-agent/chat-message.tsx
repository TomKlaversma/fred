import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isAssistant = role === 'assistant';

  return (
    <div className={cn('flex gap-3', isAssistant ? 'justify-start' : 'justify-end')}>
      {isAssistant && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback className="bg-blue-600 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3',
          isAssistant
            ? 'bg-slate-100 dark:bg-slate-800 text-foreground'
            : 'bg-blue-100 dark:bg-blue-900 text-foreground'
        )}
      >
        {isAssistant ? (
          <MarkdownRenderer content={content} />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        )}

        {timestamp && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {timestamp.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>

      {!isAssistant && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback className="bg-slate-600 text-white">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
