import { n, fmtN } from '../shared/utils/common'
import HelpHint, { HintFormula, HintNote } from '../shared/components/HelpHint'

const WAREHOUSE_TYPES = ['Rack', 'Pallet', '대차']
const CONTAINER_TYPES = ['BOX', 'Pallet', '대차', '기타']

const emptyItem = () => ({
  id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  warehouseType: 'Rack',
  cmdt: '',
  category: '',
  dailyQty: '',
  container: 'BOX',
  length: '',
  width: '',
  height: '',
  loadQty: '',
  stackLevel: 1,
  dio: '',
  margin: 2
})

function calcRow(item) {
  const occupiedArea = n(item.length) * n(item.width)
  const totalLoadQty = n(item.loadQty) * (n(item.stackLevel) || 1)
  const dailyPallets = totalLoadQty > 0 ? n(item.dailyQty) / totalLoadQty : 0
  const dailyArea = occupiedArea * dailyPallets
  const warehouseM2 = dailyArea * n(item.dio) * (n(item.margin) || 1)
  return {
    occupiedArea,
    totalLoadQty,
    dailyPallets,
    dailyArea,
    warehouseM2,
    warehousePyeong: warehouseM2 / 3.3
  }
}

export default function WarehouseArea({ data, updateData }) {
  const items = data?.items?.length ? data.items : [emptyItem()]
  const setItems = (next) => updateData({ items: typeof next === 'function' ? next(items) : next })
  const updateItem = (id, upd) => setItems(list => list.map(item => item.id === id ? { ...item, ...upd } : item))
  const addItem = () => setItems([...items, emptyItem()])
  const removeItem = (id) => {
    if (items.length <= 1) return
    if (window.confirm('이 Item을 삭제하시겠습니까?')) setItems(items.filter(item => item.id !== id))
  }

  const totals = items.reduce((acc, item) => {
    const c = calcRow(item)
    return {
      dailyPallets: acc.dailyPallets + c.dailyPallets,
      dailyArea: acc.dailyArea + c.dailyArea,
      warehouseM2: acc.warehouseM2 + c.warehouseM2,
      warehousePyeong: acc.warehousePyeong + c.warehousePyeong
    }
  }, { dailyPallets: 0, dailyArea: 0, warehouseM2: 0, warehousePyeong: 0 })

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">물류 창고 면적 산출</div>

      <div className="section-card">
        <div className="section-title">
          Item별 창고 Capa. 분석
          <HelpHint title="창고 Capa. 분석">
            <p>일 Max 물동 기준으로 CMDT별 소요 면적을 산출합니다.</p>
            <HintFormula>{`용기 면적 = L × W
Total 적재 수량 = 적재 수량 × 적재 단수
일일 Pallet 수 = 일 생산 수량 ÷ Total 적재 수량
일일 면적 = 용기 면적 × 일일 Pallet 수
창고 면적 = 일일 면적 × DIO × 창고 여유율`}</HintFormula>
            <HintNote>창고 면적(평)은 m² ÷ 3.3으로 표시합니다.</HintNote>
          </HelpHint>
        </div>

        <div className="warehouse-actions">
          <button className="btn btn-primary" onClick={addItem}>＋ Item 추가</button>
        </div>

        {items.map((item, idx) => {
          const c = calcRow(item)
          return (
            <div className="warehouse-item" key={item.id}>
              <div className="warehouse-item__head">
                <strong>Item {idx + 1}</strong>
                {items.length > 1 && (
                  <button className="mini-btn" onClick={() => removeItem(item.id)}>삭제</button>
                )}
              </div>
              <div className="input-grid">
                <div className="input-group">
                  <div className="input-label-row"><span className="input-label">창고 유형</span></div>
                  <select className="input-field" value={item.warehouseType}
                    onChange={e => updateItem(item.id, { warehouseType: e.target.value })}>
                    {WAREHOUSE_TYPES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <div className="input-label-row"><span className="input-label">CMDT</span></div>
                  <input className="input-field" value={item.cmdt}
                    onChange={e => updateItem(item.id, { cmdt: e.target.value })} placeholder="예: Comp" />
                </div>
                <div className="input-group">
                  <div className="input-label-row"><span className="input-label">구분</span></div>
                  <input className="input-field" value={item.category}
                    onChange={e => updateItem(item.id, { category: e.target.value })} placeholder="예: 실외기용" />
                </div>
                <div className="input-group">
                  <div className="input-label-row"><span className="input-label">일 생산 수량</span></div>
                  <input className="input-field" type="number" min={0} value={item.dailyQty}
                    onChange={e => updateItem(item.id, { dailyQty: e.target.value })} placeholder="예: 500" />
                </div>
                <div className="input-group">
                  <div className="input-label-row"><span className="input-label">용기</span></div>
                  <select className="input-field" value={item.container}
                    onChange={e => updateItem(item.id, { container: e.target.value })}>
                    {CONTAINER_TYPES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <div className="input-label-row"><span className="input-label">가로 L (m)</span></div>
                  <input className="input-field" type="number" min={0} step="0.01" value={item.length}
                    onChange={e => updateItem(item.id, { length: e.target.value })} placeholder="예: 1.15" />
                </div>
                <div className="input-group">
                  <div className="input-label-row"><span className="input-label">세로 W (m)</span></div>
                  <input className="input-field" type="number" min={0} step="0.01" value={item.width}
                    onChange={e => updateItem(item.id, { width: e.target.value })} placeholder="예: 1.23" />
                </div>
                <div className="input-group">
                  <div className="input-label-row"><span className="input-label">높이 H (m)</span></div>
                  <input className="input-field" type="number" min={0} step="0.01" value={item.height}
                    onChange={e => updateItem(item.id, { height: e.target.value })} placeholder="예: 1.80" />
                </div>
                <div className="result-box tone-blue">
                  <span className="result-box__label">용기 면적 (L × W)</span>
                  <span className="result-box__value">{fmtN(c.occupiedArea, ' m²', 2)}</span>
                </div>
                <div className="input-group">
                  <div className="input-label-row"><span className="input-label">적재 수량</span></div>
                  <input className="input-field" type="number" min={0} value={item.loadQty}
                    onChange={e => updateItem(item.id, { loadQty: e.target.value })} placeholder="예: 48" />
                </div>
                <div className="input-group">
                  <div className="input-label-row"><span className="input-label">적재 단수</span></div>
                  <input className="input-field" type="number" min={1} value={item.stackLevel}
                    onChange={e => updateItem(item.id, { stackLevel: e.target.value })} placeholder="예: 2" />
                </div>
                <div className="result-box tone-slate">
                  <span className="result-box__label">Total 적재 수량</span>
                  <span className="result-box__value">{fmtN(c.totalLoadQty, '', 0)}</span>
                </div>
                <div className="result-box tone-slate">
                  <span className="result-box__label">일일 Pallet 수</span>
                  <span className="result-box__value">{fmtN(c.dailyPallets, '', 0)}</span>
                </div>
                <div className="result-box tone-slate">
                  <span className="result-box__label">일일 면적</span>
                  <span className="result-box__value">{fmtN(c.dailyArea, ' m²', 1)}</span>
                </div>
                <div className="input-group">
                  <div className="input-label-row"><span className="input-label">DIO (days)</span></div>
                  <input className="input-field" type="number" min={0} value={item.dio}
                    onChange={e => updateItem(item.id, { dio: e.target.value })} placeholder="예: 15" />
                </div>
                <div className="input-group">
                  <div className="input-label-row"><span className="input-label">창고 여유율</span></div>
                  <input className="input-field" type="number" min={0} step="0.1" value={item.margin}
                    onChange={e => updateItem(item.id, { margin: e.target.value })} placeholder="예: 2" />
                </div>
                <div className="result-box full-width" style={{ background: '#A50034' }}>
                  <span className="result-box__label">창고 면적 = 일일 면적 × DIO × 창고 여유율</span>
                  <span className="result-box__value">{fmtN(c.warehouseM2, ' m²', 0)} / {fmtN(c.warehousePyeong, '평', 0)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="section-card" style={{ background: '#2A1F24', color: 'white' }}>
        <div className="section-title" style={{ color: 'white', borderBottomColor: '#4A4045' }}>Sub Total</div>
        <div className="input-grid">
          <div className="result-box" style={{ background: '#3A2F33' }}>
            <span className="result-box__label">일일 Pallet 수</span>
            <span className="result-box__value">{fmtN(totals.dailyPallets, '', 0)}</span>
          </div>
          <div className="result-box" style={{ background: '#3A2F33' }}>
            <span className="result-box__label">일일 면적</span>
            <span className="result-box__value">{fmtN(totals.dailyArea, ' m²', 0)}</span>
          </div>
          <div className="result-box full-width" style={{ background: '#A50034' }}>
            <span className="result-box__label">총 창고 면적</span>
            <span className="result-box__value">{fmtN(totals.warehouseM2, ' m²', 0)} / {fmtN(totals.warehousePyeong, '평', 0)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
