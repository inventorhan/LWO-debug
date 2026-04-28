/**
 * 숫자 변환 및 계산 유틸리티
 */

/**
 * 값을 float 숫자로 변환합니다. 실패 시 0을 반환합니다.
 */
export function n(v) {
  return parseFloat(v) || 0;
}

/**
 * 숫자를 포맷팅하여 문자열로 반환합니다.
 * @param {number} v - 값
 * @param {string} unit - 단위 (선택)
 * @param {number} decimals - 소수점 자리수 (기본 2)
 * @returns {string} 포맷팅된 문자열
 */
export function fmtN(v, unit = '', decimals = 2) {
  return v !== null && !isNaN(v) && isFinite(v) && v > 0 
    ? `${v.toLocaleString(undefined, { maximumFractionDigits: decimals })}${unit}` 
    : '—';
}

/**
 * 면적을 계산합니다 (가로 * 세로).
 */
export function calcArea(w, h) {
  const a = n(w) * n(h);
  return a > 0 ? a : null;
}

/**
 * 타임스탬프를 HH:mm:ss 형식으로 변환합니다.
 */
export function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

/**
 * 두 시점 사이의 차이(초)를 계산합니다.
 */
export function getGap(start, end) {
  if (!start) return null;
  const stop = end || Date.now();
  return ((stop - start) / 1000).toFixed(1);
}

/**
 * 파일을 Base64로 변환합니다.
 */
export const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});
