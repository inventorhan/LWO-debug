import { useState, useCallback, useEffect } from 'react'
import { fileToBase64 } from './shared/utils/common'

const STORAGE_KEY = 'lwo_app_persistent_data'

/* ───── 초기 운반 종류 정의 (PPT 스펙 기준) ───── */
const initialTransportTypes = {
  worker:   { label: '작업자', speed: 2.3 },
  cart:     { label: '대차', speed: 1.8 },
  handcart: { label: '손수레', speed: 1.6 },
  pallet:   { label: '파렛트', speed: 2.0 },
  agv:      { label: 'AGV', speed: 1.5 },
  other:    { label: '기타', speed: 0 }
}

/* ───── 초기 데이터 템플릿 ───── */
const createInitialWorkerData = (name) => ({
  basicInfo: { personnel: name, transportType: 'worker', transportQty: 1, speed: 2.3, weight: 0.8, measureCount: 1 },
  measurements: [
    {
      id: `cycle-${Date.now()}`,
      name: '1',
      cards: [
        { id: `1-pick-${Date.now()}`, type: 'pick', start: null, end: null, materialCount: 1 },
        { id: `1-move-${Date.now()}`, type: 'move', start: null, end: null, waypointNo: 1 },
        { id: `1-load-${Date.now()}`, type: 'load', start: null, end: null, processNo: 1 }
      ]
    }
  ],
  photos: { transport: [], part: [] }
})

/* ── Global state ── */
export const initialState = {
  worker: { 
    activePersonnel: '홍길동',
    personnelList: ['홍길동', '김철수', '이영희', '박지민', '최유진'],
    dataByPersonnel: {
      '홍길동': createInitialWorkerData('홍길동')
    },
    transportTypes: initialTransportTypes
  },
  elevator: { 
    basicInfo: { hogiNo: 1, cartQty: 0, boxQty: 0, palletQty: 0, handcartQty: 0, weight: 0.8 }, 
    cards: [
      { id: 'ev-init-load', type: 'load', start: null, end: null, materialCount: '' },
      { id: 'ev-init-move', type: 'move', start: null, end: null, floorNo: 1 },
      { id: 'ev-init-unload', type: 'unload', start: null, end: null, processNo: 1 }
    ],
    photos: []
  },
  area: { 
    factory: { width: '', height: '', photo: null }, 
    zones: [
      { no: 1, width: '', height: '', photo: null, items: [] }
    ] 
  },
  inventory: { selfUph: '', dayShiftTime: '', nightShiftTime: '', remainTime: '', ageingQty: '', customerUph: '', customerProdTime: '', distributionRatio: '', depotLoadTime: '', selfToCustomerTime: '', customerDockTime: '', waitTime: '', customerStock: '' },
  amr: { tactTime: '', recycleRate: '', loadQty: '', amrtSpeed: '', distance: '', loadCount: '', loadTime: '', unloadCount: '', unloadTime: '', operationRate: 0.8, spare: 1 },
  savedAt: null,
}

export function useAppState() {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // 누락된 모듈/필드는 초기값으로 보완 (구버전 데이터 호환)
        setState({
          ...initialState,
          ...parsed,
          worker: {
            ...initialState.worker,
            ...(parsed.worker || {}),
            transportTypes: { ...initialState.worker.transportTypes, ...((parsed.worker || {}).transportTypes || {}) },
            dataByPersonnel: (parsed.worker && parsed.worker.dataByPersonnel) || initialState.worker.dataByPersonnel
          },
          elevator:  { ...initialState.elevator, ...(parsed.elevator || {}) },
          area:      { ...initialState.area, ...(parsed.area || {}) },
          inventory: { ...initialState.inventory, ...(parsed.inventory || {}) },
          amr:       { ...initialState.amr, ...(parsed.amr || {}) }
        })
      } catch {}
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 사진이 너무 많아 quota 초과 등 — 무시
    }
  }, [state])

  const updateWorker = useCallback(u => setState(s => {
    const active = s.worker.activePersonnel
    return { 
      ...s, 
      worker: { 
        ...s.worker, 
        dataByPersonnel: {
          ...s.worker.dataByPersonnel,
          [active]: { ...s.worker.dataByPersonnel[active], ...u }
        }
      } 
    }
  }), [])

  const switchPersonnel = useCallback((newName) => {
    setState(s => {
      const newData = s.worker.dataByPersonnel[newName] ? {} : { [newName]: createInitialWorkerData(newName) }
      return {
        ...s,
        worker: {
          ...s.worker,
          activePersonnel: newName,
          dataByPersonnel: { ...s.worker.dataByPersonnel, ...newData }
        }
      }
    })
  }, [])

  const updateElevator  = useCallback(u => setState(s => ({ ...s, elevator: { ...s.elevator, ...u } })), [])
  const updateArea      = useCallback(u => setState(s => ({ ...s, area: { ...s.area, ...u } })), [])
  const updateInventory = useCallback(u => setState(s => ({ ...s, inventory: { ...s.inventory, ...u } })), [])
  const updateAmr       = useCallback(u => setState(s => ({ ...s, amr: { ...s.amr, ...u } })), [])

  const addCycle = useCallback(() => {
    setState(s => {
      const active = s.worker.activePersonnel
      const workerData = s.worker.dataByPersonnel[active]
      if (!workerData || !workerData.measurements || workerData.measurements.length === 0) return s
      const prev = workerData.measurements[workerData.measurements.length - 1]
      const newIndex = workerData.measurements.length + 1
      const newCycle = {
        id: `cycle-${Date.now()}`,
        name: `${newIndex}`,
        cards: prev.cards.map(c => ({
          ...c,
          id: `${newIndex}-${c.type}-${Math.random().toString(36).substr(2, 5)}`,
          start: null,
          end: null
        }))
      }
      return {
        ...s,
        worker: { 
          ...s.worker, 
          dataByPersonnel: {
            ...s.worker.dataByPersonnel,
            [active]: {
              ...workerData,
              measurements: [...workerData.measurements, newCycle],
              basicInfo: { ...workerData.basicInfo, measureCount: newIndex }
            }
          }
        }
      }
    })
  }, [])

  const removeCycle = useCallback((id) => {
    setState(s => {
      const active = s.worker.activePersonnel
      const workerData = s.worker.dataByPersonnel[active]
      if (!workerData || !workerData.measurements || workerData.measurements.length <= 1) return s
      const next = workerData.measurements.filter(m => m.id !== id)
      return {
        ...s,
        worker: { 
          ...s.worker, 
          dataByPersonnel: {
            ...s.worker.dataByPersonnel,
            [active]: {
              ...workerData,
              measurements: next,
              basicInfo: { ...workerData.basicInfo, measureCount: next.length }
            }
          }
        }
      }
    })
  }, [])

  const updateCycleCard = useCallback((cycleId, cardId, upd) => {
    setState(s => {
      const active = s.worker.activePersonnel
      const workerData = s.worker.dataByPersonnel[active]
      if (!workerData || !workerData.measurements) return s
      return {
        ...s,
        worker: {
          ...s.worker,
          dataByPersonnel: {
            ...s.worker.dataByPersonnel,
            [active]: {
              ...workerData,
              measurements: workerData.measurements.map(m => 
                m.id === cycleId 
                ? { ...m, cards: m.cards.map(c => c.id === cardId ? { ...c, ...upd } : c) } 
                : m
              )
            }
          }
        }
      }
    })
  }, [])

  const addCardInCycle = useCallback((cycleId, cardType) => {
    setState(s => {
      const active = s.worker.activePersonnel
      const workerData = s.worker.dataByPersonnel[active]
      if (!workerData || !workerData.measurements) return s
      return {
        ...s,
        worker: {
          ...s.worker,
          dataByPersonnel: {
            ...s.worker.dataByPersonnel,
            [active]: {
              ...workerData,
              measurements: workerData.measurements.map(m => 
                m.id === cycleId 
                ? { 
                    ...m, 
                    cards: [
                      ...m.cards, 
                      { 
                        id: `${Date.now()}`, 
                        type: cardType, 
                        start: null, 
                        end: null,
                        ...(cardType === 'pick' ? { materialCount: 1 } : cardType === 'move' ? { waypointNo: 1 } : { processNo: 1 })
                      }
                    ] 
                  } 
                : m
              )
            }
          }
        }
      }
    })
  }, [])

  const removeCardInCycle = useCallback((cycleId, cardId) => {
    setState(s => {
      const active = s.worker.activePersonnel
      const workerData = s.worker.dataByPersonnel[active]
      if (!workerData || !workerData.measurements) return s
      return {
        ...s,
        worker: {
          ...s.worker,
          dataByPersonnel: {
            ...s.worker.dataByPersonnel,
            [active]: {
              ...workerData,
              measurements: workerData.measurements.map(m => 
                m.id === cycleId 
                ? { ...m, cards: m.cards.filter(c => c.id !== cardId) } 
                : m
              )
            }
          }
        }
      }
    })
  }, [])

  const addPersonnel = useCallback((name) => {
    setState(s => {
      if (s.worker.personnelList.includes(name)) return s
      const isFirst = s.worker.personnelList.length === 0
      const nextActive = isFirst ? name : s.worker.activePersonnel
      const newData = isFirst ? { [name]: createInitialWorkerData(name) } : {}
      return { 
        ...s, 
        worker: { 
          ...s.worker, 
          personnelList: [...s.worker.personnelList, name],
          activePersonnel: nextActive,
          dataByPersonnel: { ...s.worker.dataByPersonnel, ...newData }
        } 
      }
    })
  }, [])

  const removePersonnel = useCallback((name) => {
    setState(s => {
      const nextData = { ...s.worker.dataByPersonnel }
      delete nextData[name]
      const nextList = s.worker.personnelList.filter(n => n !== name)
      const nextActive = s.worker.activePersonnel === name ? nextList[0] || '' : s.worker.activePersonnel
      const newData = (nextActive && !nextData[nextActive]) ? { [nextActive]: createInitialWorkerData(nextActive) } : {}
      return { 
        ...s, 
        worker: { 
          ...s.worker, 
          personnelList: nextList,
          activePersonnel: nextActive,
          dataByPersonnel: { ...nextData, ...newData }
        } 
      }
    })
  }, [])

  const updatePersonnel = useCallback((oldName, newName) => {
    setState(s => {
      const workerData = s.worker.dataByPersonnel[oldName]
      const nextData = { ...s.worker.dataByPersonnel }
      if (workerData) {
        nextData[newName] = { ...workerData, basicInfo: { ...workerData.basicInfo, personnel: newName } }
        delete nextData[oldName]
      }
      return { 
        ...s, 
        worker: { 
          ...s.worker, 
          personnelList: s.worker.personnelList.map(n => n === oldName ? newName : n),
          activePersonnel: s.worker.activePersonnel === oldName ? newName : s.worker.activePersonnel,
          dataByPersonnel: nextData
        } 
      }
    })
  }, [])

  /* ───── 운반 종류 관리 ───── */
  const addTransportType = useCallback((id, label, speed) => {
    setState(s => ({
      ...s,
      worker: {
        ...s.worker,
        transportTypes: { ...s.worker.transportTypes, [id]: { label, speed: parseFloat(speed) || 0 } }
      }
    }))
  }, [])

  const updateTransportType = useCallback((id, upd) => {
    setState(s => ({
      ...s,
      worker: {
        ...s.worker,
        transportTypes: { 
          ...s.worker.transportTypes, 
          [id]: { ...s.worker.transportTypes[id], ...upd, speed: upd.speed !== undefined ? parseFloat(upd.speed) : s.worker.transportTypes[id].speed } 
        }
      }
    }))
  }, [])

  const removeTransportType = useCallback((id) => {
    setState(s => {
      // 1. 해당 항목을 제외한 새로운 객체 생성 (Rest properties 방식)
      const newTypes = { ...s.worker.transportTypes }
      delete newTypes[id]
      
      // 2. 만약 현재 선택된 작업자의 운반 종류가 삭제된 것이라면 'worker'로 초기화
      const active = s.worker.activePersonnel
      const currentWorkerData = s.worker.dataByPersonnel[active]
      let nextDataByPersonnel = { ...s.worker.dataByPersonnel }
      
      if (currentWorkerData?.basicInfo?.transportType === id) {
        nextDataByPersonnel[active] = {
          ...currentWorkerData,
          basicInfo: { ...currentWorkerData.basicInfo, transportType: 'worker' }
        }
      }

      return { 
        ...s, 
        worker: { 
          ...s.worker, 
          transportTypes: newTypes,
          dataByPersonnel: nextDataByPersonnel
        } 
      }
    })
  }, [])

  /* 사진 업로드 */
  const addPhoto = useCallback(async (module, category, file) => {
    const base64 = await fileToBase64(file)
    setState(s => {
      const next = { ...s }
      if (module === 'worker') {
        const active = s.worker.activePersonnel
        const workerData = s.worker.dataByPersonnel[active]
        next.worker = { 
          ...next.worker, 
          dataByPersonnel: {
            ...next.worker.dataByPersonnel,
            [active]: {
              ...workerData,
              photos: { ...workerData.photos, [category]: [...(workerData.photos[category] || []), base64] }
            }
          }
        }
      } else if (module === 'elevator') {
        next.elevator = { ...next.elevator, photos: [...(next.elevator.photos || []), base64] }
      }
      return next
    })
  }, [])

  const removePhoto = useCallback((module, category, index) => {
    setState(s => {
      const next = { ...s }
      if (module === 'worker') {
        const active = s.worker.activePersonnel
        const workerData = s.worker.dataByPersonnel[active]
        const list = [...workerData.photos[category]]
        list.splice(index, 1)
        next.worker = { 
          ...next.worker, 
          dataByPersonnel: {
            ...next.worker.dataByPersonnel,
            [active]: {
              ...workerData,
              photos: { ...workerData.photos, [category]: list }
            }
          }
        }
      } else if (module === 'elevator') {
        const list = [...next.elevator.photos]
        list.splice(index, 1)
        next.elevator = { ...next.elevator, photos: list }
      }
      return next
    })
  }, [])

  return { 
    state, setState, 
    updateWorker, updateElevator, updateArea, updateInventory, updateAmr,
    addPhoto, removePhoto,
    addPersonnel, removePersonnel, updatePersonnel,
    addCycle, removeCycle, updateCycleCard, addCardInCycle, removeCardInCycle,
    switchPersonnel,
    addTransportType, updateTransportType, removeTransportType
  }
}
