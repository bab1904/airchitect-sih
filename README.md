# 🛢️ TimeAgent Link (Airchitect SIH PS 26122 - Oil India Limited)

**Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management**  
Developed for **Smart India Hackathon (SIH)** • Problem Statement **26122** (Ministry of Petroleum & Natural Gas / Oil India Limited).

---

## 📌 Executive Summary

Large-scale energy and refinery infrastructure projects like the **Crude Distillation Unit (CDU-4) Expansion** suffer from critical information disconnects between daily site progress (DPRs, WhatsApp voice-notes, paper logs) and master scheduling baselines (Primavera P6 / MS Project). 

**TimeAgent Link** bridges this operational gap using an intelligent AI schedule-linking layer:
1. **Multimodal Ingestion**: Captures voice-notes (via OpenAI Whisper AI) and unstructured text daily progress reports.
2. **Semantic WBS Alignment**: Maps unstructured activities to L5/L6 work packages using sentence embeddings (`all-MiniLM-L6-v2`) and cosine similarity.
3. **Automated & HITL Threshold Routing**: Automatically applies high-confidence actuals ($\ge$ 85%) with immutable audit trails while routing ambiguous updates (50%–84%) to a Human-in-the-Loop (HITL) reconciliation queue.
4. **Institutional Memory & Predictive Forecasting**: Vectorizes historical delay events, equipment breakdowns, and safety permit (PTW) bottlenecks to calculate duration variance matrices.

---

## 🏗️ 4-Module System Architecture

```
                                  [ Field Daily Logs & Voice Notes ]
                                                  │
                                                  ▼
                               ┌─────────────────────────────────────┐
                               │       MODULE 2: Time Agent          │
                               │  - Audio Recorder (MediaRecorder)   │
                               │  - OpenAI Whisper Speech-to-Text    │
                               │  - all-MiniLM-L6-v2 Embeddings      │
                               └──────────────────┬──────────────────┘
                                                  │
                                                  ▼
                               ┌─────────────────────────────────────┐
                               │       Threshold Routing Engine      │
                               └──────┬───────────┬───────────┬──────┘
                                      │           │           │
                     Confidence ≥ 85% │   50%-84% │     < 50% │
                                      ▼           │           ▼
               ┌─────────────────────────────┐    │   ┌─────────────────────────────┐
               │   MODULE 1: WBS Baseline    │    │   │      Unlinked Backlog       │
               │  - Auto-Update Actual Dates │    │   │  - Unmatched Activities     │
               │  - Immutable Audit Trail    │    │   │  - 'Create L6 Task' Builder │
               └──────────────▲──────────────┘    │   └──────────────┬──────────────┘
                              │                   ▼                  │
                              │       ┌───────────────────────┐      │
                              │       │ MODULE 3: HITL Queue  │      │
                              │       │ - Planner Review Card │      │
                              └───────┤ - Candidate Selector  │◄─────┘
                                      │ - 'Approve & Sync'    │
                                      └───────────────────────┘
                                                  │
                                                  ▼
                               ┌─────────────────────────────────────┐
                               │    MODULE 4: Institutional Memory   │
                               │  - Vector Query on Past Delays      │
                               │  - Duration Variance Analytics      │
                               │  - Root Cause Mitigation Matrix     │
                               └─────────────────────────────────────┘
```

---

## 🚀 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Axios |
| **Audio Processing** | HTML5 `MediaRecorder` API, OpenAI Whisper (`base` model) |
| **NLP & Vector Search** | `sentence-transformers` (`all-MiniLM-L6-v2`), NumPy, Cosine Similarity |
| **Backend API** | Python 3.11/3.13, FastAPI, Uvicorn, Pydantic v2, Python-Multipart |
| **Storage & Persistence** | SQLite (Thread-safe in-memory & disk baseline with JSON audit trails) |
| **Deployment & DevOps** | Vercel (Frontend SPA), Docker (Containerized backend with FFmpeg), Render |

---

## 📁 Repository Structure

```
airchitect-sih/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py              # Endpoints: /api/schedule, /api/ingest, /api/transcribe, /api/memory-query
│   │   ├── models/
│   │   │   └── schemas.py             # Pydantic Schemas for Tasks, Ingest, Queue, and Memory
│   │   ├── services/
│   │   │   ├── database.py            # SQLite Database Manager & CDU-4 Master Baseline
│   │   │   ├── matcher_engine.py      # Entity Extraction, SentenceTransformer & Threshold Routing
│   │   │   ├── transcriber.py         # OpenAI Whisper Audio Transcriber
│   │   │   └── institutional_memory.py# Semantic Delay Query & Variance Matrix
│   │   └── config.py                  # API Configuration & CORS Settings
│   ├── Dockerfile                     # Production Container (Python 3.11, FFmpeg, Uvicorn)
│   ├── main.py                        # FastAPI Application Entrypoint
│   └── requirements.txt               # Backend Python Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx            # Navigation Sidebar & Live Pending Badge Counters
│   │   │   ├── Header.tsx             # Project Metadata & Live Backend Health
│   │   │   ├── AuditTrailModal.tsx    # Clickable AI Confidence & Provenance Inspector
│   │   │   ├── CreateL6Modal.tsx      # Planner Modal to Bind Unlinked Logs into L6 Tasks
│   │   │   └── InstitutionalMemory.tsx# Natural Language Delay Query Dashboard
│   │   ├── views/
│   │   │   ├── ScheduleBaselineView.tsx   # View 1: Dense WBS Baseline Table
│   │   │   ├── TimeAgentIngestionView.tsx # View 2: Whisper Audio & DPR Ingestion
│   │   │   ├── ReconciliationQueueView.tsx# View 3: HITL Planner Approvals & Unlinked Log Backlog
│   │   │   └── InstitutionalMemoryView.tsx# View 4: Institutional Memory & Variance
│   │   ├── services/
│   │   │   └── api.ts                 # Dynamic Axios Client
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript Interfaces
│   │   ├── App.tsx                    # Main View Router & State Orchestration
│   │   └── main.tsx                   # React Entrypoint
│   ├── package.json                   # Frontend Dependencies
│   ├── vite.config.ts                 # Vite Configuration
│   └── vercel.json                    # Frontend SPA Rewrites
├── run_dev.bat                        # 1-Click Windows Dev Runner
├── render.yaml                        # Infrastructure-as-Code for Backend Deployment
├── vercel.json                        # Root Vercel Deployment Configuration
└── README.md
```

---

## ⚡ Quick Start & Running Locally

### Option 1: One-Click Windows Launch
Double-click `run_dev.bat` in the project root to start both backend and frontend servers simultaneously.

### Option 2: Running Terminals Separately

#### 1. Start Backend (FastAPI + Whisper + Sentence-Transformers)
```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```
*API runs on `http://localhost:8000` (Swagger documentation at `http://localhost:8000/docs`)*

#### 2. Start Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
```
*Frontend UI runs on `http://localhost:5173`*

---

## 🌐 Production Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel --prod --yes
```

### Backend (Docker / Render / Railway)
```bash
docker build -t airchitect-oil-backend ./backend
docker run -p 8000:8000 airchitect-oil-backend
```
