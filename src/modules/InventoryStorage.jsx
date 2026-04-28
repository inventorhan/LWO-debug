import { useMemo } from 'react'
import { n, fmtN } from '../shared/utils/common'

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

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">적정 재고 보관량 산출</div>

      <div className="section-card">
        <div className="section-title">생산 라인 UPH (자사)</div>
        <div className="input-grid">
          <div className="input-group">
            <span className="input-label">자사 UPH</span>
            <input className="input-field" type="number" min={0} value={f.selfUph || ''}
              onChange={e => set('selfUph', e.target.value)} placeholder="시간당 생산 수량" />
          </div>
          <div className="input-group">
            <span className="input-label">주간 생산 시간 (시간)</span>
            <input className="input-field" type="number" min={0} value={f.dayShiftTime || ''}
              onChange={e => set('dayShiftTime', e.target.value)} placeholder="예: 8" />
          </div>
          <div className="input-group">
            <span className="input-label">야간 생산 시간 (시간)</span>
            <input className="input-field" type="number" min={0} value={f.nightShiftTime || ''}
              onChange={e => set('nightShiftTime', e.target.value)} placeholder="예: 8" />
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">주간 생산량 = UPH × 주간시간</span>
            <span className="result-box__value">{fmtN(dayProd, '개', 0)}</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">야간 생산량 = UPH × 야간시간</span>
            <span className="result-box__value">{fmtN(nightProd, '개', 0)}</span>
          </div>
          <div className="result-box tone-dark">
            <span className="result-box__label">일일 생산량</span>
            <span className="result-box__value">{fmtN(dailyProd, '개', 0)}</span>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">고객 라인 UPH</div>
        <div className="input-grid">
          <div className="input-group">
            <span className="input-label">고객 UPH</span>
            <input className="input-field" type="number" min={0} value={f.customerUph || ''}
              onChange={e => set('customerUph', e.target.value)} />
          </div>
          <div className="input-group">
            <span className="input-label">고객 생산 시간 (시간)</span>
            <input className="input-field" type="number" min={0} value={f.customerProdTime || ''}
              onChange={e => set('customerProdTime', e.target.value)} />
          </div>
          <div className="input-group">
            <span className="input-label">물량 배분 비율 (%)</span>
            <input className="input-field" type="number" min={0} max={100} value={f.distributionRatio || ''}
              onChange={e => set('distributionRatio', e.target.value)} placeholder="예: 50" />
          </div>
          <div className="result-box tone-dark">
            <span className="result-box__label">고객 일 생산 공급량</span>
            <span className="result-box__value">{fmtN(custDailySupply, '개', 0)}</span>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">운반 리드타임 → 수량 환산</div>
        <div className="input-grid">
          <div className="input-group">
            <span className="input-label">Depot~상차 시간 (초)</span>
            <input className="input-field" type="number" min={0} value={f.depotLoadTime || ''}
              onChange={e => set('depotLoadTime', e.target.value)} />
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">상차 제품수 = 시간/3600 × UPH</span>
            <span className="result-box__value">{fmtN(loadQty, '개', 0)}</span>
          </div>
          <div className="input-group">
            <span className="input-label">자사~고객 이동 시간 (초)</span>
            <input className="input-field" type="number" min={0} value={f.selfToCustomerTime || ''}
              onChange={e => set('selfToCustomerTime', e.target.value)} />
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">이동 제품수</span>
            <span className="result-box__value">{fmtN(moveQty, '개', 0)}</span>
          </div>
          <div className="input-group">
            <span className="input-label">고객 Dock~Depot 하차 시간 (초)</span>
            <input className="input-field" type="number" min={0} value={f.customerDockTime || ''}
              onChange={e => set('customerDockTime', e.target.value)} />
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">하차 제품수</span>
            <span className="result-box__value">{fmtN(unloadQty, '개', 0)}</span>
          </div>
          <div className="input-group">
            <span className="input-label">대기 시간 (초)</span>
            <input className="input-field" type="number" min={0} value={f.waitTime || ''}
              onChange={e => set('waitTime', e.target.value)} />
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">대기 제품수 (고객 UPH 기준)</span>
            <span className="result-box__value">{fmtN(waitQty, '개', 0)}</span>
          </div>
          <div className="input-group">
            <span className="input-label">고객사 재고 시간 (초)</span>
            <input className="input-field" type="number" min={0} value={f.customerStock || ''}
              onChange={e => set('customerStock', e.target.value)} />
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">재고 제품수 (고객 UPH 기준)</span>
            <span className="result-box__value">{fmtN(stockQty, '개', 0)}</span>
          </div>
          <div className="result-box full-width tone-dark">
            <span className="result-box__label">리드타임 합계</span>
            <span className="result-box__value">{fmtN(leadTotalQty, '개', 0)}</span>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">실제 적정 보관 수량</div>
        <div className="input-grid">
          <div className="input-group">
            <span className="input-label">주간 잔량 생산 시간 (시간)</span>
            <input className="input-field" type="number" min={0} value={f.remainTime || ''}
              onChange={e => set('remainTime', e.target.value)} />
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">주간 잔량 수량 = UPH × 잔량시간</span>
            <span className="result-box__value">{fmtN(remainQty, '개', 0)}</span>
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">야간 생산 수량</span>
            <span className="result-box__value">{fmtN(nightProd, '개', 0)}</span>
          </div>
          <div className="input-group">
            <span className="input-label">숙성 보관 수량 (개)</span>
            <input className="input-field" type="number" min={0} value={f.ageingQty || ''}
              onChange={e => set('ageingQty', e.target.value)} />
          </div>
          <div className="result-box full-width" style={{ background: '#1e40af', padding: '14px 16px' }}>
            <span className="result-box__label" style={{ fontSize: '0.85rem' }}>
              ⭐ Total 최적 보관 수량 = 주간잔량 + 야간생산 + 숙성보관
            </span>
            <span className="result-box__value" style={{ fontSize: '1.5rem' }}>{fmtN(totalStorage, '개', 0)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
