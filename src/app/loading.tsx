export default function Loading() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "70vh", gap: 16, background: "var(--background)", color: "var(--muted-foreground)",
    }}>
      <div style={{ position: "relative", width: 40, height: 40 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "3px solid var(--border)",
          borderTopColor: "var(--brand)",
          animation: "spin 0.7s linear infinite",
        }} />
      </div>
      <p style={{ fontSize: 14, fontWeight: 500 }}>Loading...</p>
    </div>
  )
}
