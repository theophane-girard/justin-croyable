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
  EmptyComponent,
  InputDirective,
  InputGroupComponent,
  SelectImports,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { SkillStore } from '../../core/skill-store';
import { TagStore } from '../../core/tag-store';
import { SKILLS_LINK, TAG_ADD_LINK } from '../../app.routes';

type TagOption = { readonly value: string; readonly label: string };

const CREATE_TITLE = 'Nouvelle compétence';
const EDIT_TITLE = 'Modifier la compétence';

@Component({
  selector: 'app-skill-form',
  imports: [
    RouterLink,
    NgIcon,
    ...SelectImports,
    ButtonComponent,
    CardComponent,
    EmptyComponent,
    InputDirective,
    InputGroupComponent,
  ],
  template: `
    <div class="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <h2 class="text-foreground text-lg font-semibold">{{ title() }}</h2>
          <p class="text-muted-foreground text-sm">Une compétence appartient à un tag.</p>
        </div>
        <div class="flex items-center gap-2">
          <a appButton variant="outline" [routerLink]="skillsLink">Annuler</a>
          <button appButton [buttonDisabled]="!canSubmit() || saving()" (click)="onSave()">
            <ng-icon name="phosphorFloppyDisk" class="size-4" />
            Enregistrer
          </button>
        </div>
      </div>

      @if (tagOptions().length === 0) {
        <app-empty
          icon="phosphorTag"
          title="Aucun tag disponible"
          description="Crée d'abord un tag : chaque compétence doit en référencer un."
        />
        <div class="flex justify-center">
          <a appButton variant="outline" [routerLink]="tagAddLink">
            <ng-icon name="phosphorPlus" class="size-4" />
            Créer un tag
          </a>
        </div>
      } @else {
        <app-card>
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <app-input-group label="Libellé" [required]="true">
              <input app-input placeholder="Signals" [value]="label()" (input)="onLabel($event)" />
            </app-input-group>

            <app-select
              label="Tag"
              placeholder="Sélectionner un tag…"
              [required]="true"
              [withSearch]="true"
              [value]="tagId()"
              (valueChange)="onTagChange($event)"
            >
              @for (option of tagOptions(); track option.value) {
                <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
              }
            </app-select>
          </div>
        </app-card>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillFormComponent {
  readonly id = input<string>('');

  readonly #store = inject(SkillStore);
  readonly #tags = inject(TagStore);
  readonly #router = inject(Router);

  protected readonly skillsLink = SKILLS_LINK;
  protected readonly tagAddLink = TAG_ADD_LINK;
  protected readonly saving = signal(false);

  protected readonly label = signal('');
  protected readonly tagId = signal('');

  protected readonly title = computed(() => (this.id() ? EDIT_TITLE : CREATE_TITLE));

  protected readonly tagOptions = computed<readonly TagOption[]>(() =>
    this.#tags
      .entries()
      .map(tag => ({ value: tag.id, label: `${tag.type} · ${tag.label}` }))
      .sort((first, second) => first.label.localeCompare(second.label, 'fr')),
  );

  protected readonly canSubmit = computed(() => this.label().trim() !== '' && this.tagId() !== '');

  constructor() {
    effect(() => {
      const existing = this.#store.entries().find(skill => skill.id === this.id());
      if (!existing) {
        return;
      }
      this.label.set(existing.label);
      this.tagId.set(existing.tagId);
    });
  }

  protected onLabel(event: Event): void {
    this.label.set((event.target as HTMLInputElement).value);
  }

  protected onTagChange(value: string | string[] | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.tagId.set(value);
  }

  protected onSave(): void {
    if (!this.canSubmit()) {
      return;
    }
    this.saving.set(true);
    const payload = { label: this.label().trim(), tagId: this.tagId() };
    const id = this.id();
    const request = id ? this.#store.update(id, payload) : this.#store.create(payload);
    void request
      .then(succeeded => {
        if (succeeded) {
          void this.#router.navigateByUrl(SKILLS_LINK);
        }
      })
      .finally(() => this.saving.set(false));
  }
}
