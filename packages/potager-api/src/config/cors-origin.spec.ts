import { describe, expect, it } from 'vitest';

import {
  corsOriginHandler,
  FIREBASE_HOSTING_SITES,
  isAllowedOrigin,
  isFirebaseHostingOrigin,
  type CorsOriginCallback,
  type CorsOriginRules,
} from './cors-origin';

const [SITE = ''] = FIREBASE_HOSTING_SITES;

const RULES: CorsOriginRules = {
  allowedOrigins: ['http://localhost:4200'],
  hostingSites: FIREBASE_HOSTING_SITES,
  extraOriginPattern: null,
};

describe('isFirebaseHostingOrigin', () => {
  it('accepte les canaux live du site', () => {
    expect(isFirebaseHostingOrigin(`https://${SITE}.web.app`, SITE)).toBe(true);
    expect(isFirebaseHostingOrigin(`https://${SITE}.firebaseapp.com`, SITE)).toBe(true);
  });

  it('accepte le canal de preview nommé par la CI', () => {
    // pr<numéro>-<branche tronquée>, tirets compris, puis l'empreinte Firebase.
    expect(
      isFirebaseHostingOrigin(`https://${SITE}--pr105-claude-potager-app-u-a1b2c3d4.web.app`, SITE),
    ).toBe(true);
  });

  it('accepte un canal nommé à la main', () => {
    expect(isFirebaseHostingOrigin(`https://${SITE}--preview-9f8e7d6c.web.app`, SITE)).toBe(true);
  });

  it('accepte la forme historique pr-<numéro>', () => {
    expect(isFirebaseHostingOrigin(`https://${SITE}--pr-105-a1b2c3d4.web.app`, SITE)).toBe(true);
  });

  it('refuse un autre site du projet', () => {
    expect(isFirebaseHostingOrigin('https://pokemon-comparator.web.app', SITE)).toBe(false);
    expect(isFirebaseHostingOrigin('https://pokemon-comparator--pr1-x.web.app', SITE)).toBe(false);
  });

  it('refuse un site dont le nom contient le nôtre', () => {
    expect(isFirebaseHostingOrigin(`https://not-${SITE}.web.app`, SITE)).toBe(false);
    expect(isFirebaseHostingOrigin(`https://${SITE}-bis.web.app`, SITE)).toBe(false);
  });

  it('refuse un sous-domaine ajouté devant le site', () => {
    expect(isFirebaseHostingOrigin(`https://evil.${SITE}.web.app`, SITE)).toBe(false);
  });

  it('refuse un autre domaine qui se termine par le nôtre', () => {
    expect(isFirebaseHostingOrigin(`https://${SITE}.web.app.evil.com`, SITE)).toBe(false);
    expect(isFirebaseHostingOrigin(`https://${SITE}--pr1.evil.com`, SITE)).toBe(false);
  });

  it('refuse le http en clair', () => {
    expect(isFirebaseHostingOrigin(`http://${SITE}.web.app`, SITE)).toBe(false);
  });

  it('refuse une origine illisible', () => {
    expect(isFirebaseHostingOrigin('pas-une-url', SITE)).toBe(false);
    expect(isFirebaseHostingOrigin('', SITE)).toBe(false);
  });

  it('refuse un séparateur de canal sans nom de canal', () => {
    expect(isFirebaseHostingOrigin(`https://${SITE}--.web.app`, SITE)).toBe(false);
    expect(isFirebaseHostingOrigin(`https://${SITE}---x.web.app`, SITE)).toBe(false);
  });
});

describe('isAllowedOrigin', () => {
  it('accepte les origines listées telles quelles', () => {
    expect(isAllowedOrigin('http://localhost:4200', RULES)).toBe(true);
    expect(isAllowedOrigin('http://localhost:4300', RULES)).toBe(false);
  });

  it('accepte les previews du site sans configuration supplémentaire', () => {
    expect(isAllowedOrigin(`https://${SITE}--pr42-feature-x-1a2b3c4d.web.app`, RULES)).toBe(true);
  });

  it('accepte une origine couverte par le motif supplémentaire', () => {
    const rules: CorsOriginRules = { ...RULES, extraOriginPattern: /^https:\/\/staging\.test$/ };
    expect(isAllowedOrigin('https://staging.test', rules)).toBe(true);
    expect(isAllowedOrigin('https://autre.test', rules)).toBe(false);
  });

  it('refuse une requête sans origine', () => {
    expect(isAllowedOrigin(undefined, RULES)).toBe(false);
    expect(isAllowedOrigin('', RULES)).toBe(false);
  });
});

describe('corsOriginHandler', () => {
  it('rend la décision au rappel de cors', () => {
    const handler = corsOriginHandler(RULES);
    const calls: (boolean | undefined)[] = [];
    const collect: CorsOriginCallback = (_error, allow) => calls.push(allow);

    handler(`https://${SITE}--pr7-fix-abc12345.web.app`, collect);
    handler('https://ailleurs.test', collect);
    handler(undefined, collect);

    expect(calls).toEqual([true, false, false]);
  });
});
