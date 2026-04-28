import { useCallback } from 'react'
import { getGap } from '../shared/utils/common'
import TimerSection from '../shared/components/TimerSection'
import PhotoSection from '../shared/components/PhotoSection'

const CARD_TITLES = {
  load:     'E/V 로딩',
  move:     '이동 시간',
  unload:   'E/V 언로딩',
  recovery: '회수 시간'
}

const COLORS = {
  load: '#f59e0b',
  move: '#3b82f6',
  unload: '#ea580c',
  recovery: '#ef4444'
}

export default function ElevatorWorkload({ data, updateData, addPhoto, removePhoto }) {
  const basicInfo = data.basicInfo || {}
  const cards = data.cards || []
  const photos = data.photos || []

  const setBasicInfo = useCallback((upd) => {
    updateData({ basicInfo: { ...basicInfo, ...upd } })
  }, [basicInfo, updateData])

  const updateCard = useCallback((cardId, updates) => {
    updateData({ cards: cards.map(c => c.id === cardId ? { ...c, ...updates } : c) })
  }, [cards, updateData])

  const addCard = useCallback((type) => {
    const newCard = {
      id: `ev-${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type, start: null, end: null,
      ...(type === 'load' ? { materialCount: '' }
         : type === 'unload' ? { processNo: 1 }
         : type === 'move' ? { floorNo: 1 } : {})
    }
    updateData({ cards: [...cards, newCard] })
  }, [cards, updateData])

  const removeCard = useCallback((cardId) => {
    if (window.confirm('카드를 삭제하시겠습니까?')) {
      updateData({ cards: cards.filter(c => c.id !== cardId) })
    }
  }, [cards, updateData])

  const totalTransportSec = cards.reduce((sum, card) => sum + (parseFloat(getGap(card.start, card.end)) || 0), 0)
  const moveSec = cards.filter(c => c.type === 'move')
    .reduce((sum, c) => sum + (parseFloat(getGap(c.start, c.end)) || 0), 0)
  const weight = parseFloat(basicInfo.weight) || 0.8
  const weightedTime = 3600 * weight
  const workloadRate = weightedTime > 0 ? ((totalTransportSec / weightedTime) * 100) : 0

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">Elevator 부하율 산출</div>

      <div className="section-card">
        <div className="section-title">기초 정보 입력</div>
        <div className="input-grid">
          <div className="input-group">
            <span className="input-label">E/V 호기 (1~9)</span>
            <select className="input-field" value={basicInfo.hogiNo ?? 1}
              onChange={e => setBasicInfo({ hogiNo: parseInt(e.target.value) })}>
              {Array.from({ length: 9 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}호기</option>)}
            </select>
          </div>
          <div className="input-group">
            <span className="input-label">대차 개수</span>
            <input className="input-field" type="number" min={0} value={basicInfo.cartQty ?? 0}
              onChange={e => setBasicInfo({ cartQty: e.target.value })} />
          </div>
          <div className="input-group">
            <span className="input-label">박스 개수</span>
            <input className="input-field" type="number" min={0} value={basicInfo.boxQty ?? 0}
              onChange={e => setBasicInfo({ boxQty: e.target.value })} />
          </div>
          <div className="input-group">
            <span className="input-label">파렛트 개수</span>
            <input className="input-field" type="number" min={0} value={basicInfo.palletQty ?? 0}
              onChange={e => setBasicInfo({ palletQty: e.target.value })} />
          </div>
          <div className="input-group">
            <span className="input-label">손수레 개수</span>
            <input className="input-field" type="number" min={0} value={basicInfo.handcartQty ?? 0}
              onChange={e => setBasicInfo({ handcartQty: e.target.value })} />
          </div>
          <div className="input-group">
            <span className="input-label">부하 가중치 (0~1)</span>
            <input className="input-field" type="number" step="0.1" min={0.1} max={1}
              value={basicInfo.weight ?? 0.8}
              onChange={e => setBasicInfo({ weight: parseFloat(e.target.value) || 0.8 })} />
          </div>
          <div className="input-group full-width">
            <PhotoSection title="호기 적재 사진" photos={photos} onAdd={addPhoto} onRemove={removePhoto} />
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">측정 결과 <span className="sub-title">| 누적 합산</span></div>
        <div className="input-grid">
          <div className="result-box">
            <span className="result-box__label">총 운반 시간</span>
            <span className="result-box__value">{totalTransportSec.toFixed(1)}초</span>
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">누적 이동 시간</span>
            <span className="result-box__value">{moveSec.toFixed(1)}초</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">부하 가중 시간 = 3600 × {weight}</span>
            <span className="result-box__value">{weightedTime.toFixed(0)}초</span>
          </div>
          <div className="result-box" style={{ background: workloadRate > 90 ? '#991b1b' : workloadRate > 70 ? '#b91c1c' : '#0f766e' }}>
            <span className="result-box__label">E/V 부하율</span>
            <span className="result-box__value">{workloadRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">측정 내역 <span className="sub-title">| {cards.length}건</span></div>

        {cards.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: '#64748b', fontSize: '0.9rem' }}>
            아래 버튼으로 측정 카드를 추가해 주세요.
          </div>
        )}

        {cards.map((card, idx) => (
          <TimerSection
            key={card.id}
            title={`${CARD_TITLES[card.type] || card.type} (${idx + 1})`}
            start={card.start}
            end={card.end}
            onStart={() => updateCard(card.id, { start: Date.now(), end: null })}
            onEnd={() => updateCard(card.id, { end: Date.now() })}
            onDelete={() => removeCard(card.id)}
            extraInputs={
              card.type === 'load' ? (
                <div className="input-group">
                  <span className="input-label">자재 종수</span>
                  <input className="input-field" type="number" min={0} value={card.materialCount ?? ''}
                    onChange={e => updateCard(card.id, { materialCount: e.target.value })} />
                </div>
              ) : card.type === 'move' ? (
                <div className="input-group">
                  <span className="input-label">층 선택 (1~10)</span>
                  <select className="input-field" value={card.floorNo ?? 1}
                    onChange={e => updateCard(card.id, { floorNo: parseInt(e.target.value) })}>
                    {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}층</option>)}
                  </select>
                </div>
              ) : card.type === 'unload' ? (
                <div className="input-group">
                  <span className="input-label">공정 번호 (1~10)</span>
                  <select className="input-field" value={card.processNo ?? 1}
                    onChange={e => updateCard(card.id, { processNo: parseInt(e.target.value) })}>
                    {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}번</option>)}
                  </select>
                </div>
              ) : null
            }
          />
        ))}

        <div className="input-grid" style={{ marginTop: 12, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
          <button className="btn" style={{ background: COLORS.load, color: 'white', fontSize: '0.85rem' }} onClick={() => addCard('load')}>+ 로딩</button>
          <button className="btn" style={{ background: COLORS.move, color: 'white', fontSize: '0.85rem' }} onClick={() => addCard('move')}>+ 이동</button>
          <button className="btn" style={{ background: COLORS.unload, color: 'white', fontSize: '0.85rem' }} onClick={() => addCard('unload')}>+ 언로딩</button>
          <button className="btn" style={{ background: COLORS.recovery, color: 'white', fontSize: '0.85rem' }} onClick={() => addCard('recovery')}>+ 회수</button>
        </div>
      </div>
    </div>
  )
}
