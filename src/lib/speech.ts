export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speakEnglish(text: string, rate = 0.78): Promise<boolean> {
  return new Promise((resolve) => {
    if (!canSpeak()) {
      resolve(false)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    utterance.voice =
      voices.find((voice) => voice.lang === 'en-US' && /Samantha|Ava|Google US English/i.test(voice.name)) ??
      voices.find((voice) => voice.lang === 'en-US') ??
      voices.find((voice) => voice.lang.startsWith('en')) ??
      null
    utterance.lang = 'en-US'
    utterance.rate = rate
    utterance.pitch = 1.05
    utterance.volume = 1
    utterance.onend = () => resolve(true)
    utterance.onerror = () => resolve(false)
    window.speechSynthesis.speak(utterance)
  })
}
