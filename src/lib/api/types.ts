export interface Author {
  id: string;
  name: string;
  photoUrl?: string;
  handle?: string;
}

export interface Reaction {
  emoji: string;
  count: number;
}

export interface MediaAttachment {
  url: string;
  contentType?: string;
  width?: number;
  height?: number;
}

export interface QuotedMessage {
  id: string;
  body: string;
  author: { name: string };
  attachments?: MediaAttachment[];
}

export interface Message {
  id: string;
  body: string;
  bodyHtml?: string;
  author: Author;
  createdAt: string;
  publicationId: string;
  reactions?: Reaction[];
  parentId?: string;
  isAuthor?: boolean;
  attachments?: MediaAttachment[];
  quotedMessage?: QuotedMessage;
}

export interface SearchableMessage extends Message {
  publicationName: string;
  subdomain: string;
}

export interface Publication {
  id: string;        // numeric publication ID (e.g. "1476543")
  name: string;
  subdomain: string;
  logoUrl?: string;
  unreadCount?: number;
}

export interface Thread {
  post: Message;
  replies: Message[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  hint?: string;
  endpoint?: string;
  triedEndpoints?: string[];
}
