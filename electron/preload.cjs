/**
 * 렌더러(웹) 측에 안전하게 노출되는 브릿지.
 * 현재는 빈 상태 — 추후 네이티브 기능(파일 저장 등) 필요 시 contextBridge로 노출.
 */
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('lwoDesktop', {
  isElectron: true,
  platform: process.platform
})
