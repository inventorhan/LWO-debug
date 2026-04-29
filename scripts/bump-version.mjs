/**
 * versionCode 자동 증가 + versionName 업데이트 스크립트
 *
 * 사용법:
 *   node scripts/bump-version.mjs            → versionCode +1, versionName 그대로
 *   node scripts/bump-version.mjs 1.0.1      → versionCode +1, versionName "1.0.1"
 *   node scripts/bump-version.mjs --patch    → versionName patch +1 (e.g. 1.0.0 → 1.0.1)
 *   node scripts/bump-version.mjs --minor    → versionName minor +1 (e.g. 1.0.0 → 1.1.0)
 *   node scripts/bump-version.mjs --major    → versionName major +1 (e.g. 1.0.0 → 2.0.0)
 *
 * 자동으로 android/app/build.gradle 의 versionCode/versionName 을 갱신합니다.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GRADLE = path.resolve(__dirname, '..', 'android', 'app', 'build.gradle');

if (!fs.existsSync(GRADLE)) {
  console.error('✗ build.gradle 파일을 찾을 수 없습니다:', GRADLE);
  process.exit(1);
}

let src = fs.readFileSync(GRADLE, 'utf8');

const codeMatch = src.match(/versionCode\s+(\d+)/);
const nameMatch = src.match(/versionName\s+"([^"]+)"/);

if (!codeMatch || !nameMatch) {
  console.error('✗ build.gradle 에서 versionCode/versionName 을 찾을 수 없습니다.');
  process.exit(1);
}

const oldCode = parseInt(codeMatch[1], 10);
const oldName = nameMatch[1];
const newCode = oldCode + 1;

let newName = oldName;
const arg = process.argv[2];

if (arg === '--patch' || arg === '--minor' || arg === '--major') {
  const parts = oldName.split('.').map(p => parseInt(p, 10));
  while (parts.length < 3) parts.push(0);
  if (arg === '--patch') parts[2] += 1;
  else if (arg === '--minor') { parts[1] += 1; parts[2] = 0; }
  else { parts[0] += 1; parts[1] = 0; parts[2] = 0; }
  newName = parts.join('.');
} else if (arg && /^\d+\.\d+(\.\d+)?$/.test(arg)) {
  newName = arg;
}

src = src.replace(/versionCode\s+\d+/, `versionCode ${newCode}`);
src = src.replace(/versionName\s+"[^"]+"/, `versionName "${newName}"`);

fs.writeFileSync(GRADLE, src, 'utf8');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  ✅ 버전 업데이트 완료');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  versionCode  ${oldCode}  →  ${newCode}`);
console.log(`  versionName  ${oldName}  →  ${newName}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log();
console.log('  다음 명령으로 릴리즈 빌드:');
console.log('    cd android && ./gradlew bundleRelease   (AAB)');
console.log('    cd android && ./gradlew assembleRelease (APK)');
