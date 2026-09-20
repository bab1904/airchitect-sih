export interface AuditEntry {
  timestamp: string
  source_dpr: string
  action_detected: string
  confidence_score: number
  auto_applied: boolean
  author: string
  details?: string
}

export interface WBSTask {
  id: string
  wbs_level: 'L5' | 'L6'
  wbs_code: string
  discipline: 'Civil' | 'Piping' | 'Electrical' | 'Instrumentation' | 'Mechanical' | string
  activity_name: string
  planned_start: string
  planned_finish: string
  actual_start?: string | null
  actual_finish?: string | null
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED'
  progress_percent: number
  critical_path: boolean
  audit_trail: AuditEntry[]
}

export interface ScheduleResponse {
  project_name: string
  total_tasks: number
  completed: number
  in_progress: number
  not_started: number
  critical_path_tasks: number
  tasks: WBSTask[]
}

export interface ExtractedEntities {
  discipline: string
  timestamp: string
  action: 'START' | 'FINISH' | 'IN_PROGRESS' | 'DELAY' | string
  progress_percent?: number | null
  delay_reason?: string | null
  location?: string | null
}

export interface MatchCandidate {
  task_id: string
  activity_name: string
  discipline: string
  wbs_level: string
  similarity_score: number
}

export interface IngestResponse {
  ingest_id: string
  raw_text: string
  extracted_entities: ExtractedEntities
  top_matches: MatchCandidate[]
  best_confidence: number
  routing_decision: 'AUTO_APPLIED' | 'HITL_REVIEW_REQUIRED' | 'UNLINKED_ACTIVITY'
  matched_task_id?: string | null
  matched_task_name?: string | null
  message: string
}

export interface ReviewQueueItem {
  queue_id: string
  raw_text: string
  source_type: 'text' | 'voice'
  reported_by: string
  discipline: string
  timestamp: string
  action: string
  progress_percent?: number | null
  delay_reason?: string | null
  confidence_score: number
  suggested_task_id?: string | null
  suggested_task_name?: string | null
  top_candidates: MatchCandidate[]
  status: 'PENDING_REVIEW' | 'UNLINKED_ACTIVITY'
  created_at: string
}

export interface DelayMemoryRecord {
  log_id: string
  task_id?: string | null
  task_name?: string | null
  discipline: string
  supervisor_quote: string
  root_cause: string
  planned_duration_days?: number
  actual_duration_days?: number
  variance_days: number
  relevance_score: number
  logged_at: string
}

export interface VarianceMatrixItem {
  discipline: string
  planned_avg_days: number
  actual_avg_days: number
  variance_days: number
  primary_delay_driver: string
  ai_risk_forecast: string
}

export interface MemoryQueryResponse {
  query: string
  top_matches: DelayMemoryRecord[]
  variance_matrix: VarianceMatrixItem[]
}
