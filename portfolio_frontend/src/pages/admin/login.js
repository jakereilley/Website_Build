/**
 * admin/login.js — Admin login page with JWT authentication.
 *
 * Displays a username/password form that authenticates against the
 * Django SimpleJWT endpoint via the auth.js login() utility.
 *
 * On successful login, JWT access and refresh tokens are stored in
 * localStorage and the user is redirected to the admin dashboard.
 *
 * If the user is already authenticated (has a stored access token),
 * this page immediately redirects to /admin without showing the form.
 *
 * @module pages/admin/login
 */

import { login, isAuthenticated } from '../../utils/auth.js';
import { navigate } from '../../utils/router.js';

export default {
  /**
   * Mount the login page. Redirects to dashboard if already authenticated.
   * @param {HTMLElement} container - The router's mount element
   */
  mount(container) {
    // Skip login form if user already has a token
    if (isAuthenticated()) {
      navigate('/admin');
      return;
    }

    container.innerHTML = `
      <section class="page">
        <div class="container admin-login">
          <h1>Admin Login</h1>
          <form id="login-form" class="contact-form" novalidate>
            <div class="form-group">
              <label for="login-username">Username</label>
              <input type="text" id="login-username" required />
            </div>
            <div class="form-group">
              <label for="login-password">Password</label>
              <input type="password" id="login-password" required />
            </div>
            <button type="submit" class="btn btn-primary">Log In</button>
            <p class="form-status" id="login-status"></p>
          </form>
        </div>
      </section>
    `;

    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = document.getElementById('login-status');
      status.textContent = '';
      status.className = 'form-status';

      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;

      if (!username || !password) {
        status.textContent = 'Please fill in all fields.';
        status.classList.add('error');
        return;
      }

      try {
        await login(username, password);
        navigate('/admin');
      } catch {
        status.textContent = 'Invalid credentials.';
        status.classList.add('error');
      }
    });
  },

  unmount() {},
};
