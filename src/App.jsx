import { useState, useRef } from 'react'
import { useAppState, initialState } from './store'
import WorkerWorkload from './modules/WorkerWorkload'
import ElevatorWorkload from './modules/ElevatorWorkload'
import AreaEfficiency from './modules/AreaEfficiency'
import InventoryStorage from './modules/InventoryStorage'
import AmrCalculation from './modules/AmrCalculation'
import { exportToExcel } from './shared/utils/excelExport'
import { saveJson } from './shared/utils/saveAndShare'

const TABS = [
  { id: 'worker',    label: '작업자 부하율', short: '작업자', icon: '👷' },
  { id: 'elevator',  label: 'E/V 부하율',    short: 'E/V',    icon: '🛗' },
  { id: 'area',      label: '면적 효율',     short: '면적',   icon: '📐' },
  { id: 'inventory', label: '재고 보관량',   short: '재고',   icon: '📦' },
  { id: 'amr',       label: 'AMR 대수',      short: 'AMR',    icon: '🤖' },
]

export default function App() {
  const {
    state, setState, updateWorker, updateElevator, updateArea, updateInventory, updateAmr,
    addPhoto, removePhoto, addPersonnel, removePersonnel, updatePersonnel,
    addCycle, removeCycle, updateCycleCard, addCardInCycle, removeCardInCycle,
    switchPersonnel, addTransportType, updateTransportType, removeTransportType,
    switchHogi, updateElevatorBasic,
    addElevatorCycle, removeElevatorCycle, updateElevatorCycleCard,
    addElevatorCard, removeElevatorCard,
    addElevatorLoadItem, updateElevatorLoadItem, removeElevatorLoadItem
  } = useAppState()

  const [activeTab, setActiveTab] = useState('worker')
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)

  const showToast = (msg) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2400)
  }

  const handleSave = async () => {
    try {
      const filename = `LWO_분석_${new Date().toISOString().slice(0, 10)}.json`
      const json = JSON.stringify(state, null, 2)
      const result = await saveJson(filename, json)
      showToast(`💾 저장 완료 (Documents/LWO/${filename})`)
    } catch (err) {
      console.error(err)
      showToast('⚠️ 저장 중 오류가 발생했습니다.')
    }
  }

  const handleLoad = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const loaded = JSON.parse(ev.target.result)
        // 필수 필드 보강
        setState({
          ...initialState,
          ...loaded,
          worker: { ...initialState.worker, ...(loaded.worker || {}) },
          elevator:  { ...initialState.elevator, ...(loaded.elevator || {}) },
          area:      { ...initialState.area, ...(loaded.area || {}) },
          inventory: { ...initialState.inventory, ...(loaded.inventory || {}) },
          amr:       { ...initialState.amr, ...(loaded.amr || {}) }
        })
        showToast('📂 데이터를 불러왔습니다.')
      } catch {
        showToast('⚠️ 파일 형식이 잘못되었습니다.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleExportExcel = async () => {
    try {
      await exportToExcel(state)
      showToast('📊 엑셀 저장 완료 (Documents/LWO/)')
    } catch (err) {
      console.error(err)
      showToast('⚠️ 엑셀 저장 중 오류가 발생했습니다.')
    }
  }

  const handleReset = () => {
    if (window.confirm('모든 입력 데이터를 초기화합니다. 진행하시겠습니까?')) {
      setState(initialState)
      try { localStorage.removeItem('lwo_app_persistent_data') } catch {}
      showToast('🔄 초기화되었습니다.')
    }
  }

  /* 사진 추가/삭제 wrap — 에러 시 사용자 알림 */
  const safeAddPhoto = async (module, category, file) => {
    try {
      await addPhoto(module, category, file)
    } catch (err) {
      console.error(err)
      showToast('⚠️ 사진을 처리할 수 없습니다. 다시 시도해 주세요.')
    }
  }

  const renderModule = () => {
    switch (activeTab) {
      case 'worker':
        return <WorkerWorkload
          key={state.worker.activePersonnel}
          data={state.worker}
          updateData={updateWorker}
          addPhoto={(cat, file) => safeAddPhoto('worker', cat, file)}
          removePhoto={(cat, idx) => removePhoto('worker', cat, idx)}
          addPersonnel={addPersonnel}
          removePersonnel={removePersonnel}
          updatePersonnel={updatePersonnel}
          addCycle={addCycle}
          removeCycle={removeCycle}
          updateCycleCard={updateCycleCard}
          addCardInCycle={addCardInCycle}
          removeCardInCycle={removeCardInCycle}
          switchPersonnel={switchPersonnel}
          addTransportType={addTransportType}
          updateTransportType={updateTransportType}
          removeTransportType={removeTransportType}
        />
      case 'elevator':
        return <ElevatorWorkload
          data={state.elevator}
          switchHogi={switchHogi}
          updateElevatorBasic={updateElevatorBasic}
          addElevatorCycle={addElevatorCycle}
          removeElevatorCycle={removeElevatorCycle}
          updateElevatorCycleCard={updateElevatorCycleCard}
          addElevatorCard={addElevatorCard}
          removeElevatorCard={removeElevatorCard}
          addElevatorLoadItem={addElevatorLoadItem}
          updateElevatorLoadItem={updateElevatorLoadItem}
          removeElevatorLoadItem={removeElevatorLoadItem}
          addPhoto={(file) => safeAddPhoto('elevator', null, file)}
          removePhoto={(idx) => removePhoto('elevator', null, idx)}
        />
      case 'area':
        return <AreaEfficiency data={state.area} updateData={updateArea} />
      case 'inventory':
        return <InventoryStorage data={state.inventory} updateData={updateInventory} />
      case 'amr':
        return <AmrCalculation data={state.amr} updateData={updateAmr} />
      default: return null
    }
  }

  return (
    <div className="app-container">
      {/* Sidebar (Desktop only) */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>📦 LWO</h1>
          <p>물류 시스템 분석 Tool</p>
        </div>
        <nav className="sidebar-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <span className="header-title">LWO</span>
          <span className="header-subtitle">물류 분석 Tool</span>
        </div>
        <div className="header-right">
          <label className="header-btn" title="JSON 데이터 불러오기">
            <span>📂</span><span className="hide-sm">열기</span>
            <input type="file" accept=".json,application/json" onChange={handleLoad} style={{ display: 'none' }} />
          </label>
          <button className="header-btn" onClick={handleSave} title="JSON 저장">
            <span>💾</span><span className="hide-sm">저장</span>
          </button>
          <button className="header-btn" onClick={handleExportExcel} title="Excel 내보내기"
            style={{ background: 'rgba(211,47,47,0.85)', borderColor: 'rgba(255,255,255,0.5)' }}>
            <span>📊</span><span className="hide-sm">엑셀</span>
          </button>
          <button className="header-btn" onClick={handleReset} title="모든 입력 초기화"
            style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.2)' }}>
            <span>🔄</span>
          </button>
        </div>
      </header>

      <main className="app-content">
        <div className="module-wrap">
          {renderModule()}
        </div>
      </main>

      {/* Bottom nav (Mobile/Tablet only) */}
      <nav className="bottom-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.short}</span>
          </button>
        ))}
      </nav>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
