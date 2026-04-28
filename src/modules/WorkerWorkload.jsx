import { useState, useCallback } from 'react'
import { getGap } from '../shared/utils/common'
import TimerSection from '../shared/components/TimerSection'
import PhotoSection from '../shared/components/PhotoSection'

const CARD_TITLES = {
  pick:     '자재 피킹',
  move:     '이동 시간',
  load:     '로딩/언로딩',
  recovery: '회수 시간'
}

const COLORS = {
  pick: '#10b981',
  move: '#3b82f6',
  load: '#f59e0b',
  recovery: '#ef4444'
}

export default function WorkerWorkload({
  data, updateData, addPhoto, removePhoto,
  addPersonnel, removePersonnel, updatePersonnel,
  addCycle, removeCycle, updateCycleCard, addCardInCycle, removeCardInCycle,
  switchPersonnel,
  addTransportType, updateTransportType, removeTransportType
}) {
  const { activePersonnel, dataByPersonnel, personnelList, transportTypes } = data
  const currentData = dataByPersonnel[activePersonnel] || {
    basicInfo: { transportType: 'worker', transportQty: 1, weight: 0.8, measureCount: 1 },
    measurements: [],
    photos: { transport: [], part: [] }
  }
  const basicInfo = currentData.basicInfo || {}
  const measurements = currentData.measurements || []
  const photos = currentData.photos || { transport: [], part: [] }

  const [userSelectedCycleId, setUserSelectedCycleId] = useState(null)
  const activeCycleId = userSelectedCycleId && measurements.find(m => m.id === userSelectedCycleId)
    ? userSelectedCycleId
    : (measurements[measurements.length - 1]?.id || null)
  const activeCycle = measurements.find(m => m.id === activeCycleId)
  const activeIndex = activeCycle ? measurements.findIndex(m => m.id === activeCycleId) + 1 : 0

  const [isManagerOpen, setIsManagerOpen] = useState(false)
  const [newPersonName, setNewPersonName] = useState('')
  const [editingName, setEditingName] = useState(null)
  const [editValue, setEditValue] = useState('')

  const [isTransportManagerOpen, setIsTransportManagerOpen] = useState(false)
  const [newTransportLabel, setNewTransportLabel] = useState('')
  const [newTransportSpeed, setNewTransportSpeed] = useState('')
  const [editingTransportId, setEditingTransportId] = useState(null)
  const [editTransportLabel, setEditTransportLabel] = useState('')
  const [editTransportSpeed, setEditTransportSpeed] = useState('')

  const setBasicInfo = useCallback((upd) => {
    updateData({ basicInfo: { ...basicInfo, ...upd } })
  }, [basicInfo, updateData])

  const handleAddCycle = useCallback(() => {
    addCycle()
    setUserSelectedCycleId(null)
  }, [addCycle])

  const handleDeleteCycle = useCallback((id) => {
    if (measurements.length <= 1) return
    if (window.confirm(`${activeIndex}회차의 모든 측정 데이터가 삭제됩니다. 계속하시겠습니까?`)) {
      removeCycle(id)
      setUserSelectedCycleId(null)
    }
  }, [measurements.length, activeIndex, removeCycle])

  /* 합계 계산 */
  const totalTransportSec = measurements.reduce((sum, cycle) =>
    sum + (cycle.cards?.reduce((cs, c) => cs + (parseFloat(getGap(c.start, c.end)) || 0), 0) || 0), 0)

  const totalMovingSec = measurements.reduce((sum, cycle) =>
    sum + (cycle.cards?.reduce((cs, c) => {
      const g = parseFloat(getGap(c.start, c.end)) || 0
      return (c.type === 'move' || c.type === 'recovery') ? cs + g : cs
    }, 0) || 0), 0)

  const selectedTransport = transportTypes[basicInfo.transportType] || { speed: 0 }
  const speed = basicInfo.transportType === 'other'
    ? (parseFloat(basicInfo.speed) || 0)
    : (parseFloat(selectedTransport.speed) || 0)

  const totalDistance = speed > 0 ? (totalMovingSec * speed) : 0
  const weight = parseFloat(basicInfo.weight) || 0.8
  const weightedTime = 3600 * weight
  const workloadRate = weightedTime > 0 ? ((totalTransportSec / weightedTime) * 100) : 0

  /* 다른 인원 통계 (대시보드) */
  const workerStats = (personnelList || []).map(name => {
    const pData = dataByPersonnel[name] || {}
    const bInfo = pData.basicInfo || {}
    const meas = pData.measurements || []
    let pickT = 0, moveT = 0, loadT = 0, recoverT = 0
    meas.forEach(m => m.cards?.forEach(c => {
      const g = parseFloat(getGap(c.start, c.end)) || 0
      if (c.type === 'pick') pickT += g
      else if (c.type === 'move') moveT += g
      else if (c.type === 'load') loadT += g
      else if (c.type === 'recovery') recoverT += g
    }))
    const totalT = pickT + moveT + loadT + recoverT
    const tType = bInfo.transportType || 'worker'
    const uSpeed = tType === 'other' ? (parseFloat(bInfo.speed) || 0) : (transportTypes[tType]?.speed || 0)
    const dist = (moveT + recoverT) * uSpeed
    const wght = parseFloat(bInfo.weight) || 0.8
    const capacityT = 3600 * wght
    const wlRate = capacityT > 0 ? (totalT / capacityT) * 100 : 0
    return {
      name, totalT, dist, wlRate: Math.round(wlRate * 10) / 10,
      details: {
        pickT, moveT, loadT, recoverT,
        moveDist: moveT * uSpeed,
        recoverDist: recoverT * uSpeed,
        pickRate: capacityT > 0 ? (pickT / capacityT) * 100 : 0,
        moveRate: capacityT > 0 ? (moveT / capacityT) * 100 : 0,
        loadRate: capacityT > 0 ? (loadT / capacityT) * 100 : 0,
        recoverRate: capacityT > 0 ? (recoverT / capacityT) * 100 : 0
      }
    }
  }).filter(w => w.name)

  const maxT = Math.max(1, ...workerStats.map(w => w.totalT))
  const maxDist = Math.max(1, ...workerStats.map(w => w.dist))
  const maxWl = Math.max(100, ...workerStats.map(w => w.wlRate))

  const teamTotal = workerStats.reduce((acc, w) => ({
    pickT: acc.pickT + w.details.pickT,
    moveT: acc.moveT + w.details.moveT,
    loadT: acc.loadT + w.details.loadT,
    recoverT: acc.recoverT + w.details.recoverT,
    totalT: acc.totalT + w.totalT,
    dist: acc.dist + w.dist
  }), { pickT: 0, moveT: 0, loadT: 0, recoverT: 0, totalT: 0, dist: 0 })

  const renderSegment = (val, total, color, label, unit = '') => {
    if (val <= 0 || total <= 0) return null
    const pct = (val / total) * 100
    return (
      <div style={{
        height: `${pct}%`, width: '100%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
      }} title={`${label}: ${val.toFixed(1)}${unit}`}>
        {pct > 12 && (
          <span style={{
            fontSize: '0.62rem', fontWeight: 800, color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)', whiteSpace: 'nowrap'
          }}>{val.toFixed(0)}{unit}</span>
        )}
      </div>
    )
  }

  const renderHorizontalSegment = (val, total, color, label, unit = '') => {
    if (val <= 0 || total <= 0) return null
    const pct = (val / total) * 100
    return (
      <div style={{
        width: `${pct}%`, height: '100%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
      }} title={`${label}: ${val.toFixed(1)}${unit}`}>
        {pct > 6 && (
          <span style={{
            fontSize: '0.65rem', fontWeight: 800, color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}>{val.toFixed(0)}{unit}</span>
        )}
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">물류작업자 업무 부하율 산출</div>

      {/* 기초 정보 */}
      <div className="section-card">
        <div className="section-title">기초 정보 입력</div>
        <div className="input-grid">
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="input-label">물류 인원 (이름)</span>
              <button className="btn" onClick={() => setIsManagerOpen(true)}
                style={{ height: 26, padding: '0 8px', fontSize: '0.7rem', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }}>
                명단관리
              </button>
            </div>
            <select className="input-field" value={activePersonnel || ''}
              onChange={e => switchPersonnel(e.target.value)}>
              {personnelList?.length === 0 && <option value="">인원을 추가하세요</option>}
              {personnelList?.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>

          <div className="input-group">
            <span className="input-label">측정 횟수</span>
            <input className="input-field" type="number" value={measurements.length || 0} readOnly />
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="input-label">운반 종류 (속도 자동)</span>
              <button className="btn" onClick={() => setIsTransportManagerOpen(true)}
                style={{ height: 26, padding: '0 8px', fontSize: '0.7rem', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }}>
                운반관리
              </button>
            </div>
            <select className="input-field" value={basicInfo.transportType || 'worker'}
              onChange={e => setBasicInfo({ transportType: e.target.value })}>
              {Object.entries(transportTypes).map(([id, t]) => (
                <option key={id} value={id}>{t.label} ({t.speed} m/s)</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <span className="input-label">운반 수량</span>
            <input className="input-field" type="number" min={1} value={basicInfo.transportQty ?? 1}
              onChange={e => setBasicInfo({ transportQty: e.target.value })} />
          </div>

          <div className="input-group">
            <span className="input-label">운반 속도 (m/s)</span>
            <input className="input-field" type="number" step="0.1" min={0} value={speed}
              readOnly={basicInfo.transportType !== 'other'}
              onChange={e => setBasicInfo({ speed: e.target.value })} />
          </div>

          <div className="input-group">
            <span className="input-label">부하 가중치 (0~1)</span>
            <input className="input-field" type="number" step="0.1" min={0.1} max={1}
              value={basicInfo.weight ?? 0.8}
              onChange={e => setBasicInfo({ weight: parseFloat(e.target.value) || 0.8 })} />
          </div>

          <PhotoSection title="운반 사진" photos={photos.transport}
            onAdd={(f) => addPhoto('transport', f)} onRemove={(i) => removePhoto('transport', i)} />
          <PhotoSection title="운반 부품 사진" photos={photos.part}
            onAdd={(f) => addPhoto('part', f)} onRemove={(i) => removePhoto('part', i)} />
        </div>
      </div>

      {/* 측정 결과 (누적 합산) */}
      <div className="section-card">
        <div className="section-title">측정 결과 <span className="sub-title">| 전체 누적 합산</span></div>
        <div className="input-grid">
          <div className="result-box">
            <span className="result-box__label">총 운반 시간 (피킹+이동+로딩+회수)</span>
            <span className="result-box__value">{totalTransportSec.toFixed(1)}초</span>
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">총 이동거리 (이동+회수)</span>
            <span className="result-box__value">{totalDistance.toFixed(1)} m</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">부하 가중 시간 = 3600 × {weight}</span>
            <span className="result-box__value">{weightedTime.toFixed(0)} 초</span>
          </div>
          <div className="result-box" style={{ background: workloadRate > 90 ? '#991b1b' : workloadRate > 70 ? '#b91c1c' : '#0f766e' }}>
            <span className="result-box__label">물류 부하율</span>
            <span className="result-box__value">{workloadRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* 측정 내역 */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div className="section-title" style={{ marginBottom: 0, border: 'none', paddingBottom: 0 }}>
            측정 내역 <span className="sub-title">| {measurements.length}회 중 {activeIndex || 0}회차</span>
          </div>
          {measurements.length > 1 && (
            <button className="btn" onClick={() => handleDeleteCycle(activeCycleId)}
              style={{ height: 32, padding: '0 12px', background: '#fee2e2', color: '#b91c1c', fontSize: '0.78rem' }}>
              🗑️ 회차삭제
            </button>
          )}
        </div>

        <div className="cycle-tabs-container">
          {measurements.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setUserSelectedCycleId(m.id)}
              className={`cycle-tab-btn ${activeCycleId === m.id ? 'active' : ''}`}
              title={`${idx + 1}회차`}
            >{idx + 1}</button>
          ))}
          <button onClick={handleAddCycle} className="cycle-tab-btn"
            style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}
            title="회차 추가">+</button>
        </div>

        {activeCycle?.cards?.map((card, idx) => (
          <TimerSection
            key={card.id}
            title={`${CARD_TITLES[card.type] || card.type} (${idx + 1})`}
            start={card.start}
            end={card.end}
            onStart={() => updateCycleCard(activeCycleId, card.id, { start: Date.now(), end: null })}
            onEnd={() => updateCycleCard(activeCycleId, card.id, { end: Date.now() })}
            onDelete={() => {
              if (window.confirm('이 카드를 삭제하시겠습니까?')) {
                removeCardInCycle(activeCycleId, card.id)
              }
            }}
            extraInputs={
              card.type === 'pick' ? (
                <div className="input-group">
                  <span className="input-label">자재 종수</span>
                  <input className="input-field" type="number" min={0} value={card.materialCount ?? ''}
                    onChange={e => updateCycleCard(activeCycleId, card.id, { materialCount: e.target.value })} />
                </div>
              ) : card.type === 'move' ? (
                <div className="input-group">
                  <span className="input-label">경유지 번호 (1~10)</span>
                  <select className="input-field" value={card.waypointNo ?? 1}
                    onChange={e => updateCycleCard(activeCycleId, card.id, { waypointNo: parseInt(e.target.value) })}>
                    {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}번</option>)}
                  </select>
                </div>
              ) : card.type === 'load' ? (
                <div className="input-group">
                  <span className="input-label">공정 번호 (1~10)</span>
                  <select className="input-field" value={card.processNo ?? 1}
                    onChange={e => updateCycleCard(activeCycleId, card.id, { processNo: parseInt(e.target.value) })}>
                    {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}번</option>)}
                  </select>
                </div>
              ) : null
            }
          />
        ))}

        <div className="input-grid" style={{ marginTop: 12, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
          <button className="btn" style={{ background: COLORS.pick, color: 'white', fontSize: '0.85rem' }}
            onClick={() => activeCycleId && addCardInCycle(activeCycleId, 'pick')}>+ 피킹</button>
          <button className="btn" style={{ background: COLORS.move, color: 'white', fontSize: '0.85rem' }}
            onClick={() => activeCycleId && addCardInCycle(activeCycleId, 'move')}>+ 이동</button>
          <button className="btn" style={{ background: COLORS.load, color: 'white', fontSize: '0.78rem' }}
            onClick={() => activeCycleId && addCardInCycle(activeCycleId, 'load')}>+ 로딩</button>
          <button className="btn" style={{ background: COLORS.recovery, color: 'white', fontSize: '0.85rem' }}
            onClick={() => activeCycleId && addCardInCycle(activeCycleId, 'recovery')}>+ 회수</button>
        </div>
      </div>

      {/* 대시보드 */}
      {workerStats.length > 0 && (
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '2px dashed #e2e8f0' }}>
          <div style={{
            fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary-dark)',
            textAlign: 'center', padding: '8px 16px 16px'
          }}>
            📊 전체 인원 분석 대시보드
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            {Object.entries({ '피킹': COLORS.pick, '이동': COLORS.move, '로딩/언로딩': COLORS.load, '회수': COLORS.recovery }).map(([label, color]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, background: color, borderRadius: 2 }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{label}</span>
              </div>
            ))}
          </div>

          <div className="section-card" style={{ background: 'white' }}>
            <div className="section-title">인원별 작업 시간 누적 (초)</div>
            <div style={{ display: 'flex', height: 220, gap: 8, alignItems: 'flex-end', margin: '32px 0 24px 0', borderBottom: '1px dashed #cbd5e1' }}>
              {workerStats.map((w, i) => {
                const heightPct = maxT > 0 ? Math.max(2, (w.totalT / maxT) * 100) : 2
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: `${heightPct}%`, position: 'relative', minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, position: 'absolute', top: -22, color: '#1e293b' }}>{w.totalT.toFixed(0)}s</div>
                    <div style={{ width: '100%', maxWidth: 36, height: '100%', display: 'flex', flexDirection: 'column-reverse', borderRadius: '4px 4px 0 0', overflow: 'hidden', background: '#f1f5f9' }}>
                      {renderSegment(w.details.pickT, w.totalT, COLORS.pick, '피킹')}
                      {renderSegment(w.details.moveT, w.totalT, COLORS.move, '이동')}
                      {renderSegment(w.details.loadT, w.totalT, COLORS.load, '로딩')}
                      {renderSegment(w.details.recoverT, w.totalT, COLORS.recovery, '회수')}
                    </div>
                    <div style={{ position: 'absolute', bottom: -22, fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="section-card" style={{ background: 'white' }}>
            <div className="section-title">인원별 총 이동 거리 누적 (m)</div>
            <div style={{ display: 'flex', height: 220, gap: 8, alignItems: 'flex-end', margin: '32px 0 24px 0', borderBottom: '1px dashed #cbd5e1' }}>
              {workerStats.map((w, i) => {
                const heightPct = maxDist > 0 ? Math.max(2, (w.dist / maxDist) * 100) : 2
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: `${heightPct}%`, position: 'relative', minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, position: 'absolute', top: -22, color: COLORS.move }}>{w.dist.toFixed(0)}m</div>
                    <div style={{ width: '100%', maxWidth: 36, height: '100%', display: 'flex', flexDirection: 'column-reverse', borderRadius: '4px 4px 0 0', overflow: 'hidden', background: '#f1f5f9' }}>
                      {renderSegment(w.details.moveDist, w.dist, COLORS.move, '이동', 'm')}
                      {renderSegment(w.details.recoverDist, w.dist, COLORS.recovery, '회수', 'm')}
                    </div>
                    <div style={{ position: 'absolute', bottom: -22, fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="section-card" style={{ background: 'white' }}>
            <div className="section-title">인원별 업무 부하율 (%)</div>
            <div style={{ display: 'flex', height: 220, gap: 8, alignItems: 'flex-end', margin: '32px 0 24px 0', borderBottom: '1px dashed #cbd5e1' }}>
              {workerStats.map((w, i) => {
                const heightPct = maxWl > 0 ? Math.max(2, (w.wlRate / maxWl) * 100) : 2
                const totalColor = w.wlRate > 90 ? COLORS.recovery : w.wlRate > 70 ? COLORS.load : COLORS.move
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: `${heightPct}%`, position: 'relative', minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, position: 'absolute', top: -22, color: totalColor }}>{w.wlRate.toFixed(0)}%</div>
                    <div style={{ width: '100%', maxWidth: 36, height: '100%', display: 'flex', flexDirection: 'column-reverse', borderRadius: '4px 4px 0 0', overflow: 'hidden', border: `1px solid ${totalColor}33`, background: '#f1f5f9' }}>
                      {renderSegment(w.details.pickRate, w.wlRate, COLORS.pick, '피킹', '%')}
                      {renderSegment(w.details.moveRate, w.wlRate, COLORS.move, '이동', '%')}
                      {renderSegment(w.details.loadRate, w.wlRate, COLORS.load, '로딩', '%')}
                      {renderSegment(w.details.recoverRate, w.wlRate, COLORS.recovery, '회수', '%')}
                    </div>
                    <div style={{ position: 'absolute', bottom: -22, fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {teamTotal.totalT > 0 && (
            <div className="section-card" style={{ background: '#1e293b', color: 'white' }}>
              <div className="section-title" style={{ color: 'white', borderBottomColor: '#334155' }}>창고 전체 작업 시간 분포 (팀 총합)</div>
              <div style={{ height: 44, width: '100%', display: 'flex', borderRadius: 8, overflow: 'hidden', margin: '12px 0 8px', border: '1px solid #475569' }}>
                {renderHorizontalSegment(teamTotal.pickT, teamTotal.totalT, COLORS.pick, '피킹', 's')}
                {renderHorizontalSegment(teamTotal.moveT, teamTotal.totalT, COLORS.move, '이동', 's')}
                {renderHorizontalSegment(teamTotal.loadT, teamTotal.totalT, COLORS.load, '로딩', 's')}
                {renderHorizontalSegment(teamTotal.recoverT, teamTotal.totalT, COLORS.recovery, '회수', 's')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', opacity: 0.85 }}>
                <span>총 작업 시간: {teamTotal.totalT.toFixed(1)}초</span>
                <span>총 이동 거리: {teamTotal.dist.toFixed(1)}m</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 명단 관리 모달 */}
      {isManagerOpen && (
        <div className="modal-overlay">
          <div className="section-card" style={{ width: '100%', maxWidth: 420, margin: 0, maxHeight: '85vh', overflowY: 'auto', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <span className="section-title" style={{ marginBottom: 0, border: 'none', padding: 0 }}>👥 물류 인원 명단 관리</span>
              <button onClick={() => { setIsManagerOpen(false); setEditingName(null) }}
                style={{ border: 'none', background: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="input-field" placeholder="새 이름" value={newPersonName}
                onChange={e => setNewPersonName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newPersonName.trim()) { addPersonnel(newPersonName.trim()); setNewPersonName('') } }} />
              <button className="btn btn-primary"
                onClick={() => { if (newPersonName.trim()) { addPersonnel(newPersonName.trim()); setNewPersonName('') } }}>
                추가
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {personnelList?.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: 16 }}>등록된 인원이 없습니다.</div>
              )}
              {personnelList?.map(name => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  {editingName === name ? (
                    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                      <input className="input-field" style={{ height: 36 }} value={editValue}
                        onChange={e => setEditValue(e.target.value)} autoFocus
                        onKeyDown={e => { if (e.key === 'Enter' && editValue.trim() && editValue !== name) { updatePersonnel(name, editValue.trim()); setEditingName(null) } }} />
                      <button onClick={() => { if (editValue.trim() && editValue !== name) updatePersonnel(name, editValue.trim()); setEditingName(null) }}
                        style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✅</button>
                      <button onClick={() => setEditingName(null)}
                        style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontWeight: 500 }}>{name}</span>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => { setEditingName(name); setEditValue(name) }}
                          style={{ border: 'none', background: 'none', color: '#3b82f6', fontSize: '1.1rem', cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => { if (window.confirm(`${name}님을 삭제하시겠습니까? 측정 데이터도 함께 삭제됩니다.`)) removePersonnel(name) }}
                          style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '1.1rem', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <button className="btn" style={{ width: '100%', marginTop: 20, background: '#f1f5f9', color: '#475569' }}
              onClick={() => { setIsManagerOpen(false); setEditingName(null) }}>닫기</button>
          </div>
        </div>
      )}

      {/* 운반 종류 관리 모달 */}
      {isTransportManagerOpen && (
        <div className="modal-overlay">
          <div className="section-card" style={{ width: '100%', maxWidth: 420, margin: 0, maxHeight: '85vh', overflowY: 'auto', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <span className="section-title" style={{ marginBottom: 0, border: 'none', padding: 0 }}>🚚 운반 종류 관리</span>
              <button onClick={() => { setIsTransportManagerOpen(false); setEditingTransportId(null) }}
                style={{ border: 'none', background: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <input className="input-field" placeholder="종류 이름 (예: 지게차)" value={newTransportLabel}
                onChange={e => setNewTransportLabel(e.target.value)} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input-field" type="number" step="0.1" placeholder="속도 (m/s)" value={newTransportSpeed}
                  onChange={e => setNewTransportSpeed(e.target.value)} />
                <button className="btn btn-primary"
                  onClick={() => {
                    if (newTransportLabel.trim() && newTransportSpeed) {
                      addTransportType(`tt_${Date.now()}`, newTransportLabel.trim(), newTransportSpeed)
                      setNewTransportLabel(''); setNewTransportSpeed('')
                    }
                  }}>추가</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(transportTypes).map(([id, t]) => (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  {editingTransportId === id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      <input className="input-field" value={editTransportLabel}
                        onChange={e => setEditTransportLabel(e.target.value)} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input className="input-field" type="number" step="0.1" value={editTransportSpeed}
                          onChange={e => setEditTransportSpeed(e.target.value)} />
                        <button onClick={() => { updateTransportType(id, { label: editTransportLabel, speed: editTransportSpeed }); setEditingTransportId(null) }}
                          style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✅</button>
                        <button onClick={() => setEditingTransportId(null)}
                          style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.label}</span>
                        <span style={{ fontSize: '0.78rem', color: '#3b82f6' }}>{t.speed} m/s</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => { setEditingTransportId(id); setEditTransportLabel(t.label); setEditTransportSpeed(t.speed) }}
                          style={{ border: 'none', background: 'none', color: '#3b82f6', fontSize: '1.1rem', cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => { if (window.confirm(`${t.label}을(를) 삭제하시겠습니까?`)) removeTransportType(id) }}
                          style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '1.1rem', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <button className="btn" style={{ width: '100%', marginTop: 20, background: '#f1f5f9', color: '#475569' }}
              onClick={() => { setIsTransportManagerOpen(false); setEditingTransportId(null) }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  )
}
