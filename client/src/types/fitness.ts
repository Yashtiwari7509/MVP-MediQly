export interface FitnessData {
  steps: number;
  calories: number;
  activeMinutes: number;
  activities: Array<{
    type: string;
    startTime: string;
    duration: number;
    calories: number;
  }>;
} 