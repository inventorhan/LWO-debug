import { useMemo, useCallback } from 'react'
import { n, fmtN } from '../shared/utils/common'
import HelpHint, { HintFormula, HintNote } from '../shared/components/HelpHint'
import normalCurveImg from '../assets/normal_distribution.png'

/* 통계 함수 */
const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
const stdev = (arr) => {
  if (arr.length < 2) return 0
  const m = avg(arr)
  const s = arr.reduce((a, v) => a + (v - m) ** 2, 0) / (arr.length - 1)
  return Math.sqrt(s)
}

/* 정규분포 + Z표 이미지 (PPT에서 추출, 그대로 표시) */
const NormalCurveImage = () => (
  <img
    src={normalCurveImg}
    alt="통계적 방법: 적정재고 = 입고량평균(μ) + 안전재고(Zσ) — 정규분포 + 안전계수(Z) 표"
    style={{
      width: '100%',
      maxWidth: 520,
      height: 'auto',
      display: 'block',
      margin: '0 auto',
      borderRadius: 6,
      userSelect: 'none'
    }}
    draggable={false}
  />
)

export default function InventoryStatistics({ data, updateData, addRecord, updateRecord, removeRecord }) {
  const f = data || {}
  const records = f.records || []
  const set = (k, v) => updateData({ [k]: v })

  /* 통계 산출 — 빈 값은 무시 */
  const prodArr = records.map(r => n(r.production)).filter(v => v > 0)
  const shipArr = records.map(r => n(r.shipment)).filter(v => v > 0)
  const stockArr = records.map(r => n(r.stock)).filter(v => v > 0)

  const stats = useMemo(() => ({
    /* 재고 */
    stockAvg: avg(stockArr),  stockStd: stdev(stockArr),
    stockMin: stockArr.length ? Math.min(...stockArr) : 0,
    stockMax: stockArr.length ? Math.max(...stockArr) : 0,
    /* 출하량 */
    shipAvg: avg(shipArr),  shipStd: stdev(shipArr),
    shipMin: shipArr.length ? Math.min(...shipArr) : 0,
    shipMax: shipArr.length ? Math.max(...shipArr) : 0,
    /* 생산량 */
    prodAvg: avg(prodArr),
    prodCount: prodArr.length
  }), [stockArr.join(','), shipArr.join(','), prodArr.join(',')])  // eslint-disable-line

  /* 적정 재고 (99.9% / 99.5%) */
  const stock999 = stats.shipAvg + stats.shipStd * 3.09
  const stock995 = stats.shipAvg + stats.shipStd * 2.575
  const days999 = stats.shipAvg > 0 ? stock999 / stats.shipAvg : 0
  const days995 = stats.shipAvg > 0 ? stock995 / stats.shipAvg : 0

  const handleAdd = useCallback(() => addRecord(), [addRecord])
  const handleUpdate = useCallback((id, field, value) => updateRecord(id, { [field]: value }), [updateRecord])
  const handleRemove = useCallback((id) => {
    if (window.confirm('이 일자 데이터를 삭제하시겠습니까?')) removeRecord(id)
  }, [removeRecord])

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">실적 기준 적정 재고 산출</div>

      {/* ── 1. 통계적 방법 안내 ── */}
      <div className="section-card">
        <div className="section-title">
          통계적 방법 안내
          <HelpHint title="통계적 방법">
            <p>실제 운영 데이터(일별 생산·출하·재고)를 입력해 <b>통계적으로</b> 적정 재고를 산출합니다.</p>
            <HintFormula>{`적정 재고 = 평균 소요량 + (안전계수 × 소요량 편차)
         = 평균 출하량 + Z × 출하량 표준편차`}</HintFormula>
            <p>안전계수 Z는 목표 서비스율(품절 없이 충족할 확률)에 따라 결정됩니다.</p>
            <HintNote type="ok">데이터가 많을수록 (최소 7일, 권장 30일 이상) 결과가 더 정확해집니다.</HintNote>
          </HelpHint>
        </div>

        <div style={{ background: 'white', border: '1px solid #E5DCDF', borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <NormalCurveImage />
        </div>
        <div style={{ fontSize: '0.78rem', color: '#7C6E74' }}>
          ※ 본 모듈은 <b>99.9% (Z=3.09)</b> 및 <b>99.5% (Z=2.575)</b>를 자동 산출합니다.
        </div>
      </div>

      {/* ── 2. 기초 정보 ── */}
      <div className="section-card">
        <div className="section-title">
          기초 정보
          <HelpHint title="기초 정보">
            <p>분석 대상이 되는 <b>생산 제품 / 모델</b>을 식별합니다. 라벨 용도이며 산출 결과에는 영향을 주지 않습니다.</p>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">생산 제품</span></div>
            <input className="input-field" type="text" value={f.product || ''}
              onChange={e => set('product', e.target.value)} placeholder="예: 세탁기, 냉장고 등" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">모델</span></div>
            <input className="input-field" type="text" value={f.model || ''}
              onChange={e => set('model', e.target.value)} placeholder="예: Top Loader 4도어 등" />
          </div>
        </div>
      </div>

      {/* ── 3. 일자별 입력 ── */}
      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <div className="section-title" style={{ marginBottom: 0, border: 'none', paddingBottom: 0 }}>
            일자별 실적 입력 <span className="sub-title">| 총 {records.length}일</span>
            <HelpHint title="일자별 실적 입력">
              <p>매일의 <b>생산량 · 출하량 · 재고량</b>을 기록합니다.</p>
              <ul style={{ paddingLeft: 18, margin: '6px 0' }}>
                <li><b>일자</b>: YYYY-MM-DD 등 자유 입력</li>
                <li><b>생산량</b>: 그날 생산된 수량</li>
                <li><b>출하량</b>: 그날 출하된 수량 → 통계의 핵심 변수</li>
                <li><b>재고량</b>: 그날 종료 시점의 재고 수량</li>
              </ul>
              <HintNote>최소 7일, 권장 30일 이상 데이터가 모이면 산출 신뢰도가 높습니다.</HintNote>
              <HintNote type="warn">빈 값은 통계에서 자동 제외됩니다.</HintNote>
            </HelpHint>
          </div>
          <button className="btn" onClick={handleAdd}
            style={{ height: 34, padding: '0 14px', background: '#FDF2F4', color: '#A50034', border: '1px solid #E8C5CC', fontSize: '0.82rem' }}>
            + 일자 추가
          </button>
        </div>

        {records.length === 0 && (
          <div style={{ padding: '24px 12px', textAlign: 'center', color: '#7C6E74', fontSize: '0.88rem', background: '#FAEFF2', borderRadius: 8 }}>
            <p style={{ marginBottom: 6 }}>아직 입력된 일자가 없습니다.</p>
            <p>위 <b>+ 일자 추가</b> 버튼을 눌러 시작하세요.</p>
          </div>
        )}

        {records.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="inv-stat-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 540 }}>
              <thead>
                <tr style={{ background: '#F4E1E7' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>일자</th>
                  <th style={thStyle}>생산량</th>
                  <th style={thStyle}>출하량</th>
                  <th style={thStyle}>재고량</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #E5DCDF' }}>
                    <td style={tdStyle}>{idx + 1}</td>
                    <td style={tdStyle}>
                      <input type="date" value={r.date || ''}
                        onChange={e => handleUpdate(r.id, 'date', e.target.value)}
                        style={inputCell} />
                    </td>
                    <td style={tdStyle}>
                      <input type="number" min={0} value={r.production || ''}
                        onChange={e => handleUpdate(r.id, 'production', e.target.value)}
                        style={inputCell} placeholder="0" />
                    </td>
                    <td style={tdStyle}>
                      <input type="number" min={0} value={r.shipment || ''}
                        onChange={e => handleUpdate(r.id, 'shipment', e.target.value)}
                        style={inputCell} placeholder="0" />
                    </td>
                    <td style={tdStyle}>
                      <input type="number" min={0} value={r.stock || ''}
                        onChange={e => handleUpdate(r.id, 'stock', e.target.value)}
                        style={inputCell} placeholder="0" />
                    </td>
                    <td style={{ ...tdStyle, width: 38, textAlign: 'center' }}>
                      <button onClick={() => handleRemove(r.id)}
                        style={{ border: 'none', background: 'none', color: '#7C6E74', fontSize: '1rem', cursor: 'pointer', padding: 4 }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {records.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            <button className="btn" onClick={handleAdd}
              style={{ flex: 1, minWidth: 130, height: 36, background: '#FDF2F4', color: '#A50034', border: '1px solid #E8C5CC', fontSize: '0.82rem' }}>
              + 일자 추가
            </button>
            <button className="btn" onClick={() => { if (window.confirm('모든 일자 데이터를 삭제하시겠습니까?')) updateData({ records: [] }) }}
              style={{ flex: 1, minWidth: 130, height: 36, background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', fontSize: '0.82rem' }}>
              🗑️ 전체 삭제
            </button>
          </div>
        )}
      </div>

      {/* ── 4. 자동 산출 ── */}
      <div className="section-card">
        <div className="section-title">
          자동 산출 — 통계
          <HelpHint title="자동 산출">
            <p>입력된 데이터로부터 자동 계산되는 <b>통계 값</b>입니다.</p>
            <HintFormula>{`평균    = AVERAGE(값)
표준편차 = STDEV(값)  ※ 표본 표준편차

99.9% 적정재고 = 평균 출하량 + 출하량 표편 × 3.09
99.5% 적정재고 = 평균 출하량 + 출하량 표편 × 2.575
재고 일수      = 적정 재고 ÷ 평균 출하량      [일]`}</HintFormula>
            <HintNote>빈 값은 자동 제외 — 데이터가 부족하면 일부 통계가 0으로 표시됩니다.</HintNote>
          </HelpHint>
        </div>

        <div className="inv-section-label">📦 재고량 통계</div>
        <div className="input-grid">
          <div className="result-box tone-slate">
            <span className="result-box__label">평균 재고</span>
            <span className="result-box__value">{fmtN(stats.stockAvg, '대', 0)}</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">표준편차</span>
            <span className="result-box__value">{fmtN(stats.stockStd, '', 1)}</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">Min</span>
            <span className="result-box__value">{fmtN(stats.stockMin, '대', 0)}</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">Max</span>
            <span className="result-box__value">{fmtN(stats.stockMax, '대', 0)}</span>
          </div>
        </div>

        <div className="inv-section-label" style={{ marginTop: 14 }}>🚚 출하량 통계</div>
        <div className="input-grid">
          <div className="result-box tone-slate">
            <span className="result-box__label">평균 출하량</span>
            <span className="result-box__value">{fmtN(stats.shipAvg, '대/일', 0)}</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">표준편차</span>
            <span className="result-box__value">{fmtN(stats.shipStd, '', 1)}</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">Min</span>
            <span className="result-box__value">{fmtN(stats.shipMin, '대', 0)}</span>
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">Max</span>
            <span className="result-box__value">{fmtN(stats.shipMax, '대', 0)}</span>
          </div>

          <div className="result-box full-width" style={{ background: '#A50034', padding: '14px 16px' }}>
            <span className="result-box__label" style={{ fontSize: '0.85rem' }}>
              ⭐ 99.9% 적정 재고 = 평균 + 표편 × 3.09
            </span>
            <span className="result-box__value" style={{ fontSize: '1.4rem' }}>
              {fmtN(stock999, '대', 0)}
              <span style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: 12, opacity: 0.85 }}>
                · 재고 일수 {days999.toFixed(1)}일
              </span>
            </span>
          </div>
          <div className="result-box full-width" style={{ background: '#6F0023', padding: '14px 16px' }}>
            <span className="result-box__label" style={{ fontSize: '0.85rem' }}>
              ⭐ 99.5% 적정 재고 = 평균 + 표편 × 2.575
            </span>
            <span className="result-box__value" style={{ fontSize: '1.4rem' }}>
              {fmtN(stock995, '대', 0)}
              <span style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: 12, opacity: 0.85 }}>
                · 재고 일수 {days995.toFixed(1)}일
              </span>
            </span>
          </div>
        </div>

        <div style={{ marginTop: 12, padding: 12, background: '#FAEFF2', borderRadius: 8, fontSize: '0.78rem', color: '#4A4045', lineHeight: 1.7 }}>
          <div><strong>① 평균 소요량</strong> : 일평균 출하량 (조달기간 동안 필요한 수량의 통계적 기댓값)</div>
          <div><strong>② 안전계수 Z</strong> : 회사 서비스 수준에 따라 결정 (보통 95% Z=1.65, 99% Z=2.33)</div>
          <div><strong>③ 소요량 편차</strong> : 출하량의 표준편차 — 들쭉날쭉한 정도를 나타냄</div>
        </div>
      </div>
    </div>
  )
}

const thStyle = { padding: '8px 10px', textAlign: 'left', color: '#6F0023', borderBottom: '2px solid #A50034', fontWeight: 800, fontSize: '0.82rem' }
const tdStyle = { padding: '4px 6px', verticalAlign: 'middle' }
const inputCell = { width: '100%', padding: '6px 8px', border: '1px solid #E5DCDF', borderRadius: 6, fontSize: '0.85rem', fontFamily: 'inherit', background: 'white', minWidth: 0 }
