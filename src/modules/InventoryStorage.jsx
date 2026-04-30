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

  /* 자사 라인 */
  const dayProd   = useMemo(() => n(f.selfUph) * n(f.dayShiftTime),   [f.selfUph, f.dayShiftTime])
  const nightProd = useMemo(() => n(f.selfUph) * n(f.nightShiftTime), [f.selfUph, f.nightShiftTime])
  const dailyProd = useMemo(() => dayProd + nightProd,                 [dayProd, nightProd])

  /* 고객 라인 */
  const custDailySupply = useMemo(() =>
    n(f.customerUph) * n(f.customerProdTime) * (n(f.distributionRatio) > 0 ? (n(f.distributionRatio) / 100) : 1),
    [f.customerUph, f.customerProdTime, f.distributionRatio]
  )

  /* 운반 리드타임 → 수량 환산 */
  const loadQty   = useMemo(() => (n(f.depotLoadTime) / 3600) * n(f.selfUph),         [f.depotLoadTime, f.selfUph])
  const moveQty   = useMemo(() => (n(f.selfToCustomerTime) / 3600) * n(f.selfUph),    [f.selfToCustomerTime, f.selfUph])
  const unloadQty = useMemo(() => (n(f.customerDockTime) / 3600) * n(f.selfUph),      [f.customerDockTime, f.selfUph])
  const waitQty   = useMemo(() => (n(f.waitTime) / 3600) * n(f.customerUph),          [f.waitTime, f.customerUph])
  const stockQty  = useMemo(() => (n(f.customerStock) / 3600) * n(f.customerUph),     [f.customerStock, f.customerUph])

  const leadTotalQty = useMemo(() => loadQty + moveQty + unloadQty + waitQty + stockQty,
    [loadQty, moveQty, unloadQty, waitQty, stockQty])

  /* 실제 적정 보관 수량 */
  const remainQty    = useMemo(() => n(f.selfUph) * n(f.remainTime),       [f.selfUph, f.remainTime])
  const totalStorage = useMemo(() => remainQty + nightProd + n(f.ageingQty),
    [remainQty, nightProd, f.ageingQty])

  /* 각 리드타임 행: 입력 1개 + 결과 1개를 한 row로 묶어서 보기 좋게 */
  const leadRows = [
    { key: 'depotLoadTime',      label: 'Depot ~ 상차 시간 (초)',          out: '상차 제품수',                 outVal: loadQty },
    { key: 'selfToCustomerTime', label: '자사 ~ 고객 이동 시간 (초)',      out: '이동 제품수',                 outVal: moveQty },
    { key: 'customerDockTime',   label: '고객 Dock ~ Depot 하차 시간 (초)', out: '하차 제품수',                 outVal: unloadQty },
    { key: 'waitTime',           label: '대기 시간 (초)',                  out: '대기 제품수 (고객 UPH 기준)',  outVal: waitQty },
    { key: 'customerStock',      label: '고객사 재고 시간 (초)',           out: '재고 제품수 (고객 UPH 기준)',  outVal: stockQty }
  ]

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">적정 재고 보관량 산출</div>

      {/* ── 1. 자사 생산 라인 ── */}
      <div className="section-card">
        <div className="section-title">생산 라인 UPH (자사)</div>

        <div className="inv-section-label">📥 입력</div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">자사 UPH</span></div>
            <input className="input-field" type="number" min={0} value={f.selfUph || ''}
              onChange={e => set('selfUph', e.target.value)} placeholder="시간당 생산 수량" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">주간 생산 시간 (h)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.dayShiftTime || ''}
              onChange={e => set('dayShiftTime', e.target.value)} placeholder="예: 8" />
          </div>
          <div className="input-group full-width">
            <div className="input-label-row"><span className="input-label">야간 생산 시간 (h)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.nightShiftTime || ''}
              onChange={e => set('nightShiftTime', e.target.value)} placeholder="예: 8" />
          </div>
        </div>

        <Divider />
        <div className="input-grid">
          <div className="result-box tone-slate">
            <span className="result-box__label">주간 생산량 = UPH × 주간시간</span>
            <span className="result-box__value">{fmtN(dayProd, '개', 0)}</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">야간 생산량 = UPH × 야간시간</span>
            <span className="result-box__value">{fmtN(nightProd, '개', 0)}</span>
          </div>
          <div className="result-box tone-dark full-width">
            <span className="result-box__label">일일 생산량</span>
            <span className="result-box__value">{fmtN(dailyProd, '개', 0)}</span>
          </div>
        </div>
      </div>

      {/* ── 2. 고객 라인 ── */}
      <div className="section-card">
        <div className="section-title">고객 라인 UPH</div>

        <div className="inv-section-label">📥 입력</div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">고객 UPH</span></div>
            <input className="input-field" type="number" min={0} value={f.customerUph || ''}
              onChange={e => set('customerUph', e.target.value)} />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">고객 생산 시간 (h)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.customerProdTime || ''}
              onChange={e => set('customerProdTime', e.target.value)} />
          </div>
          <div className="input-group full-width">
            <div className="input-label-row"><span className="input-label">물량 배분 비율 (%)</span></div>
            <input className="input-field" type="number" min={0} max={100} value={f.distributionRatio || ''}
              onChange={e => set('distributionRatio', e.target.value)} placeholder="예: 50" />
          </div>
        </div>

        <Divider />
        <div className="input-grid">
          <div className="result-box tone-dark full-width">
            <span className="result-box__label">고객 일 생산 공급량 = UPH × 시간 × 배분비율</span>
            <span className="result-box__value">{fmtN(custDailySupply, '개', 0)}</span>
          </div>
        </div>
      </div>

      {/* ── 3. 운반 리드타임 ── */}
      <div className="section-card">
        <div className="section-title">운반 리드타임 → 수량 환산</div>

        <div className="inv-section-label">📥 입력 + 자동 산출</div>

        {/* 각 리드타임을 입력+결과 쌍으로 그루핑 */}
        {leadRows.map((r) => (
          <div key={r.key} className="inv-lead-row">
            <div className="input-group">
              <div className="input-label-row"><span className="input-label">{r.label}</span></div>
              <input className="input-field" type="number" min={0} value={f[r.key] || ''}
                onChange={e => set(r.key, e.target.value)} placeholder="초" />
            </div>
            <div className="result-box tone-slate">
              <span className="result-box__label">{r.out}</span>
              <span className="result-box__value">{fmtN(r.outVal, '개', 0)}</span>
            </div>
          </div>
        ))}

        <Divider label="합계" />
        <div className="input-grid">
          <div className="result-box full-width" style={{ background: '#0f766e', padding: '14px 16px' }}>
            <span className="result-box__label">리드타임 합계 (5단계 누적)</span>
            <span className="result-box__value" style={{ fontSize: '1.4rem' }}>{fmtN(leadTotalQty, '개', 0)}</span>
          </div>
        </div>
      </div>

      {/* ── 4. 실제 적정 보관 수량 ── */}
      <div className="section-card">
        <div className="section-title">실제 적정 보관 수량</div>

        <div className="inv-section-label">📥 입력</div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">주간 잔량 생산 시간 (h)</span></div>
            <input className="input-field" type="number" step="0.1" min={0} value={f.remainTime || ''}
              onChange={e => set('remainTime', e.target.value)} />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">숙성 보관 수량 (개)</span></div>
            <input className="input-field" type="number" min={0} value={f.ageingQty || ''}
              onChange={e => set('ageingQty', e.target.value)} />
          </div>
        </div>

        <Divider />
        <div className="input-grid">
          <div className="result-box tone-blue">
            <span className="result-box__label">주간 잔량 = UPH × 잔량시간</span>
            <span className="result-box__value">{fmtN(remainQty, '개', 0)}</span>
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">야간 생산 수량</span>
            <span className="result-box__value">{fmtN(nightProd, '개', 0)}</span>
          </div>
          <div className="result-box full-width" style={{ background: '#1e40af', padding: '18px 16px' }}>
            <span className="result-box__label" style={{ fontSize: '0.85rem' }}>
              ⭐ Total 최적 보관 수량 = 주간잔량 + 야간생산 + 숙성보관
            </span>
            <span className="result-box__value" style={{ fontSize: '1.7rem' }}>{fmtN(totalStorage, '개', 0)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
