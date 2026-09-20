import React, { useState } from 'react'
import { X, PlusCircle, Layers, Calendar, CheckCircle2 } from 'lucide-react'
import { ReviewQueueItem, WBSTask } from '../types'

interface CreateL6ModalProps {
  item: ReviewQueueItem | null
  existingL5Tasks: WBSTask[]
  onClose: () => void
  onSubmit: (taskData: {
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
  }) => Promise<void>
}

export const CreateL6Modal: React.FC<CreateL6ModalProps> = ({
  item,
  existingL5Tasks,
  onClose,
  onSubmit
}) => {
  const [discipline, setDiscipline] = useState(item?.discipline || 'Civil')
  const [activityName, setActivityName] = useState(item ? `Field Activity: ${item.raw_text.slice(0, 70)}...` : '')
  const [parentL5Id, setParentL5Id] = useState(existingL5Tasks[0]?.id || 'CIV-L5-1041')
  const [plannedStart, setPlannedStart] = useState(new Date().toISOString().split('T')[0])
  const [plannedFinish, setPlannedFinish] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [actualStart, setActualStart] = useState(item?.timestamp?.split(' ')[0] || new Date().toISOString().split('T')[0])
  const [progressPercent, setProgressPercent] = useState(item?.progress_percent || 25)
  const [submitting, setSubmitting] = useState(false)

  if (!item) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({
        queue_id: item.queue_id,
        parent_l5_id: parentL5Id,
        discipline,
        activity_name: activityName,
        planned_start: plannedStart,
        planned_finish: plannedFinish,
        actual_start: actualStart,
        initial_status: 'IN_PROGRESS',
        progress_percent: progressPercent
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-950 border border-indigo-700/50 rounded-lg text-indigo-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New L6 WBS Task</h3>
              <p className="text-xs text-slate-400">Promote unlinked field activity to master schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unlinked Field Source Preview */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800/80 text-xs">
          <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
            Originating Unlinked Field Log ({item.queue_id})
          </span>
          <p className="font-mono text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            &ldquo;{item.raw_text}&rdquo;
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Discipline
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-white"
              >
                <option value="Civil">Civil</option>
                <option value="Piping">Piping</option>
                <option value="Electrical">Electrical</option>
                <option value="Instrumentation">Instrumentation</option>
                <option value="Mechanical">Mechanical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Parent L5 Task
              </label>
              <select
                value={parentL5Id}
                onChange={(e) => setParentL5Id(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-white"
              >
                {existingL5Tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} - {t.activity_name.slice(0, 30)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              New L6 Activity Description
            </label>
            <input
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-white"
              placeholder="e.g. Flare line trench hydraulic rock breaking"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Planned Start
              </label>
              <input
                type="date"
                value={plannedStart}
                onChange={(e) => setPlannedStart(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Planned Finish
              </label>
              <input
                type="date"
                value={plannedFinish}
                onChange={(e) => setPlannedFinish(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Actual Start Date
              </label>
              <input
                type="date"
                value={actualStart}
                onChange={(e) => setActualStart(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Initial Progress ({progressPercent}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercent}
                onChange={(e) => setProgressPercent(Number(e.target.value))}
                className="w-full accent-indigo-500 mt-2"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Creating L6 Task...' : 'Create & Sync to Baseline'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
