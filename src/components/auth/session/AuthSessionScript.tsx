import Script from "next/script";
import { AUTH_HASH_PREFIX } from "@/lib/auth/auth-hash-import";
import { MATEO_SSO_EXIT_KEY } from "@/lib/auth/mateo-sso-exit";
import { AUTH_STORAGE_KEY } from "@/lib/auth/auth-storage";
import { SESSION_MAX_AGE_MS } from "@/lib/auth/auth-session-timeout";

/**
 * Script síncrono que corre antes de React.
 * - Importa sesión desde #polaria-auth= (SSO Mateo → WMS).
 * - Fuerza polaria-auth solo en localStorage (nunca sessionStorage).
 * - Purga sesiones de más de 12 h (o legacy sin marca de inicio).
 * - Evita que bfcache muestre rutas protegidas sin sesión.
 */
export function AuthSessionScript() {
  const script = `
(function () {
  var KEY = ${JSON.stringify(AUTH_STORAGE_KEY)};
  var HASH_PREFIX = ${JSON.stringify(AUTH_HASH_PREFIX)};
  var SSO_EXIT_KEY = ${JSON.stringify(MATEO_SSO_EXIT_KEY)};
  var MAX_AGE_MS = ${SESSION_MAX_AGE_MS};

  function purgeSessionAuth() {
    try {
      sessionStorage.removeItem(KEY);
    } catch (e) {}
  }

  function migrateToLocal() {
    try {
      if (!localStorage.getItem(KEY)) {
        var legacy = sessionStorage.getItem(KEY);
        if (legacy) localStorage.setItem(KEY, legacy);
      }
      purgeSessionAuth();
    } catch (e) {}
  }

  function isExpiredState(state) {
    if (!state || !state.accessToken) return true;
    var started = state.sessionStartedAt;
    if (typeof started !== "number") return true;
    return Date.now() - started >= MAX_AGE_MS;
  }

  function purgeExpiredAuth() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      var state = parsed && parsed.state ? parsed.state : parsed;
      if (isExpiredState(state)) {
        localStorage.removeItem(KEY);
        purgeSessionAuth();
      }
    } catch (e) {}
  }

  function importAuthFromHash() {
    try {
      var hash = window.location.hash;
      if (!hash || hash.indexOf(HASH_PREFIX) !== 0) return;
      var encoded = hash.substring(HASH_PREFIX.length);
      if (!encoded) return;
      var b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      var decoded = atob(b64);
      var payload = JSON.parse(decoded);
      var state = payload.state || payload;
      if (!state || !state.accessToken) return;
      var stored = payload.state
        ? payload
        : { state: state, version: 0 };
      if (stored.version === undefined) stored.version = 0;
      if (typeof stored.state.sessionStartedAt !== "number") {
        stored.state.sessionStartedAt = Date.now();
      }
      localStorage.setItem(KEY, JSON.stringify(stored));
      var clean = window.location.pathname + window.location.search;
      history.replaceState(null, "", clean);
    } catch (e) {}
  }

  function isProtected(path) {
    return path === "/configurador" || path.indexOf("/configurador/") === 0
      || path === "/dashboard" || path.indexOf("/dashboard/") === 0
      || path === "/platform" || path.indexOf("/platform/") === 0;
  }

  function readToken() {
    try {
      migrateToLocal();
      purgeExpiredAuth();
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && parsed.state && parsed.state.accessToken
        ? parsed.state.accessToken
        : null;
    } catch (e) {
      return null;
    }
  }

  function guardProtectedRoute() {
    migrateToLocal();
    try {
      if (sessionStorage.getItem(SSO_EXIT_KEY)) return;
    } catch (e) {}
    if (!isProtected(window.location.pathname)) return;
    if (!readToken()) {
      window.location.replace("/login");
    }
  }

  window.addEventListener("pageshow", function (event) {
    migrateToLocal();
    if (event.persisted) {
      importAuthFromHash();
      purgeExpiredAuth();
      guardProtectedRoute();
    }
  });

  migrateToLocal();
  importAuthFromHash();
  purgeExpiredAuth();
  guardProtectedRoute();
})();
`;

  return (
    // beforeInteractive: el guard de sesión debe correr antes de hidratar rutas protegidas.
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script
      id="polaria-auth-session-guard"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
