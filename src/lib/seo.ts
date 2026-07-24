export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://play.zedbeatz.com"
export const SITE_NAME = "ZedBeatz"
export const SITE_TITLE = "ZedBeatz — Zambian Music Streaming"
export const SITE_DESCRIPTION = "Zambian Music Streaming — Discover, stream, and download the latest Zambian music, albums, and playlists for free. Listen to Zed music, Zambian songs, gospel, afrobeat, hip-hop, and more."
export const SITE_KEYWORDS = "ZedBeatz, Zed Beatz, Zedbeatz, Zedbeats, Zed beats, Zambian music, Zed music, Zambian songs, Zed songs, Zambian music streaming, Zambian mp3 download, latest Zambian music, new Zambian songs, Zambian artists, Zambian gospel music, Zambian hip hop, Zambian afrobeat, zedwap, ilovezedmusic, Zambian music app, play zedbeatz, Yo Maps, Chef 187, Chile One, Macky 2, Mordecai Mwila, Dandy Krazy, Petersen Zagaze, Slap Dee, Jae Cash, Gemma Griffiths, B Flow, Njava, Cleopatra Ioane"

export const SERVER_API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
  : "http://localhost:8080/api/v1"
