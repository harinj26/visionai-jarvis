import base64
import json
import re
import subprocess
import time

import httpx
from fastapi import FastAPI, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="VisionAI Desktop")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434"
MODEL = "qwen2.5vl:7b"

GROUND_SYSTEM = """You are a desktop vision assistant. Analyze the screenshot and locate the requested element(s).

Respond ONLY with valid JSON in this exact format:
{
  "found": true,
  "elements": [
    {
      "label": "element name",
      "bbox_2d": [x1, y1, x2, y2],
      "description": "brief description of what it is and where",
      "confidence": 0.95
    }
  ],
  "summary": "one sentence summary of what was found"
}

Rules:
- bbox_2d coordinates are normalized 0-1000 (0,0 = top-left, 1000,1000 = bottom-right)
- Return ALL matching elements if multiple exist
- If nothing found, set found=false and elements=[]
- Output ONLY the JSON object, no other text"""

DESCRIBE_SYSTEM = """You are a desktop vision assistant. Analyze the screenshot and answer the user's question.
Be specific about positions (top-left, center, etc.), visual hierarchy, and element details.
Describe what you observe accurately and concisely."""


def parse_bboxes_from_response(content: str) -> tuple[list[dict], str]:
    """Extract bboxes and summary from model response. Returns (bboxes, summary)."""
    bboxes = []
    summary = content

    # Try JSON block first (```json ... ```)
    json_block = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", content)
    raw_json = json_block.group(1) if json_block else None

    # Fall back to bare JSON object
    if not raw_json:
        bare = re.search(r"\{[\s\S]*\}", content)
        raw_json = bare.group(0) if bare else None

    if raw_json:
        try:
            parsed = json.loads(raw_json)
            summary = parsed.get("summary", content)
            for el in parsed.get("elements", []):
                bbox = el.get("bbox_2d", [])
                if len(bbox) == 4:
                    bboxes.append(
                        {
                            "label": el.get("label", "element"),
                            "bbox": [int(v) for v in bbox],
                            "description": el.get("description", ""),
                            "confidence": float(el.get("confidence", 1.0)),
                        }
                    )
            return bboxes, summary
        except (json.JSONDecodeError, ValueError):
            pass

    # Fall back to Qwen native grounding format: <ref>label</ref><box>(x1,y1),(x2,y2)</box>
    for match in re.finditer(
        r"<ref>(.*?)</ref>\s*<box>\((\d+),(\d+)\),\((\d+),(\d+)\)</box>", content
    ):
        bboxes.append(
            {
                "label": match.group(1),
                "bbox": [
                    int(match.group(2)),
                    int(match.group(3)),
                    int(match.group(4)),
                    int(match.group(5)),
                ],
                "description": "",
                "confidence": 1.0,
            }
        )

    return bboxes, summary


@app.post("/api/screenshot")
async def capture_screenshot():
    """Capture the full desktop and return as base64 PNG."""
    path = "/tmp/visionai_cap.png"
    result = subprocess.run(
        ["screencapture", "-x", "-t", "png", path],
        capture_output=True,
    )
    if result.returncode != 0:
        raise HTTPException(500, f"screencapture failed: {result.stderr.decode()}")

    with open(path, "rb") as f:
        data = f.read()

    return {"image": base64.b64encode(data).decode(), "format": "png"}


@app.post("/api/analyze")
async def analyze(
    image: UploadFile,
    query: str = Form(...),
    mode: str = Form("ground"),
):
    """Send image + query to Qwen2.5-VL and return parsed results."""
    image_bytes = await image.read()
    image_b64 = base64.b64encode(image_bytes).decode()

    system = GROUND_SYSTEM if mode == "ground" else DESCRIBE_SYSTEM
    prompt = (
        f"Find and locate: {query}" if mode == "ground" else query
    )

    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": MODEL,
                    "messages": [
                        {"role": "system", "content": system},
                        {
                            "role": "user",
                            "content": prompt,
                            "images": [image_b64],
                        },
                    ],
                    "stream": False,
                    "options": {"temperature": 0.1},
                },
            )
        resp.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(504, "Ollama timed out — model may still be loading")
    except httpx.HTTPError as e:
        raise HTTPException(502, f"Ollama error: {e}")

    latency_ms = int((time.time() - start) * 1000)
    data = resp.json()
    content = data["message"]["content"]

    bboxes, summary = parse_bboxes_from_response(content)

    return {
        "analysis": summary,
        "bboxes": bboxes,
        "raw": content,
        "latency_ms": latency_ms,
        "mode": mode,
        "model": MODEL,
    }
