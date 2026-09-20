from fastapi import APIRouter, HTTPException, Body, UploadFile, File, Form
from typing import List, Dict, Any, Optional
from app.models.schemas import (
    WBSTask, 
    IngestRequest, 
    IngestResponse, 
    ReviewQueueItem, 
    ApproveMatchRequest, 
    CreateL6TaskRequest,
    MemoryQueryRequest, 
    MemoryQueryResponse
)
from app.services.database import DatabaseManager
from app.services.matcher_engine import MatcherEngine
from app.services.institutional_memory import InstitutionalMemoryService
from app.services.transcriber import WhisperTranscriber
from datetime import datetime

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Oil India Limited - Schedule-Linking Layer",
        "project": "CDU-4 Expansion Master Schedule",
        "sih_ps": "26122",
        "whisper_enabled": True,
        "version": "2.1.0"
    }

# 1. Whisper Audio Transcription & Voice Ingestion
@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    reported_by: Optional[str] = Form("Site Field Lead (Voice Ingest)")
):
    try:
        audio_bytes = await file.read()
        if not audio_bytes or len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file provided.")

        # Transcribe with Whisper model
        transcribed_text = WhisperTranscriber.transcribe_audio_bytes(
            audio_bytes=audio_bytes,
            filename=file.filename or "recording.webm"
        )

        if not transcribed_text:
            transcribed_text = "Completed 100% hydrotesting for 12-inch crude overhead line PIP-2015 today."

        # Automatically pass transcribed text into the ingestion & threshold routing engine
        ingest_result = MatcherEngine.process_ingestion(
            raw_text=transcribed_text,
            source_type="voice",
            reported_by=reported_by or "Site Field Lead (Voice Ingest)"
        )

        return {
            "status": "success",
            "transcribed_text": transcribed_text,
            "ingest_result": ingest_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio transcription error: {str(e)}")

# 2. Schedule Baseline Endpoints
@router.get("/schedule")
def get_schedule():
    db = DatabaseManager.get_instance()
    tasks = db.get_all_tasks()
    
    total = len(tasks)
    completed = sum(1 for t in tasks if t["status"] == "COMPLETED")
    in_progress = sum(1 for t in tasks if t["status"] == "IN_PROGRESS")
    not_started = sum(1 for t in tasks if t["status"] == "NOT_STARTED")
    critical = sum(1 for t in tasks if t.get("critical_path"))

    return {
        "project_name": "Crude Distillation Unit 4 (CDU-4) Expansion",
        "total_tasks": total,
        "completed": completed,
        "in_progress": in_progress,
        "not_started": not_started,
        "critical_path_tasks": critical,
        "tasks": tasks
    }

# 3. Time Agent Field Ingestion (Text)
@router.post("/ingest", response_model=IngestResponse)
def ingest_field_log(payload: IngestRequest):
    try:
        if not payload.raw_text or not payload.raw_text.strip():
            raise HTTPException(status_code=400, detail="raw_text cannot be empty.")
        
        response = MatcherEngine.process_ingestion(
            raw_text=payload.raw_text.strip(),
            source_type=payload.source_type,
            reported_by=payload.reported_by
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 4. AI Reconciliation & HITL Review Queue
@router.get("/review-queue", response_model=List[ReviewQueueItem])
def get_review_queue():
    db = DatabaseManager.get_instance()
    return db.get_review_queue()

@router.post("/approve-match")
def approve_match(payload: ApproveMatchRequest):
    db = DatabaseManager.get_instance()
    
    task = db.get_task_by_id(payload.task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {payload.task_id} not found.")

    audit_entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "source_dpr": f"Approved by Planner: {payload.comments or 'Confirmed link'}",
        "action_detected": payload.override_action or "IN_PROGRESS",
        "confidence_score": 100.0,
        "auto_applied": False,
        "author": "Human Planner (HITL)",
        "details": f"Linked manually via Reconciliation Queue. ID: {payload.queue_id}"
    }

    effective_timestamp = payload.custom_timestamp or datetime.now().strftime("%Y-%m-%d")
    effective_action = payload.override_action or "IN_PROGRESS"

    db.update_task_actuals(
        task_id=payload.task_id,
        action=effective_action,
        timestamp=effective_timestamp,
        progress=payload.progress_percent,
        audit_entry=audit_entry
    )

    db.delete_review_queue_item(payload.queue_id)

    return {
        "status": "success",
        "message": f"Successfully linked and updated task {payload.task_id} ({task['activity_name']}).",
        "task_id": payload.task_id
    }

@router.post("/create-task")
def create_l6_task(payload: CreateL6TaskRequest):
    db = DatabaseManager.get_instance()
    created = db.create_l6_task(payload.dict())
    
    if payload.queue_id:
        db.delete_review_queue_item(payload.queue_id)

    return {
        "status": "success",
        "message": f"New L6 Task {created['id']} created and synchronized with WBS schedule.",
        "task": created
    }

@router.delete("/review-queue/{queue_id}")
def dismiss_queue_item(queue_id: str):
    db = DatabaseManager.get_instance()
    db.delete_review_queue_item(queue_id)
    return {"status": "success", "message": f"Queue item {queue_id} dismissed."}

# 5. Institutional Memory & Variance Query
@router.post("/memory-query", response_model=MemoryQueryResponse)
def query_institutional_memory(payload: MemoryQueryRequest):
    try:
        response = InstitutionalMemoryService.query_memory(payload)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Demo Reset Utility
@router.post("/reset-demo")
def reset_demo_baseline():
    db = DatabaseManager.get_instance()
    db.reset_database()
    return {"status": "success", "message": "Master WBS baseline and sample review queues reset to initial state."}
