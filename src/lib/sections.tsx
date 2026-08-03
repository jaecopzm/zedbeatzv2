export interface SectionOption {
  key: string
  label: string
}

export const SECTIONS: SectionOption[] = [
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

export function getSectionLabel(key: string | null | undefined): string {
  if (!key) return "None"
  return SECTIONS.find((s) => s.key === key)?.label || key
}

export function SectionSelect({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (key: string) => void
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="admin-input"
      style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}
    >
      {SECTIONS.map((s) => (
        <option key={s.key} value={s.key}>
          {s.label}
        </option>
      ))}
    </select>
  )
}
