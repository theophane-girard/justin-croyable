import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { ButtonComponent, provideZard } from '@justin-croyable/design-system';

/**
 * Point d'entrée de la cible `build` d'`angular.json`.
 *
 * Pourquoi il existe : le serveur de dev de Storybook impose un `browserTarget`
 * (`checkForLegacyBuildOptions` du framework rejette une configuration sans
 * cible Angular explicite). Storybook ne bundle pas ce fichier — il remplace le
 * point d'entrée par le sien — mais il lit la configuration de cette cible pour
 * les styles globaux, les assets et le tsconfig.
 *
 * Il fait donc office de référence minimale de câblage du DS dans une app :
 * `provideZard()` pour les événements clavier groupés, `provideRouter()` parce
 * que breadcrumb et header rendent des `routerLink`.
 *
 * Conséquence attendue : au démarrage, Angular signale ce fichier comme « part
 * of the TypeScript compilation but it's unused » — aucune story ne l'importe.
 * C'est normal, et le supprimer du programme casserait `ng build`.
 */
@Component({
  selector: 'app-root',
  imports: [ButtonComponent],
  template: `
    <main class="flex min-h-dvh flex-col items-center justify-center gap-4">
      <h1 class="text-lg font-medium">@justin-croyable/design-system</h1>
      <p class="text-sm text-muted-foreground">
        Cette page n'est qu'un point d'entrée de build. La documentation vivante est le Storybook.
      </p>
      <a appButton href="/">Ouvrir le Storybook</a>
    </main>
  `,
})
class AppComponent {}

bootstrapApplication(AppComponent, {
  providers: [provideZard(), provideRouter([])],
}).catch(error => console.error(error));
