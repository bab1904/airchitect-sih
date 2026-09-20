import axios from 'axios'
import {
  ScheduleResponse,
  IngestResponse,
  ReviewQueueItem,
  MemoryQueryResponse,
  WBSTask
} from '../types'

// Dynamic environment-based API base URL with fallback to local proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const api = {
  async checkHealth(): Promise<boolean> {
    try {
      const res = await client.get('/health')
      return res.status === 200
    } catch {
      return false
    }
  },

  async getSchedule(): Promise<ScheduleResponse> {
    const res = await client.get<ScheduleResponse>('/schedule')
    return res.data
  },

  async ingestFieldLog(
    rawText: string,
    sourceType: 'text' | 'voice' = 'text',
    reportedBy: string = 'Site Field Engineer'
  ): Promise<IngestResponse> {
    const res = await client.post<IngestResponse>('/ingest', {
      raw_text: rawText,
      source_type: sourceType,
      reported_by: reportedBy
    })
    return res.data
  },

  async transcribeAudio(
    audioBlob: Blob,
    reportedBy: string = 'Site Field Lead (Voice Ingest)'
  ): Promise<{ status: string; transcribed_text: string; ingest_result: IngestResponse }> {
    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.webm')
    formData.append('reported_by', reportedBy)

    const res = await client.post('/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return res.data
  },

  async getReviewQueue(): Promise<ReviewQueueItem[]> {
    const res = await client.get<ReviewQueueItem[]>('/review-queue')
    return res.data
  },

  async approveMatch(payload: {
    queue_id: string
    task_id: string
    override_action?: string
    custom_timestamp?: string
    progress_percent?: number
    comments?: string
  }): Promise<{ status: string; message: string; task_id: string }> {
    const res = await client.post('/approve-match', payload)
    return res.data
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
    const res = await client.post('/create-task', payload)
    return res.data
  },

  async dismissQueueItem(queueId: string): Promise<void> {
    await client.delete(`/review-queue/${queueId}`)
  },

  async queryMemory(query: string, discipline?: string): Promise<MemoryQueryResponse> {
    const res = await client.post<MemoryQueryResponse>('/memory-query', {
      query,
      discipline: discipline && discipline !== 'ALL' ? discipline : undefined,
      limit: 3
    })
    return res.data
  },

  async resetDemoBaseline(): Promise<void> {
    await client.post('/reset-demo')
  }
}
