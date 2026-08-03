// Import de contenu brut de fichier via le suffixe `?raw` de Vite (utilisé par
// `preview.ts` pour injecter le CSS des palettes du DS au runtime). Vite fournit
// le contenu ; ce module ambiant donne le type au compilateur Angular.
declare module '*.css?raw' {
  const content: string;
  export default content;
}
