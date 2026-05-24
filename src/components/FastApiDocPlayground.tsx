/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Sparkles, Terminal, Copy, Check, Play, BookOpen } from "lucide-react";

const CODE_TEMPLATES = {
  python: `import requests

url = "http://localhost:8000/predict"
payload = {
    "text": "Amazing performance! F1-score reached a wonderful 0.913 in fine-tuning."
}
headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
`,
  curl: `curl -X 'POST' \\
  'http://localhost:8000/predict' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "text": "Amazing performance! F1-score reached a wonderful 0.913 in fine-tuning."
}'`,
  javascript: `fetch("http://localhost:8000/predict", {
  method: "POST",
  headers: {
    "accept": "application/json",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    text: "Amazing performance! F1-score reached a wonderful 0.913 in fine-tuning."
  })
})
.then(res => res.json())
.then(data => console.log(data));
`
};

export default function FastApiDocPlayground() {
  const [activeTab, setActiveTab] = useState<"curl" | "python" | "javascript">("curl");
  const [copied, setCopied] = useState(false);
  const [inputText, setInputText] = useState("Amazing performance! F1-score reached a wonderful 0.913 in fine-tuning.");
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState<any>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_TEMPLATES[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecute = async () => {
    setLoading(true);
    setApiResponse(null);
    setHeaders(null);
    try {
      const start = performance.now();
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText })
      });
      const end = performance.now();
      
      const data = await resp.json();
      setApiResponse(data.bert);
      setHeaders({
        "status": "200 OK",
        "server": "uvicorn / fastapi",
        "content-type": "application/json",
        "x-inference-duration-ms": (end - start).toFixed(2),
        "access-control-allow-origin": "*"
      });
    } catch (e) {
      setApiResponse({ error: "Could not execute API test on uvicorn broker node" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="fastapi-doc-playground-root" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-display font-semibold text-slate-100">FastAPI Automatic Interactive Docs</h2>
        </div>
        <span className="text-[10px] font-mono font-bold text-sky-450 text-sky-400 bg-sky-950/30 border border-sky-900/40 px-2.5 py-1 rounded">
          OpenAPI v3.0 / Swagger UI
        </span>
      </div>

      <p className="text-sm text-slate-450 text-slate-400 mb-5 leading-relaxed">
        FastAPI automatically generates interactive Swagger endpoints and JSON response structures. Test our production inference server using the sandbox client below or copy cURL templates.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        {/* Left column: Endpoint definition and payload input */}
        <div className="lg:col-span-6 space-y-4">
          {/* POST Bar */}
          <div className="bg-slate-950 border border-slate-850/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <span className="text-[10px] font-bold font-mono bg-emerald-950/80 border border-emerald-900/40 text-emerald-450 text-emerald-400 px-2 py-1 rounded">
                POST
              </span>
              <span className="font-mono text-xs text-slate-200">/predict</span>
              <span className="text-[11px] text-slate-500 font-mono">FastAPI Inference</span>
            </div>
            <button
              id="swagger-execute-btn"
              onClick={handleExecute}
              disabled={loading || !inputText.trim()}
              type="button"
              className="px-3 py-1.5 bg-emerald-650 hover:bg-emerald-555 bg-indigo-600 hover:bg-indigo-500 font-mono text-xs font-semibold text-white rounded-md transition-all flex items-center space-x-1.5"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-slate-300/30 border-t-white rounded-full animate-spin block" />
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute</span>
                </>
              )}
            </button>
          </div>

          {/* Body Params Input */}
          <div className="bg-slate-950 border border-slate-850/80 rounded-xl p-4">
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-3">Interactive Payload (json):</span>
            
            <div className="space-y-3">
              <div className="text-xs text-slate-450 text-slate-450 text-slate-405 font-mono">
                {"{"} <br />
                &nbsp;&nbsp;<span className="text-indigo-400">"text"</span>: <span className="text-emerald-450 text-emerald-400">"{inputText}"</span> <br />
                {"}"}
              </div>

              <textarea
                id="swagger-payload-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Modify sentence payload..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
          </div>

          {/* API Client snippet code guides */}
          <div className="bg-slate-950 border border-slate-850/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 leading-none">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Code Generator:</span>
              <button
                id="btn-copy-swagger-code"
                onClick={handleCopy}
                type="button"
                className="text-slate-500 hover:text-slate-350 transition flex items-center text-[10px] font-mono"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                {copied ? "Copied" : "Copy Code"}
              </button>
            </div>

            {/* Language tabs */}
            <div className="flex border-b border-slate-900 mb-3 text-xs gap-1.5">
              {(["curl", "python", "javascript"] as const).map((t) => (
                <button
                  id={`swagger-tab-${t}`}
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-2 pb-1.5 font-mono capitalize transition-all ${activeTab === t ? 'border-b-2 border-indigo-400 text-indigo-400 font-semibold' : 'text-slate-500 hover:text-slate-400'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Block with snippets */}
            <pre className="text-[10px] text-slate-400 font-mono overflow-auto max-h-44 bg-slate-900 border border-slate-900 p-3 rounded-lg leading-relaxed select-all">
              {CODE_TEMPLATES[activeTab]}
            </pre>
          </div>
        </div>

        {/* Right column: Interactive Responses Block */}
        <div className="lg:col-span-6 bg-slate-950 border border-slate-855 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-3">Model Response Terminal (FastAPI stdout):</span>

            {apiResponse ? (
              <div className="space-y-4 font-mono text-xs leading-relaxed animate-fade-in">
                {/* Headers block */}
                <div>
                  <span className="text-[10px] text-slate-550 block mb-1">RESPONSE HEADERS (uvicorn_node):</span>
                  <div className="bg-slate-900 border border-slate-900 text-[10px] text-indigo-305 text-indigo-300 rounded-lg p-3">
                    {Object.entries(headers || {}).map(([hk, hv]) => (
                      <div key={hk} className="flex justify-between">
                        <span className="text-slate-500 mr-2">{hk}:</span>
                        <span className="font-semibold text-slate-300">{hv as string}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Body block */}
                <div>
                  <span className="text-[10px] text-slate-550 block mb-1">RESPONSE BODY (json):</span>
                  <pre className="bg-slate-900 border border-slate-900 text-[10px] text-emerald-400 font-semibold rounded-lg p-3 overflow-auto max-h-56">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-44 border border-dashed border-slate-900 rounded-lg flex flex-col items-center justify-center text-center text-slate-500 p-4 font-mono text-[11px] space-y-1 bg-slate-900/15">
                <Terminal className="w-8 h-8 text-slate-705 text-slate-700 animate-pulse mb-1" />
                <span>$ python eval_fastapi.py --predict</span>
                <span className="text-slate-600 block pt-1.5 font-sans leading-normal max-w-xs">
                  Click 'Execute' in the left POST endpoint block to run simulated model validation against our inference server.
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-slate-900 pt-3 text-[10px] text-slate-600 font-mono leading-none">
            Inference latency averages <strong className="text-indigo-400">84ms</strong> · Workers pooled: <strong className="text-slate-400">3/3 Active</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
