// Korean particles that depend on whether the word ends in a final consonant.

function finalConsonant(word: string): number | null {
  const code = word.trim().charCodeAt(word.trim().length - 1);
  if (code < 0xac00 || code > 0xd7a3) return null;
  return (code - 0xac00) % 28;
}

/** "신사이바시로" / "오사카성으로" (ㄹ takes 로). */
export function withRo(word: string): string {
  const jong = finalConsonant(word);
  return `${word}${jong === null || jong === 0 || jong === 8 ? "로" : "으로"}`;
}

/** "도톤보리가" / "호젠지 요코초가" / "시장이" */
export function withIga(word: string): string {
  const jong = finalConsonant(word);
  return `${word}${jong ? "이" : "가"}`;
}
