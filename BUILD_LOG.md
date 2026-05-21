# VisionAI — Build Log

## What Was Asked

The user wanted to build a local web application to test `qwen2.5vl:7b` (running via Ollama) as a foundation for a **Jarvis-style desktop vision assistant**. The primary goals:

1. **Visual Grounding** — identify UI elements on a screenshot and draw bounding boxes around them
2. **OCR / Price Extraction** — test the model's ability to read text and numbers
3. **Pattern Recognition** — identify chart patterns or UI structures
4. **Spatial Reasoning** — understand layout and relative positions
5. **Desktop Understanding** — the real end goal: ask "find Chrome" and have the model locate it on screen so a future Jarvis app could navigate/click to it

---

## Architecture Decisions

| Decision | Rationale |
|---|---|
| FastAPI backend | Async, lightweight, handles multipart image uploads cleanly |
| React + Vite frontend | Fast dev loop, TypeScript catches bbox math errors at compile time |
| Tailwind CSS | Dark "Jarvis" theme via utility classes, no custom CSS framework needed |
| `uv` for Python env | User's system has Python 3.14 under Homebrew (PEP 668 blocks global pip) |
| Vite proxy `/api → :8000` | Avoids CORS complexity; single origin in the browser |
| `screencapture -x` | macOS native CLI, no extra Python deps for screenshot capture |

---

## Steps Taken

### 1. Backend (`backend/`)

**`main.py`** — FastAPI application with three endpoints:

- `POST /api/screenshot` — runs `screencapture -x /tmp/visionai_cap.png`, reads it, returns base64
- `POST /api/analyze` — accepts `image` (multipart), `query`, `mode` (`ground` or `describe`); sends to Ollama at `http://localhost:11434/api/chat` with `qwen2.5vl:7b`; parses response; returns structured JSON
- bbox parsing handles two formats:
  - **JSON block** — model returns `{"elements": [{"label":…, "bbox_2d": [x1,y1,x2,y2], …}]}`
  - **Native Qwen grounding tokens** — `<ref>label</ref><box>(x1,y1),(x2,y2)</box>`

Two system prompts:
- **GROUND mode** — instructs the model to output strict JSON with `bbox_2d` arrays (0–1000 normalized coordinates)
- **DESCRIBE mode** — free-form description of the screen

**`requirements.txt`**: `fastapi`, `uvicorn[standard]`, `httpx`, `python-multipart`

Setup: `uv venv .venv && uv pip install -r requirements.txt`

### 2. Frontend (`frontend/`)

**Stack**: React 18 + Vite 5 + TypeScript 5 + Tailwind 3

**Component breakdown**:

| File | Purpose |
|---|---|
| `src/api.ts` | `captureScreenshot()`, `analyzeImage()`, `dataUrlToBlob()` |
| `src/types.ts` | `BBox`, `AnalysisResult`, `HistoryEntry`, `Mode` |
| `src/components/ImageCanvas.tsx` | Canvas overlay that draws color-coded bboxes over the image; handles drag-and-drop; ResizeObserver keeps bboxes aligned on window resize; hover highlights individual detections |
| `src/components/QueryBar.tsx` | Bottom bar: screenshot button, file upload, mode toggle (GROUND/DESCRIBE), text input, submit; preset queries drawer |
| `src/components/ResultsPanel.tsx` | Right sidebar: summary text, per-element cards with bbox coordinates, latency badge, raw response toggle |
| `src/App.tsx` | Top-level state: imageUrl/Blob, result, loading, error; orchestrates all user actions |

**Bbox coordinate math** (in `ImageCanvas.tsx`):
- Qwen2.5-VL outputs normalized 0–1000 coordinates
- Image is displayed with `object-fit: contain` (letterboxed)
- Canvas is overlaid absolutely; draws are mapped via:
  ```
  pixelX = offsetX + (bboxX / 1000) * renderedWidth
  pixelY = offsetY + (bboxY / 1000) * renderedHeight
  ```
- `ResizeObserver` redraws on container resize

**Visual design**: Dark "Jarvis" theme — `#08090e` background, `#00ff9f` neon green primary, `#00d4ff` cyan secondary, scanline CSS overlay for atmosphere.

### 3. Startup

**`start.sh`** — runs backend (`uvicorn`) and frontend (`vite dev`) in parallel; traps Ctrl+C to kill both.

---

## How to Run

```bash
# First time only: install deps
cd backend && uv venv .venv && uv pip install -r requirements.txt && cd ..
cd frontend && npm install && cd ..

# Every time: start both servers
./start.sh

# Then open:
# http://localhost:5173
```

> Make sure Ollama is running: `ollama serve` (and `ollama pull qwen2.5vl:7b` if not pulled)

---

## Qwen2.5-VL Grounding Notes

- The model uses **normalized 0–1000 coordinates** (not pixel coordinates, not 0–1 floats)
- In GROUND mode, the app instructs the model to output strict JSON — this is more reliable than parsing native `<ref>/<box>` tokens via Ollama
- `temperature: 0.1` is set for deterministic grounding (lower = more consistent bbox outputs)
- First inference after model load is slow (~30s); subsequent queries are faster

---

## Next Steps (Jarvis Roadmap)

1. **Click-to-navigate** — add `POST /api/click?x=N&y=N` that uses `pyautogui` to click the detected element's center pixel
2. **Region capture** — screenshot a specific window or region instead of the full desktop
3. **Continuous mode** — auto-capture at interval, track element movements
4. **Voice input** — use Whisper locally to accept spoken queries
5. **Action chains** — "find Chrome and open a new tab" as a multi-step instruction
