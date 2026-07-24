"use client"

import type { ChangeEvent, DragEvent, ReactNode, RefObject } from "react"
import { useCallback, useRef, useState } from "react"

interface BaseDropzoneProps {
  label?: ReactNode
  hint?: ReactNode
  value?: File | null
  previewUrl?: string | null
  onFile: (file: File | null) => void
  invalidMessage?: string
  sizeHint?: string
  inputId?: string
  inputRef?: RefObject<HTMLInputElement | null>
  error?: string
  height?: number
  square?: boolean
}

interface ImageDropzoneProps extends BaseDropzoneProps {
  variant: "image"
  accept?: "image" | "image-or-pdf"
  maxSizeMB?: number
  square?: boolean
}

interface AudioDropzoneProps extends BaseDropzoneProps {
  variant: "audio"
  maxSizeMB?: number
}

interface BannerDropzoneProps extends BaseDropzoneProps {
  variant: "banner"
  maxSizeMB?: number
  height?: number
}

type FileDropzoneProps = ImageDropzoneProps | AudioDropzoneProps | BannerDropzoneProps

function formatBytes(bytes: number) {
  if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + " MB"
  if (bytes >= 1_000) return (bytes / 1_000).toFixed(1) + " KB"
  return bytes + " B"
}

function ImageIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function AudioIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color} stroke="none">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function FileDropzone(props: FileDropzoneProps) {
  const {
    label,
    hint,
    value,
    previewUrl,
    onFile,
    invalidMessage,
    sizeHint,
    inputId,
    inputRef: externalRef,
    error,
    variant,
  } = props

  const internalRef = useRef<HTMLInputElement>(null)
  const fileRef = externalRef ?? internalRef
  const [drag, setDrag] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const accept = (() => {
    switch (variant) {
      case "image":
        return props.accept === "image-or-pdf" ? "image/*,.pdf" : "image/*"
      case "audio":
        return "audio/*"
      case "banner":
        return "image/*"
    }
  })()

  const acceptSet = (() => {
    if (variant === "audio") return ["audio/"]
    if (variant === "image" && props.accept === "image-or-pdf") return ["image/", ".pdf"]
    return ["image/"]
  })()

  const maxSizeMB: number = props.maxSizeMB ?? 5

  const validate = useCallback(
    (file: File): string | null => {
      const okType = acceptSet.some((prefix) =>
        prefix.startsWith(".") ? file.name.toLowerCase().endsWith(prefix) : file.type.startsWith(prefix),
      )
      if (!okType) return invalidMessage ?? "Unsupported file type"
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `File must be under ${maxSizeMB}MB`
      }
      return null
    },
    [acceptSet, invalidMessage, maxSizeMB],
  )

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) {
        onFile(null)
        setValidationError(null)
        return
      }
      const err = validate(file)
      if (err) {
        setValidationError(err)
        return
      }
      setValidationError(null)
      onFile(file)
    },
    [onFile, validate],
  )

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDrag(false)
      const f = e.dataTransfer.files?.[0]
      if (f) handleFile(f)
    },
    [handleFile],
  )

  const onPick = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] ?? null
      handleFile(f)
    },
    [handleFile],
  )

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    handleFile(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const activeError = error ?? validationError
  const id = inputId
  const hasFile = !!value
  const showPreviewImage = variant !== "audio" && (previewUrl || (variant === "image" && hasFile))

  // Border / background state
  const border = drag
    ? "2px dashed var(--brand)"
    : hasFile
    ? "2px solid var(--brand)"
    : "2px dashed var(--border)"
  const background = drag
    ? "var(--brand-bg)"
    : hasFile
    ? variant === "banner"
      ? "var(--card-bg)"
      : "var(--brand-bg)"
    : variant === "audio"
    ? "var(--background)"
    : "var(--background)"

  function triggerFilePicker() {
    fileRef.current?.click()
  }

  // Shared drop handler container
  const containerStyle: React.CSSProperties = {
    border,
    borderRadius: 14,
    background,
    padding: hasFile || previewUrl || variant === "banner" ? 12 : 28,
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    position: "relative",
    overflow: "hidden",
  }

  let body: ReactNode = null

  if (variant === "audio") {
    body = (
      <div
        onClick={triggerFilePicker}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDrag(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDrag(false)
        }}
        onDrop={onDrop}
        style={containerStyle}
      >
        <input
          id={id}
          ref={fileRef}
          type="file"
          accept={accept}
          onChange={onPick}
          style={{ display: "none" }}
        />
        {hasFile && value ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AudioIcon color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--foreground)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {value.name}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
                {formatBytes(value.size)} · {value.type || "audio"}
              </p>
            </div>
            <button
              type="button"
              onClick={clear}
              style={{
                background: "none",
                border: "none",
                color: "var(--muted-foreground)",
                cursor: "pointer",
                padding: 6,
                borderRadius: 6,
              }}
              title="Remove"
            >
              <CloseIcon />
            </button>
          </div>
        ) : (
          <>
            {sizeHint ? (
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: drag ? "var(--brand)" : "var(--foreground)",
                }}
              >
                {drag ? "Drop to upload" : sizeHint}
              </p>
            ) : (
              <>
                <div style={{ marginBottom: 10, color: "var(--muted-foreground)" }}>
                  <AudioIcon color="currentColor" />
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: drag ? "var(--brand)" : "var(--foreground)",
                  }}
                >
                  {drag ? "Drop to upload" : "Drag & drop your audio"}
                </p>
              </>
            )}
            {hint && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
                {hint}
              </p>
            )}
          </>
        )}
      </div>
    )
  } else if (variant === "banner") {
    const height = props.height ?? 200
    const bgImage = previewUrl ? `url(${previewUrl}) center/cover` : "linear-gradient(135deg, var(--brand), var(--brand-light))"
    body = (
      <div
        onClick={triggerFilePicker}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDrag(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDrag(false)
        }}
        onDrop={onDrop}
        style={{
          width: "100%",
          height,
          borderRadius: 20,
          background: bgImage,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s ease",
          border: drag ? "3px solid var(--brand)" : "3px solid transparent",
          boxShadow: previewUrl ? "none" : "0 4px 24px var(--brand-shadow)",
        }}
      >
        <input
          id={id}
          ref={fileRef}
          type="file"
          accept={accept}
          onChange={onPick}
          style={{ display: "none" }}
        />
        {previewUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: drag ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.32)",
              transition: "background 0.2s",
            }}
          />
        )}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: "#fff", pointerEvents: "none" }}>
          <ImageIcon />
          <p style={{ margin: "8px 0 0", fontSize: 13, fontWeight: 600 }}>
            {drag
              ? "Drop to replace"
              : previewUrl
              ? "Click or drop to change"
              : (hint ?? "Drag & drop or click to browse")}
          </p>
        </div>
        {previewUrl && (
          <button
            type="button"
            onClick={clear}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 2,
              width: 36,
              height: 36,
              borderRadius: 999,
              border: "none",
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.8)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.5)")}
            title="Remove photo"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    )
  } else {
    // variant === "image"
    body = (
      <div
        onClick={triggerFilePicker}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDrag(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDrag(false)
        }}
        onDrop={onDrop}
        style={{
          ...containerStyle,
          padding: showPreviewImage ? 12 : 28,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexDirection: showPreviewImage ? "row" : "column",
        }}
      >
        <input
          id={id}
          ref={fileRef}
          type="file"
          accept={accept}
          onChange={onPick}
          style={{ display: "none" }}
        />
        {showPreviewImage ? (
          <>
            <img
              src={previewUrl ?? ""}
              alt=""
              style={{
                width: props.square === false ? 120 : 72,
                height: props.square === false ? "auto" : 72,
                aspectRatio: props.square === false ? "16 / 9" : undefined,
                maxHeight: props.square === false ? 96 : undefined,
                borderRadius: props.square === false ? 10 : 10,
                objectFit: "cover",
                boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
                {hasFile ? value?.name : "Image selected"}
              </p>
              <p style={{ margin: "2px 0 6px", fontSize: 12, color: "var(--muted-foreground)" }}>
                Click or drop to replace
              </p>
              <button
                type="button"
                onClick={clear}
                style={{
                  padding: "4px 12px",
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--muted-foreground)",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                color: "var(--muted-foreground)",
                ...(props.square === false ? { marginBottom: 4 } : { marginBottom: 8 }),
              }}
            >
              <ImageIcon />
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: drag ? "var(--brand)" : "var(--foreground)",
              }}
            >
              {drag ? "Drop to upload" : hint ?? "Drag & drop or click to browse"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted-foreground)" }}>
              {sizeHint ?? "Square recommended"}
            </p>
          </>
        )}
      </div>
    )
  }

  if (label) {
    return (
      <div style={{ marginBottom: 0 }}>
        <label
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 6,
            display: "block",
          }}
        >
          {label}
        </label>
        {body}
        {activeError && (
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 12,
              color: "#ef4444",
            }}
            role="alert"
          >
            {activeError}
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      {body}
      {activeError && (
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 12,
            color: "#ef4444",
          }}
          role="alert"
        >
          {activeError}
        </p>
      )}
    </>
  )
}
