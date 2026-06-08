export interface ChatSession {
  _id: string;
  title: string;
  updatedAt: string;
}

export interface AgentAction {
  tool: string;
  invoiceIds: string[];
}

export interface ChatMessage {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  actions?: AgentAction[];
  // FE-only: a synthetic message shown when a send fails (never comes from the API).
  error?: boolean;
}

export interface SendResponse {
  message: ChatMessage;
  actions: AgentAction[];
}
