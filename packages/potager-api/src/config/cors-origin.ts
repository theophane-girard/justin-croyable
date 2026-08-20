/**
 * Origines autorisées par CORS.
 *
 * Les canaux de prévisualisation Firebase Hosting ont un sous-domaine dynamique,
 * il faut donc les reconnaître par leur forme et non les lister. Le canal se
 * lit dans le libellé d'hôte, séparé du site par un double tiret :
 *
 *   https://<site>--<canal>-<empreinte>.web.app
 *
 * Le nom de canal produit en CI vient de `FirebaseExtended/action-hosting-deploy`
 * (`pr<numéro>-<20 premiers caractères de la branche>`, les caractères hors
 * `[A-Za-z0-9_\-.]` remplacés par `_`) puis de `firebase-tools`, qui remplace
 * `/ : _ #` par des tirets. Une branche `claude/potager-app-updates-56zitv` sur
 * la PR 105 donne donc `pr105-claude-potager-app-u`, et non `pr-105-<empreinte>`.
 * Plutôt que de rejouer cette suite de transformations, on ne contraint ici que
 * ce qui est structurel : le site, et un nom de canal en libellé d'hôte valide.
 *
 * À noter : un site Firebase dont l'identifiant commencerait par `<site>--`
 * produirait une URL live indiscernable d'une de nos previews. Le contrôle
 * d'accès ne repose pas sur l'origine mais sur le jeton Firebase porté par
 * l'en-tête `authorization`, hors de portée d'une autre origine.
 */

/** Sites Firebase Hosting servant le front de cette API (voir `.firebaserc`). */
export const FIREBASE_HOSTING_SITES: readonly string[] = ['justin-croyable-potager'];

const HOSTING_DOMAINS: readonly string[] = ['web.app', 'firebaseapp.com'];

const PREVIEW_SEPARATOR = '--';

const CHANNEL_LABEL = /^[a-z0-9][a-z0-9-]*$/i;

export type CorsOriginRules = {
  readonly allowedOrigins: readonly string[];
  readonly hostingSites: readonly string[];
  readonly extraOriginPattern: RegExp | null;
};

function parseOriginUrl(origin: string): URL | null {
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function hostLabelFor(hostname: string): string | null {
  const domain = HOSTING_DOMAINS.find(candidate => hostname.endsWith(`.${candidate}`));
  return domain ? hostname.slice(0, -(domain.length + 1)) : null;
}

export function isFirebaseHostingOrigin(origin: string, site: string): boolean {
  const url = parseOriginUrl(origin);
  if (!url) {
    return false;
  }
  const label = hostLabelFor(url.hostname);
  if (label === null) {
    return false;
  }
  if (label === site) {
    return true;
  }
  const prefix = `${site}${PREVIEW_SEPARATOR}`;
  if (!label.startsWith(prefix)) {
    return false;
  }
  return CHANNEL_LABEL.test(label.slice(prefix.length));
}

export type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

/** Décision CORS, à brancher sur `enableCors({ origin })`. */
export function corsOriginHandler(
  rules: CorsOriginRules,
): (origin: string | undefined, callback: CorsOriginCallback) => void {
  return (origin, callback) => callback(null, isAllowedOrigin(origin, rules));
}

export function isAllowedOrigin(origin: string | undefined, rules: CorsOriginRules): boolean {
  if (!origin) {
    return false;
  }
  if (rules.allowedOrigins.includes(origin)) {
    return true;
  }
  if (rules.hostingSites.some(site => isFirebaseHostingOrigin(origin, site))) {
    return true;
  }
  return rules.extraOriginPattern?.test(origin) ?? false;
}
