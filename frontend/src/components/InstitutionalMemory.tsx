import React, { useState, useEffect } from 'react'
import {
  BrainCircuit,
  Search,
  AlertTriangle,
  Clock,
  TrendingUp,
  BarChart3,
  Sparkles,
  FileText,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  ShieldCheck,
  Quote,
  Flame,
  ArrowRight
} from 'lucide-react'
import { MemoryQueryResponse, DelayMemoryRecord, VarianceMatrixItem } from '../types'
import { api } from '../services/api'

export const InstitutionalMemory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('What causes delays in 24-inch piping erection?')
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MemoryQueryResponse | null>(null)

  const sampleQueries = [
    'What causes delays in 24-inch piping erection?',
    'Continuous monsoon downpour waterlogging in raft pit',
    'Permit to Work (PTW) clearance delay from Safety Cell',
    'Vendor delayed shipment of alloy steel seamless fittings',
    'Excavator struck unmapped legacy utility cooling line'
  ]

  useEffect(() => {
    handleSearch('What causes delays in 24-inch piping erection?')
  }, [])

  const handleSearch = async (queryText?: string) => {
    const q = queryText !== undefined ? queryText : searchQuery
    if (!q.trim()) return

    setLoading(true)
    try {
      const data = await api.queryMemory(q.trim(), selectedDiscipline)
      setResult(data)
    } catch (err: any) {
      console.error('Memory query error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDisciplineChange = (disc: string) => {
    setSelectedDiscipline(disc)
    setTimeout(() => {
      handleSearch(searchQuery)
    }, 50)
  }

  const getDisciplineColor = (disc: string) => {
    switch (disc?.toLowerCase()) {
      case 'civil':
        return 'bg-amber-950/70 text-amber-300 border-amber-800/60'
      case 'piping':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60'
      case 'electrical':
        return 'bg-purple-950/70 text-purple-300 border-purple-800/60'
      case 'mechanical':
        return 'bg-rose-950/70 text-rose-300 border-rose-800/60'
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700'
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <BrainCircuit className="w-4 h-4" />
              <span>Module 4: Institutional Memory & Analytics</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Natural Language Delay Query Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Ask natural language questions about historical delay drivers across the <strong>CDU-4 Refinery Expansion</strong>.
              The <strong>all-MiniLM-L6-v2</strong> sentence transformer searches past supervisor logs and outputs root-cause insights with predictive duration variance.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
              Top 3 Semantic Matches
            </span>
          </div>
        </div>

        {/* Prominent Search Bar */}
        <div className="mt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch()
            }}
            className="flex flex-wrap items-center gap-3"
          >
            <div className="relative flex-1 min-w-[320px]">
              <Search className="w-5 h-5 text-indigo-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask about past delays, e.g. 'What causes delays in 24-inch piping erection?'..."
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-medium placeholder-slate-500 transition shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Computing Embeddings...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Semantic Query</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Query Preset Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Quick Prompts:</span>
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSearchQuery(q)
                  handleSearch(q)
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-slate-300 hover:text-white transition truncate max-w-[320px]"
              >
                &ldquo;{q}&rdquo;
              </button>
            ))}
          </div>

          {/* Discipline Filters */}
          <div className="mt-4 flex items-center space-x-1.5 border-t border-slate-800/60 pt-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center space-x-1">
              <Filter className="w-3 h-3" />
              <span>Discipline Filter:</span>
            </span>
            {['ALL', 'Civil', 'Piping', 'Electrical', 'Mechanical'].map((disc) => (
              <button
                key={disc}
                onClick={() => handleDisciplineChange(disc)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition ${
                  selectedDiscipline.toLowerCase() === disc.toLowerCase()
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {disc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Section: Historical Insight Cards (Top 3 Semantic Matches) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Quote className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Historical Insight Cards &bull; Semantic Root Cause Retrieval
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Top {result?.top_matches.length || 0} Vector Matches
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800">
            <Clock className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
            Computing sentence transformer cosine similarities across institutional memory...
          </div>
        ) : !result || result.top_matches.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">
            No matching delay logs found. Try querying another delay topic.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {result.top_matches.map((item, idx) => (
              <div
                key={item.log_id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-indigo-800/80 transition flex flex-col justify-between space-y-4 relative group"
              >
                <div>
                  {/* Top Bar: Match Rank & Confidence Score */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        Rank #{idx + 1} &bull; {item.log_id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDisciplineColor(
                          item.discipline
                        )}`}
                      >
                        {item.discipline}
                      </span>
                    </div>

                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-sm flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>{item.relevance_score}% Match</span>
                    </span>
                  </div>

                  {/* Affected WBS Activity Node */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Affected WBS Node
                    </span>
                    <div className="text-xs font-bold text-white flex items-center space-x-1.5 truncate">
                      <span className="font-mono text-indigo-400">{item.task_id}</span>
                      <span>&bull;</span>
                      <span className="truncate">{item.task_name}</span>
                    </div>
                  </div>

                  {/* Exact Supervisor Quote */}
                  <div className="mt-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Exact Supervisor Quote
                    </span>
                    <p className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed shadow-inner">
                      &ldquo;{item.supervisor_quote}&rdquo;
                    </p>
                  </div>

                  {/* Identified Root Cause Badge */}
                  <div className="mt-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Identified Root Cause
                    </span>
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-900/60 text-xs font-semibold text-rose-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      <span className="leading-tight">{item.root_cause}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Impact & Logged Date */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-rose-400" />
                    <span>Duration Impact: <strong className="text-rose-300">+{item.variance_days} Days</strong></span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{item.logged_at}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section: Visual Variance Matrix */}
      {result && result.variance_matrix && (
        <div className="space-y-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Predictive Duration Variance Matrix (AI Forecasting Model)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Planned vs. Actual Durations Across Disciplines
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {result.variance_matrix.map((matrixItem) => {
              const variancePct = Math.round(
                ((matrixItem.actual_avg_days - matrixItem.planned_avg_days) /
                  matrixItem.planned_avg_days) *
                  100
              )

              return (
                <div
                  key={matrixItem.discipline}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">
                        {matrixItem.discipline} Discipline
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          matrixItem.variance_days > 4
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        +{matrixItem.variance_days}d ({variancePct}%)
                      </span>
                    </div>

                    {/* Comparison Bars (Planned vs Actual) */}
                    <div className="mt-4 space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Planned Avg Duration</span>
                          <span className="font-mono font-bold text-slate-200">
                            {matrixItem.planned_avg_days} days
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className="bg-indigo-500 h-full rounded-full"
                            style={{
                              width: `${(matrixItem.planned_avg_days / 25) * 100}%`
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                          <span>Actual Avg Duration</span>
                          <span className="font-mono font-bold text-rose-300">
                            {matrixItem.actual_avg_days} days
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className="bg-rose-500 h-full rounded-full"
                            style={{
                              width: `${(matrixItem.actual_avg_days / 25) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Primary Delay Driver */}
                    <div className="mt-4 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Primary Delay Driver
                      </span>
                      <p className="text-xs text-slate-300 leading-snug">
                        {matrixItem.primary_delay_driver}
                      </p>
                    </div>
                  </div>

                  {/* AI Risk Forecast Output */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-0.5">
                      AI Predictive Forecast
                    </span>
                    <div className="text-[11px] text-slate-300 font-medium">
                      {matrixItem.ai_risk_forecast}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
