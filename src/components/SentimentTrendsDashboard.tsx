/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { StreamItem, EmotionClass } from "../types.js";
import { BarChart2, TrendingUp, AlertTriangle, MessageSquare, Tag, Eye, Layers, Clock, ShieldCheck, ChevronRight } from "lucide-react";

interface TopicEntity {
  id: string;
  name: string;
  keywords: string[];
  totalCount: number;
  dominantSentiment: EmotionClass;
  sentimentScore: number; // -100 to 100
  distribution: { [key in EmotionClass]: number };
  sampleMessages: StreamItem[];
}

export default function SentimentTrendsDashboard({ streamItems, onAnalyzeItem }: { streamItems: StreamItem[]; onAnalyzeItem: (id: string) => Promise<void> }) {
  const [selectedModel, setSelectedModel] = useState<"bert" | "baseline">("bert");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any | null>(null);

  // Helper: map emotion to positivity weights for Net Sentiment Index (-1 to +1)
  const getSentimentValue = (em: EmotionClass): number => {
    switch (em) {
      case EmotionClass.JOY: return 1.0;
      case EmotionClass.LOVE: return 1.0;
      case EmotionClass.SURPRISE: return 0.5; // surprising can be positive
      case EmotionClass.SADNESS: return -0.8;
      case EmotionClass.ANGER: return -1.0;
      case EmotionClass.FEAR: return -0.8;
      default: return 0;
    }
  };

  const getEmotionColorHex = (em: EmotionClass): string => {
    switch (em) {
      case EmotionClass.JOY: return "#10b981"; // emerald-500
      case EmotionClass.LOVE: return "#ec4899"; // pink-500
      case EmotionClass.SURPRISE: return "#d946ef"; // fuchsia-500
      case EmotionClass.SADNESS: return "#0ea5e9"; // sky-500
      case EmotionClass.ANGER: return "#f43f5e"; // rose-500
      case EmotionClass.FEAR: return "#f59e0b"; // amber-500
      default: return "#64748b";
    }
  };

  const getEmotionTailwindText = (em: EmotionClass): string => {
    switch (em) {
      case EmotionClass.JOY: return "text-emerald-400";
      case EmotionClass.LOVE: return "text-pink-400";
      case EmotionClass.SURPRISE: return "text-fuchsia-400";
      case EmotionClass.SADNESS: return "text-sky-400";
      case EmotionClass.ANGER: return "text-rose-400";
      case EmotionClass.FEAR: return "text-amber-500";
      default: return "text-slate-400";
    }
  };

  // 1. DYNAMIC TOPIC & ENTITY EXTRACTION Engine
  // Categorizes messages on the fly and aggregates stats based on selection model
  const entities: TopicEntity[] = [
    {
      id: "api_server",
      name: "Backend API & Uvicorn Servers",
      keywords: ["server", "endpoint", "api", "database", "migration", "timeout", "workers", "uvicorn", "vram", "leak", "index", "memory", "response", "host"],
      totalCount: 0,
      dominantSentiment: EmotionClass.JOY,
      sentimentScore: 0,
      distribution: {
        [EmotionClass.JOY]: 0, [EmotionClass.SADNESS]: 0, [EmotionClass.ANGER]: 0,
        [EmotionClass.FEAR]: 0, [EmotionClass.LOVE]: 0, [EmotionClass.SURPRISE]: 0
      },
      sampleMessages: []
    },
    {
      id: "nlp_pipeline",
      name: "BERT NLP Transformer Model",
      keywords: ["model", "bert", "f1-score", "loss", "accuracy", "epochs", "fine-tuning", "transformer", "attention", "head", "matrix", "heads", "saliency", "predict", "inference"],
      totalCount: 0,
      dominantSentiment: EmotionClass.JOY,
      sentimentScore: 0,
      distribution: {
        [EmotionClass.JOY]: 0, [EmotionClass.SADNESS]: 0, [EmotionClass.ANGER]: 0,
        [EmotionClass.FEAR]: 0, [EmotionClass.LOVE]: 0, [EmotionClass.SURPRISE]: 0
      },
      sampleMessages: []
    },
    {
      id: "customer_care",
      name: "Customer Care & Support Team",
      keywords: ["support", "ticket", "service", "customer", "team", "replied", "staff", "representative", "agents", "help"],
      totalCount: 0,
      dominantSentiment: EmotionClass.JOY,
      sentimentScore: 0,
      distribution: {
        [EmotionClass.JOY]: 0, [EmotionClass.SADNESS]: 0, [EmotionClass.ANGER]: 0,
        [EmotionClass.FEAR]: 0, [EmotionClass.LOVE]: 0, [EmotionClass.SURPRISE]: 0
      },
      sampleMessages: []
    },
    {
      id: "logistics_shipping",
      name: "Logistics, Order Fees & Shipping",
      keywords: ["package", "shipping", "refund", "delivery", "delivered", "shipping", "shipped", "arrived", "carrier", "order", "charge", "spent"],
      totalCount: 0,
      dominantSentiment: EmotionClass.JOY,
      sentimentScore: 0,
      distribution: {
        [EmotionClass.JOY]: 0, [EmotionClass.SADNESS]: 0, [EmotionClass.ANGER]: 0,
        [EmotionClass.FEAR]: 0, [EmotionClass.LOVE]: 0, [EmotionClass.SURPRISE]: 0
      },
      sampleMessages: []
    },
    {
      id: "general_product",
      name: "General App Experience",
      keywords: [], // Fallback catch-all category
      totalCount: 0,
      dominantSentiment: EmotionClass.JOY,
      sentimentScore: 0,
      distribution: {
        [EmotionClass.JOY]: 0, [EmotionClass.SADNESS]: 0, [EmotionClass.ANGER]: 0,
        [EmotionClass.FEAR]: 0, [EmotionClass.LOVE]: 0, [EmotionClass.SURPRISE]: 0
      },
      sampleMessages: []
    }
  ];

  // Process all streamItems to populate topics
  streamItems.forEach(item => {
    // Determine active sentiment for analytics aggregation
    let activeSentiment: EmotionClass | null = null;
    if (selectedModel === "bert" && item.isAnalyzed && item.bert) {
      activeSentiment = item.bert.className;
    } else if (selectedModel === "baseline") {
      // Baseline prediction already exists or we run it locally
      activeSentiment = item.baseline ? item.baseline.className : null;
    }

    // Default to baseline anyway if bert isn't analyzed yet to avoid empty gaps in overall trends
    if (!activeSentiment && item.baseline) {
      activeSentiment = item.baseline.className;
    }

    if (!activeSentiment) return; // Skip if no data available

    const textLower = item.text.toLowerCase();
    let categorized = false;

    // Direct search matching keyword vectors
    for (const ent of entities.slice(0, 4)) {
      if (ent.keywords.some(kw => textLower.includes(kw))) {
        ent.totalCount += 1;
        ent.distribution[activeSentiment] += 1;
        ent.sampleMessages.push(item);
        categorized = true;
        break; // Associate to first matching topic vector for exclusion integrity
      }
    }

    if (!categorized) {
      const fallback = entities[4]; // General category
      fallback.totalCount += 1;
      fallback.distribution[activeSentiment] += 1;
      fallback.sampleMessages.push(item);
    }
  });

  // Calculate Net sentiment index scores for each topic
  entities.forEach(ent => {
    if (ent.totalCount === 0) return;
    let netSum = 0;
    let maxCount = -1;
    let dominant: EmotionClass = EmotionClass.JOY;

    Object.entries(ent.distribution).forEach(([emClass, count]) => {
      const em = emClass as EmotionClass;
      netSum += count * getSentimentValue(em);
      if (count > maxCount) {
        maxCount = count;
        dominant = em;
      }
    });

    ent.dominantSentiment = dominant;
    ent.sentimentScore = Math.round((netSum / ent.totalCount) * 100);
  });

  // Filter out topics with 0 count to prevent empty UI elements
  const activeTopics = entities.filter(ent => ent.totalCount > 0);

  // 2. CHRONOLOGICAL DATA BINNING FOR TREND CHARTING
  // Maps standard chronological time-series steps
  const getTimelineBuckets = () => {
    const sorted = [...streamItems]
      .filter(f => f.baseline || (selectedModel === "bert" && f.bert))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (sorted.length === 0) return [];

    // Bin into 6 equal step bins represent progress over chronological intervals
    const binCount = 6;
    const bins: {
      timeLabel: string;
      netSentiment: number; // score -100 to 100
      count: number;
      classBreakdown: { [key in EmotionClass]: number };
    }[] = Array.from({ length: binCount }, (_, idx) => ({
      timeLabel: `T-${binCount - idx - 1}`,
      netSentiment: 0,
      count: 0,
      classBreakdown: {
        [EmotionClass.JOY]: 0, [EmotionClass.SADNESS]: 0, [EmotionClass.ANGER]: 0,
        [EmotionClass.FEAR]: 0, [EmotionClass.LOVE]: 0, [EmotionClass.SURPRISE]: 0
      }
    }));

    const chunk = Math.max(Math.ceil(sorted.length / binCount), 1);
    sorted.forEach((item, index) => {
      const binIdx = Math.min(Math.floor(index / chunk), binCount - 1);
      const currentBin = bins[binIdx];

      let em: EmotionClass | null = null;
      if (selectedModel === "bert" && item.isAnalyzed && item.bert) {
        em = item.bert.className;
      } else if (item.baseline) {
        em = item.baseline.className;
      }

      if (em) {
        currentBin.classBreakdown[em] += 1;
        currentBin.count += 1;
      }
    });

    // Compute metrics for each bin
    bins.forEach(b => {
      if (b.count === 0) {
        b.netSentiment = 0;
        return;
      }
      let netSum = 0;
      Object.entries(b.classBreakdown).forEach(([emClass, val]) => {
        netSum += val * getSentimentValue(emClass as EmotionClass);
      });
      b.netSentiment = Math.round((netSum / b.count) * 100);
    });

    return bins;
  };

  const timelineData = getTimelineBuckets();

  // 3. OVERALL KPI AGGREGATES
  const overallKPIs = (() => {
    let total = 0;
    let netSum = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let unanalyzedCount = 0;

    const classDistribution = {
      [EmotionClass.JOY]: 0, [EmotionClass.SADNESS]: 0, [EmotionClass.ANGER]: 0,
      [EmotionClass.FEAR]: 0, [EmotionClass.LOVE]: 0, [EmotionClass.SURPRISE]: 0
    };

    streamItems.forEach(item => {
      let em: EmotionClass | null = null;
      if (selectedModel === "bert") {
        if (item.isAnalyzed && item.bert) {
          em = item.bert.className;
        } else {
          unanalyzedCount += 1;
          // Fallback safely to baseline if not analyzed to keep aggregate curves whole
          if (item.baseline) em = item.baseline.className;
        }
      } else if (item.baseline) {
        em = item.baseline.className;
      }

      if (em) {
        total += 1;
        classDistribution[em] += 1;
        const val = getSentimentValue(em);
        netSum += val;
        if (val > 0) positiveCount += 1;
        if (val < 0) negativeCount += 1;
      }
    });

    const netScore = total > 0 ? Math.round((netSum / total) * 100) : 0;
    const ratio = negativeCount > 0 ? parseFloat((positiveCount / negativeCount).toFixed(2)) : positiveCount;

    return {
      total,
      netScore,
      positiveCount,
      negativeCount,
      unanalyzedCount,
      ratio,
      classDistribution
    };
  })();

  // Render SVG charts custom calculations
  const chartWidth = 590;
  const chartHeight = 160;
  const paddingX = 40;
  const paddingY = 20;

  // Render Net Sentiment Area Line Chart
  const linePoints = timelineData.map((d, i) => {
    const x = paddingX + (i / (timelineData.length - 1)) * (chartWidth - paddingX * 2);
    // score ranges from -100 to +100. Map to Y coordinates (0 top, chartHeight bottom)
    const normalizedVal = (d.netSentiment + 100) / 200; // 0 to 1
    const y = chartHeight - paddingY - normalizedVal * (chartHeight - paddingY * 2);
    return { x, y, value: d.netSentiment, timeLabel: d.timeLabel, item: d };
  });

  const pathD = linePoints.length > 0 
    ? `M ${linePoints[0].x} ${linePoints[0].y} ` + linePoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
    : "";

  const areaD = linePoints.length > 0
    ? `${pathD} L ${linePoints[linePoints.length - 1].x} ${chartHeight - paddingY} L ${linePoints[0].x} ${chartHeight - paddingY} Z`
    : "";

  return (
    <div id="sentiment-dashboard-root" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl animate-fade-in space-y-6">
      
      {/* Dashboard Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5.5 h-5.5 text-indigo-400" />
            <h2 className="text-xl font-display font-bold text-slate-150 text-slate-100">Sentiment Analytics & Trends</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
            Real-time sentiment volatility, multi-class pipeline distribution over discrete time slices, and operational topic mapping.
          </p>
        </div>

        {/* Model Comparer Mode Toggles */}
        <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-850 p-1 rounded-lg">
          <button
            id="toggle-model-bert"
            onClick={() => { setSelectedModel("bert"); setSelectedTopicId(null); }}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all duration-200 ${selectedModel === "bert" ? "bg-indigo-600 text-white font-semibold shadow" : "text-slate-500 hover:text-slate-400"}`}
          >
            Fine-tuned BERT
          </button>
          <button
            id="toggle-model-baseline"
            onClick={() => { setSelectedModel("baseline"); setSelectedTopicId(null); }}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all duration-200 ${selectedModel === "baseline" ? "bg-slate-800 text-slate-200" : "text-slate-500 hover:text-slate-400"}`}
          >
            Baseline LogReg
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 : Net Sentiment Index */}
        <div className="bg-slate-950 border border-slate-850/80 p-4.5 rounded-xl flex flex-col justify-between shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-transparent blur-xl" />
          <div>
            <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">Net Sentiment Score</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className={`text-2xl font-display font-extrabold ${overallKPIs.netScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {overallKPIs.netScore > 0 ? `+${overallKPIs.netScore}` : overallKPIs.netScore}
              </span>
              <span className="text-xs text-slate-500 font-mono">Index (-100 to +100)</span>
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between text-[11px] font-mono border-t border-slate-900/40 pt-2.5">
            <span className="text-slate-500">Vol Ratio (Pos/Neg):</span>
            <span className="text-indigo-400 font-bold">{overallKPIs.ratio}x</span>
          </div>
        </div>

        {/* KPI 2 : Feedback Volume */}
        <div className="bg-slate-950 border border-slate-850/80 p-4.5 rounded-xl flex flex-col justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">Total Feed Volume</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-display font-extrabold text-slate-200">
                {overallKPIs.total}
              </span>
              <span className="text-xs text-slate-500 font-mono">Ingested Streams</span>
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between text-[11px] font-mono border-t border-slate-900/40 pt-2.5">
            <span className="text-slate-500">Positive Signals:</span>
            <span className="text-emerald-400 font-bold">{overallKPIs.positiveCount}</span>
          </div>
        </div>

        {/* KPI 3 : Volatility alert */}
        <div className="bg-slate-950 border border-slate-850/80 p-4.5 rounded-xl flex flex-col justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">Operational Alerts</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className={`text-2xl font-display font-extrabold ${overallKPIs.classDistribution[EmotionClass.ANGER] > 2 ? 'text-rose-400' : 'text-slate-400'}`}>
                {overallKPIs.classDistribution[EmotionClass.ANGER]}
              </span>
              <span className="text-xs text-slate-500 font-mono">Hostile Angers</span>
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between text-[11px] font-mono border-t border-slate-900/40 pt-2.5">
            <span className="text-slate-500">Critical Warnings:</span>
            <span className={`font-bold ${overallKPIs.classDistribution[EmotionClass.FEAR] > 2 ? 'text-amber-500' : 'text-slate-500'}`}>
              {overallKPIs.classDistribution[EmotionClass.FEAR]}
            </span>
          </div>
        </div>

        {/* KPI 4 : BERT Pending Pool */}
        <div className="bg-slate-950 border border-slate-850/80 p-4.5 rounded-xl flex flex-col justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-wider">BERT Classification Pool</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-display font-extrabold text-indigo-400">
                {Math.round(( (overallKPIs.total - overallKPIs.unanalyzedCount) / Math.max(overallKPIs.total, 1) ) * 100)}%
              </span>
              <span className="text-xs text-slate-500 font-mono">BERT Coverage</span>
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between text-[11px] font-mono border-t border-slate-900/40 pt-2.5">
            <span className="text-slate-500">Awaiting Inference:</span>
            <span className="text-amber-550 text-amber-500 font-bold">{overallKPIs.unanalyzedCount} items</span>
          </div>
        </div>

      </div>

      {/* Main Charts Workspace (Time Series curves) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Span: Chronological Area Spline SVG Chart */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-850 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 leading-none">
              <span className="text-[10px] font-mono text-slate-450 uppercase flex items-center">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
                Chronological Net Sentiment Timeline
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                Calculated over {timelineData.length} sequential intervals
              </span>
            </div>
            <p className="text-xs text-slate-550 text-slate-500 leading-relaxed mb-4">
              Real-time trend analysis tracing metric velocity. Area curves values over +30 indicate positive operations, while sub-zero segments highlight aggregate dissatisfaction.
            </p>
          </div>

          {/* Custom SVG Spline Line and Area */}
          <div className="w-full bg-slate-900/50 border border-slate-900 rounded-lg p-3.5 relative overflow-visible select-none h-44 flex items-center justify-center">
            {linePoints.length > 0 ? (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                
                {/* Horizontal reference lines */}
                <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#1e293b" strokeDasharray="2" />
                <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#334155" strokeWidth="1" strokeDasharray="3" />
                <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#1e293b" strokeDasharray="2" />

                {/* Left labels */}
                <text x={10} y={paddingY + 3} fill="#64748b" className="text-[9px] font-mono">+100</text>
                <text x={10} y={chartHeight / 2 + 3} fill="#475569" className="text-[9px] font-mono font-semibold">0</text>
                <text x={10} y={chartHeight - paddingY + 3} fill="#64748b" className="text-[9px] font-mono">-100</text>

                {/* Vertical bins columns reference */}
                {linePoints.map((pt, idx) => (
                  <line key={idx} x1={pt.x} y1={paddingY} x2={pt.x} y2={chartHeight - paddingY} stroke="#0f172a" strokeWidth="1" />
                ))}

                {/* Net Sentiment Area Fill Gradient */}
                <path d={areaD} fill="url(#indigo-grad-fill)" className="opacity-15" />

                {/* Net Sentiment Spline Line Path */}
                <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* SVG Gradients definitions */}
                <defs>
                  <linearGradient id="indigo-grad-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Coordinate Plot Nodes */}
                {linePoints.map((pt, idx) => {
                  const isHovered = hoveredDataPoint?.idx === idx;
                  return (
                    <g key={idx} onMouseEnter={() => setHoveredDataPoint({ ...pt, idx })} onMouseLeave={() => setHoveredDataPoint(null)}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : 3.5}
                        className="transition-all duration-150 cursor-pointer"
                        fill={pt.value >= 0 ? "#10b981" : "#f43f5e"}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}

                {/* Bottom X-axis chron labels */}
                {linePoints.map((pt, idx) => (
                  <text key={idx} x={pt.x} y={chartHeight - 3} className="text-[8px] font-mono text-slate-500" textAnchor="middle">
                    {pt.timeLabel}
                  </text>
                ))}
              </svg>
            ) : (
              <span className="text-xs text-slate-500 italic">Inject and analyze stream reviews to render metric timeline...</span>
            )}

            {/* Float Tooltip Crosshair */}
            {hoveredDataPoint && (
              <div className="absolute top-2 right-2 bg-slate-950 border border-slate-800 rounded-lg p-2.5 z-10 font-mono shadow-2xl space-y-1 text-[11px] animate-fade-in pointer-events-none">
                <div className="text-slate-400 border-b border-slate-901 pb-1 flex justify-between gap-4">
                  <span>S-Slice:</span>
                  <span className="text-indigo-400 font-bold">{hoveredDataPoint.timeLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Net Index:</span>
                  <span className={`font-bold ${hoveredDataPoint.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {hoveredDataPoint.value > 0 ? `+${hoveredDataPoint.value}` : hoveredDataPoint.value}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Volume:</span>
                  <span className="text-slate-350 font-bold">{hoveredDataPoint.item.count} items</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3.5 flex justify-between text-[10px] font-mono text-slate-500">
            <span>← Oldest feed snapshots</span>
            <span>Latest live snapshots →</span>
          </div>
        </div>

        {/* Right Span: Dynamic Multi-class breakdown chart */}
        <div className="lg:col-span-4 bg-slate-950 border border-slate-850 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-450 block mb-2 uppercase tracking-wide">
              Pipelines Class Counts
            </span>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Discrete multi-class feedback aggregates. Highlight levels mapping absolute category ratios across processing bins.
            </p>
          </div>

          {/* Dynamic bar charts counts */}
          <div className="space-y-3.5 py-1">
            {Object.entries(overallKPIs.classDistribution).map(([emClass, val]) => {
              const em = emClass as EmotionClass;
              const ratioScore = overallKPIs.total > 0 ? (val / overallKPIs.total) * 100 : 0;
              return (
                <div key={emClass}>
                  <div className="flex items-center justify-between font-mono text-xs mb-1 leading-none">
                    <span className="text-slate-400 flex items-center">
                      <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: getEmotionColorHex(em) }} />
                      {emClass.split("/")[0]}
                    </span>
                    <span className="text-slate-300 font-bold">{val} <span className="text-slate-600 text-[10px]/none font-normal">({Math.round(ratioScore)}%)</span></span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(ratioScore, 2)}%`,
                        backgroundColor: getEmotionColorHex(em)
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-center font-mono text-slate-500 mt-2.5 border-t border-slate-900/40 pt-2.5">
            Model: <strong className="text-indigo-400 capitalize">{selectedModel} classification output</strong>
          </div>
        </div>

      </div>

      {/* Topics & Operational Entities block */}
      <div className="bg-slate-950 border border-slate-850 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4.5">
          <div className="flex items-center space-x-1.5">
            <Tag className="w-5 h-5 text-indigo-400" />
            <h3 className="font-display font-semibold text-slate-100 text-sm uppercase tracking-wider">Operational Topics & Sentiment Bindings</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Interactive mapping · Click entity trace logs
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-5">
          Reviews are grouped dynamically using keyword embeddings. Click on any operational layer to inspect matching raw telemetry logs currently populated.
        </p>

        {/* Entities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {entities.map(ent => {
            const isSelected = selectedTopicId === ent.id;
            const ratioScore = ent.totalCount > 0 ? ent.sentimentScore : 0;
            return (
              <button
                id={`topic-kpi-${ent.id}`}
                key={ent.id}
                onClick={() => setSelectedTopicId(selectedTopicId === ent.id ? null : ent.id)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 ${isSelected ? 'bg-indigo-950/25 border-indigo-500/50 shadow-lg' : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-900/60 hover:border-slate-800'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${isSelected ? 'bg-indigo-950 text-indigo-400' : 'bg-slate-950 text-slate-450 text-slate-500'}`}>
                    {ent.id.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-slate-400">N: {ent.totalCount}</span>
                </div>

                <h4 className="font-display font-semibold text-xs text-slate-200 mb-3.5 leading-snug truncate">
                  {ent.name}
                </h4>

                {ent.totalCount > 0 ? (
                  <div className="space-y-2">
                    {/* Index range bar */}
                    <div>
                      <div className="flex justify-between text-[10px] font-mono mb-1 leading-none">
                        <span className="text-slate-500">Idx Score:</span>
                        <span className={`font-bold ${ratioScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {ratioScore > 0 ? `+${ratioScore}` : ratioScore}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ratioScore >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.max(Math.min((ratioScore + 100) / 2, 100), 10)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono leading-none border-t border-slate-950 pt-2">
                      <span className="text-slate-500">Dominant:</span>
                      <span className={`font-bold uppercase ${getEmotionTailwindText(ent.dominantSentiment)} text-[9px]/none`}>
                        {ent.dominantSentiment.split("/")[0]}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-slate-600 block pt-4 select-none">No feed indicators</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Entity Logs table */}
        {selectedTopicId && (
          <div className="mt-5 border-t border-slate-900 pt-5 animate-fade-in space-y-3.5">
            <div className="flex items-center justify-between mb-3 leading-none">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">
                Filtered Feedback logs for: <strong className="text-slate-200">{entities.find(e => e.id === selectedTopicId)?.name}</strong>
              </span>
              <button
                id="close-filtered-topic"
                onClick={() => setSelectedTopicId(null)}
                className="text-[10px] font-mono text-slate-500 hover:text-slate-300"
              >
                Clear Filter
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {entities.find(e => e.id === selectedTopicId)?.sampleMessages.map(msg => {
                const isBert = msg.isAnalyzed && msg.bert;
                const emClass = isBert ? msg.bert!.className : msg.baseline?.className;
                return (
                  <div key={msg.id} className="bg-slate-905 bg-slate-900 border border-slate-850 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs leading-relaxed">
                    <div className="flex-1">
                      <p className="text-slate-250 text-slate-300">{msg.text}</p>
                      <span className="text-[10px] text-slate-550 font-mono uppercase block mt-1">
                        Source: {msg.source} · Time: {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      {emClass && (
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 border rounded ${getEmotionTailwindText(emClass).replace('text', 'border').replace('-400', '-900/40').replace('-500', '-900/40')} ${getEmotionTailwindText(emClass).replace('text', 'bg').replace('-400', '-950/40').replace('-500', '-950/40')} ${getEmotionTailwindText(emClass)}`}>
                          {emClass.split("/")[0]}
                        </span>
                      )}

                      {!isBert && (
                        <button
                          id={`btn-dashboard-infer-${msg.id}`}
                          onClick={() => onAnalyzeItem(msg.id)}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 font-mono text-[9px] text-white rounded font-medium transition"
                        >
                          Run BERT
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {entities.find(e => e.id === selectedTopicId)?.sampleMessages.length === 0 && (
                <div className="p-4 border border-dashed border-slate-900 text-slate-500 text-center text-xs font-mono">
                  No active logs in window
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
