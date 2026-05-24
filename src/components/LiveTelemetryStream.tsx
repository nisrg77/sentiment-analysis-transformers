/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { StreamItem, EmotionClass } from "../types.js";
import { Play, Square, RefreshCw, Layers, ShieldCheck, Mail, MessageSquare, Star, TrendingUp } from "lucide-react";

export default function LiveTelemetryStream({
  lastAddedItem,
  items: parentItems,
  onInference,
  isActive: parentIsActive,
  onToggleActive,
  onRefresh
}: {
  lastAddedItem?: any;
  items?: StreamItem[];
  onInference?: (id: string) => Promise<void>;
  isActive?: boolean;
  onToggleActive?: () => void;
  onRefresh?: () => void;
}) {
  const [localItems, setLocalItems] = useState<StreamItem[]>([]);
  const [localIsActive, setLocalIsActive] = useState(true);
  const [analyzingIds, setAnalyzingIds] = useState<string[]>([]);

  const items = parentItems !== undefined ? parentItems : localItems;
  const isActive = parentIsActive !== undefined ? parentIsActive : localIsActive;
  const toggleActive = onToggleActive !== undefined ? onToggleActive : () => setLocalIsActive(!localIsActive);
  const triggerRefresh = onRefresh !== undefined ? onRefresh : () => fetchStream();

  // Telemetry rolling metrics
  const [metrics, setMetrics] = useState({
    totalCompleted: 2491,
    avgLatency: 84.5,
    qps: 31.4,
    errors: 0.0
  });

  const fetchStream = async () => {
    try {
      const resp = await fetch("/api/stream");
      if (!resp.ok) throw new Error("Could not fetch stream");
      const data: StreamItem[] = await resp.json();
      if (parentItems !== undefined) {
        // App.tsx uses parent variables, but update local state just in case
      } else {
        setLocalItems(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (parentItems !== undefined) return;
    fetchStream();
    // Fetch initial stream
  }, [parentItems]);

  // Sync if user analyzed a item in the primary form
  useEffect(() => {
    if (parentItems !== undefined) return;
    if (lastAddedItem) {
      fetchStream();
    }
  }, [lastAddedItem, parentItems]);

  // Periodic polling for stream updates
  useEffect(() => {
    if (parentItems !== undefined) return;
    if (!isActive) return;

    const interval = setInterval(() => {
      fetchStream();
      // Rotate metrics slightly to make it feel alive
      setMetrics(prev => ({
        totalCompleted: prev.totalCompleted + (Math.random() > 0.4 ? 1 : 0),
        avgLatency: parseFloat((83.2 + Math.random() * 2.8).toFixed(1)),
        qps: parseFloat((30.8 + Math.random() * 1.5).toFixed(1)),
        errors: 0.0
      }));
    }, 4500);

    return () => clearInterval(interval);
  }, [isActive, parentItems]);

  const handleInference = async (id: string) => {
    if (onInference) {
      await onInference(id);
      return;
    }
    if (analyzingIds.includes(id)) return;
    setAnalyzingIds(prev => [...prev, id]);
    try {
      const resp = await fetch(`/api/stream/analyze/${id}`, {
        method: "POST"
      });
      if (!resp.ok) throw new Error("Inference failed");
      const updatedItem: StreamItem = await resp.json();

      setLocalItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      setMetrics(prev => ({
        ...prev,
        totalCompleted: prev.totalCompleted + 1
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingIds(prev => prev.filter(item => item !== id));
    }
  };

  const getSourceIcon = (source: StreamItem["source"]) => {
    switch (source) {
      case "social":
        return <MessageSquare className="w-3.5 h-3.5 text-sky-450 text-sky-400" />;
      case "app_store":
        return <Star className="w-3.5 h-3.5 text-amber-500" />;
      case "support_ticket":
        return <Mail className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const getEmotionBadge = (em: EmotionClass) => {
    let color = "";
    switch (em) {
      case EmotionClass.JOY:
        color = "text-emerald-400 bg-emerald-950/40 border-emerald-900/40"; break;
      case EmotionClass.SADNESS:
        color = "text-sky-450 text-sky-400 bg-sky-950/40 border-sky-900/40"; break;
      case EmotionClass.ANGER:
        color = "text-rose-400 bg-rose-950/40 border-rose-900/40"; break;
      case EmotionClass.FEAR:
        color = "text-amber-500 bg-amber-950/40 border-amber-900/40"; break;
      case EmotionClass.LOVE:
        color = "text-pink-400 bg-pink-950/40 border-pink-900/40"; break;
      case EmotionClass.SURPRISE:
        color = "text-fuchsia-400 bg-fuchsia-950/40 border-fuchsia-900/40"; break;
    }
    return (
      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 border rounded ${color}`}>
        {em.split("/")[0]}
      </span>
    );
  };

  // Compute distribution for rolling mini-chart representation
  const analyzed = items.filter(f => f.isAnalyzed && f.bert);
  const totalAnalyzed = analyzed.length;
  const countStats = { Joy: 0, Sadness: 0, Anger: 0, Fear: 0, Love: 0, Surprise: 0 };
  
  analyzed.forEach(a => {
    const rawClass = a.bert?.className.split("/")[0];
    if (rawClass && rawClass in countStats) {
      countStats[rawClass as keyof typeof countStats] += 1;
    }
  });

  return (
    <div id="live-telemetry-stream-root" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl flex flex-col h-full justify-between animate-fade-in">
      <div>
        {/* Header Options */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-display font-semibold text-slate-100">Inference Stream Monitor</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              id="stream-active-toggle"
              onClick={toggleActive}
              type="button"
              className={`p-1.5 rounded-lg border text-xs transition-all duration-200 flex items-center space-x-1 ${isActive ? 'bg-indigo-950/30 border-indigo-900/40 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'}`}
              title={isActive ? "Pause real-time stream" : "Resume real-time stream"}
            >
              {isActive ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">LIVE</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">PAUSED</span>
                </>
              )}
            </button>
            <button
              id="stream-force-refresh"
              onClick={triggerRefresh}
              type="button"
              className="p-1.5 bg-slate-950 hover:bg-slate-850 text-slate-500 hover:text-slate-350 border border-slate-800 rounded-lg transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-450 text-slate-450 text-slate-400 mb-5 leading-relaxed">
          Simulates streaming production telemetry (Twitter reviews, customer complaints, and support tickers) feeding into our multi-class BERT pipeline. Check predictions live.
        </p>

        {/* Real-Time Metrics Row */}
        <div className="grid grid-cols-4 gap-3 mb-6 bg-slate-950 border border-slate-850 rounded-xl p-3.5">
          <div className="text-center border-r border-slate-900">
            <span className="text-[9px] font-mono text-slate-500 block uppercase mb-1">Total Classified</span>
            <span className="font-display font-bold text-slate-200 text-sm">{metrics.totalCompleted}</span>
          </div>
          <div className="text-center border-r border-slate-900">
            <span className="text-[9px] font-mono text-slate-500 block uppercase mb-1">M-Latency (BERT)</span>
            <span className="font-display font-bold text-indigo-400 text-sm">{metrics.avgLatency}ms</span>
          </div>
          <div className="text-center border-r border-slate-900">
            <span className="text-[9px] font-mono text-slate-500 block uppercase mb-1">THROUGHPUT</span>
            <span className="font-display font-bold text-slate-350 text-slate-200 text-sm">{metrics.qps} QPS</span>
          </div>
          <div className="text-center">
            <span className="text-[9px] font-mono text-slate-500 block uppercase mb-1">ERRORS/TIMEO</span>
            <span className="font-display font-bold text-emerald-450 text-emerald-450 text-emerald-400 text-sm">0.00%</span>
          </div>
        </div>

        {/* Sentiment Volume Mini Ratio */}
        <div className="mb-5 bg-slate-900 border border-slate-850/60 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3">
            <span className="flex items-center uppercase text-[10px] tracking-wider text-slate-400">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
              Rolling Stream Sentiment Distribution:
            </span>
            <span className="text-[10px] text-slate-550">{totalAnalyzed}/{items.length} Evaluated</span>
          </div>
          <div className="space-y-2.5">
            {Object.entries(countStats).map(([k, val]) => {
              const pct = totalAnalyzed > 0 ? (val / totalAnalyzed) * 100 : 0;
              let barColor = "bg-indigo-505 bg-indigo-500";
              if (k === "Joy") barColor = "bg-emerald-500";
              if (k === "Sadness") barColor = "bg-sky-500";
              if (k === "Anger") barColor = "bg-rose-500";
              if (k === "Fear") barColor = "bg-amber-500";
              if (k === "Love") barColor = "bg-pink-500";
              if (k === "Surprise") barColor = "bg-fuchsia-500";

              return (
                <div key={k} className="flex items-center justify-between">
                  <span className="w-16 text-xs text-slate-400 font-medium truncate">{k}</span>
                  <div className="flex-1 mx-3.5 h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs text-slate-550 font-mono font-bold">
                    {Math.round(pct)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Stream Scrolling Table */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2 border-b border-slate-850 pb-2">
          <span>STREAM QUEUE INGESTFEED</span>
          <span>STATUS INTERACTION</span>
        </div>

        <div className="space-y-2 max-h-[295px] overflow-y-auto pr-1">
          {items.map((item) => {
            const isAnalyzing = analyzingIds.includes(item.id);
            return (
              <div
                id={item.id}
                key={item.id}
                className={`bg-slate-950 border rounded-xl p-3.5 hover:border-slate-750 transition-all duration-200 ${item.isAnalyzed ? 'border-slate-850/80 bg-slate-950/40' : 'border-indigo-950/40 bg-indigo-950/5'}`}
              >
                {/* Meta header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    {getSourceIcon(item.source)}
                    <span className="capitalize text-[10px] font-medium text-slate-500 tracking-wider">
                      {item.source.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-600">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                {/* Review Text */}
                <p className="text-xs text-slate-350 text-slate-350 text-slate-300 leading-relaxed mb-3 font-sans break-words selection:bg-indigo-500/10">
                  {item.text}
                </p>

                {/* Bottom predictor trigger */}
                <div className="flex items-center justify-between mt-1">
                  {item.isAnalyzed && item.bert ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-slate-550 font-medium">BERT Label:</span>
                        {getEmotionBadge(item.bert.className)}
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">
                        ({item.bert.latencyMs.toFixed(0)}ms)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full border-t border-slate-900 pt-2.5">
                      <span className="text-[10px] font-mono text-yellow-500/85 text-yellow-500/90 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse mr-1" />
                        Awaiting Inference
                      </span>
                      <button
                        id={`btn-infer-${item.id}`}
                        onClick={() => handleInference(item.id)}
                        disabled={isAnalyzing}
                        type="button"
                        className="text-[10px] bg-indigo-650 bg-indigo-600 font-semibold hover:bg-indigo-505 hover:bg-indigo-500 text-white font-mono px-2.5 py-1.5 rounded-md transition-all flex items-center"
                      >
                        {isAnalyzing ? (
                          <>
                            <span className="w-3 h-3 rounded-full border border-slate-300/30 border-t-white animate-spin mr-1.5 block" />
                            Evaluating...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            Run BERT
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
