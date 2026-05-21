export interface BBox {
  label: string;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] normalized 0-1000
  description: string;
  confidence: number;
}

export interface AnalysisResult {
  analysis: string;
  bboxes: BBox[];
  raw: string;
  latency_ms: number;
  mode: string;
  model: string;
}

export interface HistoryEntry {
  id: string;
  query: string;
  mode: "ground" | "describe";
  result: AnalysisResult;
  imageUrl: string;
  timestamp: Date;
}

export type Mode = "ground" | "describe";
