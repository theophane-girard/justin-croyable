# @justin-croyable/mobile-ds

Design System React Native basé sur **NativeWind** (Tailwind CSS pour React Native).

- 🎨 Styling via classes Tailwind (`className`)
- 🌗 Dark / light mode intégré
- 🛠️ **Personnalisable par projet** via des variables de thème (couleurs + rayon),
  sans toucher au code des composants
- 🧱 Composants prêts à l'emploi : `Text`, `Button`, `Card`, `Input`, `Badge`

## Comment ça marche

Les composants n'utilisent que des **tokens sémantiques** (`bg-primary`,
`text-foreground`, `border-border`…). Ces tokens pointent vers des **variables CSS**
(`--color-primary`, …) injectées au runtime par le `ThemeProvider`.

Conséquence :

- changer de thème = passer un autre objet `theme` au provider ;
- dark / light = le provider échange simplement le jeu de variables.

## Installation dans une application

> Les dépendances (`nativewind`, `tailwindcss`, `react-native-reanimated`,
> `react-native-safe-area-context`) sont déjà présentes dans le monorepo. Pour un
> projet externe, installez-les en plus de cette lib.

### 1. `tailwind.config.js` (à la racine de l'app)

```js
module.exports = {
  presets: [require('@justin-croyable/mobile-ds/tailwind.preset')],
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    // indispensable pour que Tailwind voie les classes du Design System
    './node_modules/@justin-croyable/mobile-ds/src/**/*.{ts,tsx}',
  ],
};
```

### 2. `global.css`

Importez la feuille fournie (ou créez la vôtre avec les mêmes directives) **une
seule fois** à l'entrée de l'app :

```ts
import '@justin-croyable/mobile-ds/global.css';
```

### 3. `metro.config.js`

```js
const { withNativeWind } = require('nativewind/metro');
// ... config metro existante ...
module.exports = withNativeWind(config, { input: './global.css' });
```

### 4. `babel.config.js`

```js
module.exports = {
  presets: [
    ['babel-preset-expo', { jsxImportSource: 'nativewind' }], // ou le preset RN
    'nativewind/babel',
  ],
};
```

### 5. Envelopper l'app dans le `ThemeProvider`

```tsx
import { ThemeProvider } from '@justin-croyable/mobile-ds';

export default function App() {
  return (
    <ThemeProvider defaultMode="system">
      <RootNavigator />
    </ThemeProvider>
  );
}
```

## Personnaliser le thème d'un projet

`createTheme` ne redéfinit que ce que vous voulez ; le reste vient du thème par défaut.

```tsx
import { ThemeProvider, createTheme } from '@justin-croyable/mobile-ds';

// Les couleurs sont des canaux RGB ("R G B") pour gérer l'opacité (bg-primary/50).
const theme = createTheme({
  light: { primary: '124 58 237', primaryForeground: '255 255 255' }, // violet
  dark: { primary: '167 139 250' },
  radius: 12,
});

<ThemeProvider theme={theme} defaultMode="system">
  <App />
</ThemeProvider>;
```

Tokens disponibles (light + dark) : `background`, `foreground`, `border`, `input`,
`ring`, `card` / `cardForeground`, `primary` / `primaryForeground`,
`secondary` / `secondaryForeground`, `muted` / `mutedForeground`,
`accent` / `accentForeground`, `destructive` / `destructiveForeground`,
`success` / `successForeground`, plus `radius`.

## Dark mode

- `defaultMode="system"` (défaut) suit le réglage de l'appareil.
- Pour basculer manuellement :

```tsx
import { useTheme } from '@justin-croyable/mobile-ds';

function ThemeToggle() {
  const { mode, toggleMode } = useTheme();
  return <Button onPress={toggleMode}>{mode === 'dark' ? '☀️' : '🌙'}</Button>;
}
```

## Exemple d'utilisation des composants

```tsx
import {
  Card, CardHeader, CardTitle, CardContent, CardFooter,
  Text, Button, Input, Badge,
} from '@justin-croyable/mobile-ds';

<Card>
  <CardHeader>
    <CardTitle>Connexion</CardTitle>
    <Badge variant="success">Actif</Badge>
  </CardHeader>
  <CardContent>
    <Input label="Email" placeholder="vous@exemple.com" keyboardType="email-address" />
    <Input label="Mot de passe" secureTextEntry error="Mot de passe requis" />
  </CardContent>
  <CardFooter>
    <Button variant="outline">Annuler</Button>
    <Button className="flex-1">Se connecter</Button>
  </CardFooter>
</Card>;
```

## Visualiser les composants (Storybook)

Chaque composant a ses stories colocalisées (`*.stories.tsx`). Elles sont
affichées par l'app [`@justin-croyable/storybook-host`](../../packages/storybook-host)
(Storybook on-device, avec bascule dark/light) :

```sh
# Dans le navigateur (le plus rapide, sans émulateur)
npm run storybook-web -w @justin-croyable/storybook-host   # http://localhost:6006

# Ou on-device (rendu natif réel)
nx start @justin-croyable/storybook-host      # bundler Metro
nx run-android @justin-croyable/storybook-host # ou run-ios
```

## Tests

```sh
nx test @justin-croyable/mobile-ds
nx lint @justin-croyable/mobile-ds
nx typecheck @justin-croyable/mobile-ds
```
