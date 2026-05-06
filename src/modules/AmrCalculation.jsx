import { useMemo } from 'react'
import { n, fmtN } from '../shared/utils/common'

const RATE_OPTIONS = [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0]

export default function AmrCalculation({ data, updateData }) {
  const f = data || {}
  const set = (k, v) => updateData({ [k]: v })

  /* ── 생산 수량 (UPH / 운행횟수 / Cycle) ── */
  const uph = useMemo(() => {
    const tt = n(f.tactTime)
    const rr = n(f.recycleRate) / 100
    return tt > 0 ? (3600 / tt) * rr : 0
  }, [f.tactTime, f.recycleRate])

  const amrRunCount  = useMemo(() => n(f.loadQty) > 0 ? uph / n(f.loadQty) : 0, [uph, f.loadQty])
  /* AMR 1회 Cycle Time = 3600 / 운행횟수 (PPT 산식) */
  const amrCycleTime = useMemo(() => amrRunCount > 0 ? 3600 / amrRunCount : 0, [amrRunCount])

  /* ── 왕복 이동 시간 ── */
  const roundTripDist = useMemo(() => n(f.distance) * 2, [f.distance])
  const totalLoadSec  = useMemo(() => n(f.loadCount) * n(f.loadTime), [f.loadCount, f.loadTime])
  const totalUnloadSec = useMemo(() => n(f.unloadCount) * n(f.unloadTime), [f.unloadCount, f.unloadTime])
  const totalLoadUnloadSec = totalLoadSec + totalUnloadSec

  const roundTripSec = useMemo(() => {
    const speed = n(f.amrtSpeed)
    return speed > 0 ? (roundTripDist / speed) + totalLoadUnloadSec : 0
  }, [roundTripDist, f.amrtSpeed, totalLoadUnloadSec])

  const roundTripMin = roundTripSec / 60

  /* ── 필요 대수 (PPT 요청: 1.2대 → Round-up → 2대, +Spare) ── */
  /* 원단위 = 왕복시간 / Cycle (실수). 가동율로 나눈 뒤 ceil 하여 최종 대수 */
  const baseRaw = useMemo(() =>
    amrCycleTime > 0 ? roundTripSec / amrCycleTime : 0,
    [roundTripSec, amrCycleTime]
  )

  const operationRate = n(f.operationRate) || 0.8
  const adjustedRaw = operationRate > 0 ? baseRaw / operationRate : 0
  /* 결과가 1.2대 이면 무조건 2대로 — Math.ceil */
  const amrBaseUnits = baseRaw > 0 ? Math.ceil(baseRaw) : 0
  const amrAdjustedUnits = adjustedRaw > 0 ? Math.ceil(adjustedRaw) : 0
  const amrRequired = amrAdjustedUnits + n(f.spare)

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">AMR 대수 산출</div>

      {/* 1) 생산 수량 정보 */}
      <div className="section-card">
        <div className="section-title">생산 수량 정보</div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">Tact Time (초)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.tactTime || ''}
              onChange={e => set('tactTime', e.target.value)} placeholder="초" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">회수율 (%)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} max={100} value={f.recycleRate || ''}
              onChange={e => set('recycleRate', e.target.value)} placeholder="예: 90" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">장입 수량 (개/회)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.loadQty || ''}
              onChange={e => set('loadQty', e.target.value)} />
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">UPH = (3600 / Tact) × 회수율</span>
            <span className="result-box__value">{fmtN(uph, '', 1)}</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">AMR 운행 횟수 = UPH / 장입수량</span>
            <span className="result-box__value">{fmtN(amrRunCount, '회', 1)}</span>
          </div>
          <div className="result-box tone-dark">
            <span className="result-box__label">AMR 1회 Cycle Time = 3600 / 운행횟수</span>
            <span className="result-box__value">{fmtN(amrCycleTime, '초', 1)}</span>
          </div>
        </div>
      </div>

      {/* 2) AMR 운행 산출 — 왕복거리 / 로딩 / 언로딩 그룹화 */}
      <div className="section-card">
        <div className="section-title">AMR 운행 산출</div>

        {/* AMR Speed + 이동거리 (나란히) */}
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">AMR Speed (m/s)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.amrtSpeed || ''}
              onChange={e => set('amrtSpeed', e.target.value)} />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">AMR 이동 거리 (m, 편도)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.distance || ''}
              onChange={e => set('distance', e.target.value)} />
          </div>
          <div className="result-box full-width tone-blue">
            <span className="result-box__label">왕복 이동 거리 = 거리 × 2</span>
            <span className="result-box__value">{fmtN(roundTripDist, 'm', 1)}</span>
          </div>
        </div>

        {/* 로딩 그룹: 횟수 + 시간(나란히) → Total */}
        <div style={{ height: 1, background: 'var(--color-card-border)', margin: '14px 0' }} />
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">로딩 횟수</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.loadCount || ''}
              onChange={e => set('loadCount', e.target.value)} />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">로딩 시간 (초/회)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.loadTime || ''}
              onChange={e => set('loadTime', e.target.value)} />
          </div>
          <div className="result-box full-width tone-slate">
            <span className="result-box__label">Total 로딩 시간</span>
            <span className="result-box__value">{fmtN(totalLoadSec, '초', 1)}</span>
          </div>
        </div>

        {/* 언로딩 그룹: 횟수 + 시간(나란히) → Total */}
        <div style={{ height: 1, background: 'var(--color-card-border)', margin: '14px 0' }} />
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">언로딩 횟수</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.unloadCount || ''}
              onChange={e => set('unloadCount', e.target.value)} />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">언로딩 시간 (초/회)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.unloadTime || ''}
              onChange={e => set('unloadTime', e.target.value)} />
          </div>
          <div className="result-box full-width tone-slate">
            <span className="result-box__label">Total 언로딩 시간</span>
            <span className="result-box__value">{fmtN(totalUnloadSec, '초', 1)}</span>
          </div>
        </div>

        {/* 로딩+언로딩 합계 */}
        <div style={{ height: 1, background: 'var(--color-card-border)', margin: '14px 0' }} />
        <div className="input-grid">
          <div className="result-box full-width" style={{ background: '#b91c1c' }}>
            <span className="result-box__label">Total 로딩 + 언로딩 시간</span>
            <span className="result-box__value">{fmtN(totalLoadUnloadSec, '초', 1)}</span>
          </div>
        </div>
      </div>

      {/* 3) AMR 왕복 이동 시간 산출 */}
      <div className="section-card">
        <div className="section-title">AMR 총 왕복시간 산출 <span className="sub-title">| AMR Cycle Time</span></div>
        <div className="input-grid">
          <div className="result-box tone-blue full-width">
            <span className="result-box__label">총 왕복시간(초) = (왕복거리 / Speed) + 로딩언로딩</span>
            <span className="result-box__value">{fmtN(roundTripSec, '초', 1)}</span>
          </div>
          <div className="result-box tone-dark full-width">
            <span className="result-box__label">총 왕복시간(분)</span>
            <span className="result-box__value">{fmtN(roundTripMin, '분', 2)}</span>
          </div>
        </div>
      </div>

      {/* 4) 실제 AMR 필요 대수 — 가동률 select + Round-up + Spare */}
      <div className="section-card">
        <div className="section-title">실제 AMR 필요 대수</div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">AMR 가동율 (0~1)</span></div>
            <select className="input-field" value={f.operationRate ?? 0.8}
              onChange={e => set('operationRate', parseFloat(e.target.value))}>
              {RATE_OPTIONS.map(r => <option key={r} value={r}>{r.toFixed(2)}</option>)}
            </select>
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">AMR Spare (대)</span></div>
            <input className="input-field" type="number" min={0} value={f.spare ?? 1}
              onChange={e => set('spare', e.target.value)} />
          </div>

          <div className="result-box tone-slate full-width">
            <span className="result-box__label">AMR 원단위 = ⌈ 총왕복시간 / Cycle ⌉ (소수→올림)</span>
            <span className="result-box__value">
              {baseRaw > 0
                ? <>{baseRaw.toFixed(2)} → <span style={{ color: '#fbbf24' }}>{amrBaseUnits}대</span></>
                : '—'}
            </span>
          </div>
          <div className="result-box tone-slate full-width">
            <span className="result-box__label">가동율 적용 = ⌈ 원단위 / 가동율 ⌉ (충전, 수리 등 시간)</span>
            <span className="result-box__value">
              {adjustedRaw > 0
                ? <>{adjustedRaw.toFixed(2)} → <span style={{ color: '#fbbf24' }}>{amrAdjustedUnits}대</span></>
                : '—'}
            </span>
          </div>
          <div className="result-box full-width" style={{ background: '#1e40af', padding: '14px 16px' }}>
            <span className="result-box__label" style={{ fontSize: '0.85rem' }}>
              ⭐ AMR 필요 대수 = ⌈ 원단위 / 가동율 ⌉ + Spare
            </span>
            <span className="result-box__value" style={{ fontSize: '1.5rem' }}>
              {amrRequired > 0 ? `${amrRequired}대` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
