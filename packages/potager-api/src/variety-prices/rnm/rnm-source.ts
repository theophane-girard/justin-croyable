import { setTimeout as sleep } from 'node:timers/promises';

import {
  DOWNLOAD_MAX_ATTEMPTS,
  DOWNLOAD_RETRY_DELAY_MS,
  DOWNLOAD_USER_AGENT,
  VISIONET_BASE_URL,
  VISIONET_FILE_PATH,
} from './rnm.constants';

type CookieCapableHeaders = Headers & { getSetCookie?: () => string[] };

function extractCookies(headers: Headers): string {
  const setCookies = (headers as CookieCapableHeaders).getSetCookie?.() ?? [];
  return setCookies
    .map(cookie => cookie.split(';', 1).at(0) ?? '')
    .filter(Boolean)
    .join('; ');
}

function looksLikeZip(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes.at(0) === 0x50 && bytes.at(1) === 0x4b;
}

function buildDocumentUrl(year: number): string {
  const shortYear = String(year % 100).padStart(2, '0');
  const fileUrl = `${VISIONET_FILE_PATH}/COT-MUL-prd_RNM-A${shortYear}.zip`;
  const params = new URLSearchParams({ fileurl: fileUrl, telechargersanscomptage: 'oui' });
  return `${VISIONET_BASE_URL}/Pages/OpenDocument.aspx?${params.toString()}`;
}

async function warmUpCookies(): Promise<string> {
  const response = await fetch(`${VISIONET_BASE_URL}/`, {
    headers: { 'user-agent': DOWNLOAD_USER_AGENT },
  });
  return extractCookies(response.headers);
}

async function attemptDownload(url: string, cookies: string): Promise<Uint8Array | null> {
  const response = await fetch(url, {
    headers: {
      'user-agent': DOWNLOAD_USER_AGENT,
      referer: `${VISIONET_BASE_URL}/Pages/Statistiques.aspx?sousmenu=multi-filieres`,
      ...(cookies ? { cookie: cookies } : {}),
    },
  });
  if (!response.ok) {
    return null;
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  return looksLikeZip(bytes) ? bytes : null;
}

async function downloadWithRetry(
  url: string,
  cookies: string,
  attempt: number,
): Promise<Uint8Array> {
  const bytes = await attemptDownload(url, cookies);
  if (bytes) {
    return bytes;
  }
  if (attempt + 1 >= DOWNLOAD_MAX_ATTEMPTS) {
    throw new Error(
      `Téléchargement RNM échoué après ${DOWNLOAD_MAX_ATTEMPTS} tentatives (le serveur n'a pas renvoyé de ZIP).`,
    );
  }
  await sleep(DOWNLOAD_RETRY_DELAY_MS);
  return downloadWithRetry(url, cookies, attempt + 1);
}

export async function downloadRnmZip(year: number): Promise<Uint8Array> {
  const url = buildDocumentUrl(year);
  const cookies = await warmUpCookies();
  return downloadWithRetry(url, cookies, 0);
}
