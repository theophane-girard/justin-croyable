export * from './breadcrumb.component';
export * from './breadcrumb.variants';
// Absent du barrel d'origine, contrairement à select / command / tooltip /
// layout qui exportent tous leur tableau `*Imports`. Ajouté pour que les
// consommateurs puissent importer le groupe de composants en une fois.
export * from './breadcrumb.imports';
