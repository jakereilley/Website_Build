/**
 * api.js — HTTP client for the Django REST API.
 *
 * Provides get(), post(), put(), and del() functions that handle:
 *   - Automatic JWT token attachment (Authorization header)
 *   - Automatic token refresh on 401 responses
 *   - Redirect to login page when session expires
 *   - FormData support (for file uploads like resume/project images)
 *
 * All requests are routed through the internal request() function which
 * handles auth logic. The Vite dev server proxies /api requests to
 * Django on port 8000 (configured in vite.config.js).
 *
 * Usage:
 *   import { get, post, put, del } from './api.js';
 *
 *   const projects = await get('/projects/');         // GET /api/projects/
 *   await post('/contact/', { name, email, ... });    // POST /api/contact/
 *   await put('/projects/my-project/', data);         // PUT /api/projects/my-project/
 *   await del('/blog/old-post/');                     // DELETE /api/blog/old-post/
 *
 * @module api
 */

import { getToken, refreshAccessToken, logout } from './auth.js';

/** Base path prepended to all endpoints. Vite proxies this to Django. */
const BASE_URL = '/api';

/**
 * Core request function — all API calls flow through here.
 *
 * Handles JWT authentication and automatic token refresh:
 *   1. Attaches the access token to the Authorization header (if available)
 *   2. If the server returns 401 (Unauthorized), attempts to refresh the token
 *   3. If refresh succeeds, retries the original request with the new token
 *   4. If refresh fails, clears tokens and redirects to the login page
 *
 * @param {string} endpoint - API path (e.g., '/projects/')
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Response>} The fetch Response object
 * @throws {Error} If the session has expired and refresh failed
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData — the browser needs to set the
  // multipart boundary automatically. For JSON data, set it explicitly.
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });

  // Handle expired access token: try refreshing, then retry the request
  if (response.status === 401 && token) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      return fetch(url, { ...options, headers });
    }
    // Refresh failed — session is fully expired
    logout();
    window.location.hash = '#/admin/login';
    throw new Error('Session expired');
  }

  return response;
}

/**
 * Send a GET request and return the parsed JSON response.
 *
 * @param {string} endpoint - API path (e.g., '/projects/')
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} If the response is not ok
 */
export async function get(endpoint) {
  const res = await request(endpoint);
  if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
  return res.json();
}

/**
 * Send a POST request with JSON or FormData body.
 * Returns the parsed JSON response. Error responses include the
 * server's validation errors in the thrown error's .data property.
 *
 * @param {string} endpoint - API path (e.g., '/contact/')
 * @param {Object|FormData} data - Request body (auto-detects FormData for file uploads)
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} With .data containing server validation errors
 */
export async function post(endpoint, data) {
  const isFormData = data instanceof FormData;
  const res = await request(endpoint, {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(`POST ${endpoint} failed: ${res.status}`), { data: err });
  }
  return res.json();
}

/**
 * Send a PUT request to update a resource.
 *
 * @param {string} endpoint - API path (e.g., '/projects/my-project/')
 * @param {Object|FormData} data - Updated resource data
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function put(endpoint, data) {
  const isFormData = data instanceof FormData;
  const res = await request(endpoint, {
    method: 'PUT',
    body: isFormData ? data : JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PUT ${endpoint} failed: ${res.status}`);
  return res.json();
}

/**
 * Send a DELETE request to remove a resource.
 *
 * @param {string} endpoint - API path (e.g., '/blog/old-post/')
 * @returns {Promise<Response>} The raw Response (DELETE typically returns 204 No Content)
 */
export async function del(endpoint) {
  const res = await request(endpoint, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${endpoint} failed: ${res.status}`);
  return res;
}
