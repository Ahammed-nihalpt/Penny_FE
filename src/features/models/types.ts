export interface ModelStatus {
  id: string;
  label: string;
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  rateLimited: boolean;
}

export interface ModelsResponse {
  models: ModelStatus[];
  current: string;
}
