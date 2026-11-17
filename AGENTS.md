# visionai-jarvis

Rules for every coding agent (Claude Code, Codex, Pi, DeepSeek harness). Read `README.md` for setup and run steps.

## What this is
A local desktop vision app: ask a question about a screenshot and get bounding boxes drawn over the answer. Qwen2.5-VL 7B runs through Ollama.

## Layout and run
- `backend/` — Python API (`uv venv .venv`, `uv pip install -r requirements.txt`)
- `frontend/` — Node 18+ web UI
- `start.sh` — starts both
- Needs `ollama serve` and the `qwen2.5vl:7b` model.

## Project-specific rules
- The GitHub repository is public. Do not commit screenshots of the desktop, personal data or anything private.
- Do not pull, replace or remove Ollama models without asking.

## Rules
- This folder is the only home of this app. Do not create copies elsewhere.
- Never commit `.env`, credentials, cookies or saved login sessions. New variables go in `.env.example` with empty values.
- Do not commit dependencies (`.venv`, `node_modules`), build output or large media.
- Ask before deleting files, changing Git history, or pushing.

## Current state
<!-- Updated at each handoff: what works, what is in progress, what is next. -->
