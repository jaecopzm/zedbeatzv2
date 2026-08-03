"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "@/lib/toast-store"
import type { Track } from "@/types"
import { SECTIONS, SectionSelect, getSectionLabel } from "@/lib/sections"

export default function AdminSectionsPage() {
  const queryClient = useQueryClient()
  const [filterSection, setFilterSection] = useState("")
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tracks"],
    queryFn: () => api.adminListTracks(1000, 0),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, section }: { id: string; section: string }) =>
      api.adminUpdateTrackSection(id, section),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tracks"] })
      toast("Section updated", "success")
    },
    onError: (e: any) => toast(e?.message || "Failed to update section", "error"),
  })

  const tracks: Track[] = data?.tracks ?? []

  const filtered = (() => {
    let list = filterSection ? tracks.filter((t) => t.section === filterSection) : tracks
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist_name.toLowerCase().includes(q)
      )
    }
    return list
  })()

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--foreground)", letterSpacing: "-0.4px", margin: 0 }}>Sections Manager</h1>
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: "2px 0 0" }}>Assign tracks to home page sections</p>
        </div>
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="admin-input"
          style={{ padding: "8px 12px", maxWidth: 200, cursor: "pointer" }}
        >
          <option value="">All sections</option>
          {SECTIONS.filter((s) => s.key).map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tracks by title or artist..."
          className="admin-search"
          style={{ maxWidth: 400 }}
        />
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "48px", borderRadius: "8px" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>No tracks found</p>
          <p style={{ fontSize: 14, margin: 0 }}>
            {search.trim() || filterSection ? "Try adjusting your search or filter." : "Tracks will appear here once uploaded."}
          </p>
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
                flexWrap: "wrap",
              }}
            >
              {track.cover_url ? (
                <img src={track.cover_url} alt="" style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: "40px", height: "40px", borderRadius: "6px", background: "var(--border)", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.title}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                  {track.artist_name}
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted-foreground)", flexShrink: 0, minWidth: "110px", textAlign: "right" }}>
                {track.section ? getSectionLabel(track.section) : <span style={{ opacity: 0.4 }}>None</span>}
              </div>
              <SectionSelect
                value={track.section || ""}
                onChange={(key) => updateMutation.mutate({ id: track.id, section: key })}
              />
            </div>
          ))}
          <p style={{ textAlign: "center", color: "var(--muted-foreground)", fontSize: 12, margin: "12px 0 0" }}>
            Showing {filtered.length} track{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  )
}
