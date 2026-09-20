import React, { useState, useMemo } from 'react'
import {
  Calendar,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Flame,
  Bot,
  UserCheck,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react'
import { ScheduleResponse, WBSTask } from '../types'

interface ScheduleBaselineViewProps {
  scheduleData: ScheduleResponse | null
  loading: boolean
  onSelectTaskAudit: (task: WBSTask) => void
}

export const ScheduleBaselineView: React.FC<ScheduleBaselineViewProps> = ({
  scheduleData,
  loading,
  onSelectTaskAudit
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [criticalOnly, setCriticalOnly] = useState(false)

  const tasks = scheduleData?.tasks || []

  // Filter logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.activity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.wbs_code.includes(searchQuery)

      const matchesDiscipline =
        selectedDiscipline === 'ALL' || t.discipline.toLowerCase() === selectedDiscipline.toLowerCase()

      const matchesStatus =
        selectedStatus === 'ALL' || t.status.toLowerCase() === selectedStatus.toLowerCase()

      const matchesCritical = !criticalOnly || t.critical_path

      return matchesSearch && matchesDiscipline && matchesStatus && matchesCritical
    })
  }, [tasks, searchQuery, selectedDiscipline, selectedStatus, criticalOnly])

  // Stats calculations
  const totalTasks = tasks.length
  const completed = tasks.filter((t) => t.status === 'COMPLETED').length
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length
  const notStarted = tasks.filter((t) => t.status === 'NOT_STARTED').length
  const criticalCount = tasks.filter((t) => t.critical_path).length
  const aiLinkedCount = tasks.filter((t) => t.audit_trail.length > 0).length

  const getDisciplineBadge = (disc: string) => {
    switch (disc.toLowerCase()) {
      case 'civil':
        return 'bg-amber-950/70 text-amber-300 border-amber-800/60'
      case 'piping':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60'
      case 'electrical':
        return 'bg-purple-950/70 text-purple-300 border-purple-800/60'
      case 'instrumentation':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
      case 'mechanical':
        return 'bg-rose-950/70 text-rose-300 border-rose-800/60'
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-[11px] font-bold text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-[11px] font-bold text-indigo-300">
            <Clock className="w-3 h-3 animate-spin text-indigo-400" />
            <span>In Progress</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[11px] font-bold text-slate-400">
            <span>Not Started</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total Tasks</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{totalTasks}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">L5 / L6 Granularity</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>In Progress</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300 mt-1">{inProgress}</div>
          <div className="text-[11px] text-indigo-400/80 mt-0.5">Active field crews</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-1">{completed}</div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">
            {totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0}% of baseline
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Critical Path</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">{criticalCount}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">Refinery critical milestones</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>AI Linked Actuals</span>
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 mt-1">{aiLinkedCount}</div>
          <div className="text-[11px] text-cyan-400/80 mt-0.5">Audited from field logs</div>
        </div>
      </div>

      {/* Table Filters & Search Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Task ID (e.g. CIV-L5-1041), WBS code, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-white placeholder-slate-500 transition"
            />
          </div>

          {/* Discipline Selector */}
          <div className="flex items-center space-x-1 overflow-x-auto py-1">
            {['ALL', 'Civil', 'Piping', 'Electrical', 'Mechanical', 'Instrumentation'].map((disc) => (
              <button
                key={disc}
                onClick={() => setSelectedDiscipline(disc)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  selectedDiscipline.toLowerCase() === disc.toLowerCase()
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {disc}
              </button>
            ))}
          </div>
        </div>

        {/* Critical Path Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCriticalOnly(!criticalOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition ${
              criticalOnly
                ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${criticalOnly ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>Critical Path Only</span>
          </button>
        </div>
      </div>

      {/* Master Dense Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">WBS Level / Code</th>
                <th className="py-3 px-4">Activity ID</th>
                <th className="py-3 px-4">Discipline</th>
                <th className="py-3 px-4 min-w-[260px]">Activity Description & Scope</th>
                <th className="py-3 px-4 whitespace-nowrap">Planned Window</th>
                <th className="py-3 px-4 whitespace-nowrap">Actual Dates</th>
                <th className="py-3 px-4">Status & Progress</th>
                <th className="py-3 px-4 text-right">AI Audit Trail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                    Loading Master WBS baseline schedule...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching WBS tasks found for the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const hasAudits = task.audit_trail && task.audit_trail.length > 0
                  const latestAudit = hasAudits ? task.audit_trail[task.audit_trail.length - 1] : null

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-800/40 transition-colors duration-100 group"
                    >
                      {/* WBS Code & Level */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              task.wbs_level === 'L5'
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {task.wbs_level}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">{task.wbs_code}</span>
                        </div>
                      </td>

                      {/* Task ID */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-white">
                        <div className="flex items-center space-x-1.5">
                          {task.critical_path && (
                            <span title="Critical Path Task">
                              <Flame className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            </span>
                          )}
                          <span>{task.id}</span>
                        </div>
                      </td>

                      {/* Discipline */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDisciplineBadge(
                            task.discipline
                          )}`}
                        >
                          {task.discipline}
                        </span>
                      </td>

                      {/* Activity Name */}
                      <td className="py-3 px-4 text-slate-200">
                        <div className="font-semibold text-xs leading-snug">{task.activity_name}</div>
                      </td>

                      {/* Planned Window */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        <div>
                          <span>{task.planned_start}</span>
                          <span className="text-slate-600 mx-1">&rarr;</span>
                          <span>{task.planned_finish}</span>
                        </div>
                      </td>

                      {/* Actual Dates */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                        {task.actual_start ? (
                          <div className="text-indigo-300 font-semibold">
                            <span>{task.actual_start}</span>
                            <span className="text-slate-600 mx-1">&rarr;</span>
                            <span>{task.actual_finish || 'In Progress'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 font-normal italic">Not recorded</span>
                        )}
                      </td>

                      {/* Status & Progress */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getStatusBadge(task.status)}
                          <div className="w-24 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full ${
                                task.status === 'COMPLETED'
                                  ? 'bg-emerald-400'
                                  : task.status === 'IN_PROGRESS'
                                  ? 'bg-indigo-500'
                                  : 'bg-slate-700'
                              }`}
                              style={{ width: `${task.progress_percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Clickable AI Audit Badge */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {hasAudits ? (
                          <button
                            onClick={() => onSelectTaskAudit(task)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-[11px] font-bold shadow-sm transition group-hover:border-indigo-500"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{latestAudit?.confidence_score}%</span>
                            <span className="text-[10px] text-indigo-400 font-normal">
                              ({task.audit_trail.length})
                            </span>
                            <ChevronRight className="w-3 h-3 text-indigo-400" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onSelectTaskAudit(task)}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300 text-[10px] transition"
                          >
                            <span>No Audits</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredTasks.length} of {tasks.length} total tasks</span>
          <span className="text-[11px]">Click on any AI Audit badge to inspect field logs & provenance</span>
        </div>
      </div>
    </div>
  )
}
