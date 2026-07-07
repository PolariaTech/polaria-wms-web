import { beforeEach, describe, expect, it } from "vitest";
import {
  AUTH_STORAGE_KEY,
  authPersistStorage,
  ensureAuthOnlyInLocalStorage,
  purgeAuthFromSessionStorage,
  readAuthStorageRaw,
} from "@/lib/auth/auth-storage";

const SAMPLE = JSON.stringify({
  state: { accessToken: "token-abc", refreshToken: "ref", context: null },
  version: 0,
});

describe("auth-storage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("migra polaria-auth de sessionStorage a localStorage", () => {
    sessionStorage.setItem(AUTH_STORAGE_KEY, SAMPLE);

    ensureAuthOnlyInLocalStorage();

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe(SAMPLE);
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("authPersistStorage escribe solo en localStorage", () => {
    authPersistStorage.setItem(AUTH_STORAGE_KEY, SAMPLE);

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe(SAMPLE);
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("authPersistStorage elimina de localStorage y purga sessionStorage", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, SAMPLE);
    sessionStorage.setItem(AUTH_STORAGE_KEY, SAMPLE);

    authPersistStorage.removeItem(AUTH_STORAGE_KEY);

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("readAuthStorageRaw purga sessionStorage antes de leer", () => {
    sessionStorage.setItem(AUTH_STORAGE_KEY, SAMPLE);
    localStorage.setItem(AUTH_STORAGE_KEY, SAMPLE);

    expect(readAuthStorageRaw()).toBe(SAMPLE);
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("purgeAuthFromSessionStorage no toca localStorage", () => {
    localStorage.setItem(AUTH_STORAGE_KEY, SAMPLE);
    sessionStorage.setItem(AUTH_STORAGE_KEY, SAMPLE);

    purgeAuthFromSessionStorage();

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe(SAMPLE);
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});
