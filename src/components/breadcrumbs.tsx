import Link from "next/link"

interface Crumb {
  label: string
  href?: string
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" style={navStyle}>
      <ol style={olStyle}>
        <li style={liStyle}>
          <Link href="/" style={linkStyle}>Home</Link>
          <span style={sepStyle}>/</span>
        </li>
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} style={liStyle}>
              {item.href && !isLast ? (
                <Link href={item.href} style={linkStyle}>{item.label}</Link>
              ) : (
                <span style={currentStyle} aria-current={isLast ? "page" : undefined}>{item.label}</span>
              )}
              {!isLast && <span style={sepStyle}>/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

const navStyle: React.CSSProperties = {
  padding: "12px 32px 0",
  fontSize: 12,
  color: "var(--muted-foreground)",
}
const olStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  listStyle: "none",
  margin: 0,
  padding: 0,
  flexWrap: "wrap",
}
const liStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
}
const linkStyle: React.CSSProperties = {
  color: "var(--muted-foreground)",
  textDecoration: "none",
}
const sepStyle: React.CSSProperties = {
  color: "var(--border)",
  fontSize: 10,
  userSelect: "none",
}
const currentStyle: React.CSSProperties = {
  color: "var(--foreground)",
  fontWeight: 600,
}
