import { Bot, Search, Filter, Download } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function ChatWelcomeMessage() {
  return (
    <div className="flex gap-3 p-6">
      <Avatar className="h-8 w-8 mt-1">
        <AvatarFallback className="bg-blue-600 text-white">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="max-w-[80%] rounded-lg px-4 py-3 bg-slate-100 dark:bg-slate-800">
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          Hello! I am your AI Lead Generation Assistant.
        </h3>
        <p className="mb-4 text-foreground">I can help you:</p>

        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <Search className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-foreground">Find leads</strong>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                matching your ideal customer profile
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <Filter className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-foreground">Refine search criteria</strong>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                with natural language
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <Download className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-foreground">Export leads</strong>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                directly to your CRM
              </p>
            </div>
          </li>
        </ul>

        <p className="mt-4 text-foreground">
          What kind of leads are you looking for today?
        </p>
      </div>
    </div>
  );
}
