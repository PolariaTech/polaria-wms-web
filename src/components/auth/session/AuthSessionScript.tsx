import Script from "next/script";
import { AUTH_HASH_PREFIX } from "@/lib/auth/auth-hash-import";
import { MATEO_SSO_EXIT_KEY } from "@/lib/auth/mateo-sso-exit";
import { AUTH_STORAGE_KEY } from "@/lib/auth/auth-storage";

/**
 * Script síncrono que corre antes de React.
 * - Importa sesión desde #polaria-auth= (SSO Mateo → WMS).
 * - Fuerza polaria-auth solo en localStorage (nunca sessionStorage).
 * - Evita que bfcache muestre rutas protegidas sin sesión.
 */
export function AuthSessionScript() {
  const script = `
(function () {
  var KEY = ${JSON.stringify(AUTH_STORAGE_KEY)};
  var HASH_PREFIX = ${JSON.stringify(AUTH_HASH_PREFIX)};
  var SSO_EXIT_KEY = ${JSON.stringify(MATEO_SSO_EXIT_KEY)};

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
      guardProtectedRoute();
    }
  });

  migrateToLocal();
  importAuthFromHash();
  guardProtectedRoute();
})();
`;

  return (
    <Script
      id="polaria-auth-session-guard"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
