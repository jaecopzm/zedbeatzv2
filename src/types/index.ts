export interface Track {
  id: string
  artist_id: string
  album_id: string | null
  title: string
  duration_sec: number
  genre_id: string | null
  cover_url: string | null
  file_size: number
  mime_type: string
  status: string
  scheduled_at: string | null
  released_at: string | null
  play_count: number
  like_count: number
  track_order: number
  created_at: string
  updated_at: string
  section: string
  artist_name: string
  album_name?: string
  collaborators?: Collaborator[]
  description?: string | null
}

export interface Collaborator {
  artist_id: string
  stage_name: string
  role: string
  photo_url?: string | null
}

export interface Album {
  id: string
  artist_id: string
  title: string
  cover_url: string | null
  type: string
  status: string
  scheduled_at: string | null
  released_at: string | null
  created_at: string
  updated_at: string
  artist_name?: string
  tracks: Track[]
}

export interface Artist {
  id: string
  user_id: string
  email: string
  stage_name: string
  bio: string | null
  photo_url: string | null
  cover_url: string | null
  location: string | null
  genre_tags: string[]
  verified: boolean
  follower_count?: number | null
  is_followed?: boolean | null
  track_count?: number | null
  created_at: string
  updated_at: string
}

export interface Genre {
  id: string
  name: string
  slug: string
}

export interface Playlist {
  id: string
  user_id: string
  title: string
  description: string | null
  cover_url: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface StreamURL {
  url: string
  expires_in: number
}

export interface RecommendedTrack {
  id: string
  title: string
  artist_name: string
  cover_url: string | null
  duration_sec: number
  play_count: number
}

export interface Claim {
  id: string
  artist_id: string
  user_id: string
  status: "pending" | "under_review" | "approved" | "rejected"
  method: "social_media" | "manual_review"
  social_platform: string | null
  social_post_url: string | null
  verification_code: string | null
  document_keys: string[]
  notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface ClaimStatusResponse {
  claimed: boolean
  claim?: Claim
}

export interface SearchResultTrack {
  spotify_id: string
  title: string
  artists: string[]
  artist_ids: string[]
  artist_genres: string[]
  isrc: string
  duration_ms: number
  album_name: string
  cover_url: string
}

export interface BulkImportItem {
  spotify_id?: string
  search?: string
  override_title?: string
  override_artist?: string
  genre_id?: string | null
  featured_artists?: string
  album_title?: string
  publish?: boolean
  section?: string
  description?: string
}

export interface BulkImportResult {
  index: number
  error?: string
  title?: string
  id?: string
}

export interface RadioStation {
  id: string
  name: string
  slug: string
  description: string | null
  cover_url: string | null
  type: "genre" | "curated" | "personalized" | "playlist"
  genre_id: string | null
  genre_name?: string
  created_by: string
  is_active: boolean
  track_count: number
  created_at: string
  updated_at: string
}

export interface RadioStationTrack {
  id: string
  artist_id: string
  title: string
  artist_name: string
  cover_url: string | null
  duration_sec: number
  play_count: number
  album_id: string | null
  album_name: string | null
  collaborators?: { artist_id: string; stage_name: string; role?: string; photo_url?: string | null }[]
}

export interface RadioStationsResponse {
  stations: {
    genre: { id: string; name: string; slug: string; cover_url: string | null; track_count: number }[]
    curated: RadioStation[]
    playlists: {
      id: string
      name: string
      description: string | null
      cover_url: string | null
      track_count: number
      created_at: string
      updated_at: string
    }[]
  }
  user_id: string | null
}

export interface StationDetailResponse {
  station: RadioStation
  tracks: RadioStationTrack[]
}

export interface ResumePoint {
  track_id: string
  position_sec: number
  duration_sec: number
  updated_at: string
  title?: string
  artist_id?: string
  artist_name?: string
  cover_url?: string | null
}
