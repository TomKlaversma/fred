'use client';

import { MoreVertical, Edit2, RefreshCw, Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ChatHeaderProps {
  title: string;
  messageCount: number;
  isPublic?: boolean;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export function ChatHeader({
  title,
  messageCount,
  isPublic = false,
  onEdit,
  onRegenerate,
  onArchive,
  onDelete,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <Badge variant="secondary" className="text-xs">
          {messageCount} messages
        </Badge>
        {isPublic && (
          <Badge variant="outline" className="text-xs">
            Public
          </Badge>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRegenerate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate Last
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
