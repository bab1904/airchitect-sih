from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AuditEntry(BaseModel):
    timestamp: str
    source_dpr: str
    action_detected: str
    confidence_score: float
    auto_applied: bool
    author: str = "TimeAgent AI"
    details: Optional[str] = None

class WBSTask(BaseModel):
    id: str = Field(..., example="CIV-L5-1041")
    wbs_level: str = Field(..., example="L5")
    wbs_code: str = Field(..., example="1.3.2.1")
    discipline: str = Field(..., example="Civil")
    activity_name: str = Field(..., example="CDU-4 Column Main Raft Foundation Concrete Pouring")
    planned_start: str = Field(..., example="2026-09-01")
    planned_finish: str = Field(..., example="2026-09-15")
    actual_start: Optional[str] = None
    actual_finish: Optional[str] = None
    status: str = Field(default="NOT_STARTED", example="IN_PROGRESS") # NOT_STARTED, IN_PROGRESS, COMPLETED, DELAYED
    progress_percent: int = Field(default=0, ge=0, le=100)
    critical_path: bool = False
    audit_trail: List[AuditEntry] = []

class ExtractedEntities(BaseModel):
    discipline: str
    timestamp: str
    action: str # START, FINISH, IN_PROGRESS, DELAY
    progress_percent: Optional[int] = None
    delay_reason: Optional[str] = None
    location: Optional[str] = None

class MatchCandidate(BaseModel):
    task_id: str
    activity_name: str
    discipline: str
    wbs_level: str
    similarity_score: float

class IngestRequest(BaseModel):
    raw_text: str = Field(..., example="Completed 100% hydrotesting for 12-inch crude overhead line PIP-2015 today.")
    source_type: str = Field(default="text", example="text") # text or voice
    reported_by: str = Field(default="Site Engineer / Field Lead", example="Rajesh Sharma (Civil Lead)")

class IngestResponse(BaseModel):
    ingest_id: str
    raw_text: str
    extracted_entities: ExtractedEntities
    top_matches: List[MatchCandidate]
    best_confidence: float
    routing_decision: str # AUTO_APPLIED, HITL_REVIEW_REQUIRED, UNLINKED_ACTIVITY
    matched_task_id: Optional[str] = None
    matched_task_name: Optional[str] = None
    message: str

class ReviewQueueItem(BaseModel):
    queue_id: str
    raw_text: str
    source_type: str
    reported_by: str
    discipline: str
    timestamp: str
    action: str
    progress_percent: Optional[int] = None
    delay_reason: Optional[str] = None
    confidence_score: float
    suggested_task_id: Optional[str] = None
    suggested_task_name: Optional[str] = None
    top_candidates: List[MatchCandidate] = []
    status: str # PENDING_REVIEW or UNLINKED_ACTIVITY
    created_at: str

class ApproveMatchRequest(BaseModel):
    queue_id: str
    task_id: str
    override_action: Optional[str] = None # START, FINISH, IN_PROGRESS
    custom_timestamp: Optional[str] = None
    progress_percent: Optional[int] = None
    comments: Optional[str] = "Approved by Lead Project Planner"

class CreateL6TaskRequest(BaseModel):
    queue_id: Optional[str] = None
    parent_l5_id: Optional[str] = "CIV-L5-1041"
    discipline: str
    activity_name: str
    planned_start: str
    planned_finish: str
    actual_start: Optional[str] = None
    actual_finish: Optional[str] = None
    initial_status: str = "IN_PROGRESS"
    progress_percent: Optional[int] = 25

class MemoryQueryRequest(BaseModel):
    query: str = Field(..., example="What causes delays in 24-inch piping erection?")
    discipline: Optional[str] = None
    limit: int = 3

class DelayMemoryRecord(BaseModel):
    log_id: str
    task_id: Optional[str] = None
    task_name: Optional[str] = None
    discipline: str
    supervisor_quote: str
    root_cause: str
    planned_duration_days: Optional[int] = 14
    actual_duration_days: Optional[int] = 18
    variance_days: int = 4
    relevance_score: float
    logged_at: str

class VarianceMatrixItem(BaseModel):
    discipline: str
    planned_avg_days: float
    actual_avg_days: float
    variance_days: float
    primary_delay_driver: str
    ai_risk_forecast: str

class MemoryQueryResponse(BaseModel):
    query: str
    top_matches: List[DelayMemoryRecord]
    variance_matrix: List[VarianceMatrixItem]
