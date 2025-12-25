/**
 * Vision Tab Types
 * 
 * Goal-setting and motivational content system where Neptune helps users
 * define success and provides personalized encouragement.
 */

export interface VisionGoal {
  text: string;
  updatedAt: number;
  clarityScore?: number;
  feedback?: string;
}

export interface MotivationalContent {
  quote: string;
  context: string;
  generatedAt: number;
  category?: 'progress' | 'strategy' | 'resilience' | 'growth';
}

export interface VisionResponse {
  motivation: MotivationalContent;
  goalFeedback?: {
    clarityScore: number;
    strengths: string[];
    suggestions: string[];
  };
}
