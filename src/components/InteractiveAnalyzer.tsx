/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { EmotionClass, SentimentAnalysisResponse } from "../types.js";
import { Sparkles, ArrowRight, Clock, HelpCircle, Activity } from "lucide-react";

const SAMPLE_TEMPLATES = [
  {
    name: "Sarcastic Negation",
    text: "Oh fantastic, yet another broken database migration that wasted 4 hours of my life. Wonderful job guys.",
    desc: "Test sarcastic negation"
  },
  {
    name: "Anxious / Panic Log",
    text: "URGENT WARNING: We have a critical threat of memory leaks on worker node-4. Worried our server will crash, terrified!",
    desc: "Anxiety & warning"
  },
  {
    name: "Enthusiastic Celebration",
    text: "Wow! Absolutely loving the incredible latency speedup on our fine-tuned model pipeline! Shocked and excited!",
    desc: "Enthusiastic feedback"
  },
  {
    name: "Regret & Soft Apology",
    text: "I am deeply sorry. I regret that our support line was delayed, we adore your business and care about helping you.",
    desc: "Apology & love"
  }
];

export default function InteractiveAnalyzer({ onAnalyzeSuccess }: { onAnalyzeSuccess?: (data: SentimentAnalysisResponse) => void }) {
  const [inputText, setInputText] = useState(
    "Amazing performance! Though we were nervous that the attention matrix would bottleneck our FastAPI workers, F1-scores reached a wonderful 0.91 and astounded our NLP team!"
  );
  const [result, setResult] = useState<SentimentAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredToken, setHoveredToken] = useState<{ token: string; weight: number } | null>(null);

  const handleAnalyze = async (textToAnalyze = inputText) => {
    if (!textToAnalyze.trim()) return;
    setIsLoading(true);
    try {
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToAnalyze })
      });
      if (!resp.ok) {
        throw new Error("Analysis failed");
      }
      const data: SentimentAnalysisResponse = await resp.json();
      setResult(data);
      if (onAnalyzeSuccess) {
        onAnalyzeSuccess(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getEmotionColor = (emotion: EmotionClass) => {
    switch (emotion) {
      case EmotionClass.JOY:
        return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "shadow-emerald-500/10" };
      case EmotionClass.SADNESS:
        return { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", glow: "shadow-sky-500/10" };
      case EmotionClass.ANGER:
        return { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", glow: "shadow-rose-500/10" };
      case EmotionClass.FEAR:
        return { text: "text-amber-500", bg: "bg-amber-550/10", border: "border-amber-500/20", glow: "shadow-amber-500/10" };
      case EmotionClass.LOVE:
        return { text: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", glow: "shadow-pink-500/10" };
      case EmotionClass.SURPRISE:
        return { text: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20", glow: "shadow-fuchsia-500/10" };
      default:
        return { text: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", glow: "shadow-slate-500/10" };
    }
  };

  return (
    <div id="interactive-analyzer-root" className="bg-white border border-slate-205 border-slate-200/80 rounded-xl p-6 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-display font-semibold text-slate-800">Interactive Sentiment Arena</h2>
        </div>
        <span className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded">
          inference_node_v1.0
        </span>
      </div>

      <p className="text-sm text-slate-500 mb-5 leading-relaxed">
        Key in any review, support log, or text block. Test how the fine-tuned <strong className="text-slate-805 text-slate-800 font-bold">BERT transformer model (FastAPI)</strong> tracks complex grammar, negations, and multiple classes compared to a classical <strong className="text-slate-700 font-semibold">TF-IDF + Logistic Regression</strong> baseline.
      </p>

      {/* Shortcuts */}
      <div className="mb-4">
        <span className="text-xs font-mono font-medium text-slate-400 block mb-2">QUICK TEST CLASSIFIER PROMPTS:</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SAMPLE_TEMPLATES.map((tmpl) => (
            <button
              id={`shortcut-${tmpl.name.replace(/\s+/g, '-').toLowerCase()}`}
              key={tmpl.name}
              onClick={() => {
                setInputText(tmpl.text);
                handleAnalyze(tmpl.text);
              }}
              type="button"
              className="text-left text-xs bg-slate-50 border border-slate-205 border-slate-200 hover:border-blue-300 hover:bg-white p-2.5 rounded-lg text-slate-600 transition-all duration-200 flex flex-col justify-between shadow-xs"
            >
              <span className="font-semibold text-slate-705 text-slate-700 block mb-1 truncate">{tmpl.name}</span>
              <span className="text-[10px] text-slate-400 truncate">{tmpl.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Text Area Input */}
      <div className="relative mb-5">
        <textarea
          id="analyzer-input-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type whatever sentence you wish to evaluate..."
          rows={3}
          className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg p-3.5 pr-12 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-105 focus:ring-blue-100 transition-all duration-200 resize-none font-sans leading-relaxed"
        />
        <button
          id="analyzer-submit-btn"
          onClick={() => handleAnalyze()}
          disabled={isLoading || !inputText.trim()}
          type="button"
          className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-md font-medium text-xs transition-all duration-200 disabled:opacity-40 disabled:hover:bg-blue-600 flex items-center space-x-1"
        >
          {isLoading ? (
            <span className="w-4 h-4 rounded-full border-2 border-slate-300/30 border-t-white animate-spin block" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Analysis Side-by-Side Outputs */}
      {result ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* BERT Card - Multi-class Transformer */}
            <div className="md:col-span-8 bg-white border border-slate-205 border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              {/* Subtle Blue Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                    <h3 className="font-display font-semibold text-slate-800 text-sm">Fine-tuned BERT-base-uncased (FastAPI)</h3>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-blue-600 font-mono flex items-center bg-blue-50 px-2 py-0.5 border border-blue-100 rounded">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {result.bert.latencyMs.toFixed(1)} ms
                    </span>
                    <span className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-0.5 border border-blue-105 border-blue-100 rounded">
                      F1: 0.91
                    </span>
                  </div>
                </div>

                {/* Sentiment Winner Class and Confidence */}
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-lg border font-display font-semibold text-sm flex items-center space-x-2 shadow-lg ${getEmotionColor(result.bert.className).bg} ${getEmotionColor(result.bert.className).text} ${getEmotionColor(result.bert.className).border} ${getEmotionColor(result.bert.className).glow}`}>
                    <span>{result.bert.className}</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    Confidence: <span className="text-slate-700 font-semibold">{(result.bert.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Saliency Heatmap Block */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                    <span>SELF-ATTENTION TOKENS (SALIENCY HEATMAP):</span>
                    <span className="text-slate-500">Hover tokens to view heads weight</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 leading-relaxed min-h-[4rem] relative">
                    {result.bert.attention && result.bert.attention.length > 0 ? (
                      <div className="flex flex-wrap gap-x-1.5 gap-y-2">
                        {result.bert.attention.map((item, idx) => {
                          // Map weight values into proportional Tailwind background opacities
                          const opacityClass = Math.ceil(item.weight * 100);
                          // We custom inject inline styling for precision scale representation
                          return (
                            <span
                              id={`token-${idx}`}
                              key={idx}
                              onMouseEnter={() => setHoveredToken(item)}
                              onMouseLeave={() => setHoveredToken(null)}
                              className="px-1.5 py-0.5 rounded text-sm transition-all duration-150 cursor-help"
                              style={{
                                backgroundColor: `rgba(37, 99, 235, ${Math.max(item.weight * 0.75, 0.04)})`,
                                color: item.weight > 0.45 ? '#0f172a' : '#475569',
                                borderBottom: item.weight > 0.6 ? '2px solid rgba(37, 99, 235, 0.5)' : 'none',
                                fontWeight: item.weight > 0.6 ? '600' : '400'
                              }}
                            >
                              {item.token}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No attention map returned</span>
                    )}

                    {/* Popover on hover token info */}
                    {hoveredToken && (
                      <div className="absolute -bottom-6 right-2 bg-slate-950 text-[10px] font-mono border border-slate-800 rounded px-2 py-0.5 text-slate-400 z-10 shadow-lg flex items-center space-x-1">
                        <span className="text-indigo-400 font-bold">{hoveredToken.token}</span>
                        <span>weight :</span>
                        <span className="text-emerald-450 font-bold">{hoveredToken.weight.toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attention Head Explanation */}
                <div className="border border-slate-200 bg-slate-50/50 rounded-lg p-3 text-xs leading-relaxed text-slate-500">
                  <div className="flex items-center space-x-1 text-slate-700 font-semibold mb-1">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600 mr-1" />
                    <span>Transformer Attention Analysis:</span>
                  </div>
                  <p>{result.bert.explanation}</p>
                </div>
              </div>

              {/* Multi-class Probability Distributions */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <span className="text-[10px] font-mono text-slate-400 block mb-3 uppercase tracking-wider">Transformer Multi-Class Softmax Output:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(result.bert.probabilities).map(([emClass, val]) => {
                    const em = emClass as EmotionClass;
                    const valNum = val as number;
                    const styleMap = getEmotionColor(em);
                    const isWinner = result.bert.className === em;
                    return (
                      <div key={emClass} className={`bg-slate-50 border rounded p-2 transition-all ${isWinner ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200/60'}`}>
                        <div className="flex justify-between text-[11px] mb-1 font-mono">
                          <span className={`${styleMap.text} truncate pr-1 ${isWinner ? 'font-bold' : ''}`}>
                            {emClass.split('/')[0]}
                          </span>
                          <span className="text-slate-600 font-bold">{(valNum * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded overflow-hidden">
                          <div
                            className={`h-full rounded transition-all duration-300 ${isWinner ? styleMap.text.replace('text', 'bg').replace('-400', '-500') : 'bg-slate-300'}`}
                            style={{ width: `${valNum * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Baseline Card - Classical TF-IDF + Logistic Regression */}
            <div className="md:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <h3 className="font-display font-semibold text-slate-700 text-sm">TF-IDF + LogReg Baseline</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-550 text-slate-500 font-mono flex items-center bg-slate-100 px-2 py-0.5 border border-slate-200 rounded">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {result.baseline.latencyMs.toFixed(3)} ms
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Classical deterministic classifier running locally. Multiplies token frequencies by corpus weights with no attention memory, context resolution, or transformer heads.
                </p>

                {/* Score and Class */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center mb-4">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">DETERMINED CLASS</span>
                  <div className="font-display font-semibold text-slate-705 text-slate-700 text-sm">
                    {result.baseline.className}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Confidence: {(result.baseline.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                {/* Simple Info Bar */}
                <div className="space-y-3 font-mono text-xs text-slate-500 text-[11px]">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>Baseline F1-Score:</span>
                    <span className="text-slate-600">0.76 (Baseline)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span>Sarcasm Tracking:</span>
                    <span className="text-rose-600 font-semibold">Fails</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span>Contextual Negation:</span>
                    <span className="text-rose-600 font-semibold">Fails</span>
                  </div>
                </div>
              </div>

              {/* Big Latency Compare Stat */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <span className="text-[10px] font-mono text-slate-400 block mb-3 uppercase tracking-wider">Latency Comparison metrics:</span>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>Baseline Lexer</span>
                      <span className="text-slate-500 font-bold">{result.baseline.latencyMs.toFixed(3)}ms</span>
                    </div>
                    <div className="w-full h-2 bg-slate-150 bg-slate-100 rounded overflow-hidden">
                      <div className="h-full bg-slate-400 rounded" style={{ width: `0.5%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-blue-600 mb-1">
                      <span>BERT Transformer (FastAPI)</span>
                      <span className="text-blue-600 font-bold">{result.bert.latencyMs.toFixed(1)}ms</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded overflow-hidden">
                      <div className="h-full bg-blue-600 rounded animate-pulse" style={{ width: `100%` }} />
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-center text-slate-500 mt-3 font-mono">
                  BERT is <strong className="text-emerald-600 font-bold">{Math.ceil(result.bert.latencyMs / Math.max(result.baseline.latencyMs, 1))}x slower</strong>, but registers <strong className="text-emerald-600 font-bold">+19.7% F1 accuracy</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
          <Activity className="w-10 h-10 text-blue-500/80 animate-pulse" />
          <h4 className="font-display font-medium text-slate-700 text-sm">Waiting for Sentiment Input</h4>
          <p className="text-xs text-slate-500 max-w-sm">
            Click any quick template above or write in the text area, then click analyze to compute the self-attention maps and compare classification models!
          </p>
        </div>
      )}
    </div>
  );
}
