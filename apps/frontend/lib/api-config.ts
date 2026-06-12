'use client';

/**
 * api-config.ts
 * ─────────────
 * Deteksi platform (Capacitor native vs browser) dan kembalikan base URL yang tepat.
 *
 * - Browser web  → '/api'          (proxy ke Next.js API route → backend)
 * - Native APK   → '<SERVER_URL>'  (langsung ke NestJS backend, disimpan di Preferences)
 */

const DEFAULT_SERVER_URL = 'http://192.168.18.42:8000';
const PREF_KEY_SERVER_URL = 'gm_server_url';

let _isNative: boolean | null = null;
let _serverUrl: string | null = null;

/**
 * Cek apakah sedang berjalan sebagai native Capacitor app.
 * Safe di SSR (mengembalikan false saat tidak ada window).
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  if (_isNative !== null) return _isNative;

  try {
    const w = window as any;
    _isNative = !!(w.Capacitor?.isNativePlatform?.() ?? false);
  } catch {
    _isNative = false;
  }
  return _isNative;
}

/**
 * Ambil Server URL dari @capacitor/preferences (async, untuk native).
 * Dipanggil sekali saat app boot, hasilnya di-cache.
 */
export async function loadServerUrl(): Promise<string> {
  if (_serverUrl !== null) return _serverUrl;

  if (!isNativePlatform()) {
    _serverUrl = '';
    return _serverUrl;
  }

  try {
    const { Preferences } = await import('@capacitor/preferences');
    const { value } = await Preferences.get({ key: PREF_KEY_SERVER_URL });
    _serverUrl = value?.trim() || DEFAULT_SERVER_URL;
  } catch {
    _serverUrl = DEFAULT_SERVER_URL;
  }
  return _serverUrl;
}

/**
 * Simpan Server URL ke @capacitor/preferences.
 */
export async function saveServerUrl(url: string): Promise<void> {
  const cleaned = url.replace(/\/$/, '').trim();
  _serverUrl = cleaned;

  if (!isNativePlatform()) return;

  try {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key: PREF_KEY_SERVER_URL, value: cleaned });
  } catch (e) {
    console.warn('[api-config] Gagal menyimpan server URL:', e);
  }
}

/**
 * Invalidate cache (misal setelah user mengubah URL dari Settings).
 */
export function resetServerUrlCache(): void {
  _serverUrl = null;
}

/**
 * Kembalikan base URL untuk axios instance.
 *
 * - Web browser : '/api'                    → Next.js proxy → NestJS
 * - Native      : '<serverUrl>/api'  → langsung ke NestJS
 */
export function getBaseUrl(serverUrl?: string | null): string {
  if (!isNativePlatform()) return '/api';
  const base = (serverUrl ?? _serverUrl ?? DEFAULT_SERVER_URL).replace(/\/$/, '');
  return `${base}/api`;
}

export { DEFAULT_SERVER_URL, PREF_KEY_SERVER_URL };
