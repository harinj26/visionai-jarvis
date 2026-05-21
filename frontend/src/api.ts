import type { AnalysisResult } from "./types";

export async function captureScreenshot(): Promise<string> {
  const resp = await fetch("/api/screenshot", { method: "POST" });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(err.detail ?? "Screenshot failed");
  }
  const data = await resp.json();
  return `data:image/png;base64,${data.image}`;
}

export async function analyzeImage(
  imageBlob: Blob,
  query: string,
  mode: "ground" | "describe"
): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("image", imageBlob, "image.png");
  form.append("query", query);
  form.append("mode", mode);

  const resp = await fetch("/api/analyze", { method: "POST", body: form });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(err.detail ?? "Analysis failed");
  }
  return resp.json();
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
