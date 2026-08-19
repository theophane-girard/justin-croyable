import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  ButtonComponent,
  CardComponent,
  InputDirective,
  InputGroupComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { blankToNull } from '../../core/iso-date';
import { TagStore } from '../../core/tag-store';
import { TAGS_LINK } from '../../app.routes';

const CREATE_TITLE = 'Nouveau tag';
const EDIT_TITLE = 'Modifier le tag';

@Component({
  selector: 'app-tag-form',
  imports: [
    RouterLink,
    NgIcon,
    ButtonComponent,
    CardComponent,
    InputDirective,
    InputGroupComponent,
  ],
  template: `
    <div class="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <h2 class="text-foreground text-lg font-semibold">{{ title() }}</h2>
          <p class="text-muted-foreground text-sm">
            Un tag regroupe des expériences et des compétences par thème.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <a appButton variant="outline" [routerLink]="tagsLink">Annuler</a>
          <button appButton [buttonDisabled]="!canSubmit() || saving()" (click)="onSave()">
            <ng-icon name="phosphorFloppyDisk" class="size-4" />
            Enregistrer
          </button>
        </div>
      </div>

      <app-card>
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <app-input-group label="Libellé" [required]="true">
            <input app-input placeholder="Angular" [value]="label()" (input)="onLabel($event)" />
          </app-input-group>

          <app-input-group
            label="Type"
            [required]="true"
            hint="Regroupe les tags : techno, soft-skill, langue…"
          >
            <input app-input placeholder="techno" [value]="type()" (input)="onType($event)" />
          </app-input-group>

          <app-input-group label="Icône" hint="Nom d'icône Phosphor, par exemple phosphorCode.">
            <input app-input placeholder="phosphorCode" [value]="icon()" (input)="onIcon($event)" />
          </app-input-group>

          <app-input-group label="Image" hint="URL d'un logo, facultatif.">
            <input
              app-input
              type="url"
              placeholder="https://…/angular.svg"
              [value]="img()"
              (input)="onImg($event)"
            />
          </app-input-group>
        </div>
      </app-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagFormComponent {
  readonly id = input<string>('');

  readonly #store = inject(TagStore);
  readonly #router = inject(Router);

  protected readonly tagsLink = TAGS_LINK;
  protected readonly saving = signal(false);

  protected readonly label = signal('');
  protected readonly type = signal('');
  protected readonly icon = signal('');
  protected readonly img = signal('');

  protected readonly title = computed(() => (this.id() ? EDIT_TITLE : CREATE_TITLE));

  protected readonly canSubmit = computed(
    () => this.label().trim() !== '' && this.type().trim() !== '',
  );

  constructor() {
    effect(() => {
      const existing = this.#store.byId().get(this.id());
      if (!existing) {
        return;
      }
      this.label.set(existing.label);
      this.type.set(existing.type);
      this.icon.set(existing.icon ?? '');
      this.img.set(existing.img ?? '');
    });
  }

  protected onLabel(event: Event): void {
    this.label.set((event.target as HTMLInputElement).value);
  }

  protected onType(event: Event): void {
    this.type.set((event.target as HTMLInputElement).value);
  }

  protected onIcon(event: Event): void {
    this.icon.set((event.target as HTMLInputElement).value);
  }

  protected onImg(event: Event): void {
    this.img.set((event.target as HTMLInputElement).value);
  }

  protected onSave(): void {
    if (!this.canSubmit()) {
      return;
    }
    this.saving.set(true);
    const payload = {
      label: this.label().trim(),
      type: this.type().trim(),
      icon: blankToNull(this.icon()),
      img: blankToNull(this.img()),
    };
    const id = this.id();
    const request = id ? this.#store.update(id, payload) : this.#store.create(payload);
    void request
      .then(succeeded => {
        if (succeeded) {
          void this.#router.navigateByUrl(TAGS_LINK);
        }
      })
      .finally(() => this.saving.set(false));
  }
}
