import { create } from "zustand"

interface Toast {
  id: number
  message: string
  type: "success" | "error" | "info"
}

interface ToastState {
  toasts: Toast[]
  _nextId: number
  add: (message: string, type?: Toast["type"]) => void
  remove: (id: number) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  _nextId: 1,
  add: (message, type = "info") => {
    const id = get()._nextId
    set((s) => ({ toasts: [...s.toasts, { id, message, type }], _nextId: s._nextId + 1 }))
    setTimeout(() => get().remove(id), 3500)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function toast(message: string, type?: Toast["type"]) {
  useToastStore.getState().add(message, type)
}
