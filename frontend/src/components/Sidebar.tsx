import React from 'react'
import {
  CalendarDays,
  Mic,
  GitMerge,
  BrainCircuit,
  Database,
  RotateCcw,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react'

export type ViewType = 'schedule' | 'ingestion' | 'reconciliation' | 'memory'

interface SidebarProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  reviewQueueCount: number
  onResetDemo: () => void
  resetting: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  reviewQueueCount,
  onResetDemo,
  resetting
}) => {
  const navItems = [
    {
      id: 'schedule' as ViewType,
      label: 'L5/L6 Baseline Schedule',
      subtitle: 'CDU-4 Master WBS & Actuals',
      icon: CalendarDays,
      badge: null
    },
    {
      id: 'ingestion' as ViewType,
      label: 'Time Agent (Field Ingest)',
      subtitle: 'Audio Voice-Note & DPR NLP',
      icon: Mic,
      badge: 'Live NLP'
    },
    {
      id: 'reconciliation' as ViewType,
      label: 'AI Reconciliation Queue',
      subtitle: 'HITL Review & Unlinked Logs',
      icon: GitMerge,
      badge: reviewQueueCount > 0 ? `${reviewQueueCount} Pending` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    },
    {
      id: 'memory' as ViewType,
      label: 'Institutional Memory',
      subtitle: 'Delay Patterns & Root Cause Query',
      icon: BrainCircuit,
      badge: 'Semantic'
    }
  ]

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 select-none">
      {/* Brand & Organization Title */}
      <div>
        <div className="p-5 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-cyan-500 rounded-xl shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-400/30">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black tracking-widest text-indigo-400 uppercase">OIL INDIA LTD</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 font-semibold">
                  PS 26122
                </span>
              </div>
              <h1 className="text-base font-bold text-slate-100 tracking-tight leading-none mt-1">
                TimeAgent Link
              </h1>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
            Intelligent Data Capture & Schedule-Linking Layer for CDU-4 Refinery Expansion
          </p>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1.5">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Core Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-150 flex items-start space-x-3 border ${
                  isActive
                    ? 'bg-indigo-950/60 border-indigo-500/50 text-white shadow-lg shadow-indigo-950/50'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div
                  className={`p-2 rounded-lg mt-0.5 ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                          item.badgeColor || 'bg-indigo-950 text-indigo-300 border-indigo-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                    {item.subtitle}
                  </span>
                </div>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer / Reset & Health Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/30 space-y-3">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
          <div className="flex items-center justify-between font-semibold text-slate-300">
            <span className="flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Semantic Engine</span>
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              all-MiniLM-L6-v2
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 space-y-0.5">
            <div>• Auto-Update: &ge; 85% Confidence</div>
            <div>• HITL Review: 50% - 84%</div>
            <div>• Unlinked Log: &lt; 50%</div>
          </div>
        </div>

        <button
          onClick={onResetDemo}
          disabled={resetting}
          className="w-full py-2 px-3 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting Schedule...' : 'Reset Demo Baseline'}</span>
        </button>
      </div>
    </aside>
  )
}
