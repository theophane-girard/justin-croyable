import { NgTemplateOutlet } from '@angular/common';
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
  EXPERIENCE_TYPE,
  type CreateExperiencePayload,
  type ExperienceType,
} from '@justin-croyable/cv-contract';

import {
  ButtonComponent,
  CardComponent,
  DatePickerComponent,
  InputDirective,
  InputGroupComponent,
  mergeClasses,
  MOBILE_SHEET_CONTENT_CLASSES,
  MOBILE_SHEET_ENTER_CLASSES,
  PopoverComponent,
  PopoverDirective,
  SelectImports,
  TextareaComponent,
  ViewportService,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { ExperienceStore } from '../../core/experience-store';
import { fromIsoDate, toIsoDate } from '../../core/iso-date';
import { TagStore } from '../../core/tag-store';
import { EXPERIENCES_LINK } from '../../app.routes';

type SelectOption = { readonly value: string; readonly label: string };

const CREATE_TITLE = 'Nouvelle expérience';
const EDIT_TITLE = "Modifier l'expérience";

const TYPE_OPTIONS: readonly SelectOption[] = [
  { value: EXPERIENCE_TYPE.job, label: 'Professionnelle' },
  { value: EXPERIENCE_TYPE.extra, label: 'Extra' },
];

const TITLE_MAX_LENGTH = 255;

const PREVIEW_PANEL_PADDING = 'p-4';

function isExperienceType(value: string): value is ExperienceType {
  return value === EXPERIENCE_TYPE.job || value === EXPERIENCE_TYPE.extra;
}

@Component({
  selector: 'app-experience-form',
  imports: [
    RouterLink,
    NgIcon,
    ...SelectImports,
    ButtonComponent,
    CardComponent,
    DatePickerComponent,
    InputDirective,
    InputGroupComponent,
    NgTemplateOutlet,
    PopoverComponent,
    PopoverDirective,
    TextareaComponent,
  ],
  template: `
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <h2 class="text-foreground text-lg font-semibold">{{ title() }}</h2>
          <p class="text-muted-foreground text-sm">
            Laisse la date de fin vide pour une expérience en cours.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <a appButton variant="outline" [routerLink]="experiencesLink">Annuler</a>
          <button appButton [buttonDisabled]="!canSubmit() || saving()" (click)="onSave()">
            <ng-icon name="phosphorFloppyDisk" class="size-4" />
            Enregistrer
          </button>
        </div>
      </div>

      <app-card>
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <app-input-group label="Titre" [required]="true">
            <input
              app-input
              [attr.maxlength]="titleMaxLength"
              placeholder="Développeur front-end"
              [value]="experienceTitle()"
              (input)="onTitle($event)"
            />
          </app-input-group>

          <app-select
            label="Type"
            [required]="true"
            [value]="type()"
            (valueChange)="onTypeChange($event)"
          >
            @for (option of typeOptions; track option.value) {
              <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
            }
          </app-select>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Date de début</label>
            <app-date-picker
              placeholder="Choisir une date"
              format="d MMMM yyyy"
              type="outline"
              [value]="startDate()"
              (valueChange)="startDate.set($event)"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Date de fin</label>
            <app-date-picker
              placeholder="En cours"
              format="d MMMM yyyy"
              type="outline"
              [value]="endDate()"
              (valueChange)="endDate.set($event)"
            />
            @if (datesInvalid()) {
              <p class="text-destructive text-xs">
                La date de fin doit être postérieure ou égale à la date de début.
              </p>
            }
          </div>

          <div class="flex flex-col gap-2 md:col-span-2">
            <app-select
              label="Tags"
              placeholder="Sélectionner des tags…"
              [multiple]="true"
              [withSearch]="true"
              [maxLabelCount]="4"
              [value]="tagIds()"
              (valueChange)="onTagsChange($event)"
            >
              @for (option of tagOptions(); track option.value) {
                <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
              }
            </app-select>
          </div>

          <div class="flex flex-col gap-2 md:col-span-2">
            <div class="flex items-center justify-between gap-2">
              <label class="text-sm font-medium">Description</label>
              @if (isMobile()) {
                <button
                  appButton
                  type="button"
                  variant="outline"
                  size="sm"
                  appPopover
                  mobileSheet
                  placement="top"
                  [content]="previewPanel"
                >
                  <ng-icon name="phosphorEye" class="size-4" />
                  Aperçu
                </button>
              }
            </div>
            <textarea
              app-textarea
              rows="10"
              class="font-mono text-xs"
              placeholder="&lt;p&gt;Missions, réalisations…&lt;/p&gt;"
              [value]="description()"
              (input)="onDescription($event)"
            ></textarea>
            <p class="text-muted-foreground text-xs">
              Contenu riche : le HTML saisi ici est renvoyé tel quel par l'API et rendu par le site
              CV. L'aperçu est nettoyé par Angular : scripts et attributs de style n'y apparaissent
              pas.
            </p>
          </div>
        </div>
      </app-card>

      @if (!isMobile()) {
        <app-card>
          <div class="flex flex-col gap-2">
            <p class="text-sm font-medium">Aperçu de la description</p>
            <div class="max-h-80 overflow-auto">
              <ng-container [ngTemplateOutlet]="previewBody" />
            </div>
          </div>
        </app-card>
      }
    </div>

    <ng-template #previewPanel>
      <app-popover [class]="previewPanelClasses()">
        <ng-container [ngTemplateOutlet]="previewBody" />
      </app-popover>
    </ng-template>

    <ng-template #previewBody>
      @if (hasDescription()) {
        <div
          class="text-foreground text-sm [&_a]:text-primary [&_a]:underline [&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_em]:italic [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:mb-1 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
          [innerHTML]="description()"
        ></div>
      } @else {
        <p class="text-muted-foreground text-sm">Rien à prévisualiser : la description est vide.</p>
      }
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceFormComponent {
  readonly id = input<string>('');

  readonly #store = inject(ExperienceStore);
  readonly #tags = inject(TagStore);
  readonly #router = inject(Router);

  protected readonly isMobile = inject(ViewportService).isMobile;

  protected readonly experiencesLink = EXPERIENCES_LINK;
  protected readonly typeOptions = TYPE_OPTIONS;
  protected readonly titleMaxLength = TITLE_MAX_LENGTH;
  protected readonly saving = signal(false);

  protected readonly experienceTitle = signal('');
  protected readonly type = signal<string>(EXPERIENCE_TYPE.job);
  protected readonly description = signal('');
  protected readonly startDate = signal<Date | null>(null);
  protected readonly endDate = signal<Date | null>(null);
  protected readonly tagIds = signal<string[]>([]);

  protected readonly title = computed(() => (this.id() ? EDIT_TITLE : CREATE_TITLE));

  protected readonly hasDescription = computed(() => this.description().trim() !== '');

  protected readonly previewPanelClasses = computed(() =>
    this.isMobile()
      ? mergeClasses(
          MOBILE_SHEET_CONTENT_CLASSES,
          MOBILE_SHEET_ENTER_CLASSES,
          PREVIEW_PANEL_PADDING,
        )
      : PREVIEW_PANEL_PADDING,
  );

  protected readonly tagOptions = computed<readonly SelectOption[]>(() =>
    this.#tags
      .entries()
      .map(tag => ({ value: tag.id, label: `${tag.type} · ${tag.label}` }))
      .sort((first, second) => first.label.localeCompare(second.label, 'fr')),
  );

  protected readonly datesInvalid = computed(() => {
    const start = toIsoDate(this.startDate());
    const end = toIsoDate(this.endDate());
    if (!start || !end) {
      return false;
    }
    return end < start;
  });

  protected readonly canSubmit = computed(
    () => this.experienceTitle().trim() !== '' && this.startDate() !== null && !this.datesInvalid(),
  );

  constructor() {
    effect(() => {
      const existing = this.#store.entries().find(experience => experience.id === this.id());
      if (!existing) {
        return;
      }
      this.experienceTitle.set(existing.title);
      this.type.set(existing.type);
      this.description.set(existing.description);
      this.startDate.set(fromIsoDate(existing.startDate));
      this.endDate.set(fromIsoDate(existing.endDate));
      this.tagIds.set(existing.tags.map(tag => tag.id));
    });
  }

  protected onTitle(event: Event): void {
    this.experienceTitle.set((event.target as HTMLInputElement).value);
  }

  protected onDescription(event: Event): void {
    this.description.set((event.target as HTMLTextAreaElement).value);
  }

  protected onTypeChange(value: string | string[] | null): void {
    if (typeof value !== 'string' || !isExperienceType(value)) {
      return;
    }
    this.type.set(value);
  }

  protected onTagsChange(value: string | string[] | null): void {
    if (!Array.isArray(value)) {
      return;
    }
    this.tagIds.set(value);
  }

  protected onSave(): void {
    const startDate = toIsoDate(this.startDate());
    const type = this.type();
    if (!this.canSubmit() || !startDate || !isExperienceType(type)) {
      return;
    }
    this.saving.set(true);
    const payload: CreateExperiencePayload = {
      type,
      title: this.experienceTitle().trim(),
      description: this.description(),
      startDate,
      endDate: toIsoDate(this.endDate()),
      tagIds: this.tagIds(),
    };
    const id = this.id();
    const request = id ? this.#store.update(id, payload) : this.#store.create(payload);
    void request
      .then(succeeded => {
        if (succeeded) {
          void this.#router.navigateByUrl(EXPERIENCES_LINK);
        }
      })
      .finally(() => this.saving.set(false));
  }
}
