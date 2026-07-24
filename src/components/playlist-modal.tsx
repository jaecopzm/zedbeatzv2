"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useUIStore } from "@/lib/ui-store"
import { api } from "@/lib/api"
import { useAuthStore } from "@/lib/auth-store"

export function PlaylistModal() {
  const { playlistModalOpen, playlistModalTrackId, closePlaylistModal } = useUIStore()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [newTitle, setNewTitle] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Fetch playlists
  const { data: playlistsData, isLoading } = useQuery({
    queryKey: ["my-playlists"],
    queryFn: () => api.getMyPlaylists(),
    enabled: playlistModalOpen && !!user,
  })

  const playlists = playlistsData?.playlists || []

  // Add to existing playlist
  const addMutation = useMutation({
    mutationFn: (playlistId: string) => api.addTrackToPlaylist(playlistId, playlistModalTrackId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-playlists"] })
      closePlaylistModal()
    },
  })

  // Create new playlist & add track
  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const p = await api.createPlaylist({ title })
      await api.addTrackToPlaylist(p.id, playlistModalTrackId!)
      return p
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-playlists"] })
      setNewTitle("")
      setIsCreating(false)
      closePlaylistModal()
    },
  })

  if (!playlistModalOpen || !user) return null

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, padding: "20px"
      }}
      onClick={closePlaylistModal}
    >
      <div
        style={{
          background: "var(--card-bg)", width: "100%", maxWidth: "360px",
          borderRadius: "20px", boxShadow: "0 12px 48px rgba(0,0,0,0.2)",
          overflow: "hidden", display: "flex", flexDirection: "column"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--foreground)" }}>Add to Playlist</h2>
        </div>

        <div style={{ padding: "12px", maxHeight: "300px", overflowY: "auto" }}>
          {isLoading ? (
            <p style={{ padding: "12px", color: "var(--muted-foreground)", textAlign: "center", margin: 0 }}>Loading playlists...</p>
          ) : playlists.length === 0 && !isCreating ? (
            <p style={{ padding: "12px", color: "var(--muted-foreground)", textAlign: "center", margin: 0, fontSize: "14px" }}>You have no playlists yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {playlists.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => addMutation.mutate(p.id)}
                  disabled={addMutation.isPending}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px", width: "100%",
                    padding: "10px", borderRadius: "8px", background: "transparent",
                    border: "none", cursor: "pointer", transition: "background 0.15s",
                    textAlign: "left"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "6px",
                    background: p.cover_url ? `url(${p.cover_url}) center/cover` : "linear-gradient(135deg, var(--brand), var(--brand-light))",
                    flexShrink: 0
                  }} />
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>{p.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "16px", borderTop: "1px solid var(--border)", background: "var(--content-bg)" }}>
          {isCreating ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                autoFocus
                type="text"
                placeholder="Playlist name"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTitle.trim()) {
                    createMutation.mutate(newTitle.trim())
                  } else if (e.key === "Escape") {
                    setIsCreating(false)
                  }
                }}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)",
                  background: "var(--card-bg)", color: "var(--foreground)", fontSize: "14px",
                  outline: "none"
                }}
              />
              <button
                onClick={() => newTitle.trim() && createMutation.mutate(newTitle.trim())}
                disabled={!newTitle.trim() || createMutation.isPending}
                style={{
                  padding: "0 16px", borderRadius: "8px", background: "var(--brand)",
                  color: "white", fontSize: "14px", fontWeight: 600, border: "none",
                  cursor: "pointer", opacity: !newTitle.trim() ? 0.5 : 1
                }}
              >
                Create
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              style={{
                width: "100%", padding: "10px", borderRadius: "10px", background: "transparent",
                color: "var(--brand)", fontSize: "14px", fontWeight: 600, border: "2px dashed var(--border)",
                cursor: "pointer", transition: "border-color 0.15s, color 0.15s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--brand)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
            >
              + New Playlist
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
