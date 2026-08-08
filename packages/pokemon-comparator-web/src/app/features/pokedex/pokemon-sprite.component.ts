import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';

import { SkeletonComponent } from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-pokemon-sprite',
  imports: [SkeletonComponent, NgIcon],
  template: `
    <span class="relative inline-flex shrink-0" [class]="class()">
      @if (!loaded() && !errored()) {
        <app-skeleton class="absolute inset-0 size-full rounded-full" />
      }
      @if (errored()) {
        <span
          class="bg-muted text-muted-foreground grid size-full place-items-center rounded-full"
        >
          <ng-icon name="phosphorImageBroken" class="size-1/2" />
        </span>
      } @else {
        <img
          [src]="src()"
          [alt]="alt()"
          class="size-full rounded-full object-cover transition-opacity"
          [class.opacity-0]="!loaded()"
          (load)="loaded.set(true)"
          (error)="errored.set(true)"
        />
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonSpriteComponent {
  readonly src = input.required<string>();
  readonly alt = input<string>('');
  readonly class = input<string>('');

  protected readonly loaded = signal(false);
  protected readonly errored = signal(false);

  constructor() {
    effect(() => {
      this.src();
      this.loaded.set(false);
      this.errored.set(false);
    });
  }
}
