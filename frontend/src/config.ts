// Single source of truth for where the backend lives.
//
// Local dev: VITE_API_URL is unset, so both URLs stay relative and Vite's proxy
// (see vite.config.ts) forwards /api and /hubs to the backend on port 5202.
//
// Production: Vercel supplies VITE_API_URL as the Render origin, e.g.
// https://ascension-api.onrender.com — that origin must also be listed in the
// backend's Cors:AllowedOrigins, otherwise the browser blocks every call.
const apiOrigin = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export const API_BASE_URL = `${apiOrigin}/api`;
export const NOTIFICATION_HUB_URL = `${apiOrigin}/hubs/notifications`;
