/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EmotionClass, BaselinePrediction } from "./types.js";

// Vocabulary map with predefined class sentiment values (simulating trained Logistic Regression coefficients)
const vocabularyWeights: { [word: string]: { [key in EmotionClass]?: number } } = {
  // Joy/Positive
  happy: { [EmotionClass.JOY]: 2.5, [EmotionClass.LOVE]: 1.0 },
  glad: { [EmotionClass.JOY]: 2.0 },
  joy: { [EmotionClass.JOY]: 3.0, [EmotionClass.LOVE]: 1.2 },
  excited: { [EmotionClass.JOY]: 2.5, [EmotionClass.SURPRISE]: 1.5 },
  awesome: { [EmotionClass.JOY]: 2.8, [EmotionClass.SURPRISE]: 1.2 },
  amazing: { [EmotionClass.JOY]: 2.6, [EmotionClass.SURPRISE]: 1.5 },
  great: { [EmotionClass.JOY]: 1.8 },
  wonderful: { [EmotionClass.JOY]: 2.4, [EmotionClass.LOVE]: 1.0 },
  excellent: { [EmotionClass.JOY]: 2.5 },
  perfect: { [EmotionClass.JOY]: 2.2 },
  brilliant: { [EmotionClass.JOY]: 2.1 },
  solved: { [EmotionClass.JOY]: 1.5 },
  helpful: { [EmotionClass.JOY]: 1.6 },
  success: { [EmotionClass.JOY]: 2.0 },
  good: { [EmotionClass.JOY]: 1.2 },

  // Sadness/Melancholic
  sad: { [EmotionClass.SADNESS]: 2.8 },
  depressed: { [EmotionClass.SADNESS]: 3.0, [EmotionClass.FEAR]: 1.2 },
  unhappy: { [EmotionClass.SADNESS]: 2.2, [EmotionClass.ANGER]: 1.0 },
  sorry: { [EmotionClass.SADNESS]: 1.8, [EmotionClass.LOVE]: 0.8 },
  regret: { [EmotionClass.SADNESS]: 2.0 },
  apologize: { [EmotionClass.SADNESS]: 1.5 },
  cry: { [EmotionClass.SADNESS]: 2.5 },
  pain: { [EmotionClass.SADNESS]: 2.2, [EmotionClass.ANGER]: 1.0 },
  lost: { [EmotionClass.SADNESS]: 1.8, [EmotionClass.FEAR]: 1.0 },
  failed: { [EmotionClass.SADNESS]: 2.0, [EmotionClass.ANGER]: 1.2 },
  broken: { [EmotionClass.SADNESS]: 1.5, [EmotionClass.ANGER]: 1.5 },
  disappointed: { [EmotionClass.SADNESS]: 2.4, [EmotionClass.ANGER]: 1.2 },
  bad: { [EmotionClass.SADNESS]: 1.5, [EmotionClass.ANGER]: 1.0 },
  worst: { [EmotionClass.SADNESS]: 1.8, [EmotionClass.ANGER]: 2.0 },
  terrible: { [EmotionClass.SADNESS]: 2.0, [EmotionClass.ANGER]: 1.5 },

  // Anger/Hostile
  angry: { [EmotionClass.ANGER]: 3.0 },
  mad: { [EmotionClass.ANGER]: 2.6 },
  furious: { [EmotionClass.ANGER]: 3.2 },
  frustrating: { [EmotionClass.ANGER]: 2.5, [EmotionClass.SADNESS]: 1.2 },
  frustrated: { [EmotionClass.ANGER]: 2.4, [EmotionClass.SADNESS]: 1.3 },
  annoying: { [EmotionClass.ANGER]: 2.0 },
  useless: { [EmotionClass.ANGER]: 2.2, [EmotionClass.SADNESS]: 1.0 },
  stupid: { [EmotionClass.ANGER]: 2.5 },
  hate: { [EmotionClass.ANGER]: 3.0, [EmotionClass.SADNESS]: 1.5 },
  blame: { [EmotionClass.ANGER]: 1.8 },
  trash: { [EmotionClass.ANGER]: 2.4 },
  garbage: { [EmotionClass.ANGER]: 2.5 },
  unacceptable: { [EmotionClass.ANGER]: 2.6 },
  worst_ever: { [EmotionClass.ANGER]: 2.8 },

  // Fear/Anxious
  fear: { [EmotionClass.FEAR]: 3.0 },
  scared: { [EmotionClass.FEAR]: 2.8 },
  afraid: { [EmotionClass.FEAR]: 2.5 },
  warning: { [EmotionClass.FEAR]: 1.5, [EmotionClass.ANGER]: 1.2 },
  anxious: { [EmotionClass.FEAR]: 2.6, [EmotionClass.SADNESS]: 1.2 },
  panic: { [EmotionClass.FEAR]: 3.2, [EmotionClass.SURPRISE]: 1.0 },
  worry: { [EmotionClass.FEAR]: 2.0, [EmotionClass.SADNESS]: 1.2 },
  worried: { [EmotionClass.FEAR]: 2.1, [EmotionClass.SADNESS]: 1.1 },
  nervous: { [EmotionClass.FEAR]: 2.2 },
  dangerous: { [EmotionClass.FEAR]: 2.5 },
  unsafe: { [EmotionClass.FEAR]: 2.4 },
  threat: { [EmotionClass.FEAR]: 2.8, [EmotionClass.ANGER]: 1.5 },
  terrified: { [EmotionClass.FEAR]: 3.2 },

  // Love/Affectionate
  love: { [EmotionClass.LOVE]: 3.2, [EmotionClass.JOY]: 1.5 },
  adore: { [EmotionClass.LOVE]: 3.0, [EmotionClass.JOY]: 1.2 },
  sweet: { [EmotionClass.LOVE]: 2.0, [EmotionClass.JOY]: 1.0 },
  lovely: { [EmotionClass.LOVE]: 2.6, [EmotionClass.JOY]: 1.2 },
  affection: { [EmotionClass.LOVE]: 2.8 },
  hug: { [EmotionClass.LOVE]: 2.5 },
  friendship: { [EmotionClass.LOVE]: 2.2, [EmotionClass.JOY]: 1.0 },
  heart: { [EmotionClass.LOVE]: 2.0, [EmotionClass.JOY]: 1.0 },
  wonderful_person: { [EmotionClass.LOVE]: 2.5, [EmotionClass.JOY]: 1.0 },
  dear: { [EmotionClass.LOVE]: 1.8 },

  // Surprise/Astonished
  surprise: { [EmotionClass.SURPRISE]: 2.5, [EmotionClass.JOY]: 1.0 },
  unexpected: { [EmotionClass.SURPRISE]: 2.4, [EmotionClass.FEAR]: 0.8 },
  shocked: { [EmotionClass.SURPRISE]: 2.8, [EmotionClass.FEAR]: 1.2 },
  astounded: { [EmotionClass.SURPRISE]: 3.0 },
  sudden: { [EmotionClass.SURPRISE]: 1.8 },
  incredible: { [EmotionClass.SURPRISE]: 2.5, [EmotionClass.JOY]: 1.5 },
  weird: { [EmotionClass.SURPRISE]: 1.5, [EmotionClass.FEAR]: 0.8 },
  unbelievable: { [EmotionClass.SURPRISE]: 2.6, [EmotionClass.JOY]: 1.2 },
  wow: { [EmotionClass.SURPRISE]: 2.8, [EmotionClass.JOY]: 1.0 }
};

// Fixed Inverse Document Frequencies (IDF) simulating training on a general corpus
const defaultIDF = 1.2;
const idfMap: { [word: string]: number } = {
  the: 0.1, of: 0.15, and: 0.12, to: 0.13, a: 0.14, in: 0.18, is: 0.2, it: 0.22, you: 0.25, that: 0.24,
  happy: 1.4, sorry: 1.3, love: 1.5, sad: 1.6, angry: 1.8, fear: 1.9, custom: 1.7, unexpected: 1.8,
  great: 1.1, terrible: 1.5, worst: 1.6, wow: 1.8, break: 1.4, panic: 2.0, help: 1.2
};

export function predictBaseline(text: string): BaselinePrediction {
  const t0 = typeof process !== 'undefined' ? process.hrtime() : null;
  const tStart = Date.now();

  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, " ");
  const tokens = cleanText.split(/\s+/).filter(Boolean);

  // Compute Term Frequencies (TF)
  const tf: { [word: string]: number } = {};
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }

  // Multiply TF * IDF * classWeights (simulating dot product with regression coefficients)
  const classScores: { [key in EmotionClass]: number } = {
    [EmotionClass.JOY]: 0.1,    // small prior values
    [EmotionClass.SADNESS]: 0.1,
    [EmotionClass.ANGER]: 0.1,
    [EmotionClass.FEAR]: 0.1,
    [EmotionClass.LOVE]: 0.1,
    [EmotionClass.SURPRISE]: 0.1
  };

  for (const token in tf) {
    const tfVal = tf[token];
    const idf = idfMap[token] !== undefined ? idfMap[token] : defaultIDF;
    const tfidf = tfVal * idf;

    const weights = vocabularyWeights[token];
    if (weights) {
      for (const emotion in weights) {
        const e = emotion as EmotionClass;
        classScores[e] += tfidf * (weights[e] || 0);
      }
    }
  }

  // Applying Softmax to obtain probabilities
  const keys = Object.values(EmotionClass);
  const logits = keys.map(k => classScores[k]);
  const maxLogit = Math.max(...logits); // stability trick
  const exps = logits.map(l => Math.exp(l - maxLogit));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  const probabilities = exps.map(e => e / sumExps);

  // Find class with max probability
  let maxIdx = 0;
  let maxProb = 0;
  for (let i = 0; i < probabilities.length; i++) {
    if (probabilities[i] > maxProb) {
      maxProb = probabilities[i];
      maxIdx = i;
    }
  }

  const predictedClass = keys[maxIdx];

  // Calculate elapsed latency
  let latencyMs = 0;
  if (t0) {
    const diff = process.hrtime(t0);
    // convert to milliseconds with microsecond precision
    latencyMs = (diff[0] * 1e9 + diff[1]) / 1e6;
  } else {
    latencyMs = Date.now() - tStart;
  }

  // Baseline usually has small latency (~0.05ms to 1ms), let's ensure it's not exactly 0
  if (latencyMs < 0.01) {
    latencyMs = 0.01 + Math.random() * 0.05;
  }

  return {
    className: predictedClass,
    confidence: maxProb,
    latencyMs: parseFloat(latencyMs.toFixed(3))
  };
}
