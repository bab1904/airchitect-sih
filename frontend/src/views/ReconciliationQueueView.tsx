import React, { useState } from 'react'
import {
  GitMerge,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  AlertCircle,
  FileText,
  Mic,
  ChevronDown,
  PlusCircle,
  ShieldAlert,
  ArrowRight,
  Layers,
  Percent
} from 'lucide-react'
import { ReviewQueueItem, WBSTask } from '../types'
import { api } from '../services/api'
import { CreateL6Modal } from '../components/CreateL6Modal'

interface ReconciliationQueueViewProps {
  queueItems: ReviewQueueItem[]
  existingTasks: WBSTask[]
  loading: boolean
  onActionComplete: () => void
}

export const ReconciliationQueueView: React.FC<ReconciliationQueueViewProps> = ({
  queueItems,
  existingTasks,
  loading,
  onActionComplete
}) => {
  const [activeItemForL6, setActiveItemForL6] = useState<ReviewQueueItem | null>(null)
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string>>({})
  const [actionOverrides, setActionOverrides] = useState<Record<string, string>>({})
  const [progressOverrides, setProgressOverrides] = useState<Record<string, number>>({})
  const [plannerComments, setPlannerComments] = useState<Record<string, string>>({})
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Split into Pending Review (>= 50%) and Unlinked (< 50%)
  const pendingReviewItems = queueItems.filter((i) => i.status === 'PENDING_REVIEW' || i.confidence_score >= 50.0)
  const unlinkedItems = queueItems.filter((i) => i.status === 'UNLINKED_ACTIVITY' || i.confidence_score < 50.0)

  const handleApprove = async (item: ReviewQueueItem) => {
    const taskId = selectedCandidates[item.queue_id] || item.suggested_task_id || existingTasks[0]?.id
    if (!taskId) return

    setProcessingId(item.queue_id)
    try {
      await api.approveMatch({
        queue_id: item.queue_id,
        task_id: taskId,
        override_action: actionOverrides[item.queue_id] || item.action,
        progress_percent: progressOverrides[item.queue_id] || item.progress_percent || undefined,
        comments: plannerComments[item.queue_id] || 'Confirmed & approved by Project Lead Planner'
      })
      onActionComplete()
    } catch (err: any) {
      alert(`Approval error: ${err.message || 'Failed to approve match.'}`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDismiss = async (queueId: string) => {
    setProcessingId(queueId)
    try {
      await api.dismissQueueItem(queueId)
      onActionComplete()
    } catch (err: any) {
      alert(`Dismiss error: ${err.message || 'Failed to dismiss item.'}`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleCreateL6Submit = async (taskData: any) => {
    await api.createL6Task(taskData)
    onActionComplete()
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <GitMerge className="w-4 h-4" />
              <span>Module 3: AI Reconciliation Queue</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Human-in-the-Loop (HITL) Review & Unlinked Logs
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Field logs with similarity scores between <strong>50% and 84%</strong> require planner confirmation before schedule sync.
              Logs below <strong>50%</strong> are routed to the unlinked backlog to generate new L6 work packages.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="px-3 py-2 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 font-bold">
              {pendingReviewItems.length} Pending Approval
            </div>
            <div className="px-3 py-2 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 font-bold">
              {unlinkedItems.length} Unlinked Backlog
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Pending Planner Review Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Pending Planner Review Items ({pendingReviewItems.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Review AI suggestion & click 'Approve & Sync'</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
            <Clock className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
            Loading reconciliation queue...
          </div>
        ) : pendingReviewItems.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">Reconciliation Queue Clear</h4>
            <p className="text-xs text-slate-400 mt-1">All moderate-confidence field logs have been reviewed and synchronized.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingReviewItems.map((item) => {
              const currentTaskId = selectedCandidates[item.queue_id] || item.suggested_task_id || ''
              const isProcessing = processingId === item.queue_id

              return (
                <div
                  key={item.queue_id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-indigo-900/60 transition"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left: Raw DPR Log Info */}
                    <div className="lg:col-span-6 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                            {item.queue_id}
                          </span>
                          <span className="text-xs font-bold text-slate-300">{item.reported_by}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                          {item.source_type === 'voice' ? (
                            <span className="flex items-center space-x-1 text-purple-400 font-semibold">
                              <Mic className="w-3 h-3" /> <span>Voice Note</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 text-slate-400 font-semibold">
                              <FileText className="w-3 h-3" /> <span>Text DPR</span>
                            </span>
                          )}
                          <span>&bull; {item.timestamp}</span>
                        </div>
                      </div>

                      {/* Raw Text Quote */}
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
                        &ldquo;{item.raw_text}&rdquo;
                      </div>

                      {/* Extracted Entity Tags */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          Discipline: <strong>{item.discipline}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          Action: <strong>{item.action}</strong>
                        </span>
                        {item.progress_percent && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                            Progress: <strong>{item.progress_percent}%</strong>
                          </span>
                        )}
                        {item.delay_reason && (
                          <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-900 font-medium">
                            Delay: <strong>{item.delay_reason}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: AI Match Recommendation & Controls */}
                    <div className="lg:col-span-6 flex flex-col justify-between p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            AI Suggested WBS Target
                          </span>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                            {item.confidence_score}% Confidence
                          </span>
                        </div>

                        {/* Candidate Selector */}
                        <div className="space-y-2">
                          <select
                            value={currentTaskId}
                            onChange={(e) =>
                              setSelectedCandidates({
                                ...selectedCandidates,
                                [item.queue_id]: e.target.value
                              })
                            }
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                          >
                            {item.top_candidates && item.top_candidates.length > 0 ? (
                              item.top_candidates.map((cand) => (
                                <option key={cand.task_id} value={cand.task_id}>
                                  {cand.task_id} ({cand.similarity_score}%) - {cand.activity_name}
                                </option>
                              ))
                            ) : (
                              <option value={item.suggested_task_id || ''}>
                                {item.suggested_task_id} - {item.suggested_task_name}
                              </option>
                            )}
                          </select>
                        </div>

                        {/* Planner Custom Overrides */}
                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                          <div>
                            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                              Action Override
                            </label>
                            <select
                              value={actionOverrides[item.queue_id] || item.action}
                              onChange={(e) =>
                                setActionOverrides({
                                  ...actionOverrides,
                                  [item.queue_id]: e.target.value
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                            >
                              <option value="START">START</option>
                              <option value="IN_PROGRESS">IN_PROGRESS</option>
                              <option value="FINISH">FINISH</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                              Progress Override (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={progressOverrides[item.queue_id] || item.progress_percent || 75}
                              onChange={(e) =>
                                setProgressOverrides({
                                  ...progressOverrides,
                                  [item.queue_id]: Number(e.target.value)
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleDismiss(item.queue_id)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleApprove(item)}
                          disabled={isProcessing}
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center space-x-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isProcessing ? 'Syncing...' : 'Approve & Sync Schedule'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Section 2: Unlinked Field Activity Backlog (< 50% Match) */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Unlinked Field Activities Backlog ({unlinkedItems.length})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Unmatched field activities (&lt; 50% confidence)</span>
        </div>

        {unlinkedItems.length === 0 ? (
          <div className="p-6 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
            No unlinked field activities pending classification.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unlinkedItems.map((item) => (
              <div
                key={item.queue_id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                      {item.queue_id} &bull; Unlinked
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{item.timestamp}</span>
                  </div>

                  <p className="mt-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
                    &ldquo;{item.raw_text}&rdquo;
                  </p>

                  <div className="mt-2 flex items-center space-x-2 text-[11px] text-slate-400">
                    <span>Discipline: <strong>{item.discipline}</strong></span>
                    <span>&bull; Reported by: <strong>{item.reported_by}</strong></span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleDismiss(item.queue_id)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => setActiveItemForL6(item)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create L6 Task</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Creating New L6 Task */}
      {activeItemForL6 && (
        <CreateL6Modal
          item={activeItemForL6}
          existingL5Tasks={existingTasks.filter((t) => t.wbs_level === 'L5')}
          onClose={() => setActiveItemForL6(null)}
          onSubmit={handleCreateL6Submit}
        />
      )}
    </div>
  )
}
