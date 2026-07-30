const IS_CLIENT = typeof window !== "undefined"

export function formatDuration(sec: number | null | undefined): string {
  if (sec === null || sec === undefined || sec <= 0 || !isFinite(sec)) return "--:--"
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function formatCount(n: number | null | undefined): string {
  if (n === null || n === undefined) return "0"
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toString()
}

export function detectAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    if (!IS_CLIENT) { resolve(0); return }
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    let resolved = false
    const done = (val: number) => {
      if (resolved) return
      resolved = true
      const clean = isFinite(val) && val > 0 ? Math.round(val) : 0
      resolve(clean)
      URL.revokeObjectURL(url)
    }
    audio.addEventListener("loadedmetadata", () => done(audio.duration))
    audio.addEventListener("durationchange", () => done(audio.duration))
    audio.addEventListener("error", () => done(0))
    audio.src = url
    audio.load()
    setTimeout(() => done(0), 15000)
  })
}
