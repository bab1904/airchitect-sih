import React from 'react'
import { Server, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Flame } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle: string
  backendOnline: boolean
  onRefresh: () => void
  refreshing: boolean
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  backendOnline,
  onRefresh,
  refreshing
}) => {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <span>{title}</span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Project Tag */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-lg bg-indigo-950/50 border border-indigo-800/50 text-xs font-semibold text-indigo-300">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>CDU-4 Expansion Project</span>
        </div>

        {/* Backend Connection Badge */}
        <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-300 font-medium">
            {backendOnline ? 'FastAPI Linked (:8000)' : 'Backend Offline'}
          </span>
          <button
            onClick={onRefresh}
            title="Refresh connection & data"
            className="text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  )
}
