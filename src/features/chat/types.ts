export interface ChatSession {
  _id: string;
  title: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AgentAction {
  tool: string;
  invoiceIds: string[];
}

export interface SendResponse {
  message: ChatMessage;
  actions: AgentAction[];
}
