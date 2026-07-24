"use client"

import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
  CSSProperties,
} from "react"
import { useId } from "react"

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--muted-foreground)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 6,
  display: "block",
}

const hintStyle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: 11,
  color: "var(--muted-foreground)",
  lineHeight: 1.4,
}

const inputBase: React.CSSProperties = {
  width: "100%",
  fontFamily: "inherit",
  fontSize: 14,
  color: "var(--foreground)",
  background: "var(--card-bg)",
  border: "1.5px solid var(--border)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.18s ease, box-shadow 0.18s ease",
}

function fieldFocus(): CSSProperties {
  return { borderColor: "var(--brand)", boxShadow: "0 0 0 3px var(--brand-bg)" }
}

function fieldError(): CSSProperties {
  return { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239,68,68,0.15)" }
}

interface FieldFrameProps {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  counter?: ReactNode
  rightSlot?: ReactNode
  htmlFor?: string
  children: ReactNode
}

export function FieldFrame({
  label,
  hint,
  error,
  counter,
  rightSlot,
  htmlFor,
  children,
}: FieldFrameProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      {(label || counter) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 6,
            minHeight: 18,
          }}
        >
          {label ? (
            <label htmlFor={htmlFor} style={labelStyle}>
              {label}
            </label>
          ) : (
            <span />
          )}
          {counter && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "var(--muted-foreground)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {counter}
            </span>
          )}
        </div>
      )}
      {rightSlot ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
          {rightSlot}
        </div>
      ) : (
        children
      )}
      {hint && !error && <p style={hintStyle}>{hint}</p>}
      {error && (
        <p style={{ ...hintStyle, color: "#ef4444" }} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

interface LabeledInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  showCounter?: boolean
  maxLength?: number
}

export function LabeledInput({
  label,
  hint,
  error,
  showCounter,
  maxLength,
  id: idProp,
  onFocus,
  onBlur,
  value,
  style,
  ...rest
}: LabeledInputProps) {
  const generated = useId()
  const id = idProp ?? generated
  const valueLength = typeof value === "string" ? value.length : 0
  const showCount = showCounter && typeof maxLength === "number"

  return (
    <FieldFrame
      label={label}
      hint={hint}
      error={error}
      counter={showCount ? `${valueLength}/${maxLength}` : undefined}
      htmlFor={id}
    >
      <input
        id={id}
        value={value}
        onFocus={(e) => {
          if (!error) Object.assign(e.currentTarget.style, fieldFocus())
          onFocus?.(e)
        }}
        onBlur={(e) => {
          Object.assign(e.currentTarget.style, { borderColor: "", boxShadow: "" })
          if (error) Object.assign(e.currentTarget.style, fieldError())
          onBlur?.(e)
        }}
        maxLength={maxLength}
        style={{
          ...(error ? fieldError() : {}),
          ...inputBase,
          padding: "13px 16px",
          borderRadius: 12,
          ...style,
        }}
        {...rest}
      />
    </FieldFrame>
  )
}

interface LabeledTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  showCounter?: boolean
  maxLength?: number
}

export function LabeledTextarea({
  label,
  hint,
  error,
  showCounter,
  maxLength,
  id: idProp,
  onFocus,
  onBlur,
  value,
  rows = 4,
  style,
  ...rest
}: LabeledTextareaProps) {
  const generated = useId()
  const id = idProp ?? generated
  const valueLength = typeof value === "string" ? value.length : 0
  const showCount = showCounter && typeof maxLength === "number"

  return (
    <FieldFrame
      label={label}
      hint={hint}
      error={error}
      counter={showCount ? `${valueLength}/${maxLength}` : undefined}
      htmlFor={id}
    >
      <textarea
        id={id}
        value={value}
        rows={rows}
        onFocus={(e) => {
          if (!error) Object.assign(e.currentTarget.style, fieldFocus())
          onFocus?.(e)
        }}
        onBlur={(e) => {
          Object.assign(e.currentTarget.style, { borderColor: "", boxShadow: "" })
          if (error) Object.assign(e.currentTarget.style, fieldError())
          onBlur?.(e)
        }}
        maxLength={maxLength}
        style={{
          ...(error ? fieldError() : {}),
          ...inputBase,
          padding: "13px 16px",
          borderRadius: 12,
          lineHeight: 1.6,
          resize: "vertical",
          ...style,
        }}
        {...rest}
      />
    </FieldFrame>
  )
}

interface LabeledSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

export function LabeledSelect({
  label,
  hint,
  error,
  id: idProp,
  onFocus,
  onBlur,
  children,
  style,
  ...rest
}: LabeledSelectProps) {
  const generated = useId()
  const id = idProp ?? generated
  return (
    <FieldFrame label={label} hint={hint} error={error} htmlFor={id}>
      <select
        id={id}
        onFocus={(e) => {
          if (!error) Object.assign(e.currentTarget.style, fieldFocus())
          onFocus?.(e)
        }}
        onBlur={(e) => {
          Object.assign(e.currentTarget.style, { borderColor: "", boxShadow: "" })
          if (error) Object.assign(e.currentTarget.style, fieldError())
          onBlur?.(e)
        }}
        style={{
          ...(error ? fieldError() : {}),
          ...inputBase,
          padding: "13px 16px",
          borderRadius: 12,
          appearance: "auto",
          ...style,
        }}
        {...rest}
      >
        {children}
      </select>
    </FieldFrame>
  )
}
