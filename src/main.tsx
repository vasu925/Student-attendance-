import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global Fetch Interceptor to attach Bearer Tokens to outgoing API requests
const originalFetch = window.fetch;
try {
  Object.defineProperty(window, 'fetch', {
    value: async function (input: any, init: any) {
      let url = "";
      if (typeof input === "string") {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else if (input && typeof input === "object" && "url" in input) {
        url = (input as any).url;
      }

      // Inject standard JWT Bearer token into headers for private /api routes
      if (url.startsWith("/api/") && !url.includes("/api/auth/login") && !url.includes("/api/auth/register")) {
        const savedUser = localStorage.getItem("faculty_user");
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser);
            if (user && user.token) {
              init = init || {};
              const headers = new Headers(init.headers || {});
              headers.set("Authorization", `Bearer ${user.token}`);
              init.headers = headers;
            }
          } catch (e) {
            console.error("Fetch interceptor failed to parse faculty token:", e);
          }
        }
      }

      const response = await originalFetch(input, init);

      // Auto-logout and notify if the server returns 401 Unauthorized for private endpoints
      if (response.status === 401 && !url.includes("/api/auth/login") && !url.includes("/api/auth/register")) {
        localStorage.removeItem("faculty_user");
        window.dispatchEvent(new Event("auth_session_expired"));
      }

      return response;
    },
    writable: true,
    configurable: true,
    enumerable: true
  });
} catch (e) {
  console.error("Object.defineProperty on window.fetch failed, applying alternative global wrapper:", e);
  // Fallback: Try to define on globalThis or prototype if needed
  try {
    (globalThis as any).fetch = async function (input: any, init: any) {
      // similar logic
      let url = "";
      if (typeof input === "string") {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else if (input && typeof input === "object" && "url" in input) {
        url = (input as any).url;
      }

      if (url.startsWith("/api/") && !url.includes("/api/auth/login") && !url.includes("/api/auth/register")) {
        const savedUser = localStorage.getItem("faculty_user");
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser);
            if (user && user.token) {
              init = init || {};
              const headers = new Headers(init.headers || {});
              headers.set("Authorization", `Bearer ${user.token}`);
              init.headers = headers;
            }
          } catch (err) {
            console.error(err);
          }
        }
      }
      const response = await originalFetch(input, init);
      if (response.status === 401 && !url.includes("/api/auth/login") && !url.includes("/api/auth/register")) {
        localStorage.removeItem("faculty_user");
        window.dispatchEvent(new Event("auth_session_expired"));
      }
      return response;
    };
  } catch (err2) {
    console.error("All fetch interceptor fallbacks failed:", err2);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
