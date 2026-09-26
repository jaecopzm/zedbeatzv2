import { create } from "zustand"
import { api } from "./api"

export interface UserInfo {
  user_id: string
  email: string
  role: string
  artist_id?: string
}

interface AuthState {
  token: string | null
  user: UserInfo | null
  logout: () => void
  setToken: (token: string) => void
}

function decodeToken(token: string): UserInfo | null {
  try {
    const payloadStr = atob(token.split(".")[1])
    const payload = JSON.parse(payloadStr)
    return {
      user_id: payload.user_id,
      email: payload.email,
      role: payload.role,
      artist_id: payload.artist_id,
    }
  } catch {
    return null
  }
}

function loadFromStorage() {
  if (typeof window === "undefined") return { token: null as string | null, user: null as UserInfo | null }
  const token = localStorage.getItem("access_token")
  if (!token) return { token: null as string | null, user: null as UserInfo | null }
  const user = decodeToken(token)
  return user ? { token, user } : { token: null, user: null }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...loadFromStorage(),

  logout: async () => {
    try { await api.logout() } catch { /* ignore */ }
    set({ token: null, user: null })
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
  },

  setToken: (token: string) => {
    localStorage.setItem("access_token", token)
    const user = decodeToken(token)
    if (user) set({ token, user })
  },
}))

/** Helper to login or register with email/password and update store state. */
export async function emailLogin(email: string, password: string) {
  const res = await api.login(email, password)
  useAuthStore.getState().setToken(res.access_token)
  return res
}

export async function emailRegister(email: string, password: string) {
  const res = await api.register(email, password)
  useAuthStore.getState().setToken(res.access_token)
  return res
}
