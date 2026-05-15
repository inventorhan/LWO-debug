# 📦 LWO 물류 분석 Tool

> **Logistics Work Optimize** — 휴대폰 하나로 물류 현장의 5가지 핵심 KPI를 측정·분석·시각화하는 도구

[![Web App](https://img.shields.io/badge/▶_웹앱_바로_실행-A50034?style=for-the-badge)](https://inventorhan.github.io/LWO-debug/)
[![Manual](https://img.shields.io/badge/📖_사용_설명서-6F0023?style=for-the-badge)](https://inventorhan.github.io/LWO-debug/manual.html)
[![Docs](https://img.shields.io/badge/📚_프로젝트_구조-424242?style=for-the-badge)](./docs/PROJECT_STRUCTURE.md)

---

## ✨ 무엇을 할 수 있나요?

물류 현장에서 스톱워치 · 줄자 · 메모지로 하던 작업을 **앱 화면 한 곳**에서 처리합니다.
모든 데이터는 휴대폰 내부에 저장되며 서버로 전송되지 않습니다.

### 5개 분석 모듈

| 모듈 | 무엇을 측정? | 결과 |
|------|--------------|------|
| 👷 **작업자 부하율** | 운반 사이클 시간 (피킹·이동·로딩·회수) | 부하율 %, 총 운반 시간 |
| 🛗 **E/V 부하율** | 엘리베이터 호기별 운반 시간 + 카(케이지) 적재율 | 부하율 %, 적재율 % |
| 📐 **면적 효율** | 공장·구역별 면적 + 적재물 체적(높이) 효율 | 면적 효율 %, 체적 사용율 % |
| 📦 **재고 보관량** | 고객 요구량 + 운반 리드타임 + 운영 재고 | 최종 적정 재고 (대) |
| 🤖 **AMR 대수** | 생산 Tact + AMR 왕복 시간 | 필요 도입 대수 (대) |

### 부가 기능

- ⏱ **스톱워치 측정** — 회차별로 ▶ 시작 → ⏹ 종료
- 📸 **사진 첨부** — 운반 수단·적재 상태·공장 도면 사진 임베드
- 💾 **JSON 저장/불러오기** — 측정 데이터 영구 보관
- 📊 **Excel 내보내기** — 5개 모듈 전체를 한 파일로 (사진 포함)
- 📖 **인라인 도움말** — 각 섹션 옆 `?` 버튼 + 풀스크린 종합 설명서
- 🌐 **3가지 배포 형태** — Android 앱(APK/AAB) + 단일 HTML 파일 + GitHub Pages 호스팅

---

## 🚀 사용 방법

### 일반 사용자
1. **웹**: https://inventorhan.github.io/LWO-debug/ 접속
2. **Android 앱**: `LWO_V*.apk` 다운로드 후 폰에 설치
3. **오프라인**: `LWO_V*-web.html` 파일을 폰/PC에 저장 후 더블클릭

### 처음이라면
📖 **[사용 설명서](https://inventorhan.github.io/LWO-debug/manual.html)** 를 먼저 보세요. 모듈별 절차 + 공식 + 계산 예시까지 정리되어 있습니다.

---

## 🛠 기술 스택

```
React 19 + Vite 8 (단일 파일 빌드)
└─ Capacitor 8 → Android APK / AAB
└─ exceljs → 클라이언트 Excel 내보내기
└─ GitHub Actions → GitHub Pages 자동 배포
```

서버 / 백엔드 / 데이터베이스 없음. 완전한 **클라이언트 사이드 앱**.

---

## 📁 프로젝트 구조 (요약)

```
lwo-app/
├─ src/
│  ├─ App.jsx              ← 루트 컴포넌트 (헤더·탭·라우팅)
│  ├─ store.js             ← 전역 상태 (useAppState 훅)
│  ├─ modules/             ← 5개 분석 모듈
│  │  ├─ WorkerWorkload.jsx
│  │  ├─ ElevatorWorkload.jsx
│  │  ├─ AreaEfficiency.jsx
│  │  ├─ InventoryStorage.jsx
│  │  └─ AmrCalculation.jsx
│  └─ shared/              ← 재사용 컴포넌트 + 유틸
├─ android/                ← Capacitor 네이티브 프로젝트
├─ public/                 ← 정적 자산 (manual.html 포함)
└─ docs/                   ← 문서 (PROJECT_STRUCTURE.md, CHANGELOG.md, ...)
```

자세한 구조와 빌드 흐름은 **[PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)** 참고.

---

## ⚙ 개발 / 빌드

```bash
# 의존성 설치
npm install

# 개발 서버 (localhost:5173)
npm run dev

# 프로덕션 빌드 (dist/index.html — 단일 파일)
npm run build

# 버전 증가
npm run bump:patch   # 1.1.11 → 1.1.12
npm run bump:minor   # 1.1.x → 1.2.0

# Android 빌드
npx cap copy android
cd android && ./gradlew assembleRelease    # APK
cd android && ./gradlew bundleRelease      # AAB (Play Console)
```

`main` 브랜치에 푸시하면 **GitHub Actions가 자동으로 GitHub Pages에 배포**합니다 (1~2분 소요).

---

## 📝 문서

| 문서 | 내용 |
|------|------|
| [`docs/PROJECT_STRUCTURE.md`](./docs/PROJECT_STRUCTURE.md) | 종합 기술 문서 (구조·빌드·확장 가이드) |
| [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) | 버전별 변경 이력 |
| [`docs/manual.html`](https://inventorhan.github.io/LWO-debug/manual.html) | 일반 사용자 / 교육생용 사용 설명서 |
| [`docs/privacy.html`](https://inventorhan.github.io/LWO-debug/privacy.html) | 개인정보처리방침 |

---

## 📄 라이선스 / 제작

© 2026 LWO Project · Designed by **Haneol Lee** · Advised by **JS Kim**
