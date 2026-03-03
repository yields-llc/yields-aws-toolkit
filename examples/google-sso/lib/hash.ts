export function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // 32bit integerに変換
  }
  // 62進数文字列に変換 (簡略化)
  return Math.abs(hash).toString(36)
}
