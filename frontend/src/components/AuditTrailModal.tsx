import React from 'react'
import { X, ShieldCheck, Clock, FileText, CheckCircle2, UserCheck, Bot } from 'lucide-react'
import { WBSTask } from '../types'

interface AuditTrailModalProps {
  task: WBSTask | null
  onClose: () => void
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ task, onClose }) => {
  if (!task) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-950 border border-indigo-700/50 rounded-lg text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                  {task.id}
                </span>
                <span className="text-xs text-slate-400">WBS: {task.wbs_code} ({task.wbs_level})</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">{task.activity_name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Schedule Snapshot Banner */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800/80 grid grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Discipline</span>
            <span className="font-bold text-slate-200">{task.discipline}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Planned Dates</span>
            <span className="font-mono text-slate-300">{task.planned_start} &rarr; {task.planned_finish}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Actual Dates</span>
            <span className="font-mono text-indigo-300">
              {task.actual_start || 'Pending'} &rarr; {task.actual_finish || (task.status === 'COMPLETED' ? 'Done' : 'Ongoing')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status / Progress</span>
            <span className="font-bold text-emerald-400">{task.status} ({task.progress_percent}%)</span>
          </div>
        </div>

        {/* Audit Log Timeline */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              AI Confidence & Schedule Link Audit Trail ({task.audit_trail.length})
            </h4>
            <span className="text-[11px] text-slate-400">Chronological field records</span>
          </div>

          {task.audit_trail.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No field actuals or AI linking audits recorded yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Submit field voice-notes or DPRs via Time Agent to log actuals.</p>
            </div>
          ) : (
            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
              {task.audit_trail.map((entry, idx) => (
                <div key={idx} className="relative pl-8 group">
                  {/* Timeline dot */}
                  <div className="absolute left-1.5 top-2.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center -translate-x-1/2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        {entry.auto_applied ? (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-[11px] font-semibold text-emerald-300">
                            <Bot className="w-3 h-3 text-emerald-400" />
                            <span>Auto-Linked ({entry.confidence_score}%)</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-[11px] font-semibold text-indigo-300">
                            <UserCheck className="w-3 h-3 text-indigo-400" />
                            <span>HITL Approved ({entry.confidence_score}%)</span>
                          </span>
                        )}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          Action: {entry.action_detected}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{entry.timestamp}</span>
                      </span>
                    </div>

                    <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
                      <div className="flex items-center space-x-1 text-[10px] uppercase font-bold text-slate-400 mb-1">
                        <FileText className="w-3 h-3 text-indigo-400" />
                        <span>Source Field DPR / Audio Log:</span>
                      </div>
                      &ldquo;{entry.source_dpr}&rdquo;
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Author: <strong>{entry.author}</strong></span>
                      {entry.details && <span className="italic">{entry.details}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
          >
            Close Audit Inspector
          </button>
        </div>
      </div>
    </div>
  )
}
