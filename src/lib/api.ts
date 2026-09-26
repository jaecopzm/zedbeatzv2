const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1"

// Full backend origin for auth redirects (Google OAuth etc.)
// In dev, relative paths work via Next.js rewrites. In production, hit the API directly.
export const AUTH_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, "")
  : ""

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "ApiError"
  }
}

/** Decode JWT payload to get expiry timestamp (seconds since epoch). */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.exp ?? null
  } catch {
    return null
  }
}

/** Check if the access token is expired or expiring within the given margin (seconds). */
function isTokenExpiringSoon(marginSec = 60): boolean {
  const token = localStorage.getItem("access_token")
  if (!token) return true
  const exp = getTokenExpiry(token)
  if (!exp) return true
  return (exp * 1000) - Date.now() < marginSec * 1000
}

/** Proactively refresh the token if it's expiring soon. Returns true if valid. */
export async function ensureValidToken(): Promise<boolean> {
  if (!isTokenExpiringSoon()) return true
  return refreshAccessToken()
}

/** Start a background interval that proactively refreshes the token before expiry. */
export function startTokenRefresh(refreshMarginSec = 120): () => void {
  const intervalMs = 60_000 // check every 60 seconds
  const id = setInterval(() => {
    if (isTokenExpiringSoon(refreshMarginSec)) {
      refreshAccessToken()
    }
  }, intervalMs)
  return () => clearInterval(id)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  // Proactively refresh if expiring within 30 seconds
  if (token && isTokenExpiringSoon(30)) {
    await refreshAccessToken()
  }

  const finalToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(finalToken ? { Authorization: `Bearer ${finalToken}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    if (res.status === 401 && finalToken) {
      const refreshed = await refreshAccessToken()
      if (refreshed) return request(path, options)
    }
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new ApiError(res.status, body.error || "Request failed")
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refresh = localStorage.getItem("refresh_token")
    if (!refresh) return false

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      })
      if (!res.ok) {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        return false
      }
      const tokens = await res.json()
      localStorage.setItem("access_token", tokens.access_token)
      localStorage.setItem("refresh_token", tokens.refresh_token)
      return true
    } catch {
      return false
    }
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

export const api = {
  // Tracks
  listTracks: (limit = 20, offset = 0, section?: string) =>
    request<any>(`/tracks?limit=${limit}&offset=${offset}${section ? `&section=${encodeURIComponent(section)}` : ""}`),

  searchTracks: (q: string) =>
    request<any>(`/tracks/search?q=${encodeURIComponent(q)}`),

  searchAlbums: (q: string) =>
    request<any>(`/albums/search?q=${encodeURIComponent(q)}`),

  getTrack: (trackId: string) =>
    request<any>(`/tracks/${trackId}`),

  getStreamURL: (trackId: string) =>
    request<import("@/types").StreamURL>(`/tracks/${trackId}/stream`),

  recordPlay: (trackId: string, durationListened: number) =>
    request<void>(`/tracks/${trackId}/play`, {
      method: "POST",
      body: JSON.stringify({ duration_listened: durationListened }),
    }),

  // Auth
  devLogin: () => request<import("@/types").AuthTokens>("/auth/dev-login", { method: "POST" }),
  register: (email: string, password: string) =>
    request<import("@/types").AuthTokens>("/auth/register", {
      method: "POST", body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<import("@/types").AuthTokens>("/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),

  likeTrack: (trackId: string) =>
    request<void>(`/tracks/${trackId}/like`, { method: "POST" }),

  unlikeTrack: (trackId: string) =>
    request<void>(`/tracks/${trackId}/like`, { method: "DELETE" }),

  // Albums
  getAlbum: (albumId: string) =>
    request<import("@/types").Album>(`/albums/${albumId}`),

  listAlbums: (limit = 20, offset = 0) =>
    request<{ albums: import("@/types").Album[] }>(`/albums?limit=${limit}&offset=${offset}`),

  // Artists
  listFeaturedArtists: () =>
    request<{ artists: import("@/types").Artist[] }>("/artists/featured"),

  getArtist: (artistId: string) =>
    request<import("@/types").Artist>(`/artists/${artistId}`),

  getArtistTracks: (artistId: string) =>
    request<{ tracks: import("@/types").Track[] }>(`/artists/${artistId}/tracks`),

  getCollaboratorTracks: (artistId: string, limit = 10) =>
    request<{ tracks: import("@/types").Track[] }>(`/artists/${artistId}/collaborations?limit=${limit}`),

  getArtistAlbums: (artistId: string) =>
    request<{ albums: import("@/types").Album[] }>(`/artists/${artistId}/albums`),

  searchArtists: (q: string) =>
    request<any>(`/artists/search?q=${encodeURIComponent(q)}`),

  followArtist: (artistId: string) =>
    request<void>(`/artists/${artistId}/follow`, { method: "POST" }),

  unfollowArtist: (artistId: string) =>
    request<void>(`/artists/${artistId}/follow`, { method: "DELETE" }),

  // Genres
  listGenres: () => request<{ genres: import("@/types").Genre[] }>("/genres"),

  getTracksByGenre: (genreId: string, limit = 20, offset = 0) =>
    request<any>(`/genres/${genreId}/tracks?limit=${limit}&offset=${offset}`),

  // Playlists
  createPlaylist: (data: { title: string; description?: string; is_public?: boolean }) =>
    request<import("@/types").Playlist>("/playlists", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMyPlaylists: () => request<{ playlists: import("@/types").Playlist[] }>("/me/playlists"),

  addTrackToPlaylist: (playlistId: string, trackId: string) =>
    request<void>(`/playlists/${playlistId}/tracks`, {
      method: "POST",
      body: JSON.stringify({ track_id: trackId }),
    }),

  getPlaylist: (playlistId: string) =>
    request<any>(`/playlists/${playlistId}`),

  // Recommendations
  getRecommendations: (limit = 20) =>
    request<{ recommendations: import("@/types").RecommendedTrack[] }>(
      `/me/recommendations?limit=${limit}`
    ),

  getRadio: (trackId: string, limit = 10) =>
    request<{ queue: import("@/types").RecommendedTrack[]; seed_track_id: string }>(
      `/tracks/${trackId}/radio?limit=${limit}`
    ),

  // Comments
  getComments: (trackId: string, limit = 20, offset = 0) =>
    request<any>(`/tracks/${trackId}/comments?limit=${limit}&offset=${offset}`),

  addComment: (trackId: string, body: string) =>
    request<any>(`/tracks/${trackId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),

  // Claims
  getClaimStatus: (artistId: string) =>
    request<import("@/types").ClaimStatusResponse>(`/artists/${artistId}/claim`),

  initiateClaim: (artistId: string, method: string) =>
    request<import("@/types").Claim>(`/artists/${artistId}/claim`, {
      method: "POST",
      body: JSON.stringify({ method }),
    }),

  submitSocialVerification: (claimId: string, platform: string, postUrl: string) =>
    request<any>(`/claims/${claimId}/verify`, {
      method: "POST",
      body: JSON.stringify({ platform, post_url: postUrl }),
    }),

  submitDocuments: (claimId: string, files: File[]) => {
    const token = localStorage.getItem("access_token")
    const formData = new FormData()
    files.forEach((f) => formData.append("documents", f))
    return fetch(`${API_BASE}/claims/${claimId}/verify`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new ApiError(res.status, body.error || "Request failed")
      }
      return res.json()
    })
  },

  adminListClaims: (limit = 20, offset = 0) =>
    request<{ claims: import("@/types").Claim[]; total: number }>(
      `/admin/claims?limit=${limit}&offset=${offset}`
    ),

  adminReviewClaim: (claimId: string, action: "approve" | "reject", reason?: string) =>
    request<{ status: string; message: string; tokens?: import("@/types").AuthTokens; artist_id?: string }>(
      `/admin/claims/${claimId}/review`,
      { method: "POST", body: JSON.stringify({ action, reason }) }
    ),

  // Admin
  adminListArtists: (limit = 100, offset = 0) =>
    request<{ artists: import("@/types").Artist[] }>(`/admin/artists?limit=${limit}&offset=${offset}`),

  adminUpdateArtist: (id: string, formData: FormData) => {
    const token = localStorage.getItem("access_token")
    return fetch(`${API_BASE}/admin/artists/${id}`, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new ApiError(res.status, body.error || "Request failed")
      }
      return res.json()
    })
  },

  adminDeleteArtist: (id: string) =>
    request<void>(`/admin/artists/${id}`, { method: "DELETE" }),

  adminListAlbums: (limit = 100, offset = 0, artistId?: string) => {
    const qs = artistId ? `?limit=${limit}&offset=${offset}&artist_id=${artistId}` : `?limit=${limit}&offset=${offset}`
    return request<{ albums: import("@/types").Album[] }>(`/admin/albums${qs}`)
  },

  adminCreateAlbum: (formData: FormData) => {
    const token = localStorage.getItem("access_token")
    return fetch(`${API_BASE}/admin/albums`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new ApiError(res.status, body.error || "Request failed")
      }
      return res.json()
    })
  },

  adminUpdateAlbum: (id: string, formData: FormData) => {
    const token = localStorage.getItem("access_token")
    return fetch(`${API_BASE}/admin/albums/${id}`, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new ApiError(res.status, body.error || "Request failed")
      }
      return res.json()
    })
  },

  adminDeleteAlbum: (id: string) =>
    request<void>(`/admin/albums/${id}`, { method: "DELETE" }),

  adminListTracks: (limit = 50, offset = 0, artistId?: string) => {
    let qs = `?limit=${limit}&offset=${offset}`
    if (artistId) qs += `&artist_id=${artistId}`
    return request<{ tracks: import("@/types").Track[] }>(`/admin/tracks${qs}`)
  },

  adminUpdateTrackSection: (id: string, section: string) =>
    request<void>(`/admin/tracks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ section }),
    }),

  // Blog
  adminListPosts: (limit = 50, offset = 0, status?: string) => {
    let qs = `?limit=${limit}&offset=${offset}`
    if (status) qs += `&status=${status}`
    return request<{ posts: any[] }>(`/admin/posts${qs}`)
  },

  adminCreatePost: (formData: FormData) => {
    const token = localStorage.getItem("access_token")
    return fetch(`${API_BASE}/admin/posts`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new ApiError(res.status, body.error || "Request failed")
      }
      return res.json()
    })
  },

  adminUpdatePost: (id: string, formData: FormData) => {
    const token = localStorage.getItem("access_token")
    return fetch(`${API_BASE}/admin/posts/${id}`, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new ApiError(res.status, body.error || "Request failed")
      }
      return res.json()
    })
  },

  adminDeletePost: (id: string) =>
    request<void>(`/admin/posts/${id}`, { method: "DELETE" }),

  adminGetPost: (id: string) =>
    request<any>(`/admin/posts/${id}`),

  adminUploadTrack: (formData: FormData) => {
    const token = localStorage.getItem("access_token")
    return fetch(`${API_BASE}/admin/tracks`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new ApiError(res.status, body.error || "Request failed")
      }
      return res.json()
    })
  },

  adminImportSearch: (query: string) =>
    request<{ tracks: import("@/types").SearchResultTrack[] }>(
      `/admin/import/search?q=${encodeURIComponent(query)}`
    ),

  adminImportLookup: (id: string) =>
    request<{ tracks: import("@/types").SearchResultTrack[] }>(
      `/admin/import/lookup?id=${encodeURIComponent(id)}`
    ),

  adminImportBulk: (tracks: import("@/types").BulkImportItem[]) =>
    request<{ results: import("@/types").BulkImportResult[] }>("/admin/import/bulk", {
      method: "POST",
      body: JSON.stringify({ tracks }),
    }),

  adminImportAIEnrich: (
    tracks: { title: string; artist: string; album: string }[]
  ) =>
    request<{ results: { index: number; description: string; genre: string }[] }>(
      "/admin/import/ai-enrich",
      {
        method: "POST",
        body: JSON.stringify({ tracks }),
      }
    ),

  // History
  getHistory: (limit = 20, offset = 0) =>
    request<any>(`/me/history?limit=${limit}&offset=${offset}`),

  // Resume points (Jump Back In)
  getResume: (limit = 10) =>
    request<{ resume: import("@/types").ResumePoint[] }>(`/me/resume?limit=${limit}`),

  saveResume: (track_id: string, position_sec: number, duration_sec: number) =>
    request<{ ok: boolean }>(`/me/resume`, {
      method: "PUT",
      body: JSON.stringify({ track_id, position_sec, duration_sec }),
    }),

  deleteResume: (track_id: string) =>
    request<{ ok: boolean }>(`/me/resume/${track_id}`, { method: "DELETE" }),

  getMyLikes: (limit = 20, offset = 0) =>
    request<any>(`/me/likes?limit=${limit}&offset=${offset}`),

  getMyAlbums: (limit = 50, offset = 0) =>
    request<{ albums: import("@/types").Album[] }>(`/me/albums?limit=${limit}&offset=${offset}`),

  getFollowedArtists: (limit = 50, offset = 0) =>
    request<{ artists: import("@/types").Artist[] }>(`/me/artists?limit=${limit}&offset=${offset}`),

  // Messages
  getMyMessages: (limit = 20, offset = 0) =>
    request<any>(`/me/messages?limit=${limit}&offset=${offset}`),

  // ── Artist Dashboard ──────────────────────────────────────────────────────

  // Analytics
  artistOverview: () =>
    request<any>("/artists/me/analytics/overview"),

  artistTopTracks: () =>
    request<any>("/artists/me/analytics/tracks"),

  artistTrends: (period = "30d") =>
    request<any>(`/artists/me/analytics/trends?period=${period}`),

  // Credits
  artistGetCredits: () =>
    request<any>("/artists/me/credits"),

  artistGetCreditTransactions: (limit = 50) =>
    request<any>(`/artists/me/credits/transactions?limit=${limit}`),

  artistPurchaseCredits: (amount: number, phoneNumber: string) =>
    request<any>("/artists/me/credits/purchase", {
      method: "POST",
      body: JSON.stringify({ amount, phone_number: phoneNumber }),
    }),

  artistVerifyPayment: (txRef: string, transactionId: string) =>
    request<any>("/artists/me/credits/verify-payment", {
      method: "POST",
      body: JSON.stringify({ tx_ref: txRef, transaction_id: transactionId }),
    }),

  // Admin credits
  adminGetArtistCredits: (artistId: string) =>
    request<any>(`/admin/credits/${artistId}`),

  adminGrantCredits: (artistId: string, amount: number, reason: string) =>
    request<any>("/admin/credits/grant", {
      method: "POST",
      body: JSON.stringify({ artist_id: artistId, amount, reason }),
    }),

  adminRevokeCredits: (artistId: string, amount: number, reason: string) =>
    request<any>("/admin/credits/revoke", {
      method: "POST",
      body: JSON.stringify({ artist_id: artistId, amount, reason }),
    }),

  // Profile
  artistGetMe: () =>
    request<any>("/artists/me"),

  artistUpdateMe: (formData: FormData) => {
    const token = localStorage.getItem("access_token")
    return fetch(`${API_BASE}/artists/me`, {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new ApiError(res.status, body.error || "Request failed")
      }
      return res.json()
    })
  },

  // Track management
  artistListTracks: () =>
    request<any>("/artists/me/tracks"),

  artistUploadTrack: (formData: FormData) => {
    const token = localStorage.getItem("access_token")
    return fetch(`${API_BASE}/artists/me/tracks`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new ApiError(res.status, body.error || "Request failed")
      }
      return res.json()
    })
  },

  artistUpdateTrack: (trackId: string, data: Record<string, any>) =>
    request<any>(`/artists/me/tracks/${trackId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  artistDeleteTrack: (trackId: string) =>
    request<void>(`/artists/me/tracks/${trackId}`, { method: "DELETE" }),

  artistScheduleTrack: (trackId: string, scheduledAt: string) =>
    request<any>(`/artists/me/tracks/${trackId}/schedule`, {
      method: "PUT",
      body: JSON.stringify({ scheduled_at: scheduledAt }),
    }),

  artistAddCollaborator: (trackId: string, artistId: string) =>
    request<any>(`/artists/me/tracks/${trackId}/collaborators`, {
      method: "POST",
      body: JSON.stringify({ artist_id: artistId }),
    }),

  artistRemoveCollaborator: (trackId: string, artistId: string) =>
    request<void>(`/artists/me/tracks/${trackId}/collaborators/${artistId}`, {
      method: "DELETE",
    }),

  // Album management
  artistCreateAlbum: (data: { title: string; type?: string; cover?: File }) => {
    const token = localStorage.getItem("access_token")
    const fd = new FormData()
    fd.append("title", data.title)
    if (data.type) fd.append("type", data.type)
    if (data.cover) fd.append("cover", data.cover)
    return fetch(`${API_BASE}/artists/me/albums`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new ApiError(res.status, body.error || "Request failed")
      }
      return res.json()
    })
  },

  artistListAlbums: () =>
    request<any>("/artists/me/albums"),

  artistAddTrackToAlbum: (albumId: string, trackId: string) =>
    request<void>(`/artists/me/albums/${albumId}/tracks`, {
      method: "POST",
      body: JSON.stringify({ track_id: trackId }),
    }),

  artistRemoveTrackFromAlbum: (albumId: string, trackId: string) =>
    request<void>(`/artists/me/albums/${albumId}/tracks/${trackId}`, {
      method: "DELETE",
    }),

  // Radio
  getRadioStations: () =>
    request<import("@/types").RadioStationsResponse>("/radio/stations"),

  getRadioStation: (id: string) =>
    request<import("@/types").StationDetailResponse>(`/radio/stations/${id}`),

  getPersonalizedRadio: () =>
    request<import("@/types").StationDetailResponse>("/radio/personalized"),

  // Admin radio
  adminListStations: () =>
    request<{ stations: import("@/types").RadioStation[] }>("/admin/radio"),

  adminCreateStation: (formData: FormData) => {
    const token = localStorage.getItem("access_token")
    return fetch(`${API_BASE}/admin/radio`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new ApiError(res.status, body.error || "Request failed")
      }
      return res.json()
    })
  },

  adminUpdateStation: (id: string, formData: FormData) => {
    const token = localStorage.getItem("access_token")
    return fetch(`${API_BASE}/admin/radio/${id}`, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }))
        throw new ApiError(res.status, body.error || "Request failed")
      }
      return res.json()
    })
  },

  adminDeleteStation: (id: string) =>
    request<void>(`/admin/radio/${id}`, { method: "DELETE" }),

  adminSetStationTracks: (id: string, track_ids: string[]) =>
    request<any>(`/admin/radio/${id}/tracks`, {
      method: "PUT",
      body: JSON.stringify({ track_ids }),
    }),

  adminAddStationTrack: (id: string, track_id: string, order?: number) =>
    request<any>(`/admin/radio/${id}/tracks`, {
      method: "POST",
      body: JSON.stringify({ track_id, order: order ?? 0 }),
    }),

  adminRemoveStationTrack: (id: string, trackId: string) =>
    request<void>(`/admin/radio/${id}/tracks/${trackId}`, { method: "DELETE" }),

  // Messaging
  artistBroadcast: (subject: string, body: string) =>
    request<any>("/artists/me/messages", {
      method: "POST",
      body: JSON.stringify({ subject, body }),
    }),

  artistListSentMessages: () =>
    request<any>("/artists/me/messages"),
}
