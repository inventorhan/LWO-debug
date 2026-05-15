import { useMemo } from 'react'
import { n, fmtN } from '../shared/utils/common'

/* 섹션 내 입력↔결과 사이 구분선 */
const Divider = ({ label }) => (
  <div className="inv-divider">
    <span>{label || '산출 결과'}</span>
  </div>
)

export default function InventoryStorage({ data, updateData }) {
  const f = data || {}
  const set = (k, v) => updateData({ [k]: v })

  /* ── 1. 자사 기초 재고 ── */
  /* 고객 라인 */
  const custDayProd   = useMemo(() => n(f.customerDayUph)   * n(f.customerDayTime),   [f.customerDayUph, f.customerDayTime])
  const custNightProd = useMemo(() => n(f.customerNightUph) * n(f.customerNightTime), [f.customerNightUph, f.customerNightTime])
  const custDailyProd = useMemo(() => custDayProd + custNightProd,                     [custDayProd, custNightProd])
  /* 자사 라인 */
  const selfDayProd   = useMemo(() => n(f.selfDayUph)   * n(f.selfDayTime),   [f.selfDayUph, f.selfDayTime])
  const selfNightProd = useMemo(() => n(f.selfNightUph) * n(f.selfNightTime), [f.selfNightUph, f.selfNightTime])
  const selfDailyProd = useMemo(() => selfDayProd + selfNightProd,             [selfDayProd, selfNightProd])
  /* 일열 부족 수량 (양수=부족, 음수=잉여 → +/- 부호 표시) */
  const shortageQty = useMemo(() => custDailyProd - selfDailyProd, [custDailyProd, selfDailyProd])
  const fmtSigned = (v) => v === 0 ? '0대' : `${v > 0 ? '+' : '−'}${Math.abs(Math.round(v)).toLocaleString()}대`

  /* 고객 UPH 기준 (시간 → 수량 환산용) */
  const refUph = n(f.customerDayUph)

  /* ── 2. 운반 리드타임 → 수량 환산 ── */
  const ageingQty   = useMemo(() => (n(f.ageingTime)         / 3600) * refUph, [f.ageingTime, refUph])
  const safetyQty   = useMemo(() => (n(f.safetyStockTime)    / 3600) * refUph, [f.safetyStockTime, refUph])
  const loadQty     = useMemo(() => (n(f.depotLoadTime)      / 3600) * refUph, [f.depotLoadTime, refUph])
  const moveQty     = useMemo(() => (n(f.selfToCustomerTime) / 3600) * refUph, [f.selfToCustomerTime, refUph])
  const leadTimeStock = useMemo(() => ageingQty + safetyQty + loadQty + moveQty,
    [ageingQty, safetyQty, loadQty, moveQty])

  /* ── 3. 고객사 운영 재고 ── */
  const unloadQty       = useMemo(() => (n(f.customerDockTime)   / 3600) * refUph, [f.customerDockTime, refUph])
  const waitQty         = useMemo(() => (n(f.waitTime)           / 3600) * refUph, [f.waitTime, refUph])
  const customerSafeQty = useMemo(() => (n(f.customerSafetyTime) / 3600) * refUph, [f.customerSafetyTime, refUph])
  const customerOpsStock = useMemo(() => unloadQty + waitQty + customerSafeQty,
    [unloadQty, waitQty, customerSafeQty])

  /* ── 4. 최종 적정 재고 ── */
  const finalStock = useMemo(() => shortageQty + leadTimeStock + customerOpsStock,
    [shortageQty, leadTimeStock, customerOpsStock])

  const leadRows = [
    { key: 'ageingTime',         label: '숙성 시간 (초)',                 out: '숙성 수량',  outVal: ageingQty },
    { key: 'safetyStockTime',    label: '안심 재고 시간 (정책성, 초)',     out: '안심 수량',  outVal: safetyQty },
    { key: 'depotLoadTime',      label: 'Depot ~ 상차 시간 (초)',          out: '상차 수량',  outVal: loadQty },
    { key: 'selfToCustomerTime', label: '자사 ~ 고객 이동 시간 (초)',      out: '이동 수량',  outVal: moveQty }
  ]

  const opsRows = [
    { key: 'customerDockTime',   label: '고객 Dock ~ Depot 하차 시간 (초)', out: '하차 수량',     outVal: unloadQty },
    { key: 'waitTime',           label: '대기 시간 (초)',                  out: '대기 수량',     outVal: waitQty },
    { key: 'customerSafetyTime', label: '고객사 안전 재고 시간 (초)',       out: '안전 재고 수량', outVal: customerSafeQty }
  ]

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">적정 재고 보관량 산출</div>

      {/* ── 1. 자사 기초 재고 ── */}
      <div className="section-card">
        <div className="section-title">자사 기초 재고</div>

        <div className="inv-section-label">📥 고객 라인</div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">고객 주간 UPH</span></div>
            <input className="input-field" type="number" min={0} value={f.customerDayUph || ''}
              onChange={e => set('customerDayUph', e.target.value)} placeholder="예: 300" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">주간 작업 시간 (h)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.customerDayTime || ''}
              onChange={e => set('customerDayTime', e.target.value)} placeholder="예: 8" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">고객 야간 UPH</span></div>
            <input className="input-field" type="number" min={0} value={f.customerNightUph || ''}
              onChange={e => set('customerNightUph', e.target.value)} placeholder="예: 200" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">야간 작업 시간 (h)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.customerNightTime || ''}
              onChange={e => set('customerNightTime', e.target.value)} placeholder="예: 4" />
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">고객 주간 생산량 = UPH × 시간</span>
            <span className="result-box__value">{fmtN(custDayProd, '대', 0)}</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">고객 야간 생산량 = UPH × 시간</span>
            <span className="result-box__value">{fmtN(custNightProd, '대', 0)}</span>
          </div>
          <div className="result-box tone-dark full-width" style={{ background: '#B45309' }}>
            <span className="result-box__label">고객 일일 생산 수량</span>
            <span className="result-box__value">{fmtN(custDailyProd, '대', 0)}</span>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--color-card-border)', margin: '14px 0' }} />

        <div className="inv-section-label">📥 자사 라인</div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">자사 주간 UPH</span></div>
            <input className="input-field" type="number" min={0} value={f.selfDayUph || ''}
              onChange={e => set('selfDayUph', e.target.value)} placeholder="예: 200" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">주간 작업 시간 (h)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.selfDayTime || ''}
              onChange={e => set('selfDayTime', e.target.value)} placeholder="예: 8" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">자사 야간 UPH</span></div>
            <input className="input-field" type="number" min={0} value={f.selfNightUph || ''}
              onChange={e => set('selfNightUph', e.target.value)} placeholder="예: 100" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">야간 작업 시간 (h)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.selfNightTime || ''}
              onChange={e => set('selfNightTime', e.target.value)} placeholder="예: 4" />
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">자사 주간 생산량 = UPH × 시간</span>
            <span className="result-box__value">{fmtN(selfDayProd, '대', 0)}</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">자사 야간 생산량 = UPH × 시간</span>
            <span className="result-box__value">{fmtN(selfNightProd, '대', 0)}</span>
          </div>
          <div className="result-box tone-dark full-width" style={{ background: '#047857' }}>
            <span className="result-box__label">자사 일일 생산 수량</span>
            <span className="result-box__value">{fmtN(selfDailyProd, '대', 0)}</span>
          </div>
        </div>

        <Divider label="기초 재고 산출" />
        <div className="input-grid">
          <div className="result-box full-width" style={{ background: shortageQty < 0 ? '#047857' : '#A50034', padding: '14px 16px' }}>
            <span className="result-box__label" style={{ fontSize: '0.85rem' }}>
              일일 부족 수량 (기초 재고) = 고객 일일 − 자사 일일
              {shortageQty < 0 && ' · 잉여(자사 초과)'}
            </span>
            <span className="result-box__value" style={{ fontSize: '1.5rem' }}>{fmtSigned(shortageQty)}</span>
          </div>
        </div>
      </div>

      {/* ── 2. 운반 리드타임 ── */}
      <div className="section-card">
        <div className="section-title">운반 리드타임 → 수량 환산 <span className="sub-title">| 고객 UPH 기준</span></div>
        <div className="inv-section-label">📥 입력 + 자동 산출</div>
        {leadRows.map((r) => (
          <div key={r.key} className="inv-lead-row">
            <div className="input-group">
              <div className="input-label-row"><span className="input-label">{r.label}</span></div>
              <input className="input-field" type="number" min={0} value={f[r.key] || ''}
                onChange={e => set(r.key, e.target.value)} placeholder="초" />
            </div>
            <div className="result-box tone-slate">
              <span className="result-box__label">{r.out} = 시간/3600 × 고객 UPH</span>
              <span className="result-box__value">{fmtN(r.outVal, '대', 0)}</span>
            </div>
          </div>
        ))}
        <Divider label="합계" />
        <div className="input-grid">
          <div className="result-box full-width" style={{ background: '#047857', padding: '14px 16px' }}>
            <span className="result-box__label">리드타임 재고 = 숙성 + 안심 + 상차 + 이동</span>
            <span className="result-box__value" style={{ fontSize: '1.4rem' }}>{fmtN(leadTimeStock, '대', 0)}</span>
          </div>
        </div>
      </div>

      {/* ── 3. 고객사 운영 재고 ── */}
      <div className="section-card">
        <div className="section-title">고객사 운영 재고 <span className="sub-title">| 고객 UPH 기준</span></div>
        <div className="inv-section-label">📥 입력 + 자동 산출</div>
        {opsRows.map((r) => (
          <div key={r.key} className="inv-lead-row">
            <div className="input-group">
              <div className="input-label-row"><span className="input-label">{r.label}</span></div>
              <input className="input-field" type="number" min={0} value={f[r.key] || ''}
                onChange={e => set(r.key, e.target.value)} placeholder="초" />
            </div>
            <div className="result-box tone-slate">
              <span className="result-box__label">{r.out} = 시간/3600 × 고객 UPH</span>
              <span className="result-box__value">{fmtN(r.outVal, '대', 0)}</span>
            </div>
          </div>
        ))}
        <Divider label="합계" />
        <div className="input-grid">
          <div className="result-box full-width" style={{ background: '#047857', padding: '14px 16px' }}>
            <span className="result-box__label">고객사 운영 재고 = 하차 + 대기 + 안전 재고</span>
            <span className="result-box__value" style={{ fontSize: '1.4rem' }}>{fmtN(customerOpsStock, '대', 0)}</span>
          </div>
        </div>
      </div>

      {/* ── 4. 최종 적정 재고 ── */}
      <div className="section-card">
        <div className="section-title">최종 적정 재고</div>
        <div className="input-grid">
          <div className="result-box tone-blue">
            <span className="result-box__label">① 일일 부족 수량</span>
            <span className="result-box__value">{fmtSigned(shortageQty)}</span>
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">② 리드타임 재고</span>
            <span className="result-box__value">{fmtN(leadTimeStock, '대', 0)}</span>
          </div>
          <div className="result-box tone-blue full-width">
            <span className="result-box__label">③ 고객사 운영 재고</span>
            <span className="result-box__value">{fmtN(customerOpsStock, '대', 0)}</span>
          </div>
          <div className="result-box full-width" style={{ background: '#A50034', padding: '18px 16px' }}>
            <span className="result-box__label" style={{ fontSize: '0.85rem' }}>
              ⭐ Total 최종 적정 재고 = ① + ② + ③
            </span>
            <span className="result-box__value" style={{ fontSize: '1.7rem' }}>{fmtN(finalStock, '대', 0)}</span>
          </div>
        </div>

        <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: '0.78rem', color: '#4A4045', lineHeight: 1.7 }}>
          <div><strong>① Total 최종 적재 재고</strong> = 일일 부족 수량 + 리드타임 재고 + 고객사 운영 재고</div>
          <div><strong>② 안심 재고</strong> : 운반 사고, 설비 고장 빈도수, 차량 수배 등등</div>
          <div><strong>③ 대기 시간</strong> : 고객사 조립 라인 투입 전 보관 수량</div>
          <div><strong>④ 고객 안전 재고</strong> : 7대 로스 감안 재고</div>
        </div>
      </div>
    </div>
  )
}
