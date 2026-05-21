import { n, fmtN } from '../shared/utils/common'
import HelpHint, { HintFormula, HintNote } from '../shared/components/HelpHint'

export default function LogisticsPersonnel({ data, updateData }) {
  const f = data || {}
  const set = (k, v) => updateData({ [k]: v })

  const pickTime = n(f.pickTime)
  const loadTime = n(f.loadTime)
  const distance = n(f.distance)
  const speed = n(f.speed)
  const tripsPerHour = n(f.tripsPerHour)
  const hoursPerDay = n(f.hoursPerDay) || 8
  const availability = n(f.availability) || 0.7
  const weight = n(f.weight) || 1

  const moveTime = speed > 0 ? distance / speed : 0
  const transportTime = pickTime + loadTime + moveTime
  const dailyTrips = tripsPerHour * hoursPerDay
  const dailyTransportTime = transportTime * dailyTrips
  const basePersonnel = dailyTransportTime > 0 ? dailyTransportTime / (hoursPerDay * 3600) : 0
  const availableWorkTime = hoursPerDay * 3600 * availability
  const availablePersonnel = availableWorkTime > 0 ? dailyTransportTime / availableWorkTime : 0
  const finalPersonnel = basePersonnel * weight

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="module-title">물류 적정 인원 선정</div>

      <div className="section-card">
        <div className="section-title">
          물류 운반 시간
          <HelpHint title="물류 운반 시간">
            <p>1회 운반에 필요한 피킹, 이동, 로딩/언로딩 시간을 합산합니다.</p>
            <HintFormula>{`이동 시간 = 왕복 이동 거리 ÷ 이동 속도
물류 운반 시간 = 피킹 시간 + 로딩/언로딩 시간 + 이동 시간`}</HintFormula>
            <HintNote>모든 시간은 초(sec), 거리는 m 기준입니다.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">피킹 시간 (sec)</span></div>
            <input className="input-field" type="number" min={0} value={f.pickTime || ''}
              onChange={e => set('pickTime', e.target.value)} placeholder="예: 100" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">로딩/언로딩 시간 (sec)</span></div>
            <input className="input-field" type="number" min={0} value={f.loadTime || ''}
              onChange={e => set('loadTime', e.target.value)} placeholder="예: 20" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">왕복 이동 거리 (m)</span></div>
            <input className="input-field" type="number" min={0} value={f.distance || ''}
              onChange={e => set('distance', e.target.value)} placeholder="예: 100" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">이동 속도 (m/sec)</span></div>
            <input className="input-field" type="number" min={0} step="0.1" value={f.speed ?? 1.2}
              onChange={e => set('speed', e.target.value)} placeholder="예: 1.2" />
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">이동 시간 = 거리 ÷ 속도</span>
            <span className="result-box__value">{fmtN(moveTime, '초', 1)}</span>
          </div>
          <div className="result-box full-width" style={{ background: '#A50034' }}>
            <span className="result-box__label">물류 운반 시간 = 피킹 + 로딩/언로딩 + 이동</span>
            <span className="result-box__value">{fmtN(transportTime, '초', 1)}</span>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">
          물류 운반 횟수
          <HelpHint title="물류 운반 횟수">
            <p>시간당 운반 횟수와 일 작업 시간을 곱해 일 운반 횟수를 산출합니다.</p>
            <HintFormula>{`일 운반 횟수 = 시간당 운반 횟수 × 일 작업 시간`}</HintFormula>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">시간당 운반 횟수</span></div>
            <input className="input-field" type="number" min={0} value={f.tripsPerHour || ''}
              onChange={e => set('tripsPerHour', e.target.value)} placeholder="예: 20" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">일 작업 시간 (h)</span></div>
            <input className="input-field" type="number" min={0} step="0.5" value={f.hoursPerDay ?? 8}
              onChange={e => set('hoursPerDay', e.target.value)} placeholder="예: 8" />
          </div>
          <div className="result-box tone-slate full-width">
            <span className="result-box__label">일 운반 횟수 = 시간당 × 일 작업 시간</span>
            <span className="result-box__value">{fmtN(dailyTrips, '회', 0)}</span>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-title">
          물류 적정 인원
          <HelpHint title="물류 적정 인원">
            <p>하루 총 운반 시간을 기준 작업 시간으로 나눠 필요 인원을 계산합니다.</p>
            <HintFormula>{`총 물류 운반 시간 = 물류 운반 시간 × 일 운반 횟수
물류 운반 인원 = 총 물류 운반 시간 ÷ (일 작업 시간 × 3600)
최종 물류 적정 인원 = 물류 운반 인원 × 가중치`}</HintFormula>
            <HintNote>여유율 기준 인원도 함께 표시해 가동률 기준 검토에 사용할 수 있습니다.</HintNote>
          </HelpHint>
        </div>
        <div className="input-grid">
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">여유율</span></div>
            <input className="input-field" type="number" min={0} max={1} step="0.1" value={f.availability ?? 0.7}
              onChange={e => set('availability', e.target.value)} placeholder="예: 0.7" />
          </div>
          <div className="input-group">
            <div className="input-label-row"><span className="input-label">가중치</span></div>
            <input className="input-field" type="number" min={0} step="0.1" value={f.weight ?? 1.3}
              onChange={e => set('weight', e.target.value)} placeholder="예: 1.3" />
          </div>
          <div className="result-box tone-slate">
            <span className="result-box__label">총 물류 운반 시간</span>
            <span className="result-box__value">{fmtN(dailyTransportTime, '초', 0)}</span>
          </div>
          <div className="result-box tone-blue">
            <span className="result-box__label">인당 가동 가능 시간 ({hoursPerDay}h × {availability})</span>
            <span className="result-box__value">{fmtN(availableWorkTime, '초', 0)}</span>
          </div>
          <div className="result-box tone-dark">
            <span className="result-box__label">물류 운반 인원</span>
            <span className="result-box__value">{fmtN(basePersonnel, '명', 1)}</span>
          </div>
          <div className="result-box tone-dark">
            <span className="result-box__label">여유율 기준 인원</span>
            <span className="result-box__value">{fmtN(availablePersonnel, '명', 1)}</span>
          </div>
          <div className="result-box full-width" style={{ background: '#A50034', padding: '18px 16px' }}>
            <span className="result-box__label">최종 물류 적정 인원 = 물류 운반 인원 × 가중치</span>
            <span className="result-box__value" style={{ fontSize: '1.7rem' }}>{fmtN(finalPersonnel, '명', 1)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
