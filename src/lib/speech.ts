let activeAudio: HTMLAudioElement | null = null

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && ('speechSynthesis' in window || typeof Audio !== 'undefined')
}

function synthesizeEnglish(text: string, rate: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
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

export function speakEnglish(text: string, rate = 0.78, audioKey?: string): Promise<boolean> {
  if (!audioKey || typeof Audio === 'undefined') return synthesizeEnglish(text, rate)

  activeAudio?.pause()
  window.speechSynthesis?.cancel()
  const audio = new Audio(`/audio/${audioKey}.mp3`)
  audio.preload = 'auto'
  activeAudio = audio

  return new Promise((resolve) => {
    audio.onended = () => resolve(true)
    audio.onerror = () => {
      if (activeAudio === audio) activeAudio = null
      void synthesizeEnglish(text, rate).then(resolve)
    }
    const playback = audio.play()
    if (playback) {
      playback.catch(() => {
        if (activeAudio === audio) activeAudio = null
        void synthesizeEnglish(text, rate).then(resolve)
      })
    }
  })
}
