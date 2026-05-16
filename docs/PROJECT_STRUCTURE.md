# LWO 물류 분석 Tool — 프로젝트 구조 문서

> 처음 보는 사람도 이 문서 하나로 프로젝트 전체를 이해할 수 있도록 작성한 종합 가이드입니다.
>
> **최종 갱신**: v1.2.3 (2026-05-16) · **저장소**: github.com/inventorhan/LWO-debug

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [폴더 구조 전체 트리](#3-폴더-구조-전체-트리)
4. [핵심 파일별 상세 설명](#4-핵심-파일별-상세-설명)
5. [데이터 흐름 (State Flow)](#5-데이터-흐름-state-flow)
6. [6개 분석 모듈 구조](#6-6개-분석-모듈-구조)
7. [공통 컴포넌트 / 유틸](#7-공통-컴포넌트--유틸)
8. [스타일링 시스템](#8-스타일링-시스템)
9. [빌드 및 배포 파이프라인](#9-빌드-및-배포-파이프라인)
10. [데이터 저장 / 공유 메커니즘](#10-데이터-저장--공유-메커니즘)
11. [버전 관리](#11-버전-관리)
12. [신규 기능 추가 가이드](#12-신규-기능-추가-가이드)

---

## 1. 프로젝트 개요

### 한 줄 정의
> **휴대폰 하나로 물류 현장의 6가지 KPI를 측정·계산·시각화하는 분석 도구**

### 배포 형태 — 한 코드베이스 → 3가지 산출물

| 산출물 | 파일 | 용도 |
|--------|------|------|
| **Android APK** | `LWO_V{X}-release.apk` | 폰에 직접 설치 (사이드로드) |
| **Android AAB** | `LWO_V{X}-release.aab` | Google Play Console 업로드 |
| **Web (PWA)** | `LWO_V{X}-web.html` | 단일 HTML 파일, 어디서든 실행 |
| **온라인 호스팅** | `inventorhan.github.io/LWO-debug/` | GitHub Pages 자동 배포 |
| **교육용 매뉴얼** | `LWO_V{X}-manual.html` | 별도 HTML 가이드북 |

### 핵심 특징
- **로컬 우선** — 모든 데이터가 사용자 브라우저 `localStorage`에 저장. 서버에 어떤 정보도 전송되지 않음
- **단일 파일** — Vite + `vite-plugin-singlefile`로 JS/CSS/이미지 모두 인라인된 1개 HTML 산출 (오프라인 작동)
- **반응형** — 모바일·태블릿·PC 모두 대응 (Capacitor로 네이티브 앱 래핑)

---

## 2. 기술 스택

### 프론트엔드 (앱 본체)
| 카테고리 | 라이브러리 | 역할 |
|----------|------------|------|
| UI 프레임워크 | **React 19** | 컴포넌트 기반 렌더링 |
| 빌드 도구 | **Vite 8** | 개발 서버 + 프로덕션 빌드 |
| 번들 최적화 | **vite-plugin-singlefile** | 모든 자산을 단일 HTML로 인라인 |
| 스타일링 | **Vanilla CSS + CSS Variables** | 별도 CSS-in-JS 미사용 |
| 폰트 | **Noto Sans KR** (Google Fonts) | 한글 가독성 |

### 네이티브 래퍼
| 라이브러리 | 역할 |
|------------|------|
| **Capacitor 8** (`@capacitor/core`, `@capacitor/android`) | 웹앱을 Android 네이티브로 래핑 |
| **@capacitor/filesystem** | 네이티브 파일 저장 (Documents/LWO/) |
| **@capacitor/share** | OS 공유 시트 (카톡/메일 등) |

### 데이터 처리
| 라이브러리 | 역할 |
|------------|------|
| **exceljs** | 클라이언트 측 XLSX 생성 (`.xlsx` 파일) |
| **file-saver** | 브라우저 Blob 다운로드 fallback |

### 개발 / 품질
| 라이브러리 | 역할 |
|------------|------|
| ESLint 9 | 코드 린팅 |
| React 전용 ESLint 플러그인 | Hook 규칙·미사용 변수 등 |

### 배포 인프라
| 도구 | 용도 |
|------|------|
| **Gradle 9** | Android APK/AAB 빌드 |
| **GitHub Actions** | main 푸시 시 자동 빌드 → GitHub Pages 배포 |
| **GitHub Pages** | `inventorhan.github.io/LWO-debug/` 정적 호스팅 |

---

## 3. 폴더 구조 전체 트리

```
D:\Programs\LWO\
│
├─ lwo-app\                          # 메인 React 프로젝트 (모든 소스 코드)
│  │
│  ├─ src\                           ★ 핵심 소스 코드 ★
│  │  ├─ main.jsx                    React 진입점 (root.render)
│  │  ├─ App.jsx                     루트 컴포넌트 (헤더·탭·라우팅)
│  │  ├─ store.js                    전역 상태 관리 (custom hook)
│  │  ├─ index.css                   전역 CSS + 디자인 토큰
│  │  ├─ App.css                     App 컴포넌트 전용 (소량)
│  │  │
│  │  ├─ modules\                    6개 분석 모듈 (각 1 파일)
│  │  │  ├─ WorkerWorkload.jsx       👷 작업자 부하율
│  │  │  ├─ ElevatorWorkload.jsx     🛗 E/V 부하율
│  │  │  ├─ AreaEfficiency.jsx       📐 면적 효율
│  │  │  ├─ InventoryStorage.jsx     📦 재고 보관량 (+ 적정 Space)
│  │  │  ├─ InventoryStatistics.jsx  📈 실적 기준 적정 재고 (통계)
│  │  │  └─ AmrCalculation.jsx       🤖 AMR 대수
│  │  │
│  │  ├─ shared\                     재사용 컴포넌트 / 유틸
│  │  │  ├─ components\
│  │  │  │  ├─ SplashScreen.jsx      앱 진입 시 LWO 로고 + Start 버튼
│  │  │  │  ├─ HelpModal.jsx         📖 풀스크린 사용 설명서 (탭 6개)
│  │  │  │  ├─ HelpHint.jsx          ? 인라인 도움말 (재사용)
│  │  │  │  ├─ TimerSection.jsx      스톱워치 카드 (▶ 시작 / ⏹ 종료)
│  │  │  │  └─ PhotoSection.jsx      사진 촬영·미리보기·삭제
│  │  │  └─ utils\
│  │  │     ├─ common.js             공용 유틸 (n, fmtN, getGap, calcArea, fileToBase64)
│  │  │     ├─ excelExport.js        5개 모듈 → 단일 .xlsx 생성
│  │  │     └─ saveAndShare.js       네이티브/웹 분기 파일 저장 + 공유
│  │  │
│  │  └─ assets\
│  │     ├─ splash.jpg               스플래시 이미지 (LG 디지털 트윈)
│  │     ├─ normal_distribution.png  정규분포 + Z표 (실적 재고 모듈)
│  │     ├─ hero.png                 (legacy)
│  │     ├─ react.svg
│  │     └─ vite.svg
│  │
│  ├─ public\                        Vite가 dist/로 그대로 복사하는 정적 자산
│  │  ├─ favicon.svg
│  │  ├─ icons.svg
│  │  ├─ manifest.json               PWA 매니페스트
│  │  └─ manual.html                 별도 교육용 매뉴얼 (단일 HTML)
│  │
│  ├─ dist\                          빌드 산출물 (Vite output, .gitignore)
│  │  ├─ index.html                  ← 모든 JS/CSS/이미지 인라인된 본체
│  │  └─ manual.html                 public/에서 자동 복사
│  │
│  ├─ docs\                          GitHub Pages 백업용 + 본 문서들
│  │  ├─ index.html                  앱 본체 사본 (legacy)
│  │  ├─ manual.html                 매뉴얼 사본 (legacy)
│  │  ├─ privacy.html                개인정보처리방침
│  │  ├─ PROJECT_STRUCTURE.md        ← 지금 보고 있는 이 문서
│  │  └─ .nojekyll                   Pages가 Jekyll로 처리하지 않도록 마커
│  │
│  ├─ android\                       Capacitor가 생성한 네이티브 Android 프로젝트
│  │  ├─ app\
│  │  │  ├─ build.gradle             ★ versionCode/versionName 정의 ★
│  │  │  ├─ src\main\
│  │  │  │  ├─ AndroidManifest.xml
│  │  │  │  ├─ assets\
│  │  │  │  │  ├─ capacitor.config.json
│  │  │  │  │  ├─ capacitor.plugins.json
│  │  │  │  │  └─ public\            ← Vite dist/ 의 사본 (cap copy로 동기화)
│  │  │  │  └─ java\, res\           Android 표준 구조
│  │  │  └─ ...
│  │  ├─ build.gradle                Top-level Gradle
│  │  ├─ gradle.properties
│  │  ├─ settings.gradle
│  │  ├─ variables.gradle            Android SDK 버전 등
│  │  └─ capacitor-cordova-android-plugins\  Cordova 호환 레이어
│  │
│  ├─ scripts\
│  │  └─ bump-version.mjs            ★ 버전 자동 증가 스크립트 ★
│  │
│  ├─ node_modules\                  의존성 (gitignore)
│  ├─ .github\
│  │  └─ workflows\
│  │     └─ deploy-pages.yml         ★ GitHub Actions 자동 배포 ★
│  │
│  ├─ index.html                     Vite 진입 HTML (개발 시)
│  ├─ vite.config.js                 빌드 설정 (singleFile, base 등)
│  ├─ capacitor.config.json          앱 ID/이름/webDir 정의
│  ├─ eslint.config.js               린팅 규칙
│  ├─ package.json                   ★ 의존성 + 스크립트 정의 ★
│  └─ package-lock.json
│
├─ LWO_V1.1.12-release.apk           ← 배포용 산출물 (gitignore)
├─ LWO_V1.1.12-release.aab
├─ LWO_V1.1.12-web.html
├─ LWO_V1.1.12-manual.html
│
├─ lwo_key\                          서명 키 (절대 git에 올리지 않음)
└─ ...(기획 자료, 슬라이드 등)
```

### ★ 표시된 파일이 가장 중요
- **소스**: `src/` 전체
- **빌드 설정**: `package.json`, `vite.config.js`, `capacitor.config.json`
- **버전 관리**: `scripts/bump-version.mjs`, `android/app/build.gradle`
- **자동 배포**: `.github/workflows/deploy-pages.yml`

---

## 4. 핵심 파일별 상세 설명

### 4.1 `src/main.jsx` — 진입점 (10줄)

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

가장 단순한 진입점. `index.css` 로드 후 `<App>` 마운트.

### 4.2 `src/App.jsx` — 루트 컴포넌트 (235줄)

전체 앱의 **셸 (Shell)**:
- 상단 헤더 (열기·저장·엑셀·설명서·초기화 버튼)
- 좌측 사이드바 (PC) / 하단 탭 (모바일)
- 활성 모듈 렌더링 (`switch(activeTab)`)
- 토스트 알림
- `SplashScreen` + `HelpModal` 마운트

핵심 로직:
1. `useAppState()` 훅으로 전역 상태 + 모든 액션 가져옴
2. `activeTab` state로 5개 모듈 중 하나 렌더
3. JSON 저장/로드, Excel 내보내기 핸들러
4. 모듈에 필요한 액션을 props로 전달

### 4.3 `src/store.js` — 전역 상태 (836줄, 가장 큰 파일)

**Custom Hook 방식**의 단순한 상태 관리. Redux/Zustand 등 외부 라이브러리 미사용.

```js
export function useAppState() {
  const [state, setState] = useState(initialState)
  // localStorage 자동 동기화 (useEffect)
  // 수많은 액션 함수들...
  return { state, ...액션들 }
}
```

#### 4.3.1 State 스키마

```js
{
  worker: {            // 작업자 부하율
    activePersonnel: '홍길동',
    personnelList: [...],
    dataByPersonnel: { '홍길동': { basicInfo, measurements, photos } },
    transportTypes: { worker, cart, handcart, pallet, agv, other }
  },
  elevator: {          // E/V 부하율 — 호기별 분리
    activeHogi: 1,
    dataByHogi: { '1': { basicInfo, measurements, loadItems, photos } }
  },
  area: {              // 면적 효율
    factory: { width, height, photo },
    zones: [{ no, width, height, items: [...] }]
  },
  inventory: {         // 재고 보관량 — flat 객체 (한 세트)
    customerDayUph, customerDayTime, ...
    ageingTime, safetyStockTime, ...
    spaceWidth, spaceDepth, spaceHeight, spaceMargin  // 적정 Space 산출
  },
  inventoryStats: {    // 실적 기준 적정 재고 — 제품/모델별 데이터 분리
    productList: ['세탁기', ...],
    modelsByProduct: { '세탁기': ['Top Loader', ...] },
    activeProduct, activeModel,
    dataByKey: {
      '세탁기::Top Loader': { records: [{ id, date, production, shipment, stock }] }
    }
  },
  amr: {               // AMR 대수 — flat 객체
    tactTime, recycleRate, ...
    operationRate: 0.8, spare: 1
  }
}
```

#### 4.3.2 액션 카테고리

| 카테고리 | 함수 |
|----------|------|
| **공통** | `updateWorker`, `updateElevator`, `updateArea`, `updateInventory`, `updateAmr` |
| **작업자** | `addPersonnel`, `removePersonnel`, `updatePersonnel`, `switchPersonnel`, `addCycle`, `removeCycle`, `updateCycleCard`, `addCardInCycle`, `removeCardInCycle` |
| **운반종류** | `addTransportType`, `updateTransportType`, `removeTransportType` |
| **E/V** | `switchHogi`, `removeHogi`, `updateElevatorBasic`, `addElevatorCycle`, `removeElevatorCycle`, `updateElevatorCycleCard`, `addElevatorCard`, `removeElevatorCard`, `addElevatorLoadItem`, `updateElevatorLoadItem`, `removeElevatorLoadItem` |
| **재고 통계** | `updateInventoryStats`, `addInvProduct/removeInvProduct/renameInvProduct`, `addInvModel/removeInvModel/renameInvModel`, `setActiveInvProduct/setActiveInvModel`, `addInvStatsRecord/updateInvStatsRecord/removeInvStatsRecord`, `clearInvStatsRecords` |
| **사진** | `addPhoto`, `removePhoto` (자동 base64 변환) |

#### 4.3.3 데이터 마이그레이션

오래된 localStorage 데이터를 새 버전 스키마로 자동 변환:
- 면적 모듈 mm → m 단위 변환 (`migrateAreaUnit`)
- E/V 모듈 mm → m 단위 변환 (v1.1.4)
- 단일 cards → dataByHogi 구조 마이그레이션
- 재고 통계 단일 records[] → 제품/모델별 dataByKey 구조 (v1.2.2)

### 4.4 `src/index.css` — 디자인 시스템 (720줄)

CSS Variables로 디자인 토큰 정의:

```css
:root {
  --color-primary: #A50034;        /* LG Active Red */
  --color-primary-dark: #6F0023;
  --color-card-bg: #FBF8F9;
  /* ... */
}
```

주요 클래스:
- `.app-container`, `.app-header`, `.sidebar`, `.bottom-nav` — 레이아웃
- `.section-card`, `.section-title` — 카드 컴포넌트
- `.input-grid`, `.input-group`, `.input-field` — 폼
- `.result-box`, `.result-box.tone-blue/-dark/-slate/-success` — 결과 박스
- `.btn` — 버튼 (touch-target 44px)
- `.cycle-tabs-container`, `.cycle-tab-btn` — 회차/호기 탭

반응형 브레이크포인트:
- `768px+` — 태블릿 (3열 그리드)
- `1024px+` — 데스크탑 (사이드바 활성화)

---

## 5. 데이터 흐름 (State Flow)

```
┌────────────────────────────────────────────────────────────────┐
│                    사용자 입력 (UI Event)                       │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│  Module Component (e.g. InventoryStorage.jsx)                  │
│  - onChange={e => updateData({ field: e.target.value })}        │
└─────────────────────────────┬──────────────────────────────────┘
                              │ 액션 호출
                              ▼
┌────────────────────────────────────────────────────────────────┐
│  store.js — useAppState()                                       │
│  - setState(s => ({ ...s, ...patch }))                          │
│  - useEffect: localStorage.setItem(STORAGE_KEY, JSON.stringify) │
└─────────────────────────────┬──────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        React Re-render  localStorage   다른 모듈에도 영향?
              │            (영구 저장)    (대부분 영향 없음)
              ▼
        UI 자동 갱신 (useMemo 등 파생 값 재계산)
```

### 산출값 계산 패턴
모든 모듈은 **입력만 저장하고, 산출값은 매 렌더마다 useMemo로 다시 계산**합니다.

```jsx
const dailyProd = useMemo(() => n(f.uph) * n(f.time), [f.uph, f.time])
```

장점:
- 산출 로직 변경 시 데이터 마이그레이션 불필요
- 입력만 저장하므로 localStorage 용량 절약
- 단일 source of truth — 산출 로직이 코드 한 곳에만 존재

---

## 6. 6개 분석 모듈 구조

각 모듈은 독립적이고 비슷한 패턴을 따릅니다.

### 공통 패턴

```jsx
export default function ModuleName({ data, updateData, ...액션들 }) {
  const f = data || {}
  const set = (k, v) => updateData({ [k]: v })

  // 1) useMemo로 산출값 계산
  const result = useMemo(() => /* 공식 */, [...deps])

  // 2) JSX: section-card 여러 개
  return (
    <div>
      <div className="module-title">모듈명</div>
      <div className="section-card">
        <div className="section-title">
          섹션명
          <HelpHint title="..."> ... </HelpHint>
        </div>
        <div className="input-grid"> /* 입력 + 결과 박스 */ </div>
      </div>
      {/* ... 더 많은 섹션 */}
    </div>
  )
}
```

### 모듈별 특이점

| 모듈 | 파일 | 라인 | 특이사항 |
|------|------|------|---------|
| **WorkerWorkload** | `WorkerWorkload.jsx` | 621 | 인원별 데이터 분리 (`dataByPersonnel`), 운반 종류 관리 모달, 인원별 비교 대시보드 |
| **ElevatorWorkload** | `ElevatorWorkload.jsx` | 465 | 호기별 데이터 (`dataByHogi`), gap-fill 호기 번호, 호기별 비교 대시보드 |
| **AreaEfficiency** | `AreaEfficiency.jsx` | 428 | 구역 배열 + 적재 항목 중첩, 막대그래프 시각화 |
| **InventoryStorage** | `InventoryStorage.jsx` | 340 | flat 입력 → 4단계 자동 산출, 부호 표시 (잉여/부족), **적정 Space 산출 카드** |
| **InventoryStatistics** | `InventoryStatistics.jsx` | 480 | 제품/모델 dropdown + 관리 모달, 일별 입력 테이블, 추이 라인 차트(SVG), **99.9%/99.5% Z-기반 적정재고** |
| **AmrCalculation** | `AmrCalculation.jsx` | 268 | 가장 단순. 3단계 산출 (UPH → Cycle → 대수) |

### 측정형 vs 산출형
- **측정형** (Worker, Elevator) — 스톱워치로 시간 기록, 회차 반복, `TimerSection` 사용
- **산출형** (Inventory, Amr) — 숫자 입력 → 즉시 계산
- **하이브리드** (Area) — 입력형 + 사진 + 시각화

---

## 7. 공통 컴포넌트 / 유틸

### 7.1 `shared/components/`

| 컴포넌트 | 사용처 | 역할 |
|----------|--------|------|
| **`TimerSection`** | Worker, Elevator | 스톱워치 카드. `start`/`end` 타임스탬프 받아 Gap 표시 |
| **`PhotoSection`** | Worker, Elevator | 사진 촬영 → base64 → 미리보기 |
| **`SplashScreen`** | App.jsx | 진입 시 LG 로고 + Start 버튼 |
| **`HelpModal`** | App.jsx | 📖 헤더 버튼 → 풀스크린 종합 설명서 (탭 6개) |
| **`HelpHint`** | 모든 모듈 섹션 | ? 인라인 도움말 (작은 모달) |

### 7.2 `shared/utils/`

#### `common.js` (99줄) — 4개 함수
```js
n(v)              // 안전한 숫자 변환 (parseFloat + NaN→0)
fmtN(v, unit, dp) // "1,234개" 형식 포맷
getGap(start, end) // 두 타임스탬프 차이 (초)
calcArea(w, h)    // 가로 × 세로
fileToBase64(file) // 파일 → base64 (압축 포함)
```

#### `excelExport.js` (405줄)
`exceljs`로 5개 모듈을 시트별로 분리한 `.xlsx` 생성. 사진은 워크북에 임베드.

#### `saveAndShare.js` (104줄)
플랫폼 분기:
- **네이티브 (Capacitor)**: `Filesystem.writeFile` → `Documents/LWO/` → `Share.share()` 시트
- **웹 (브라우저)**: Blob → URL → `<a download>` 클릭 (file-saver)

---

## 8. 스타일링 시스템

### LG 브랜드 컬러 (v1.1.7부터 통일)

| 변수 | 값 | 용도 |
|------|-----|------|
| `--color-primary` | `#A50034` | LG Active Red — 메인 |
| `--color-primary-light` | `#C2185B` | 호버·하이라이트 |
| `--color-primary-dark` | `#6F0023` | 짙은 강조·텍스트 |
| `--color-primary-soft` | `#F4E1E7` | 액션 버튼 배경 |
| `--color-primary-softer` | `#FAEFF2` | 카드 호버 배경 |
| `--color-accent-dark` | `#2A1F24` | 따뜻한 다크 (tone-dark) |
| `--color-success` | `#047857` | 성공·OK 상태 |
| `--color-warning` | `#B45309` | 경고·과부하 |

### 응답형 디자인
모바일 우선 (Mobile-first) — 기본 CSS는 모바일, 미디어 쿼리로 큰 화면 확장.

---

## 9. 빌드 및 배포 파이프라인

### 9.1 npm 스크립트 (`package.json`)

```json
{
  "scripts": {
    "dev":            "vite",                                  // 개발 서버
    "build":          "vite build",                            // dist/ 생성
    "lint":           "eslint .",
    "preview":        "vite preview",
    "bump":           "node scripts/bump-version.mjs",         // versionCode +1
    "bump:patch":     "node scripts/bump-version.mjs --patch", // 1.0.0 → 1.0.1
    "bump:minor":     "node scripts/bump-version.mjs --minor", // 1.0.0 → 1.1.0
    "bump:major":     "node scripts/bump-version.mjs --major", // 1.0.0 → 2.0.0
    "release:apk":    "npm run build && npx cap copy android && cd android && gradlew assembleRelease",
    "release:aab":    "npm run build && npx cap copy android && cd android && gradlew bundleRelease",
    "deploy:pages":   "npm run build + dist→docs 복사 (legacy 백업)"
  }
}
```

### 9.2 빌드 흐름 다이어그램

```
[소스 코드 src/]
       │
       ▼
[npm run build]  ← Vite + vite-plugin-singlefile
       │         (모든 JS/CSS/이미지 인라인)
       ▼
[dist/index.html]  ← 단일 HTML 파일 (~2.6 MB)
   │   │
   │   └──→ public/manual.html도 자동 복사
   │
   ├──→ [GitHub Pages]  (워크플로가 자동 업로드)
   │     URL: inventorhan.github.io/LWO-debug/
   │
   ├──→ [npx cap copy android]
   │     │
   │     ▼
   │   [android/app/src/main/assets/public/]  ← Capacitor 동기화
   │     │
   │     ▼
   │   [gradlew assembleRelease]  → APK
   │   [gradlew bundleRelease]    → AAB
   │
   └──→ [수동 복사]  → LWO_V1.1.12-web.html
```

### 9.3 GitHub Actions 자동 배포

`.github/workflows/deploy-pages.yml`:
```yaml
on: push:branches: [main]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - actions/checkout@v4
      - actions/setup-node@v4 with: node-version: 20, cache: npm
      - run: npm ci
      - run: npm run build
      - actions/configure-pages@v5
      - actions/upload-pages-artifact@v3 with: path: ./dist
      - actions/deploy-pages@v4
```

main 브랜치에 푸시할 때마다 자동으로 `dist/` 폴더가 GitHub Pages에 배포됩니다 (소요 시간 약 1~2분).

### 9.4 Android 서명 키

`android/keystore.properties` (gitignored, 절대 공유 금지):
```
storeFile=/path/to/lwo.keystore
storePassword=...
keyAlias=...
keyPassword=...
```

이 키로 모든 APK/AAB가 서명되며, Google Play Console에 등록된 것과 동일해야 합니다.

---

## 10. 데이터 저장 / 공유 메커니즘

### 10.1 localStorage 자동 동기화

```js
// store.js
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}, [state])
```

`STORAGE_KEY = 'lwo_app_persistent_data'`. 앱이 로드되면 자동 복원.

### 10.2 JSON 내보내기 (💾 저장)

`App.jsx` `handleSave` → `saveAndShare.saveJson(filename, json)`:
- **네이티브**: Capacitor Filesystem → `Documents/LWO/LWO_분석_{날짜}.json` → Share Sheet
- **웹**: Blob → `<a download>` 클릭

### 10.3 Excel 내보내기 (📊 엑셀)

`excelExport.js` → workbook에 5개 시트 추가:
1. 작업자 부하율 (인원별 데이터 + 사진 임베드)
2. E/V 부하율 (호기별)
3. 면적 효율 (공장·구역·적재)
4. 재고 보관량 (4단계 산출)
5. AMR 대수

`saveAndShare.saveXlsx(...)` → 네이티브/웹 분기.

### 10.4 사진 처리

`fileToBase64(file)` → 자동 압축 (Canvas 리사이즈) → base64 → 상태에 저장
- 모든 사진은 localStorage에 base64로 저장
- Excel 내보내기 시 workbook에 그대로 임베드

---

## 11. 버전 관리

### 자동 버전 증가 스크립트

`scripts/bump-version.mjs` — `android/app/build.gradle`의 `versionCode`/`versionName`을 자동 갱신:

```bash
npm run bump:patch   # 1.1.11 → 1.1.12 (작은 수정)
npm run bump:minor   # 1.1.0  → 1.2.0  (기능 추가)
npm run bump:major   # 1.x.x  → 2.0.0  (큰 변경)
npm run bump         # versionCode만 +1
```

`versionCode`는 매 배포마다 +1 (Play Console 필수). `versionName`은 사람이 읽는 표시용.

### 배포 산출물 네이밍 규칙
모두 `LWO_V{versionName}-release.{확장자}` 형식:
- `LWO_V1.1.12-release.apk`
- `LWO_V1.1.12-release.aab`
- `LWO_V1.1.12-web.html`
- `LWO_V1.1.12-manual.html`

이전 버전 파일은 새 버전 배포 시 함께 삭제.

---

## 12. 신규 기능 추가 가이드

### 12.1 새로운 모듈을 추가하려면?

1. **`src/modules/NewModule.jsx`** 생성 (기존 모듈 구조 복사)
2. **`src/store.js`** `initialState`에 `newModule: { ... }` 추가
3. **`src/App.jsx`** `TABS` 배열에 항목 추가 + `renderModule()` switch에 케이스 추가
4. **`src/shared/utils/excelExport.js`** 시트 추가
5. **`HelpModal.jsx`** 탭 추가 (선택)

### 12.2 새로운 입력 필드를 추가하려면?

1. 해당 모듈 jsx에서 `<input>` 추가
2. `store.js initialState[모듈]`에 필드 기본값 추가
3. `useMemo` 산출식 업데이트
4. `excelExport.js` 해당 시트 컬럼 추가

### 12.3 디자인 색상을 변경하려면?

`src/index.css` 상단의 `:root` CSS 변수만 수정. 모든 컴포넌트가 자동으로 적용됩니다.

### 12.4 배포 절차

```bash
# 1. 코드 수정 후
npm run bump:patch              # 버전 +0.0.1

# 2. 빌드 (3가지 산출물 동시)
npm run build                   # web → dist/
npx cap copy android            # native에 복사
cd android && ./gradlew assembleRelease bundleRelease

# 3. 산출물 복사 (D:/Programs/LWO/ 로)
# (필요시 수동, 또는 자동화 스크립트)

# 4. Git push (자동으로 GitHub Pages에 배포됨)
git add -A
git commit -m "feat: 변경 내용"
git push origin main
```

---

## 부록 — 참고 자료

| 항목 | 위치 |
|------|------|
| **앱 본체** | https://inventorhan.github.io/LWO-debug/ |
| **교육용 매뉴얼** | https://inventorhan.github.io/LWO-debug/manual.html |
| **GitHub 저장소** | https://github.com/inventorhan/LWO-debug |
| **GitHub Actions** | https://github.com/inventorhan/LWO-debug/actions |
| **개인정보처리방침** | https://inventorhan.github.io/LWO-debug/privacy.html |

---

## 작성자 / 라이선스

> © 2026 LWO Project · Designed by Haneol Lee · Advised by JS Kim
>
> 본 문서는 프로젝트 인계 및 신규 참여자 온보딩 목적으로 작성됨.
