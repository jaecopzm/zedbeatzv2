import { create } from "zustand"
import { Howl } from "howler"
import { api } from "./api"

export interface TrackInfo {
  id: string
  artist_id?: string
  title: string
  artist_name: string
  cover_url: string | null
  duration_sec: number
  collaborators?: { artist_id: string; stage_name: string; role: string }[]
}

// ─── play–recording helpers (module scope — not reactive) ───────────────────
let _playStartedAt: number | null = null
let _playStartedTrackId: string | null = null

function recordPreviousPlay() {
  if (_playStartedAt && _playStartedTrackId) {
    const listened = Math.round((Date.now() - _playStartedAt) / 1000)
    if (listened > 1) {
      api.recordPlay(_playStartedTrackId, listened).catch(() => {})
    }
  }
  _playStartedAt = null
  _playStartedTrackId = null
}

function startPlayRecording(trackId: string) {
  _playStartedAt = Date.now()
  _playStartedTrackId = trackId
}

// ─── internal helpers ───────────────────────────────────────────────────────
function startProgressInterval(
  get: () => PlayerState,
  set: (partial: Partial<PlayerState>) => void
) {
  const existing = get()._progressInterval
  if (existing) clearInterval(existing)

  const interval = setInterval(() => {
    const h = get().howl
    if (h && h.playing()) {
      const pos = h.seek() as number
      if (typeof pos === "number" && !isNaN(pos)) {
        set({ progress: pos })
        try {
          navigator.mediaSession.setPositionState({
            duration: get().currentTrack?.duration_sec || 0,
            playbackRate: 1,
            position: pos,
          })
        } catch {}
      }
    }
  }, 250) // smoother progress updates

  set({ _progressInterval: interval })
}

function stopProgressInterval(get: () => PlayerState) {
  const existing = get()._progressInterval
  if (existing) {
    clearInterval(existing)
    get()._progressInterval = null
  }
}

function pickRandomIndex(current: number, length: number): number {
  if (length <= 1) return current
  let idx: number
  do {
    idx = Math.floor(Math.random() * length)
  } while (idx === current)
  return idx
}

function toAbsoluteURL(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return new URL(url, window.location.origin).href
}

function artworkMimeType(url: string): string {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() ?? ""
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  if (ext === "svg") return "image/svg+xml"
  return "image/jpeg"
}

function formatArtist(track: TrackInfo): string {
  if (!track.collaborators?.length) return track.artist_name
  const featured = track.collaborators
    .filter((c) => c.role === "featured" || c.role === "feature")
    .map((c) => c.stage_name)
  if (!featured.length) return track.artist_name
  return `${track.artist_name} ft. ${featured.join(", ")}`
}

function updateMediaSession(track: TrackInfo) {
  if (!("mediaSession" in navigator)) return

  const artworkSrc = track.cover_url ? toAbsoluteURL(track.cover_url) : null
  const artworkType = track.cover_url ? artworkMimeType(track.cover_url) : "image/jpeg"

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: formatArtist(track),
    album: " ",
    artwork: artworkSrc
      ? [
          { src: artworkSrc, sizes: "96x96", type: artworkType },
          { src: artworkSrc, sizes: "128x128", type: artworkType },
          { src: artworkSrc, sizes: "256x256", type: artworkType },
          { src: artworkSrc, sizes: "512x512", type: artworkType },
        ]
      : [],
  })

  const dur = Math.max(track.duration_sec || 0, 1)
  navigator.mediaSession.setPositionState({
    duration: dur,
    playbackRate: 1,
    position: 0,
  })
  navigator.mediaSession.playbackState = "playing"

  try { navigator.mediaSession.setActionHandler("play", () => usePlayerStore.getState().togglePlay()) } catch {}
  try { navigator.mediaSession.setActionHandler("pause", () => usePlayerStore.getState().togglePlay()) } catch {}
  try { navigator.mediaSession.setActionHandler("nexttrack", () => usePlayerStore.getState().next()) } catch {}
  try { navigator.mediaSession.setActionHandler("previoustrack", () => usePlayerStore.getState().prev()) } catch {}
  try {
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime != null) usePlayerStore.getState().seek(details.seekTime)
    })
  } catch {}
  try {
    navigator.mediaSession.setActionHandler("seekbackward", (details) => {
      const delta = details.seekOffset ?? 10
      const pos = usePlayerStore.getState().progress
      usePlayerStore.getState().seek(Math.max(0, pos - delta))
    })
  } catch {}
  try {
    navigator.mediaSession.setActionHandler("seekforward", (details) => {
      const delta = details.seekOffset ?? 10
      const pos = usePlayerStore.getState().progress
      const dur = usePlayerStore.getState().currentTrack?.duration_sec ?? 0
      usePlayerStore.getState().seek(Math.min(dur, pos + delta))
    })
  } catch {}
}

// ─── state ──────────────────────────────────────────────────────────────────
interface PlayerState {
  currentTrack: TrackInfo | null
  queue: TrackInfo[]
  queueIndex: number
  isPlaying: boolean
  volume: number
  progress: number
  shuffle: boolean
  repeatMode: "off" | "all" | "one"
  howl: Howl | null
  _progressInterval: ReturnType<typeof setInterval> | null
  _loading: string | null

  play: (track: TrackInfo, queueOpts?: { tracks: TrackInfo[]; index: number }) => Promise<void>
  playQueue: (tracks: TrackInfo[], startIndex?: number) => Promise<void>
  togglePlay: () => void
  seek: (time: number) => void
  next: () => void
  prev: () => void
  setVolume: (v: number) => void
  stop: () => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  addToQueue: (track: TrackInfo) => void
  playNext: (track: TrackInfo) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
}

function loadInitialVolume(): number {
  if (typeof window === "undefined") return 0.7
  const saved = localStorage.getItem("zedbeatz_volume")
  if (saved !== null) {
    const v = parseFloat(saved)
    if (!isNaN(v) && v >= 0 && v <= 1) return v
  }
  return 0.7
}

// ... (existing code)

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  volume: loadInitialVolume(),
  progress: 0,
  shuffle: false,
  repeatMode: "off",
  howl: null,
  _progressInterval: null,
  _loading: null,

  play: async (track, queueOpts) => {
    if (get()._loading) return
    set({ _loading: track.id })

    recordPreviousPlay()
    stopProgressInterval(get)
    get().howl?.unload()

    try {
      startPlayRecording(track.id)
      const { url } = await api.getStreamURL(track.id)
      const howl = new Howl({
        src: [url],
        html5: true,
        volume: get().volume,
        onplay: () => {
          set({ isPlaying: true })
          if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing"
          startProgressInterval(get, set)
        },
        onpause: () => {
          set({ isPlaying: false })
          if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused"
          stopProgressInterval(get)
        },
        onend: () => {
          recordPreviousPlay()
          stopProgressInterval(get)
          const { queue, queueIndex, repeatMode, shuffle, _loading } = get()
          if (_loading) return
          if (repeatMode === "one") {
            get().play(queue[queueIndex], { tracks: queue, index: queueIndex })
          } else if (shuffle) {
            const nextIdx = pickRandomIndex(queueIndex, queue.length)
            get().play(queue[nextIdx], { tracks: queue, index: nextIdx })
          } else if (queueIndex < queue.length - 1) {
            const nextIdx = queueIndex + 1
            get().play(queue[nextIdx], { tracks: queue, index: nextIdx })
          } else if (repeatMode === "all") {
            get().play(queue[0], { tracks: queue, index: 0 })
          } else {
            set({ isPlaying: false, progress: 0 })
          }
        },
        onloaderror: () => console.error("Audio load error"),
      })

      updateMediaSession(track)
      howl.play()

      set({
        currentTrack: track,
        howl,
        isPlaying: true,
        progress: 0,
        queue: queueOpts ? queueOpts.tracks : [track],
        queueIndex: queueOpts ? queueOpts.index : 0,
        _loading: null,
      })
    } catch (err) {
      console.error("Failed to play track:", err)
      set({ _loading: null, isPlaying: false })
    }
  },

  playQueue: async (tracks, startIndex = 0) => {
    if (tracks[startIndex]) {
      await get().play(tracks[startIndex], { tracks, index: startIndex })
    }
  },

  togglePlay: () => {
    const { howl, isPlaying, _loading } = get()
    if (!howl || _loading) return
    if (isPlaying) {
      howl.pause()
    } else {
      howl.play()
    }
  },

  seek: (time) => {
    get().howl?.seek(time)
    set({ progress: time })
  },

  next: () => {
    const { queue, queueIndex, shuffle } = get()
    if (queue.length === 0) return

    let nextIdx: number
    if (shuffle) {
      nextIdx = pickRandomIndex(queueIndex, queue.length)
    } else if (queueIndex < queue.length - 1) {
      nextIdx = queueIndex + 1
    } else {
      nextIdx = 0
    }
    get().play(queue[nextIdx], { tracks: queue, index: nextIdx })
  },

  prev: () => {
    const { queue, queueIndex, progress } = get()
    if (queue.length === 0) return

    if (progress > 3 && queue.length <= 1) {
      get().seek(0)
      return
    }
    if (progress > 3) {
      get().seek(0)
      return
    }

    if (queueIndex > 0) {
      const prevIdx = queueIndex - 1
      get().play(queue[prevIdx], { tracks: queue, index: prevIdx })
    } else {
      get().play(queue[queue.length - 1], { tracks: queue, index: queue.length - 1 })
    }
  },

  setVolume: (v) => {
    get().howl?.volume(v)
    set({ volume: v })
    if (typeof window !== "undefined") localStorage.setItem("zedbeatz_volume", String(v))
  },

  stop: () => {
    recordPreviousPlay()
    stopProgressInterval(get)
    get().howl?.unload()
    set({
      howl: null,
      isPlaying: false,
      currentTrack: null,
      progress: 0,
      queue: [],
      queueIndex: 0,
    })
  },

  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

  toggleRepeat: () =>
    set((s) => ({
      repeatMode:
        s.repeatMode === "off"
          ? ("all" as const)
          : s.repeatMode === "all"
            ? ("one" as const)
            : ("off" as const),
    })),

  addToQueue: (track) => set((s) => ({ queue: [...s.queue, track] })),

  playNext: (track) =>
    set((s) => {
      const q = [...s.queue]
      const insertAt = s.queueIndex + 1
      q.splice(insertAt, 0, track)
      return { queue: q }
    }),

  removeFromQueue: (index) =>
    set((s) => {
      if (s.queue.length <= 1) return s
      const q = [...s.queue]
      q.splice(index, 1)
      const newIndex =
        index < s.queueIndex
          ? s.queueIndex - 1
          : index === s.queueIndex && index >= q.length
            ? q.length - 1
            : s.queueIndex
      return { queue: q, queueIndex: newIndex }
    }),

  clearQueue: () =>
    set((s) => ({
      queue: s.currentTrack ? [s.currentTrack] : [],
      queueIndex: 0,
    })),
}))
