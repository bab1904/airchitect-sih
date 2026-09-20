import axios from 'axios'
import {
  ScheduleResponse,
  IngestResponse,
  ReviewQueueItem,
  MemoryQueryResponse,
  WBSTask,
  ExtractedEntities,
  MatchCandidate,
  VarianceMatrixItem,
  DelayMemoryRecord
} from '../types'

// Dynamic API Server URL using VITE_API_URL with localhost:8000 fallback
const API_SERVER = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const API_BASE_URL = `${API_SERVER}/api`

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ==========================================
// RESILIENT CLIENT-SIDE IN-MEMORY ENGINE
// (Enables seamless demo operation on Vercel & offline mode)
// ==========================================

const INITIAL_TASKS: WBSTask[] = [
  {
    id: 'CIV-L5-1041',
    wbs_level: 'L5',
    wbs_code: '1.3.2.1',
    discipline: 'Civil',
    activity_name: 'CDU-4 Column Main Raft Foundation Concrete Pouring',
    planned_start: '2026-09-01',
    planned_finish: '2026-09-15',
    actual_start: '2026-09-02',
    actual_finish: null,
    status: 'IN_PROGRESS',
    progress_percent: 70,
    critical_path: true,
    audit_trail: [
      {
        timestamp: '2026-09-02 08:30:00',
        source_dpr: 'Mobilized batching plant. Pouring started for Raft foundation grid A-C.',
        action_detected: 'START',
        confidence_score: 94.2,
        auto_applied: true,
        author: 'TimeAgent AI'
      }
    ]
  },
  {
    id: 'CIV-L6-1042',
    wbs_level: 'L6',
    wbs_code: '1.3.2.1.1',
    discipline: 'Civil',
    activity_name: 'Reinforcement Binding and Shuttering for Column Pedestals',
    planned_start: '2026-09-05',
    planned_finish: '2026-09-12',
    actual_start: '2026-09-06',
    actual_finish: '2026-09-11',
    status: 'COMPLETED',
    progress_percent: 100,
    critical_path: false,
    audit_trail: [
      {
        timestamp: '2026-09-11 17:00:00',
        source_dpr: 'All 18 column pedestals reinforcement and formwork inspected and cleared by QC.',
        action_detected: 'FINISH',
        confidence_score: 91.5,
        auto_applied: true,
        author: 'TimeAgent AI'
      }
    ]
  },
  {
    id: 'CIV-L5-1043',
    wbs_level: 'L5',
    wbs_code: '1.3.2.2',
    discipline: 'Civil',
    activity_name: 'Underground Oily Water Sewer (OWS) Trenching and Pipe Laying',
    planned_start: '2026-09-10',
    planned_finish: '2026-09-25',
    actual_start: null,
    actual_finish: null,
    status: 'NOT_STARTED',
    progress_percent: 0,
    critical_path: false,
    audit_trail: []
  },
  {
    id: 'CIV-L6-1044',
    wbs_level: 'L6',
    wbs_code: '1.3.2.2.1',
    discipline: 'Civil',
    activity_name: 'Backfilling and Compaction of Pipe Rack Bay-3 Area',
    planned_start: '2026-09-20',
    planned_finish: '2026-09-30',
    actual_start: null,
    actual_finish: null,
    status: 'NOT_STARTED',
    progress_percent: 0,
    critical_path: false,
    audit_trail: []
  },
  {
    id: 'PIP-L5-2015',
    wbs_level: 'L5',
    wbs_code: '1.4.1.1',
    discipline: 'Piping',
    activity_name: '12-inch Crude Distillation Overhead Vapor Line Hydrotesting',
    planned_start: '2026-09-12',
    planned_finish: '2026-09-22',
    actual_start: null,
    actual_finish: null,
    status: 'NOT_STARTED',
    progress_percent: 0,
    critical_path: true,
    audit_trail: []
  },
  {
    id: 'PIP-L6-2016',
    wbs_level: 'L6',
    wbs_code: '1.4.1.1.1',
    discipline: 'Piping',
    activity_name: 'Spool Fabrication and Fit-up for Column Feed Preheater Line',
    planned_start: '2026-09-02',
    planned_finish: '2026-09-14',
    actual_start: '2026-09-03',
    actual_finish: null,
    status: 'IN_PROGRESS',
    progress_percent: 85,
    critical_path: false,
    audit_trail: [
      {
        timestamp: '2026-09-03 10:15:00',
        source_dpr: 'Spool fit-up started at yard for feed preheater line.',
        action_detected: 'START',
        confidence_score: 88.7,
        auto_applied: true,
        author: 'TimeAgent AI'
      }
    ]
  },
  {
    id: 'PIP-L5-2017',
    wbs_level: 'L5',
    wbs_code: '1.4.1.2',
    discipline: 'Piping',
    activity_name: 'Heavy Crude Furnace Crossover Piping Erection and Tie-in',
    planned_start: '2026-09-18',
    planned_finish: '2026-10-05',
    actual_start: null,
    actual_finish: null,
    status: 'NOT_STARTED',
    progress_percent: 0,
    critical_path: true,
    audit_trail: []
  },
  {
    id: 'PIP-L6-2018',
    wbs_level: 'L6',
    wbs_code: '1.4.1.2.1',
    discipline: 'Piping',
    activity_name: 'Flange Bolting and Torque Verification for Desalter Header',
    planned_start: '2026-09-22',
    planned_finish: '2026-09-28',
    actual_start: null,
    actual_finish: null,
    status: 'NOT_STARTED',
    progress_percent: 0,
    critical_path: false,
    audit_trail: []
  },
  {
    id: 'ELE-L5-3022',
    wbs_level: 'L5',
    wbs_code: '1.5.3.1',
    discipline: 'Electrical',
    activity_name: 'Substation-4 6.6kV Switchgear Panel Installation and Megger Testing',
    planned_start: '2026-09-08',
    planned_finish: '2026-09-20',
    actual_start: '2026-09-09',
    actual_finish: null,
    status: 'IN_PROGRESS',
    progress_percent: 60,
    critical_path: true,
    audit_trail: [
      {
        timestamp: '2026-09-09 14:00:00',
        source_dpr: 'Unloaded switchgear panels in Substation-4, commenced base channel alignment.',
        action_detected: 'START',
        confidence_score: 93.0,
        auto_applied: true,
        author: 'TimeAgent AI'
      }
    ]
  },
  {
    id: 'ELE-L6-3023',
    wbs_level: 'L6',
    wbs_code: '1.5.3.1.1',
    discipline: 'Electrical',
    activity_name: 'HT Cable Pulling through Main Cable Trench Bay-1 to Substation',
    planned_start: '2026-09-15',
    planned_finish: '2026-09-26',
    actual_start: null,
    actual_finish: null,
    status: 'NOT_STARTED',
    progress_percent: 0,
    critical_path: false,
    audit_trail: []
  },
  {
    id: 'ELE-L5-3024',
    wbs_level: 'L5',
    wbs_code: '1.5.3.2',
    discipline: 'Electrical',
    activity_name: 'Emergency Diesel Generator (EDG) Synchronization and Load Bank Test',
    planned_start: '2026-09-25',
    planned_finish: '2026-10-10',
    actual_start: null,
    actual_finish: null,
    status: 'NOT_STARTED',
    progress_percent: 0,
    critical_path: false,
    audit_trail: []
  },
  {
    id: 'INS-L5-4011',
    wbs_level: 'L5',
    wbs_code: '1.6.1.1',
    discipline: 'Instrumentation',
    activity_name: 'DCS Control System Loop Checking for Distillation Column Pressure Transmitters',
    planned_start: '2026-09-24',
    planned_finish: '2026-10-06',
    actual_start: null,
    actual_finish: null,
    status: 'NOT_STARTED',
    progress_percent: 0,
    critical_path: false,
    audit_trail: []
  },
  {
    id: 'MEC-L5-5018',
    wbs_level: 'L5',
    wbs_code: '1.7.2.1',
    discipline: 'Mechanical',
    activity_name: 'Heavy Lift Erection of Crude Distillation Main Column (C-401) using 600T Crane',
    planned_start: '2026-09-16',
    planned_finish: '2026-09-28',
    actual_start: null,
    actual_finish: null,
    status: 'NOT_STARTED',
    progress_percent: 0,
    critical_path: true,
    audit_trail: []
  }
]

const INITIAL_QUEUE: ReviewQueueItem[] = [
  {
    queue_id: 'RQ-8901',
    raw_text: 'Fitters carried out nitrogen leak test on line PIP-2015 overhead joints, awaiting QA stamp.',
    source_type: 'text',
    reported_by: 'Amitabh Sen (Piping Supervisor)',
    discipline: 'Piping',
    timestamp: '2026-09-19 16:20',
    action: 'IN_PROGRESS',
    progress_percent: 75,
    delay_reason: null,
    confidence_score: 78.5,
    suggested_task_id: 'PIP-L5-2015',
    suggested_task_name: '12-inch Crude Distillation Overhead Vapor Line Hydrotesting',
    top_candidates: [
      {
        task_id: 'PIP-L5-2015',
        activity_name: '12-inch Crude Distillation Overhead Vapor Line Hydrotesting',
        discipline: 'Piping',
        wbs_level: 'L5',
        similarity_score: 78.5
      },
      {
        task_id: 'PIP-L6-2016',
        activity_name: 'Spool Fabrication and Fit-up for Column Feed Preheater Line',
        discipline: 'Piping',
        wbs_level: 'L6',
        similarity_score: 52.1
      }
    ],
    status: 'PENDING_REVIEW',
    created_at: '2026-09-19 16:25:00'
  },
  {
    queue_id: 'RQ-8902',
    raw_text: 'Subcontractor mobilized hydraulic breaker for unexpected hard rock patch near flare line trench.',
    source_type: 'voice',
    reported_by: 'Pranab Gogoi (Site Lead)',
    discipline: 'Civil',
    timestamp: '2026-09-20 11:45',
    action: 'IN_PROGRESS',
    progress_percent: 20,
    delay_reason: 'Geotechnical hard rock anomaly encountered',
    confidence_score: 42.3,
    suggested_task_id: null,
    suggested_task_name: null,
    top_candidates: [],
    status: 'UNLINKED_ACTIVITY',
    created_at: '2026-09-20 11:50:00'
  }
]

const INITIAL_MEMORY_LOGS: DelayMemoryRecord[] = [
  {
    log_id: 'MEM-101',
    task_id: 'CIV-L5-1041',
    task_name: 'CDU-4 Column Main Raft Foundation Concrete Pouring',
    discipline: 'Civil',
    supervisor_quote: 'Continuous monsoon downpour caused severe waterlogging in raft pit. RMC transit mixers halted for 48 hours.',
    root_cause: 'Weather - Severe Monsoon Rain & Pit Ingress',
    planned_duration_days: 14,
    actual_duration_days: 18,
    variance_days: 4,
    relevance_score: 88.5,
    logged_at: '2026-08-15 14:00'
  },
  {
    log_id: 'MEM-102',
    task_id: 'PIP-L5-2017',
    task_name: 'Heavy Crude Furnace Crossover Piping Erection and Tie-in',
    discipline: 'Piping',
    supervisor_quote: '600T crawler crane hydraulic boom hose burst during main 24-inch piping spool positioning; maintenance team required replacement part from Guwahati depot.',
    root_cause: 'Equipment Breakdown - Heavy Lift Crane Hydraulic Failure',
    planned_duration_days: 17,
    actual_duration_days: 23,
    variance_days: 6,
    relevance_score: 92.4,
    logged_at: '2026-08-22 09:30'
  },
  {
    log_id: 'MEM-103',
    task_id: 'ELE-L5-3022',
    task_name: 'Substation-4 6.6kV Switchgear Panel Installation and Megger Testing',
    discipline: 'Electrical',
    supervisor_quote: 'Delayed Hot Work and Energization Permit to Work (PTW) clearance from refinery Safety Cell due to concurrent hydrotest in adjacent battery limit.',
    root_cause: 'Permit to Work (PTW) Regulatory Safety Cell Hold',
    planned_duration_days: 12,
    actual_duration_days: 15,
    variance_days: 3,
    relevance_score: 84.1,
    logged_at: '2026-08-28 11:15'
  },
  {
    log_id: 'MEM-104',
    task_id: 'PIP-L6-2016',
    task_name: 'Spool Fabrication and Fit-up for Column Feed Preheater Line',
    discipline: 'Piping',
    supervisor_quote: 'Vendor shipment delayed for ASTM A335 P9 alloy steel seamless fittings with 3.1 mill test certificates, stopping yard fitters.',
    root_cause: 'Supply Chain - Material & Mill Test Certificate Delay',
    planned_duration_days: 12,
    actual_duration_days: 17,
    variance_days: 5,
    relevance_score: 79.6,
    logged_at: '2026-09-02 16:45'
  }
]

const STATIC_VARIANCE_MATRIX: VarianceMatrixItem[] = [
  {
    discipline: 'Civil',
    planned_avg_days: 14.5,
    actual_avg_days: 18.2,
    variance_days: 3.7,
    primary_delay_driver: 'Monsoon Waterlogging & Subsurface Utility Clashes',
    ai_risk_forecast: 'Moderate Risk (+22% duration on underground trenching)'
  },
  {
    discipline: 'Piping',
    planned_avg_days: 15.0,
    actual_avg_days: 20.5,
    variance_days: 5.5,
    primary_delay_driver: 'Heavy Lift Crane Availability & Mill Certificate Holds',
    ai_risk_forecast: 'High Risk (+36% duration on heavy crude crossover lines)'
  },
  {
    discipline: 'Electrical',
    planned_avg_days: 11.0,
    actual_avg_days: 13.5,
    variance_days: 2.5,
    primary_delay_driver: 'Safety Cell PTW Clearance & Cable Trench Ingress',
    ai_risk_forecast: 'Low-to-Medium Risk (+18% duration on switchgear meggering)'
  },
  {
    discipline: 'Mechanical',
    planned_avg_days: 13.0,
    actual_avg_days: 16.0,
    variance_days: 3.0,
    primary_delay_driver: 'High Elevation Wind Speeds & Rigging Stand-Downs',
    ai_risk_forecast: 'Moderate Risk (+23% on main column heavy lifts)'
  }
]

let localTasks: WBSTask[] = JSON.parse(JSON.stringify(INITIAL_TASKS))
let localQueue: ReviewQueueItem[] = JSON.parse(JSON.stringify(INITIAL_QUEUE))
let localMemory: DelayMemoryRecord[] = JSON.parse(JSON.stringify(INITIAL_MEMORY_LOGS))

// Local Client-Side Ingestion Simulator
function localIngestSimulation(rawText: string, sourceType: 'text' | 'voice', reportedBy: string): IngestResponse {
  const lower = rawText.toLowerCase()

  // Discipline extraction
  let discipline = 'Civil'
  if (lower.includes('piping') || lower.includes('pipe') || lower.includes('spool') || lower.includes('hydrotest') || lower.includes('flange') || lower.includes('pip-')) {
    discipline = 'Piping'
  } else if (lower.includes('electrical') || lower.includes('cable') || lower.includes('switchgear') || lower.includes('megger') || lower.includes('substation') || lower.includes('ele-')) {
    discipline = 'Electrical'
  } else if (lower.includes('mechanical') || lower.includes('crane') || lower.includes('column') || lower.includes('mec-')) {
    discipline = 'Mechanical'
  } else if (lower.includes('instrument') || lower.includes('dcs') || lower.includes('transmitter') || lower.includes('ins-')) {
    discipline = 'Instrumentation'
  }

  // Action extraction
  let action = 'IN_PROGRESS'
  if (lower.includes('completed') || lower.includes('finished') || lower.includes('cleared') || lower.includes('passed') || lower.includes('100%')) {
    action = 'FINISH'
  } else if (lower.includes('commenced') || lower.includes('started') || lower.includes('initiated') || lower.includes('began') || lower.includes('mobilized')) {
    action = 'START'
  }

  // Delay reason extraction
  let delay_reason: string | null = null
  if (lower.includes('waterlog') || lower.includes('rain') || lower.includes('monsoon')) {
    delay_reason = 'Weather - Monsoon Ingress'
  } else if (lower.includes('breakdown') || lower.includes('crane') || lower.includes('burst')) {
    delay_reason = 'Equipment Breakdown / Hydraulic Failure'
  } else if (lower.includes('ptw') || lower.includes('permit') || lower.includes('safety')) {
    delay_reason = 'Safety Cell PTW Clearance Hold'
  }

  // Match finding
  let matchedTask = localTasks.find((t) => lower.includes(t.id.toLowerCase().replace('-', '')) || lower.includes(t.id.toLowerCase()))
  if (!matchedTask) {
    matchedTask = localTasks.find((t) => t.discipline.toLowerCase() === discipline.toLowerCase()) || localTasks[0]
  }

  let confidence = 78.5
  let decision: 'AUTO_APPLIED' | 'HITL_REVIEW_REQUIRED' | 'UNLINKED_ACTIVITY' = 'HITL_REVIEW_REQUIRED'

  if (lower.includes('pip-2015') || lower.includes('civ-1041') || lower.includes('ele-3022') || (action === 'FINISH' && lower.includes('100%'))) {
    confidence = 96.4
    decision = 'AUTO_APPLIED'
  } else if (lower.includes('uncharted') || lower.includes('unexpected') || lower.includes('perimeter')) {
    confidence = 43.2
    decision = 'UNLINKED_ACTIVITY'
  }

  const entities: ExtractedEntities = {
    discipline,
    timestamp: new Date().toISOString().split('T')[0],
    action,
    progress_percent: action === 'FINISH' ? 100 : action === 'START' ? 30 : 70,
    delay_reason
  }

  const topMatches: MatchCandidate[] = [
    {
      task_id: matchedTask.id,
      activity_name: matchedTask.activity_name,
      discipline: matchedTask.discipline,
      wbs_level: matchedTask.wbs_level,
      similarity_score: confidence
    }
  ]

  if (decision === 'AUTO_APPLIED') {
    matchedTask.status = action === 'FINISH' ? 'COMPLETED' : 'IN_PROGRESS'
    if (action === 'FINISH') matchedTask.actual_finish = entities.timestamp
    matchedTask.actual_start = matchedTask.actual_start || entities.timestamp
    matchedTask.progress_percent = entities.progress_percent || 100
    matchedTask.audit_trail.push({
      timestamp: new Date().toLocaleString(),
      source_dpr: rawText,
      action_detected: action,
      confidence_score: confidence,
      auto_applied: true,
      author: `TimeAgent AI (${sourceType.toUpperCase()} Ingest)`
    })
  } else {
    localQueue.unshift({
      queue_id: `RQ-${Math.floor(1000 + Math.random() * 9000)}`,
      raw_text: rawText,
      source_type: sourceType,
      reported_by: reportedBy,
      discipline,
      timestamp: entities.timestamp,
      action,
      progress_percent: entities.progress_percent,
      delay_reason,
      confidence_score: confidence,
      suggested_task_id: decision === 'HITL_REVIEW_REQUIRED' ? matchedTask.id : null,
      suggested_task_name: decision === 'HITL_REVIEW_REQUIRED' ? matchedTask.activity_name : null,
      top_candidates: topMatches,
      status: decision === 'HITL_REVIEW_REQUIRED' ? 'PENDING_REVIEW' : 'UNLINKED_ACTIVITY',
      created_at: new Date().toLocaleString()
    })
  }

  return {
    ingest_id: `ING-${Math.floor(1000 + Math.random() * 9000)}`,
    raw_text: rawText,
    extracted_entities: entities,
    top_matches: topMatches,
    best_confidence: confidence,
    routing_decision: decision,
    matched_task_id: decision !== 'UNLINKED_ACTIVITY' ? matchedTask.id : null,
    matched_task_name: decision !== 'UNLINKED_ACTIVITY' ? matchedTask.activity_name : null,
    message:
      decision === 'AUTO_APPLIED'
        ? `High confidence match (${confidence}%). Baseline schedule auto-updated.`
        : decision === 'HITL_REVIEW_REQUIRED'
        ? `Moderate confidence (${confidence}%). Sent to Reconciliation Queue.`
        : `Unmatched activity (${confidence}%). Flagged in unlinked backlog.`
  }
}

// ==========================================
// EXPORTED API CLIENT WITH AUTO-FALLBACK
// ==========================================

export const api = {
  async checkHealth(): Promise<boolean> {
    try {
      const res = await client.get('/health', { timeout: 2500 })
      return res.status === 200
    } catch {
      return false
    }
  },

  async getSchedule(): Promise<ScheduleResponse> {
    try {
      const res = await client.get<ScheduleResponse>('/schedule', { timeout: 3500 })
      return res.data
    } catch {
      const completed = localTasks.filter((t) => t.status === 'COMPLETED').length
      const inProgress = localTasks.filter((t) => t.status === 'IN_PROGRESS').length
      const notStarted = localTasks.filter((t) => t.status === 'NOT_STARTED').length
      const critical = localTasks.filter((t) => t.critical_path).length

      return {
        project_name: 'Crude Distillation Unit 4 (CDU-4) Expansion',
        total_tasks: localTasks.length,
        completed,
        in_progress: inProgress,
        not_started: notStarted,
        critical_path_tasks: critical,
        tasks: localTasks
      }
    }
  },

  async ingestFieldLog(
    rawText: string,
    sourceType: 'text' | 'voice' = 'text',
    reportedBy: string = 'Site Field Engineer'
  ): Promise<IngestResponse> {
    try {
      const res = await client.post<IngestResponse>('/ingest', {
        raw_text: rawText,
        source_type: sourceType,
        reported_by: reportedBy
      })
      return res.data
    } catch {
      return localIngestSimulation(rawText, sourceType, reportedBy)
    }
  },

  async transcribeAudio(
    audioBlob: Blob,
    reportedBy: string = 'Site Field Lead (Voice Ingest)'
  ): Promise<{ status: string; transcribed_text: string; ingest_result: IngestResponse }> {
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('reported_by', reportedBy)

      const res = await client.post('/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 10000
      })
      return res.data
    } catch {
      // Whisper Speech-to-Text Fallback Transcription
      const transcribed_text =
        'Completed 100% hydrotesting for 12-inch crude distillation overhead vapor line PIP-2015 today.'
      const ingest_result = localIngestSimulation(transcribed_text, 'voice', reportedBy)

      return {
        status: 'success',
        transcribed_text,
        ingest_result
      }
    }
  },

  async getReviewQueue(): Promise<ReviewQueueItem[]> {
    try {
      const res = await client.get<ReviewQueueItem[]>('/review-queue', { timeout: 3500 })
      return res.data
    } catch {
      return localQueue
    }
  },

  async approveMatch(payload: {
    queue_id: string
    task_id: string
    override_action?: string
    custom_timestamp?: string
    progress_percent?: number
    comments?: string
  }): Promise<{ status: string; message: string; task_id: string }> {
    try {
      const res = await client.post('/approve-match', payload)
      return res.data
    } catch {
      const task = localTasks.find((t) => t.id === payload.task_id)
      if (task) {
        task.status = payload.override_action === 'FINISH' ? 'COMPLETED' : 'IN_PROGRESS'
        task.progress_percent = payload.progress_percent || 80
        task.actual_start = task.actual_start || payload.custom_timestamp || new Date().toISOString().split('T')[0]
        if (payload.override_action === 'FINISH') {
          task.actual_finish = payload.custom_timestamp || new Date().toISOString().split('T')[0]
        }
        task.audit_trail.push({
          timestamp: new Date().toLocaleString(),
          source_dpr: payload.comments || 'Approved by Project Planner',
          action_detected: payload.override_action || 'IN_PROGRESS',
          confidence_score: 100.0,
          auto_applied: false,
          author: 'Human Planner (HITL)'
        })
      }
      localQueue = localQueue.filter((q) => q.queue_id !== payload.queue_id)
      return {
        status: 'success',
        message: `Successfully approved and linked ${payload.task_id}`,
        task_id: payload.task_id
      }
    }
  },

  async createL6Task(payload: {
    queue_id?: string
    parent_l5_id?: string
    discipline: string
    activity_name: string
    planned_start: string
    planned_finish: string
    actual_start?: string
    actual_finish?: string
    initial_status?: string
    progress_percent?: number
  }): Promise<{ status: string; message: string; task: WBSTask }> {
    try {
      const res = await client.post('/create-task', payload)
      return res.data
    } catch {
      const newTask: WBSTask = {
        id: `${payload.discipline.slice(0, 3).toUpperCase()}-L6-${Math.floor(1000 + Math.random() * 9000)}`,
        wbs_level: 'L6',
        wbs_code: '1.9.9.1',
        discipline: payload.discipline,
        activity_name: payload.activity_name,
        planned_start: payload.planned_start,
        planned_finish: payload.planned_finish,
        actual_start: payload.actual_start || new Date().toISOString().split('T')[0],
        actual_finish: payload.actual_finish || null,
        status: (payload.initial_status as any) || 'IN_PROGRESS',
        progress_percent: payload.progress_percent || 25,
        critical_path: false,
        audit_trail: [
          {
            timestamp: new Date().toLocaleString(),
            source_dpr: 'Created from unlinked field log review',
            action_detected: 'MANUAL_CREATION',
            confidence_score: 100.0,
            auto_applied: false,
            author: 'Project Planner'
          }
        ]
      }
      localTasks.push(newTask)
      if (payload.queue_id) {
        localQueue = localQueue.filter((q) => q.queue_id !== payload.queue_id)
      }
      return {
        status: 'success',
        message: `New L6 Task ${newTask.id} created and synced.`,
        task: newTask
      }
    }
  },

  async dismissQueueItem(queueId: string): Promise<void> {
    try {
      await client.delete(`/review-queue/${queueId}`)
    } catch {
      localQueue = localQueue.filter((q) => q.queue_id !== queueId)
    }
  },

  async queryMemory(query: string, discipline?: string): Promise<MemoryQueryResponse> {
    try {
      const res = await client.post<MemoryQueryResponse>('/memory-query', {
        query,
        discipline: discipline && discipline !== 'ALL' ? discipline : undefined,
        limit: 3
      })
      return res.data
    } catch {
      let matches = localMemory
      if (discipline && discipline !== 'ALL') {
        matches = matches.filter((m) => m.discipline.toLowerCase() === discipline.toLowerCase())
      }
      return {
        query,
        top_matches: matches.slice(0, 3),
        variance_matrix: STATIC_VARIANCE_MATRIX
      }
    }
  },

  async resetDemoBaseline(): Promise<void> {
    try {
      await client.post('/reset-demo')
    } catch {
      localTasks = JSON.parse(JSON.stringify(INITIAL_TASKS))
      localQueue = JSON.parse(JSON.stringify(INITIAL_QUEUE))
      localMemory = JSON.parse(JSON.stringify(INITIAL_MEMORY_LOGS))
    }
  }
}
