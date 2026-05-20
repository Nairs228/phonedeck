export const AUTH_TOKEN_KEY = "phonedeck_auth_token"

function readApiBase() {
  if (typeof window === "undefined") {
    return (process.env.REACT_APP_API_URL || "").replace(/\/$/, "")
  }
  const runtime = window.__PHONEDECK_API_BASE__
  if (runtime !== undefined && runtime !== null) {
    return String(runtime).trim().replace(/\/$/, "")
  }
  return (process.env.REACT_APP_API_URL || "").replace(/\/$/, "")
}

export function apiUrl(path) {
  const base = readApiBase()
  const normalized = path.startsWith("/") ? path : `/${path}`
  if (!base) {
    return normalized
  }
  return `${base}${normalized}`
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null
  }
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export function authHeaders() {
  const token = getStoredAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
