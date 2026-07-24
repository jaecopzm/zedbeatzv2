import { create } from "zustand"

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Playlist Modal
  playlistModalOpen: boolean
  playlistModalTrackId: string | null
  openPlaylistModal: (trackId: string) => void
  closePlaylistModal: () => void

  // Now Playing Screen
  nowPlayingOpen: boolean
  openNowPlaying: () => void
  closeNowPlaying: () => void

  // Queue Panel
  queuePanelOpen: boolean
  toggleQueuePanel: () => void
  closeQueuePanel: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  playlistModalOpen: false,
  playlistModalTrackId: null,
  openPlaylistModal: (trackId) => set({ playlistModalOpen: true, playlistModalTrackId: trackId }),
  closePlaylistModal: () => set({ playlistModalOpen: false, playlistModalTrackId: null }),

  nowPlayingOpen: false,
  openNowPlaying: () => set({ nowPlayingOpen: true }),
  closeNowPlaying: () => set({ nowPlayingOpen: false }),

  queuePanelOpen: false,
  toggleQueuePanel: () => set((s) => ({ queuePanelOpen: !s.queuePanelOpen })),
  closeQueuePanel: () => set({ queuePanelOpen: false }),
}))
