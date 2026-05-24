/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import InteractiveAnalyzer from "./components/InteractiveAnalyzer";
import LiveTelemetryStream from "./components/LiveTelemetryStream";
import TrainingMetricsExplorer from "./components/TrainingMetricsExplorer";
import FastApiDocPlayground from "./components/FastApiDocPlayground";
import SentimentTrendsDashboard from "./components/SentimentTrendsDashboard";
import { Cpu, Terminal, Database, Activity, Layout, Layers, RefreshCw, BarChart2 } from "lucide-react";
import { StreamItem } from "./types.js";

export default function App() {
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"inference" | "trends">("inference");
  const [streamItems, setStreamItems] = useState<StreamItem[]>([]);
  const [isStreamActive, setIsStreamActive] = useState(true);
  const [analyzingIds, setAnalyzingIds] = useState<string[]>([]);
  const [nodeState, setNodeState] = useState({
    cpu: 12.4,
    mem: "1.18 GB",
    activeWorkers: 3,
    hasApiKey: false,
    clusterHealth: "Healthy"
  });

  const fetchStream = async () => {
    try {
      const resp = await fetch("/api/stream");
      if (resp.ok) {
        const data: StreamItem[] = await resp.json();
        setStreamItems(data);
      }
    } catch (e) {
      console.error("Could not fetch stream in App level:", e);
    }
  };

  const handleInference = async (id: string) => {
    if (analyzingIds.includes(id)) return;
    setAnalyzingIds(prev => [...prev, id]);
    try {
      const resp = await fetch(`/api/stream/analyze/${id}`, {
        method: "POST"
      });
      if (resp.ok) {
        const updatedItem: StreamItem = await resp.json();
        setStreamItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingIds(prev => prev.filter(item => item !== id));
    }
  };

  const checkHealth = async () => {
    try {
      const resp = await fetch("/api/health");
      if (resp.ok) {
        const data = await resp.json();
        setNodeState(prev => ({
          ...prev,
          hasApiKey: data.hasApiKey,
          clusterHealth: data.hasApiKey ? "Healthy (Secured API)" : "Offline Simulation Fallback"
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchStream();

    // Periodically update some CPU metrics to make it feel realistically alive
    const intervalCpu = setInterval(() => {
      setNodeState(prev => ({
        ...prev,
        cpu: parseFloat((11.2 + Math.random() * 4.5).toFixed(1))
      }));
    }, 5500);

    return () => {
      clearInterval(intervalCpu);
    };
  }, []);

  // Poll stream feed if active
  useEffect(() => {
    if (!isStreamActive) return;
    const intervalStream = setInterval(() => {
      fetchStream();
    }, 4500);
    return () => clearInterval(intervalStream);
  }, [isStreamActive]);

  // Sync if child changes
  useEffect(() => {
    if (lastAnalysis) {
      fetchStream();
    }
  }, [lastAnalysis]);

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-100">
      
      {/* Top Professional Header Navigation */}
      <header className="border-b border-slate-200/80 bg-white px-6 py-4 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                <Layout className="w-5 h-5 text-blue-600" />
              </span>
              <h1 className="text-xl font-display font-bold text-slate-900">
                BERT-NLP Sentiment Inference Pipeline
              </h1>
            </div>
            <p className="text-xs text-slate-450 text-slate-400 font-mono mt-0.5 ml-9">
              TRANSFORMER SERVICE MONITOR · HUGGINGFACE DEPLOYMENT BRIDGE
            </p>
          </div>

          {/* Real-time Cluster State Strip */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 text-xs font-mono">
            <div className="flex items-center space-x-1.5 border-r border-slate-200 pr-4">
              <span className={`w-2 h-2 rounded-full ${nodeState.hasApiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
              <span className="text-[11px] text-slate-500 uppercase tracking-wide">
                Cluster: <strong className="text-slate-700 font-semibold">{nodeState.clusterHealth}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-1.5 border-r border-slate-200 pr-4 text-slate-500">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>GPU CPU-LOAD:</span>
              <span className="text-slate-800 font-bold">{nodeState.cpu}%</span>
            </div>
            <div className="flex items-center space-x-1.5 border-r border-slate-200 pr-4 text-slate-500">
              <Database className="w-4 h-4 text-slate-400" />
              <span>VRAM MEM:</span>
              <span className="text-slate-800 font-bold">{nodeState.mem}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-500">
              <Activity className="w-4 h-4 text-blue-500" />
              <span>UVICORN WORKERS:</span>
              <span className="text-slate-800 font-bold">{nodeState.activeWorkers} / 3</span>
            </div>
          </div>

        </div>
      </header>

      {/* Double Sticky Tabs Navigation Bar */}
      <div className="border-b border-slate-200 bg-white/95 sticky top-[73px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex items-center space-x-6">
          <button
            id="tab-arena-select"
            onClick={() => setActiveTab("inference")}
            className={`py-3.5 text-xs font-mono font-semibold tracking-wider uppercase border-b-2 transition-all relative flex items-center space-x-1.5 ${activeTab === "inference" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-650 hover:text-slate-600"}`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Inference Arena</span>
          </button>
          <button
            id="tab-dashboard-select"
            onClick={() => setActiveTab("trends")}
            className={`py-3.5 text-xs font-mono font-semibold tracking-wider uppercase border-b-2 transition-all relative flex items-center space-x-1.5 ${activeTab === "trends" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-650 hover:text-slate-600"}`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Trends Dashboard</span>
          </button>
        </div>
      </div>

      {/* Main Grid Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {activeTab === "inference" ? (
          <>
            {/* Top Split segment */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Column 1 (Interactive Sandbox & Docs Playgrounds) */}
              <div className="lg:col-span-8 flex flex-col space-y-6">
                <InteractiveAnalyzer
                  onAnalyzeSuccess={(data) => {
                    setLastAnalysis(data);
                    fetchStream();
                  }}
                />
                <FastApiDocPlayground />
              </div>

              {/* Column 2 (Streaming Review Queue) */}
              <div className="lg:col-span-4 h-full">
                <LiveTelemetryStream
                  lastAddedItem={lastAnalysis}
                  items={streamItems}
                  isActive={isStreamActive}
                  onToggleActive={() => setIsStreamActive(!isStreamActive)}
                  onRefresh={fetchStream}
                  onInference={handleInference}
                />
              </div>

            </div>

            {/* Full-width statistics metrics and confusion matrix at bottom */}
            <TrainingMetricsExplorer />
          </>
        ) : (
          <SentimentTrendsDashboard
            streamItems={streamItems}
            onAnalyzeItem={handleInference}
          />
        )}

      </main>

      {/* Monolithic cluster bottom status */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs font-mono text-slate-450 text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span>uvicorn version 0.22.0 · fastapi v0.95.1 · torch v2.1.0+cu118</span>
          </div>
          <div>
            <span>Sentiment Transformers Cluster Management Dashboard</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
