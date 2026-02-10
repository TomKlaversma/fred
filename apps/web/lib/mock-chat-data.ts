export interface MockConversation {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  lastActivityAt: Date;
  isPublic: boolean;
  status: 'active' | 'archived';
  tags: string[];
  isFavorite: boolean;
}

export interface MockMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export const mockConversations: MockConversation[] = [
  {
    id: 'conv-1',
    title: 'Marketing Directors Search',
    preview: 'Looking for marketing directors in...',
    messageCount: 12,
    lastActivityAt: new Date('2026-02-10T10:30:00Z'),
    isPublic: false,
    status: 'active',
    tags: ['marketing'],
    isFavorite: true,
  },
  {
    id: 'conv-2',
    title: 'Logistics HR Params',
    preview: 'Define criteria for logistics compa...',
    messageCount: 8,
    lastActivityAt: new Date('2026-02-08T16:45:00Z'),
    isPublic: true,
    status: 'active',
    tags: ['logistics', 'hr'],
    isFavorite: false,
  },
  {
    id: 'conv-3',
    title: 'Tech Startup CTOs',
    preview: 'Find CTOs at Series A tech startups...',
    messageCount: 15,
    lastActivityAt: new Date('2026-02-07T09:20:00Z'),
    isPublic: false,
    status: 'active',
    tags: ['tech', 'cto'],
    isFavorite: false,
  },
  {
    id: 'conv-4',
    title: 'Healthcare Decision Makers',
    preview: 'Hospital administrators and VP of...',
    messageCount: 6,
    lastActivityAt: new Date('2026-02-06T14:10:00Z'),
    isPublic: true,
    status: 'active',
    tags: ['healthcare'],
    isFavorite: true,
  },
];

export const mockMessages: Record<string, MockMessage[]> = {
  'conv-1': [
    {
      id: 'msg-1',
      role: 'assistant',
      content: `Hello! I am your AI Lead Generation Assistant. I can help you:

- **Find leads** matching your ideal customer profile
- **Refine search criteria** with natural language
- **Preview results** before committing to a campaign
- **Export leads** directly to your CRM

What kind of leads are you looking for today?`,
      createdAt: new Date('2026-02-10T10:00:00Z'),
    },
    {
      id: 'msg-2',
      role: 'user',
      content: 'I need marketing directors at SaaS companies with 50-200 employees',
      createdAt: new Date('2026-02-10T10:01:00Z'),
    },
    {
      id: 'msg-3',
      role: 'assistant',
      content: `Great! I'll search for marketing directors at SaaS companies with 50-200 employees.

### Search Criteria
- **Job Title**: Marketing Director
- **Industry**: SaaS
- **Company Size**: 50-200 employees
- **Location**: Any (would you like to specify?)

Here's a preview of 5 matching leads:

| Name | Company | Title | Location |
|------|---------|-------|----------|
| Sarah Chen | CloudSync | VP Marketing | San Francisco, CA |
| Marcus Williams | DataFlow | Marketing Director | Austin, TX |
| Elena Rodriguez | MetricHQ | Chief Marketing Officer | Remote |
| James Park | SyncWave | Director of Marketing | Seattle, WA |
| Lisa Anderson | CloudBase | Marketing Lead | Boston, MA |

Found **87 total matches**. Would you like to:
1. Refine the criteria
2. See more results
3. Export these leads`,
      createdAt: new Date('2026-02-10T10:02:30Z'),
    },
    {
      id: 'msg-4',
      role: 'user',
      content: 'Can you filter to only West Coast companies?',
      createdAt: new Date('2026-02-10T10:05:00Z'),
    },
  ],
  'conv-2': [
    {
      id: 'msg-5',
      role: 'assistant',
      content: 'Hello! What kind of leads are you looking for today?',
      createdAt: new Date('2026-02-08T16:40:00Z'),
    },
    {
      id: 'msg-6',
      role: 'user',
      content: 'HR managers at logistics companies',
      createdAt: new Date('2026-02-08T16:41:00Z'),
    },
  ],
  'conv-3': [
    {
      id: 'msg-7',
      role: 'assistant',
      content: 'Hello! What kind of leads are you looking for today?',
      createdAt: new Date('2026-02-07T09:15:00Z'),
    },
  ],
  'conv-4': [
    {
      id: 'msg-8',
      role: 'assistant',
      content: 'Hello! What kind of leads are you looking for today?',
      createdAt: new Date('2026-02-06T14:00:00Z'),
    },
  ],
};
