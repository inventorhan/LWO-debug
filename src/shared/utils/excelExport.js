import ExcelJS from 'exceljs'
import { saveBlob } from './saveAndShare'
import { getGap, calcArea, n } from './common'

const headerStyle = {
  font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } },
  alignment: { horizontal: 'center', vertical: 'middle' },
  border: {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  }
}
const subHeaderStyle = {
  font: { bold: true, color: { argb: 'FF0D47A1' }, size: 10 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBBDEFB' } },
  alignment: { horizontal: 'left', vertical: 'middle' }
}
const labelStyle = {
  font: { bold: true, size: 10 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }
}

function styleHeaderRow(row) {
  row.eachCell(c => { c.style = headerStyle })
  row.height = 22
}
function applySubHeader(row) {
  row.eachCell(c => { c.style = subHeaderStyle })
  row.height = 20
}

const TRANSPORT_LABELS_FALLBACK = {
  worker: '작업자', cart: '대차', handcart: '손수레',
  pallet: '파렛트', agv: 'AGV', other: '기타'
}

const CARD_LABELS = {
  pick: '피킹', move: '이동', load: '로딩', unload: '언로딩', recovery: '회수'
}

export async function exportToExcel(state) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'LWO 물류 분석 Tool'
  workbook.created = new Date()

  const transportTypes = (state.worker && state.worker.transportTypes) || {}
  const labelOf = (id) => transportTypes[id]?.label || TRANSPORT_LABELS_FALLBACK[id] || id

  /* ─── 1. 작업자 부하율 ─── */
  const ws1 = workbook.addWorksheet('1.작업자 부하율')
  ws1.columns = [
    { header: '항목', key: 'k', width: 28 },
    { header: '내용', key: 'v', width: 28 },
    { header: '비고', key: 'n', width: 28 }
  ]
  styleHeaderRow(ws1.getRow(1))

  const personnelList = state.worker?.personnelList || []
  personnelList.forEach((name) => {
    const wd = state.worker.dataByPersonnel?.[name]
    if (!wd) return
    const b = wd.basicInfo || {}
    const ms = wd.measurements || []

    ws1.addRow([])
    applySubHeader(ws1.addRow([`[ ${name} ] 기초 정보`]))
    ws1.addRows([
      ['물류 인원', b.personnel || name],
      ['운반 종류', labelOf(b.transportType)],
      ['운반 수량', b.transportQty],
      ['운반 속도(m/s)', b.transportType === 'other' ? b.speed : (transportTypes[b.transportType]?.speed ?? '')],
      ['부하 가중치', b.weight],
      ['총 측정 횟수', ms.length]
    ])

    let totalT = 0, moveT = 0
    ms.forEach((cy, ci) => {
      ws1.addRow([])
      applySubHeader(ws1.addRow([`[ ${name} ] ${ci + 1}회차 측정`]))
      ws1.addRow(['#', '구분', 'Start', 'End', 'Gap(초)', '추가정보']).eachCell(c => c.style = labelStyle)
      ;(cy.cards || []).forEach((card, idx) => {
        const gap = parseFloat(getGap(card.start, card.end)) || 0
        const startStr = card.start ? new Date(card.start).toLocaleTimeString('ko-KR', { hour12: false }) : ''
        const endStr   = card.end   ? new Date(card.end  ).toLocaleTimeString('ko-KR', { hour12: false }) : ''
        const extra = card.type === 'pick' ? `자재 종수: ${card.materialCount ?? ''}`
                    : card.type === 'move' ? `경유지: ${card.waypointNo ?? ''}번`
                    : card.type === 'load' ? `공정: ${card.processNo ?? ''}번` : ''
        ws1.addRow([idx + 1, CARD_LABELS[card.type] || card.type, startStr, endStr, gap, extra])
        totalT += gap
        if (card.type === 'move' || card.type === 'recovery') moveT += gap
      })
    })

    const speed = b.transportType === 'other' ? n(b.speed) : n(transportTypes[b.transportType]?.speed)
    const dist = moveT * speed
    const wTime = 3600 * (n(b.weight) || 0.8)
    const rate = wTime > 0 ? (totalT / wTime) * 100 : 0

    ws1.addRow([])
    applySubHeader(ws1.addRow([`[ ${name} ] 결과`]))
    ws1.addRows([
      ['총 운반 시간(초)', totalT.toFixed(1)],
      ['총 이동 거리(m)', dist.toFixed(1)],
      ['물류 부하율(%)', rate.toFixed(1)]
    ])

    /* 사진 삽입 */
    const photos = wd.photos || { transport: [], part: [] }
    const all = [...(photos.transport || []), ...(photos.part || [])]
    if (all.length > 0) {
      ws1.addRow([])
      applySubHeader(ws1.addRow([`[ ${name} ] 사진`]))
      const startRow = ws1.lastRow.number
      all.forEach((b64, i) => {
        try {
          const ext = b64.startsWith('data:image/jpeg') ? 'jpeg' : 'png'
          const id = workbook.addImage({ base64: b64, extension: ext })
          ws1.addImage(id, {
            tl: { col: 0, row: startRow + i * 14 + 1 },
            ext: { width: 320, height: 240 }
          })
        } catch {/* skip */}
      })
      for (let j = 0; j < all.length * 14 + 2; j++) ws1.addRow([])
    }
  })

  /* ─── 2. E/V 부하율 (호기별) ─── */
  const ws2 = workbook.addWorksheet('2.E_V 부하율')
  ws2.columns = [
    { header: '항목', key: 'k', width: 28 },
    { header: '내용', key: 'v', width: 28 },
    { header: '비고', key: 'n', width: 28 }
  ]
  styleHeaderRow(ws2.getRow(1))
  const e = state.elevator || {}
  const dataByHogi = e.dataByHogi || {}

  Object.entries(dataByHogi).forEach(([hogiKey, h]) => {
    const eb = h.basicInfo || {}
    applySubHeader(ws2.addRow([`${hogiKey}호기 — 기초 정보`]))
    ws2.addRows([
      ['E/V 가로(m)', eb.evWidth],
      ['E/V 세로(m)', eb.evDepth],
      ['E/V 부하 가중치', eb.weight]
    ])

    let evTotal = 0, evMove = 0, cycleCount = 0
    ws2.addRow([])
    applySubHeader(ws2.addRow([`${hogiKey}호기 — 측정 내역`]))
    ;(h.measurements || []).forEach((m, mi) => {
      cycleCount++
      ws2.addRow([`${mi + 1}회차`, '#', '구분', 'Start', 'End', 'Gap(초)', '추가정보']).eachCell(c => c.style = labelStyle)
      ;(m.cards || []).forEach((card, idx) => {
        const gap = parseFloat(getGap(card.start, card.end)) || 0
        const startStr = card.start ? new Date(card.start).toLocaleTimeString('ko-KR', { hour12: false }) : ''
        const endStr   = card.end   ? new Date(card.end  ).toLocaleTimeString('ko-KR', { hour12: false }) : ''
        const extra = card.type === 'load' ? `자재 종수: ${card.materialCount ?? ''}`
                    : card.type === 'move' ? `${card.floorNo ?? ''}층`
                    : card.type === 'unload' ? `공정: ${card.processNo ?? ''}공정` : ''
        ws2.addRow(['', idx + 1, CARD_LABELS[card.type] || card.type, startStr, endStr, gap, extra])
        evTotal += gap
        if (card.type === 'move') evMove += gap
      })
    })

    const evWeight = n(eb.weight) || 0.8
    const evRate = (evTotal / (3600 * evWeight)) * 100
    /* 적재율 */
    const evArea = (parseFloat(eb.evWidth) || 0) * (parseFloat(eb.evDepth) || 0)  // m²
    const usedArea = (h.loadItems || []).reduce((acc, it) =>
      acc + (parseFloat(it.width) || 0) * (parseFloat(it.depth) || 0) * (parseInt(it.qty) || 0), 0)  // m²
    const loadingRate = evArea > 0 ? (usedArea / evArea) * 0.9 * 100 : 0

    ws2.addRow([])
    applySubHeader(ws2.addRow([`${hogiKey}호기 — 결과`]))
    ws2.addRows([
      ['측정 회수', cycleCount],
      ['총 운반 시간(초)', evTotal.toFixed(1)],
      ['이동 시간(초)', evMove.toFixed(1)],
      ['E/V 부하율(%)', evRate.toFixed(1)],
      ['E/V 면적(m²)', evArea.toFixed(1)],
      ['실 적재 면적(m²)', usedArea.toFixed(1)],
      ['E/V 적재율(%)', loadingRate.toFixed(1)]
    ])

    if ((h.photos || []).length > 0) {
      ws2.addRow([])
      applySubHeader(ws2.addRow([`${hogiKey}호기 — 사진`]))
      const start = ws2.lastRow.number
      h.photos.forEach((b64, i) => {
        try {
          const ext = b64.startsWith('data:image/jpeg') ? 'jpeg' : 'png'
          const id = workbook.addImage({ base64: b64, extension: ext })
          ws2.addImage(id, { tl: { col: 0, row: start + i * 14 + 1 }, ext: { width: 320, height: 240 } })
        } catch {/* skip */}
      })
      for (let j = 0; j < h.photos.length * 14 + 2; j++) ws2.addRow([])
    }
    ws2.addRow([])
    ws2.addRow([])
  })

  /* ─── 3. 면적 효율 ─── */
  const ws3 = workbook.addWorksheet('3.면적 효율')
  ws3.columns = [
    { header: '항목', key: 'k', width: 22 },
    { header: '값1', key: 'v1', width: 18 },
    { header: '값2', key: 'v2', width: 18 },
    { header: '값3', key: 'v3', width: 18 },
    { header: '면적(m²)', key: 'a', width: 18 }
  ]
  styleHeaderRow(ws3.getRow(1))
  const ar = state.area || {}
  applySubHeader(ws3.addRow(['공장 (단위: m)']))
  const fA = calcArea(ar.factory?.width, ar.factory?.height)  /* m × m = m² */
  ws3.addRow(['공장', ar.factory?.width, ar.factory?.height, '', fA ? fA.toFixed(1) : ''])

  ;(ar.zones || []).forEach((z, i) => {
    ws3.addRow([])
    applySubHeader(ws3.addRow([`${i + 1}구역 (단위: m)`]))
    const zA = calcArea(z.width, z.height)
    ws3.addRow(['구역', z.width, z.height, '', zA ? zA.toFixed(1) : ''])
    ws3.addRow(['적재종류', '개수', '가로(m)', '세로(m)', '최저높이(m)', '최고높이(m)', '체적가중치']).eachCell(c => c.style = labelStyle)
    let usedArea = 0
    ;(z.items || []).forEach(item => {
      const ia = calcArea(item.width, item.depth)
      usedArea += (ia || 0) * (parseInt(item.qty) || 1)
      ws3.addRow([item.type, item.qty, item.width, item.depth, item.minHeight ?? '', item.maxHeight ?? item.height ?? '', item.volWeight ?? ''])
    })
    const eff = (zA && usedArea) ? ((usedArea / zA) * 100).toFixed(1) : '—'
    ws3.addRow(['실사용 면적 합계(m²)', usedArea.toFixed(1)])
    ws3.addRow(['적재율(%)', eff])
  })

  /* 면적 사진 */
  const photoStart = ws3.lastRow.number + 2
  let imgRow = photoStart
  const allAreaPhotos = []
  if (ar.factory?.photo) allAreaPhotos.push({ b64: ar.factory.photo, label: '공장' })
  ;(ar.zones || []).forEach((z, i) => {
    if (z.photo) allAreaPhotos.push({ b64: z.photo, label: `${i + 1}구역` })
    ;(z.items || []).forEach((it, j) => {
      if (it.photo) allAreaPhotos.push({ b64: it.photo, label: `${i + 1}구역-적재${j + 1}` })
    })
  })
  if (allAreaPhotos.length > 0) {
    ws3.getRow(imgRow).values = ['사진']
    ws3.getRow(imgRow).getCell(1).style = subHeaderStyle
    allAreaPhotos.forEach((p, idx) => {
      try {
        const ext = p.b64.startsWith('data:image/jpeg') ? 'jpeg' : 'png'
        const id = workbook.addImage({ base64: p.b64, extension: ext })
        ws3.addImage(id, { tl: { col: 0, row: imgRow + idx * 14 + 1 }, ext: { width: 320, height: 240 } })
      } catch {/* skip */}
    })
  }

  /* ─── 4. 재고 보관량 ─── */
  const ws4 = workbook.addWorksheet('4.재고 보관량')
  ws4.columns = [
    { header: '항목', key: 'k', width: 32 },
    { header: '값', key: 'v', width: 18 }
  ]
  styleHeaderRow(ws4.getRow(1))
  const inv = state.inventory || {}
  const custDayProd   = n(inv.customerDayUph)   * n(inv.customerDayTime)
  const custNightProd = n(inv.customerNightUph) * n(inv.customerNightTime)
  const custDailyProd = custDayProd + custNightProd
  const selfDayProd   = n(inv.selfDayUph)       * n(inv.selfDayTime)
  const selfNightProd = n(inv.selfNightUph)     * n(inv.selfNightTime)
  const selfDailyProd = selfDayProd + selfNightProd
  const shortageQty   = Math.max(0, custDailyProd - selfDailyProd)
  const refUph = n(inv.customerDayUph)

  applySubHeader(ws4.addRow(['자사 기초 재고 — 고객 라인']))
  ws4.addRows([
    ['고객 주간 UPH', inv.customerDayUph],
    ['고객 주간 작업 시간(시간)', inv.customerDayTime],
    ['고객 야간 UPH', inv.customerNightUph],
    ['고객 야간 작업 시간(시간)', inv.customerNightTime],
    ['고객 주간 생산량(대)', custDayProd.toFixed(0)],
    ['고객 야간 생산량(대)', custNightProd.toFixed(0)],
    ['고객 일일 생산 수량(대)', custDailyProd.toFixed(0)]
  ])
  ws4.addRow([])
  applySubHeader(ws4.addRow(['자사 기초 재고 — 자사 라인']))
  ws4.addRows([
    ['자사 주간 UPH', inv.selfDayUph],
    ['자사 주간 작업 시간(시간)', inv.selfDayTime],
    ['자사 야간 UPH', inv.selfNightUph],
    ['자사 야간 작업 시간(시간)', inv.selfNightTime],
    ['자사 주간 생산량(대)', selfDayProd.toFixed(0)],
    ['자사 야간 생산량(대)', selfNightProd.toFixed(0)],
    ['자사 일일 생산 수량(대)', selfDailyProd.toFixed(0)],
    ['일일 부족 수량 (기초 재고, 대)', shortageQty.toFixed(0)]
  ])
  ws4.addRow([])
  applySubHeader(ws4.addRow(['운반 리드타임 → 수량 환산 (고객 UPH 기준)']))
  const ageingQ = (n(inv.ageingTime)         / 3600) * refUph
  const safetyQ = (n(inv.safetyStockTime)    / 3600) * refUph
  const loadQ   = (n(inv.depotLoadTime)      / 3600) * refUph
  const moveQ   = (n(inv.selfToCustomerTime) / 3600) * refUph
  const leadTimeStock = ageingQ + safetyQ + loadQ + moveQ
  ws4.addRows([
    ['숙성 시간(초)', inv.ageingTime],
    ['숙성 수량(대)', ageingQ.toFixed(0)],
    ['안심 재고 시간(초, 정책성)', inv.safetyStockTime],
    ['안심 수량(대)', safetyQ.toFixed(0)],
    ['Depot~상차 시간(초)', inv.depotLoadTime],
    ['상차 수량(대)', loadQ.toFixed(0)],
    ['자사~고객 이동 시간(초)', inv.selfToCustomerTime],
    ['이동 수량(대)', moveQ.toFixed(0)],
    ['리드타임 재고(대) = 숙성+안심+상차+이동', leadTimeStock.toFixed(0)]
  ])
  ws4.addRow([])
  applySubHeader(ws4.addRow(['고객사 운영 재고 (고객 UPH 기준)']))
  const unloadQ = (n(inv.customerDockTime)   / 3600) * refUph
  const waitQ   = (n(inv.waitTime)           / 3600) * refUph
  const safeQ   = (n(inv.customerSafetyTime) / 3600) * refUph
  const opsStock = unloadQ + waitQ + safeQ
  ws4.addRows([
    ['고객 Dock~Depot 하차 시간(초)', inv.customerDockTime],
    ['하차 수량(대)', unloadQ.toFixed(0)],
    ['대기 시간(초)', inv.waitTime],
    ['대기 수량(대)', waitQ.toFixed(0)],
    ['고객사 안전 재고 시간(초)', inv.customerSafetyTime],
    ['안전 재고 수량(대)', safeQ.toFixed(0)],
    ['고객사 운영 재고(대) = 하차+대기+안전', opsStock.toFixed(0)]
  ])
  ws4.addRow([])
  applySubHeader(ws4.addRow(['최종 적정 재고']))
  const finalStock = shortageQty + leadTimeStock + opsStock
  ws4.addRows([
    ['① 일일 부족 수량(대)', shortageQty.toFixed(0)],
    ['② 리드타임 재고(대)', leadTimeStock.toFixed(0)],
    ['③ 고객사 운영 재고(대)', opsStock.toFixed(0)],
    ['⭐ Total 최종 적정 재고(대) = ①+②+③', finalStock.toFixed(0)]
  ])

  /* ─── 5. AMR 산출 ─── */
  const ws5 = workbook.addWorksheet('5.AMR 대수')
  ws5.columns = [
    { header: '항목', key: 'k', width: 32 },
    { header: '값', key: 'v', width: 18 }
  ]
  styleHeaderRow(ws5.getRow(1))
  const am = state.amr || {}
  const uph = n(am.tactTime) > 0 ? (3600 / n(am.tactTime)) * (n(am.recycleRate) / 100) : 0
  const runCount = n(am.loadQty) > 0 ? uph / n(am.loadQty) : 0
  const cycle = runCount > 0 ? 3600 / runCount : 0
  const round = n(am.distance) * 2
  const lSec = n(am.loadCount) * n(am.loadTime)
  const uSec = n(am.unloadCount) * n(am.unloadTime)
  const trip = n(am.amrtSpeed) > 0 ? (round / n(am.amrtSpeed)) + lSec + uSec : 0
  const base = cycle > 0 ? Math.round(trip / cycle) : 0
  const need = (n(am.operationRate) || 0.8) > 0 ? Math.round(base / (n(am.operationRate) || 0.8)) + n(am.spare) : 0

  applySubHeader(ws5.addRow(['생산 정보']))
  ws5.addRows([
    ['Tact Time(초)', am.tactTime],
    ['회수율(%)', am.recycleRate],
    ['장입 수량(개/회)', am.loadQty],
    ['UPH (자동)', uph.toFixed(1)],
    ['AMR 운행 횟수', runCount.toFixed(2)],
    ['AMR Cycle Time(초)', cycle.toFixed(1)]
  ])
  ws5.addRow([])
  applySubHeader(ws5.addRow(['운행 산출']))
  ws5.addRows([
    ['AMR Speed(m/s)', am.amrtSpeed],
    ['AMR 이동거리(m)', am.distance],
    ['왕복 이동거리(m)', round.toFixed(1)],
    ['로딩 횟수', am.loadCount],
    ['로딩 시간(초/회)', am.loadTime],
    ['Total 로딩 시간(초)', lSec.toFixed(1)],
    ['언로딩 횟수', am.unloadCount],
    ['언로딩 시간(초/회)', am.unloadTime],
    ['Total 언로딩 시간(초)', uSec.toFixed(1)],
    ['왕복 시간(초)', trip.toFixed(1)],
    ['왕복 시간(분)', (trip / 60).toFixed(2)]
  ])
  ws5.addRow([])
  applySubHeader(ws5.addRow(['필요 대수']))
  ws5.addRows([
    ['가동율', am.operationRate],
    ['Spare(대)', am.spare],
    ['AMR 원단위(대)', base],
    ['⭐ AMR 필요 대수(대)', need]
  ])

  const buffer = await workbook.xlsx.writeBuffer()
  const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `LWO_분석리포트_${ts}.xlsx`
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  return saveBlob(filename, blob, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    title: 'LWO 분석 리포트'
  })
}
