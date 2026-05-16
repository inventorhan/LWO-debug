/**
 * Electron 메인 프로세스
 * - dist/index.html (Vite 단일파일 빌드)을 BrowserWindow로 로드
 * - 창 크기 / 위치는 사용자 환경에 저장하여 재실행 시 복원
 * - 메뉴바 숨김 (앱 느낌)
 */
const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const isDev = !app.isPackaged
const settingsPath = path.join(app.getPath('userData'), 'window-state.json')

function loadWinState() {
  try { return JSON.parse(fs.readFileSync(settingsPath, 'utf8')) }
  catch { return { width: 1280, height: 820 } }
}

function saveWinState(win) {
  if (!win || win.isDestroyed()) return
  try {
    const bounds = win.isMaximized() ? loadWinState() : win.getBounds()
    fs.writeFileSync(settingsPath, JSON.stringify({
      ...bounds,
      maximized: win.isMaximized()
    }))
  } catch {/* ignore */}
}

function createWindow() {
  const state = loadWinState()

  const win = new BrowserWindow({
    width: state.width || 1280,
    height: state.height || 820,
    x: state.x,
    y: state.y,
    minWidth: 360,
    minHeight: 560,
    title: 'LWO 물류 분석',
    backgroundColor: '#F6F3F4',
    icon: path.join(__dirname, '../build/icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  /* 메뉴바 완전 제거 (Alt 키로도 안 뜨게) */
  Menu.setApplicationMenu(null)

  if (state.maximized) win.maximize()

  /* dist/index.html 로드 */
  if (isDev) {
    /* npm run electron:dev → vite dev 서버 사용 */
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  /* 외부 링크는 OS 기본 브라우저에서 열기 */
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })

  /* 창 크기 변경 시 저장 */
  win.on('close', () => saveWinState(win))
  win.on('resize', () => saveWinState(win))
  win.on('move', () => saveWinState(win))
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
