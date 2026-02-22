/**
 * auth.js — JWT authentication utilities.
 *
 * Manages JWT access and refresh tokens stored in localStorage.
 * Used by the API client (api.js) for automatic token attachment
 * and by the admin pages to check authentication status.
 *
 * Token Flow:
 *   1. login() sends credentials to POST /api/auth/login/
 *   2. The server returns { access, refresh } JWT tokens
 *   3. Both tokens are stored in localStorage
 *   4. api.js reads the access token via getToken() and attaches it to requests
 *   5. When a request gets a 401, api.js calls refreshAccessToken() to get a new
 *      access token using the refresh token
 *   6. If the refresh token is also expired (7 days), the user must log in again
 *
 * @module auth
 */

/** localStorage key for the short-lived access token (30 min) */
const ACCESS_KEY = 'portfolio-access';

/** localStorage key for the long-lived refresh token (7 days) */
const REFRESH_KEY = 'portfolio-refresh';

/**
 * Get the current access token from localStorage.
 *
 * @returns {string|null} The JWT access token, or null if not logged in
 */
export function getToken() {
  return localStorage.getItem(ACCESS_KEY);
}

/**
 * Check if the user has a stored access token.
 * Note: This doesn't verify the token is valid/unexpired — the server
 * does that. It just checks if a token exists.
 *
 * @returns {boolean} True if an access token exists in localStorage
 */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Log in with username and password.
 * Sends credentials to the Django SimpleJWT endpoint and stores
 * the returned tokens in localStorage.
 *
 * @param {string} username - The user's username
 * @param {string} password - The user's password
 * @returns {Promise<Object>} The token response { access, refresh }
 * @throws {Error} With .data containing server error details on failure
 */
export async function login(username, password) {
  const res = await fetch('/api/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error('Login failed'), { data: err });
  }

  const data = await res.json();
  localStorage.setItem(ACCESS_KEY, data.access);
  localStorage.setItem(REFRESH_KEY, data.refresh);
  return data;
}

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Called automatically by api.js when a request returns 401.
 *
 * @returns {Promise<boolean>} True if the token was successfully refreshed
 */
export async function refreshAccessToken() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return false;

  try {
    const res = await fetch('/api/auth/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem(ACCESS_KEY, data.access);
    return true;
  } catch {
    return false;
  }
}

/**
 * Log out by clearing both tokens from localStorage.
 * Does not make a server request — JWT tokens are stateless,
 * so clearing them client-side is sufficient.
 */
export function logout() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
