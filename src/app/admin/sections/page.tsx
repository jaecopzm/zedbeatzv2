"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import Link from "next/link"
import type { Track } from "@/types"

const SECTIONS = [
  { key: "", label: "None" },
  { key: "best_new_songs", label: "Best New Songs" },
  { key: "new_this_week", label: "New This Week" },
  { key: "zed_hip_hop", label: "Zambian Hip Hop" },
  { key: "zed_oldies", label: "Zed Oldies" },
  { key: "zed_afrobeats", label: "Zambian Afrobeats" },
  { key: "zed_gospel", label: "Zambian Gospel" },
  { key: "zed_rnb", label: "Zambian R&B" },
  { key: "zed_dancehall", label: "Zambian Dancehall" },
  { key: "zed_kalindula", label: "Kalindula" },
  { key: "zed_bangers", label: "Zed Bangers" },
  { key: "zed_collabos", label: "Big Collabos" },
  { key: "fresh_voices", label: "Fresh Voices" },
  { key: "throwback_thursday", label: "Throwback Thursday" },
]

export default function AdminSectionsPage() {
  const queryClient = useQueryClient()
  const [filterSection, setFilterSection] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tracks"],
    queryFn: () => api.adminListTracks(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, section }: { id: string; section: string }) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/admin/tracks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ section }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tracks"] })
    },
  })

  const tracks: Track[] = data?.tracks ?? []
  const filtered = filterSection
    ? tracks.filter((t) => t.section === filterSection)
    : tracks

  const getSectionLabel = (key: string) => SECTIONS.find((s) => s.key === key)?.label || key

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.4px", margin: 0 }}>Sections Manager</h1>
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: "2px 0 0" }}>Assign tracks to home page sections</p>
        </div>
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          style={{
            padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)",
            background: "var(--card-bg)", color: "var(--foreground)", fontSize: "13px", cursor: "pointer", outline: "none",
          }}
        >
          <option value="">All sections</option>
          {SECTIONS.filter((s) => s.key).map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "48px", borderRadius: "8px" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {filtered.map((track) => (
            <div
              key={track.id}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "8px 12px", borderRadius: "8px",
                border: "1px solid var(--border)", background: "var(--card-bg)",
              }}
            >
              {track.cover_url ? (
                <img src={track.cover_url} alt="" style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: "var(--border)", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.title}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                  {track.artist_name}
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted-foreground)", flexShrink: 0, minWidth: "100px", textAlign: "right" }}>
                {track.section ? getSectionLabel(track.section) : <span style={{ opacity: 0.4 }}>None</span>}
              </div>
              <select
                value={track.section || ""}
                onChange={(e) => updateMutation.mutate({ id: track.id, section: e.target.value })}
                style={{
                  padding: "5px 8px", borderRadius: "6px", border: "1px solid var(--border)",
                  background: "var(--background)", color: "var(--foreground)", fontSize: "12px", cursor: "pointer", outline: "none", flexShrink: 0,
                }}
              >
                {SECTIONS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--muted-foreground)", fontSize: "13px" }}>
              No tracks found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
