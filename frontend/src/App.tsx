import React, { useState, useEffect } from 'react'
import { Sidebar, ViewType } from './components/Sidebar'
import { Header } from './components/Header'
import { AuditTrailModal } from './components/AuditTrailModal'
import { ScheduleBaselineView } from './views/ScheduleBaselineView'
import { TimeAgentIngestionView } from './views/TimeAgentIngestionView'
import { ReconciliationQueueView } from './views/ReconciliationQueueView'
import { InstitutionalMemoryView } from './views/InstitutionalMemoryView'
import { ScheduleResponse, ReviewQueueItem, WBSTask, IngestResponse } from './types'
import { api } from './services/api'

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('schedule')
  const [backendOnline, setBackendOnline] = useState(false)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [loadingQueue, setLoadingQueue] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [resetting, setResetting] = useState(false)

  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(null)
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([])
  const [selectedTaskForAudit, setSelectedTaskForAudit] = useState<WBSTask | null>(null)

  // Initial load
  useEffect(() => {
    fetchAllData()
    const interval = setInterval(checkBackendHealth, 15000)
    return () => clearInterval(interval)
  }, [])

  const checkBackendHealth = async () => {
    const isOnline = await api.checkHealth()
    setBackendOnline(isOnline)
  }

  const fetchAllData = async () => {
    setRefreshing(true)
    setLoadingSchedule(true)
    setLoadingQueue(true)
    try {
      const isOnline = await api.checkHealth()
      setBackendOnline(isOnline)

      const [sched, queue] = await Promise.all([
        api.getSchedule(),
        api.getReviewQueue()
      ])

      if (sched) setScheduleData(sched)
      if (queue) setReviewQueue(queue)
    } catch (err) {
      console.error('Data fetch error:', err)
    } finally {
      setLoadingSchedule(false)
      setLoadingQueue(false)
      setRefreshing(false)
    }
  }

  const handleResetDemo = async () => {
    if (!window.confirm('Reset Master WBS schedule and sample reconciliation queue to initial state?')) {
      return
    }
    setResetting(true)
    try {
      await api.resetDemoBaseline()
      await fetchAllData()
    } catch (err: any) {
      alert(`Reset error: ${err.message || 'Failed to reset demo.'}`)
    } finally {
      setResetting(false)
    }
  }

  const handleIngestSuccess = async (response: IngestResponse) => {
    // Refresh schedule and review queue data
    await fetchAllData()
  }

  const getViewHeaderDetails = () => {
    switch (currentView) {
      case 'schedule':
        return {
          title: 'L5/L6 Schedule Baseline',
          subtitle: 'Crude Distillation Unit (CDU-4) Expansion Master Schedule & Audited Actuals'
        }
      case 'ingestion':
        return {
          title: 'Time Agent Field Ingestion',
          subtitle: 'Audio Voice-Notes & Unstructured DPR Parsing with Sentence-Transformers'
        }
      case 'reconciliation':
        return {
          title: 'AI Reconciliation Queue',
          subtitle: 'Human-in-the-Loop (HITL) Planner Approvals & Unlinked Activity Backlog'
        }
      case 'memory':
        return {
          title: 'Institutional Memory & Analytics',
          subtitle: 'Semantic Vector Retrieval of Past Delay Incidents & Schedule Variance'
        }
    }
  }

  const headerInfo = getViewHeaderDetails()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex antialiased selection:bg-indigo-500 selection:text-white">
      {/* Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        reviewQueueCount={reviewQueue.length}
        onResetDemo={handleResetDemo}
        resetting={resetting}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          backendOnline={backendOnline}
          onRefresh={fetchAllData}
          refreshing={refreshing}
        />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {currentView === 'schedule' && (
            <ScheduleBaselineView
              scheduleData={scheduleData}
              loading={loadingSchedule}
              onSelectTaskAudit={setSelectedTaskForAudit}
            />
          )}

          {currentView === 'ingestion' && (
            <TimeAgentIngestionView
              onIngestSuccess={handleIngestSuccess}
              onNavigateToQueue={() => setCurrentView('reconciliation')}
              onNavigateToSchedule={() => setCurrentView('schedule')}
            />
          )}

          {currentView === 'reconciliation' && (
            <ReconciliationQueueView
              queueItems={reviewQueue}
              existingTasks={scheduleData?.tasks || []}
              loading={loadingQueue}
              onActionComplete={fetchAllData}
            />
          )}

          {currentView === 'memory' && <InstitutionalMemoryView />}
        </main>
      </div>

      {/* Clickable AI Audit Trail Modal */}
      {selectedTaskForAudit && (
        <AuditTrailModal
          task={selectedTaskForAudit}
          onClose={() => setSelectedTaskForAudit(null)}
        />
      )}
    </div>
  )
}
