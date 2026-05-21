import { useState } from "react";
import type { AnalysisResult, BBox } from "../types";

const BBOX_COLORS = [
  "#00ff9f",
  "#00d4ff",
  "#ffd166",
  "#ff6b9d",
  "#c77dff",
  "#ff9a3c",
];

interface Props {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
}

export function ResultsPanel({ result, isLoading, error }: Props) {
  const [showRaw, setShowRaw] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="text-[10px] text-jarvis-muted tracking-widest">ANALYSIS</div>
        {[80, 60, 90, 50].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded bg-jarvis-border animate-pulse"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-[10px] text-jarvis-muted tracking-widest mb-3">ERROR</div>
        <div className="text-jarvis-red text-xs bg-jarvis-red/10 border border-jarvis-red/30 rounded p-3">
          {error}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="text-3xl opacity-20 mb-3">◎</div>
        <p className="text-jarvis-muted text-xs tracking-wider">
          AWAITING QUERY
          <br />
          <span className="text-[10px]">
            Capture or drop a screenshot, then ask a question
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-jarvis-border flex-shrink-0">
        <span className="text-[10px] text-jarvis-muted tracking-widest">ANALYSIS</span>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              result.mode === "ground"
                ? "bg-jarvis-neon/20 text-jarvis-neon"
                : "bg-jarvis-cyan/20 text-jarvis-cyan"
            }`}
          >
            {result.mode.toUpperCase()}
          </span>
          <span className="text-[10px] text-jarvis-amber bg-jarvis-amber/10 px-1.5 py-0.5 rounded">
            {result.latency_ms}ms
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary */}
        <div>
          <div className="text-[10px] text-jarvis-muted tracking-widest mb-2">SUMMARY</div>
          <p className="text-jarvis-text text-xs leading-relaxed">{result.analysis}</p>
        </div>

        {/* Detected elements */}
        {result.bboxes.length > 0 && (
          <div>
            <div className="text-[10px] text-jarvis-muted tracking-widest mb-2">
              DETECTED ELEMENTS ({result.bboxes.length})
            </div>
            <div className="space-y-2">
              {result.bboxes.map((box: BBox, i: number) => (
                <ElementCard key={i} box={box} index={i} />
              ))}
            </div>
          </div>
        )}

        {result.mode === "ground" && result.bboxes.length === 0 && (
          <div className="text-jarvis-muted text-xs bg-jarvis-border/30 rounded p-3">
            No elements located. Try rephrasing your query or switching to Describe mode.
          </div>
        )}

        {/* Raw toggle */}
        <div>
          <button
            onClick={() => setShowRaw((v) => !v)}
            className="text-[10px] text-jarvis-muted hover:text-jarvis-text tracking-widest flex items-center gap-1 transition-colors"
          >
            <span>{showRaw ? "▾" : "▸"}</span> RAW RESPONSE
          </button>
          {showRaw && (
            <pre className="mt-2 text-[10px] text-jarvis-muted bg-jarvis-border/20 rounded p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {result.raw}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function ElementCard({ box, index }: { box: BBox; index: number }) {
  const color = BBOX_COLORS[index % BBOX_COLORS.length];
  const [x1, y1, x2, y2] = box.bbox;
  const pct = (v: number) => `${(v / 10).toFixed(1)}%`;

  return (
    <div
      className="rounded p-2.5 border text-xs space-y-1"
      style={{ borderColor: color + "40", background: color + "08" }}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium" style={{ color }}>
          {box.label}
        </span>
        <span className="text-[10px]" style={{ color: color + "aa" }}>
          {Math.round(box.confidence * 100)}% conf
        </span>
      </div>
      {box.description && (
        <p className="text-jarvis-muted text-[11px] leading-relaxed">{box.description}</p>
      )}
      <div className="text-[10px] text-jarvis-muted font-mono">
        ({pct(x1)}, {pct(y1)}) → ({pct(x2)}, {pct(y2)})
      </div>
    </div>
  );
}
