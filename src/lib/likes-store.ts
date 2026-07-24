import { create } from "zustand"
import { api } from "./api"

interface LikesState {
  likedIds: Set<string>
  loaded: boolean
  sync: () => Promise<void>
  isLiked: (id: string) => boolean
  toggleLike: (id: string) => Promise<boolean>
  setLiked: (id: string, liked: boolean) => void
}

export const useLikesStore = create<LikesState>((set, get) => ({
  likedIds: new Set(),
  loaded: false,

  sync: async () => {
    try {
      const data = await api.getMyLikes()
      const tracks: { id: string }[] = data?.liked_tracks ?? []
      set({ likedIds: new Set(tracks.map((t) => t.id)), loaded: true })
    } catch {
      set({ loaded: true })
    }
  },

  isLiked: (id: string) => get().likedIds.has(id),

  toggleLike: async (id: string) => {
    const { likedIds } = get()
    const currentlyLiked = likedIds.has(id)
    try {
      if (currentlyLiked) {
        await api.unlikeTrack(id)
        const next = new Set(likedIds)
        next.delete(id)
        set({ likedIds: next })
      } else {
        await api.likeTrack(id)
        const next = new Set(likedIds)
        next.add(id)
        set({ likedIds: next })
      }
      return !currentlyLiked
    } catch {
      return currentlyLiked
    }
  },

  setLiked: (id: string, liked: boolean) =>
    set((s) => {
      const next = new Set(s.likedIds)
      if (liked) next.add(id)
      else next.delete(id)
      return { likedIds: next }
    }),
}))
