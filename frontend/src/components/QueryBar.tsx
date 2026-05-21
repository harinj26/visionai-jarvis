import { useState, useRef, type KeyboardEvent } from "react";
import type { Mode } from "../types";

const PRESETS: { label: string; query: string; mode: Mode }[] = [
  { label: "Find Chrome", query: "Google Chrome browser window", mode: "ground" },
  { label: "Find Terminal", query: "terminal or command line window", mode: "ground" },
  { label: "Find VS Code", query: "VS Code editor window", mode: "ground" },
  { label: "All Windows", query: "all open application windows", mode: "ground" },
  { label: "UI Buttons", query: "all clickable buttons and interactive elements", mode: "ground" },
  { label: "Describe Screen", query: "Describe everything visible on this desktop screenshot in detail", mode: "describe" },
];

interface Props {
  onSubmit: (query: string, mode: Mode) => void;
  onCapture: () => void;
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  hasImage: boolean;
}

export function QueryBar({ onSubmit, onCapture, onFileSelect, isLoading, hasImage }: Props) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("ground");
  const [showPresets, setShowPresets] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const q = query.trim();
    if (!q || isLoading || !hasImage) return;
    onSubmit(q, mode);
    setShowPresets(false);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
    if (e.key === "Escape") setShowPresets(false);
  };

  const applyPreset = (p: (typeof PRESETS)[0]) => {
    setQuery(p.query);
    setMode(p.mode);
    setShowPresets(false);
  };

  return (
    <div className="relative">
      {/* Presets dropdown */}
      {showPresets && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-jarvis-card border border-jarvis-border rounded-lg overflow-hidden z-10">
          <div className="px-3 py-2 text-[10px] text-jarvis-muted tracking-widest border-b border-jarvis-border">
            QUICK PRESETS
          </div>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="w-full text-left px-3 py-2 text-xs text-jarvis-text hover:bg-jarvis-border/50 flex items-center gap-3 transition-colors"
            >
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  p.mode === "ground"
                    ? "bg-jarvis-neon/20 text-jarvis-neon"
                    : "bg-jarvis-cyan/20 text-jarvis-cyan"
                }`}
              >
                {p.mode.toUpperCase()}
              </span>
              <span>{p.query}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 bg-jarvis-card border border-jarvis-border rounded-lg p-2">
        {/* Screenshot capture */}
        <button
          onClick={onCapture}
          disabled={isLoading}
          title="Capture desktop screenshot"
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded bg-jarvis-border hover:bg-jarvis-neon/20 hover:text-jarvis-neon text-jarvis-muted transition-colors disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>

        {/* File upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          title="Upload image file"
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded bg-jarvis-border hover:bg-jarvis-cyan/20 hover:text-jarvis-cyan text-jarvis-muted transition-colors disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileSelect(f);
            e.target.value = "";
          }}
        />

        {/* Divider */}
        <div className="w-px h-6 bg-jarvis-border" />

        {/* Mode toggle */}
        <button
          onClick={() => setMode((m) => (m === "ground" ? "describe" : "ground"))}
          className={`flex-shrink-0 text-[10px] px-2 py-1 rounded font-medium tracking-wider transition-colors ${
            mode === "ground"
              ? "bg-jarvis-neon/20 text-jarvis-neon"
              : "bg-jarvis-cyan/20 text-jarvis-cyan"
          }`}
        >
          {mode === "ground" ? "GROUND" : "DESCRIBE"}
        </button>

        {/* Query input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setShowPresets(true)}
          placeholder={
            mode === "ground"
              ? 'Find element... (e.g. "VS Code window")'
              : "Ask about the screen..."
          }
          className="flex-1 bg-transparent text-jarvis-text text-sm placeholder-jarvis-muted outline-none"
        />

        {/* Submit */}
        <button
          onClick={submit}
          disabled={isLoading || !query.trim() || !hasImage}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded bg-jarvis-neon/20 text-jarvis-neon hover:bg-jarvis-neon/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-jarvis-neon border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22,2 15,22 11,13 2,9" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
