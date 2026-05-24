/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum EmotionClass {
  JOY = "Joy/Positive",
  SADNESS = "Sadness/Melancholic",
  ANGER = "Anger/Hostile",
  FEAR = "Fear/Anxious",
  LOVE = "Love/Affectionate",
  SURPRISE = "Surprise/Astonished"
}

export interface TokenAttention {
  token: string;
  weight: number; // float 0.0 - 1.0 indicating model focus
}

export interface PredictionResult {
  className: EmotionClass;
  confidence: number; // 0.0 - 1.0
  probabilities: { [key in EmotionClass]: number };
  attention: TokenAttention[];
  explanation: string;
  latencyMs: number;
}

export interface BaselinePrediction {
  className: EmotionClass;
  confidence: number;
  latencyMs: number;
}

export interface SentimentAnalysisResponse {
  text: string;
  bert: PredictionResult;
  baseline: BaselinePrediction;
}

export interface StreamItem {
  id: string;
  text: string;
  source: "social" | "app_store" | "support_ticket";
  timestamp: string;
  isAnalyzed: boolean;
  bert?: {
    className: EmotionClass;
    confidence: number;
    latencyMs: number;
  };
  baseline?: {
    className: EmotionClass;
    confidence: number;
    latencyMs: number;
  };
}

export interface HistoryAnalytics {
  totalAnalyzed: number;
  avgLatencyBert: number;
  avgLatencyBaseline: number;
  bertAccuracyRoll: number;
  baselineAccuracyRoll: number;
  distribution: { [key in EmotionClass]: number };
}
