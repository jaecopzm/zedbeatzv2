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
      <header className="admin-header">
        <div className="admin-header-text">
          <span className="admin-eyebrow"><span className="admin-eyebrow-dot" aria-hidden />Curation</span>
          <h1 className="admin-title">Sections</h1>
          <p className="admin-sub">Assign tracks to home page rails. Changes go live immediately.</p>
        </div>
      </header>

      <div className="admin-toolbar">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or artist…"
          className="admin-search"
          aria-label="Search tracks"
        />
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="admin-input"
          aria-label="Filter by section"
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
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>No tracks found</p>
          <p style={{ fontSize: 14, margin: 0 }}>
            {search.trim() || filterSection ? "Try adjusting your search or filter." : "Tracks will appear here once uploaded."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((track) => (
            <div key={track.id} className="admin-card admin-manage-row" style={{ padding: "10px 12px" }}>
              {track.cover_url ? (
                <img src={track.cover_url} alt="" loading="lazy" style={{ width: 42, height: 42, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 42, height: 42, borderRadius: 9, background: "var(--hover-bg)", flexShrink: 0 }} />
              )}
              <div className="admin-row-grow" style={{ flex: "1 1 160px", minWidth: 0 }}>
                <div style={{ fontSize: "13.5px", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.title}
                </div>
                <div style={{ fontSize: "12px", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.artist_name} · {track.section ? getSectionLabel(track.section) : "No section"}
                </div>
              </div>
              <SectionSelect
                value={track.section || ""}
                onChange={(key) => updateMutation.mutate({ id: track.id, section: key })}
              />
            </div>
          ))}
          <p style={{ textAlign: "center", color: "var(--muted-foreground)", fontSize: 12.5, margin: "10px 0 0", fontVariantNumeric: "tabular-nums" }}>
            Showing {filtered.length} track{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  )
}
