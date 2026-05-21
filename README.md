# VisionAI — Jarvis Desktop Vision

A local, privacy-first desktop vision app powered by **Qwen2.5-VL 7B** running via Ollama. Point it at any screenshot, ask a natural language question, and get bounding boxes drawn over whatever the model finds.

---

## Prerequisites

| Requirement | Notes |
|---|---|
| [Ollama](https://ollama.com) | Must be running (`ollama serve`) |
| `qwen2.5vl:7b` model | Pull with `ollama pull qwen2.5vl:7b` |
| Python 3.10+ | For the backend |
| [uv](https://github.com/astral-sh/uv) | Python package manager |
| Node.js 18+ | For the frontend |

---

## Setup (first time only)

```bash
# 1. Clone the repo
git clone https://github.com/harinj26/visionai-jarvis.git
cd visionai-jarvis

# 2. Install backend dependencies
cd backend
uv venv .venv
uv pip install -r requirements.txt
cd ..

# 3. Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## Running the App

```bash
# Make sure Ollama is running first
ollama serve   # skip if already running in the background

# Start both servers
./start.sh
```

Then open **http://localhost:5173** in your browser.

---

## Interface Overview

```
┌─────────────────────────────────────────────────────────────┐
│  VISIONAI   JARVIS DESKTOP VISION          MODEL | LATENCY  │
├──────────────────────────────────────┬──────────────────────┤
│                                      │                      │
│                                      │   ANALYSIS           │
│         Image / Screenshot           │   RESULTS            │
│         (with bbox overlays)         │                      │
│                                      │   Detected elements  │
│                                      │   with coordinates   │
├──────────────────────────────────────┴──────────────────────┤
│  [📷] [⬆] | [GROUND]  Type your query...            [ ► ]  │
└─────────────────────────────────────────────────────────────┘
```

---

## How to Use

### 1. Load an image

You have three options:

- **Camera button (📷)** — Captures your full desktop. A **3-second countdown** appears on the button (`3 → 2 → 1`) so you can switch to the window you want before the shot fires.
- **Upload button (⬆)** — Opens a file picker to load any image from disk.
- **Drag & drop** — Drag any image file directly onto the canvas.

---

### 2. Choose a mode

Toggle between two modes using the pill button in the query bar:

| Mode | What it does |
|---|---|
| **GROUND** | Asks the model to locate specific elements and draws colored bounding boxes around them |
| **DESCRIBE** | Asks the model to describe the screen in free-form text — good for understanding layout or reading content |

---

### 3. Ask a question

Click the text input and type what you want to find or know. Pressing **Enter** or clicking **►** submits the query.

When the input is focused, a **preset drawer** appears with common queries you can click to auto-fill:

| Preset | Mode | Query |
|---|---|---|
| Find Chrome | GROUND | Google Chrome browser window |
| Find Terminal | GROUND | terminal or command line window |
| Find VS Code | GROUND | VS Code editor window |
| All Windows | GROUND | all open application windows |
| UI Buttons | GROUND | all clickable buttons and interactive elements |
| Describe Screen | DESCRIBE | Describe everything visible on this desktop screenshot |

---

### 4. Reading the results

**On the canvas:**
- Each detected element gets a colored bounding box
- Corner accents mark the exact boundaries
- A label pill shows the element name and confidence score (e.g. `VS Code 92%`)
- Hovering over a box highlights it

**In the results panel (right sidebar):**
- **Summary** — one sentence from the model about what it found
- **Detected Elements** — list of each element with its label, description, and normalized screen coordinates
- **Raw Response** — click to expand and see exactly what the model returned (useful for debugging)
- **Latency badge** — how long the model took to respond

---

## Tips

- **First query is slow** (~15–30s) while the model loads into memory. Subsequent queries are faster.
- **GROUND mode works best with specific queries.** "VS Code window" works better than "code editor".
- **Coordinates are normalized 0–1000.** The model reports positions on a 0–1000 grid regardless of actual screen resolution. The app converts these to pixel positions automatically when drawing boxes.
- **If nothing is found**, try rephrasing — e.g. instead of "browser" try "Google Chrome" or "Firefox window". You can also switch to DESCRIBE mode to see what the model actually sees.
- **temperature is set to 0.1** for consistent bounding box output. Higher values make responses more varied but less precise.

---

## Architecture

```
Browser (React)
    │  HTTP via Vite proxy
    ▼
FastAPI backend (:8000)
    │  POST /api/screenshot  →  screencapture (macOS)
    │  POST /api/analyze     →  Ollama REST API
    ▼
Ollama (:11434)
    └─ qwen2.5vl:7b
```

- **Frontend** — React + Vite + TypeScript + Tailwind CSS
- **Backend** — FastAPI + httpx (calls Ollama)
- **Model** — Qwen2.5-VL 7B (vision-language, local, no cloud)

---

## Roadmap

- [ ] Click-to-navigate — click a detected bbox to move the mouse there
- [ ] Region capture — screenshot only a specific window or area
- [ ] Voice input — speak queries using local Whisper
- [ ] Continuous mode — auto-capture on interval to track UI changes
