import { useState, useCallback } from "react";
import { ImageCanvas } from "./components/ImageCanvas";
import { QueryBar } from "./components/QueryBar";
import { ResultsPanel } from "./components/ResultsPanel";
import { captureScreenshot, analyzeImage, dataUrlToBlob } from "./api";
import type { AnalysisResult, Mode } from "./types";

export default function App() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const [queryCount, setQueryCount] = useState(0);

  const loadImage = useCallback((url: string, blob: Blob) => {
    setImageUrl(url);
    setImageBlob(blob);
    setResult(null);
    setError(null);
  }, []);

  const handleCapture = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = await captureScreenshot();
      const blob = await dataUrlToBlob(url);
      loadImage(url, blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Screenshot failed");
    } finally {
      setIsLoading(false);
    }
  }, [loadImage]);

  const handleFileSelect = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      loadImage(url, file);
    },
    [loadImage]
  );

  const handleDrop = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      loadImage(url, file);
    },
    [loadImage]
  );

  const handleSubmit = useCallback(
    async (query: string, mode: Mode) => {
      if (!imageBlob) return;
      setIsLoading(true);
      setError(null);
      setLastQuery(query);
      try {
        const res = await analyzeImage(imageBlob, query, mode);
        setResult(res);
        setQueryCount((c) => c + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Analysis failed");
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    },
    [imageBlob]
  );

  return (
    <div className="flex flex-col h-screen bg-jarvis-bg font-mono overflow-hidden">
      {/* Scanline overlay */}
      <div className="scan-line absolute inset-0 pointer-events-none z-50 opacity-40" />

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-jarvis-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-jarvis-red animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-jarvis-amber" />
            <div className="w-2 h-2 rounded-full bg-jarvis-neon" />
          </div>
          <span className="text-jarvis-neon text-sm font-semibold tracking-widest neon-glow">
            VISIONAI
          </span>
          <span className="text-jarvis-muted text-xs tracking-wider">
            JARVIS DESKTOP VISION
          </span>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-jarvis-muted">
          <span>
            MODEL:{" "}
            <span className="text-jarvis-cyan">qwen2.5vl:7b</span>
          </span>
          {queryCount > 0 && (
            <span>
              QUERIES:{" "}
              <span className="text-jarvis-neon">{queryCount}</span>
            </span>
          )}
          {result && (
            <span>
              LATENCY:{" "}
              <span className="text-jarvis-amber">{result.latency_ms}ms</span>
            </span>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-3 overflow-hidden">
            <ImageCanvas
              imageUrl={imageUrl}
              bboxes={result?.bboxes ?? []}
              onDrop={handleDrop}
              isLoading={isLoading && !!imageUrl}
            />
          </div>

          {/* Query bar */}
          <div className="px-3 pb-3 flex-shrink-0">
            {lastQuery && result && (
              <div className="mb-2 px-1 text-[10px] text-jarvis-muted tracking-wider">
                LAST:{" "}
                <span className="text-jarvis-text">"{lastQuery}"</span>
                {" — "}
                <span
                  className={
                    result.bboxes.length > 0
                      ? "text-jarvis-neon"
                      : "text-jarvis-muted"
                  }
                >
                  {result.bboxes.length > 0
                    ? `${result.bboxes.length} element(s) found`
                    : "nothing found"}
                </span>
              </div>
            )}
            <QueryBar
              onSubmit={handleSubmit}
              onCapture={handleCapture}
              onFileSelect={handleFileSelect}
              isLoading={isLoading}
              hasImage={!!imageUrl}
            />
          </div>
        </div>

        {/* Results sidebar */}
        <div className="w-72 border-l border-jarvis-border flex-shrink-0 bg-jarvis-card flex flex-col overflow-hidden">
          <ResultsPanel result={result} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  );
}
