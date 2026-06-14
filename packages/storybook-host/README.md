# @justin-croyable/storybook-host

App React Native qui héberge **Storybook on-device** pour visualiser le Design
System [`@justin-croyable/mobile-ds`](../../libs/mobile-ds).

Les stories sont colocalisées avec les composants dans la lib
(`libs/mobile-ds/src/**/*.stories.tsx`) ; cette app ne fait que les afficher,
avec NativeWind branché et un bouton de bascule **dark / light** dans chaque story.

## Lancer Storybook

```sh
# 1. Démarrer le bundler Metro (génère .storybook/storybook.requires.ts)
nx start @justin-croyable/storybook-host

# 2. Dans un autre terminal, lancer l'app sur un appareil / émulateur
nx run-android @justin-croyable/storybook-host
# ou
nx run-ios @justin-croyable/storybook-host
```

Storybook s'ouvre directement dans l'app : navigateur de stories, contrôles et
actions on-device.

## Storybook dans le navigateur (web)

Pour itérer vite sans émulateur, une seconde instance Storybook tourne sur le
**web** (via react-native-web + webpack), en réutilisant **les mêmes stories** :

```sh
npm run storybook-web -w @justin-croyable/storybook-host
# -> http://localhost:6006
```

Build statique :

```sh
npm run build-storybook-web -w @justin-croyable/storybook-host
# -> dist/storybook-web
```

Config dans `.storybook-web/` (builder `@storybook/react-webpack5` +
`@storybook/addon-react-native-web`). NativeWind est branché en injectant
`nativewind/babel` dans le babel-loader et en passant `global-web.css` dans
PostCSS + Tailwind. Le bouton dark/light fonctionne aussi sur le web.

> Régénérer manuellement la liste des stories (sinon Metro le fait) :
> `npm run storybook-generate -w @justin-croyable/storybook-host`

## Comment c'est câblé

| Élément | Rôle |
| --- | --- |
| `.storybook/main.ts` | Pointe vers les stories de la lib + addons on-device |
| `.storybook/preview.tsx` | Décorateur global : `ThemeProvider` + fond + toggle dark/light |
| `.storybook/index.tsx` | Monte l'UI Storybook (`view.getStorybookUI`) |
| `.storybook/storybook.requires.ts` | **Généré** par Metro/Storybook (ne pas éditer) |
| `tailwind.config.js` | Étend le preset du Design System |
| `global.css` | Directives Tailwind (les couleurs sont injectées au runtime) |
| `metro.config.js` | `withNxMetro` → `withNativeWind` → `withStorybook` |
| `.babelrc.js` | Ajoute le preset `nativewind/babel` |

### Points d'attention (Nx)

- `App.tsx` charge la racine Storybook via `require('../../.storybook')` : le
  fichier généré `storybook.requires.ts` reste hors du programme TypeScript
  (il n'émet pas de déclarations propres).
- `metro.config.js` passe `disableTypeScriptGeneration: true` à NativeWind pour
  éviter qu'il patche `tsconfig.json` (sinon conflit avec `nx sync`). Les types
  `className` viennent de `src/nativewind-env.d.ts`.
