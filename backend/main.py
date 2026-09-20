from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router

app = FastAPI(
    title="Oil India Limited - Intelligent Data Capture & Schedule-Linking Layer",
    description="SIH PS 26122: Intelligent NLP/Audio Ingestion, Semantic L5/L6 WBS Schedule Linking, HITL Reconciliation, and Institutional Memory.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "service": "OIL Schedule-Linking Layer (SIH PS 26122)",
        "project": "CDU-4 Expansion Baseline",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
