export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface BookContext {
  title: string;
  author: string;
  description?: string;
}

export interface AgentRequest {
  messages: AgentMessage[];
  bookContext?: BookContext;
  sessionContext?: {
    groupName: string;
    sessionDate: string;
  };
}

export type ConversationType = "chat" | "interview" | "summarize" | "topics" | "draft" | "analysis";
