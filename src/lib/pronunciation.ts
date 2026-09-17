export function normalizeSpeech(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function levenshteinDistance(left: string, right: string): number {
  if (!left.length) return right.length
  if (!right.length) return left.length
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)

  for (let i = 1; i <= left.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      )
    }
    previous.splice(0, previous.length, ...current)
  }
  return previous[right.length]
}

export function pronunciationScore(target: string, transcript: string): number {
  const expected = normalizeSpeech(target)
  const actual = normalizeSpeech(transcript)
  if (!expected || !actual) return 0
  if (expected === actual) return 100

  const expectedWords = expected.split(' ')
  const actualWords = actual.split(' ')
  if (expectedWords.length === 1 && actualWords.includes(expected)) return 100

  const distance = levenshteinDistance(expected, actual)
  return Math.max(0, Math.round((1 - distance / Math.max(expected.length, actual.length)) * 100))
}

export function pronunciationFeedback(score: number): { label: string; detail: string; level: 'great' | 'close' | 'retry' } {
  if (score >= 90) return { label: 'Rất rõ!', detail: 'Con đọc rất gần với từ mẫu.', level: 'great' }
  if (score >= 65) return { label: 'Gần đúng rồi!', detail: 'Nghe lại một lần và thử đọc chậm hơn nhé.', level: 'close' }
  return { label: 'Mình thử lại nhé!', detail: 'Nhìn khẩu hình, nghe mẫu rồi đọc từng âm.', level: 'retry' }
}
