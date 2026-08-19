import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { type UpsertProfilePayload } from '@justin-croyable/cv-contract';

import {
  ButtonComponent,
  CardComponent,
  DatePickerComponent,
  InputDirective,
  InputGroupComponent,
  type InputStatusVariants,
  TextareaComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { blankToNull, fromIsoDate, toIsoDate } from '../../core/iso-date';
import { ProfileStore } from '../../core/profile-store';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/\S+$/;

const INPUT_STATUS_ERROR = 'error' as const;

const EMAIL_HINT = 'Adresse de contact.';
const INVALID_EMAIL_HINT = 'Adresse e-mail invalide.';
const URL_HINT = 'Commence par https://';
const INVALID_URL_HINT = 'URL invalide : elle doit commencer par https://';

function isValidOptional(value: string, pattern: RegExp): boolean {
  const trimmed = value.trim();
  return trimmed === '' || pattern.test(trimmed);
}

function statusOf(invalid: boolean): InputStatusVariants | undefined {
  return invalid ? INPUT_STATUS_ERROR : undefined;
}

@Component({
  selector: 'app-profile',
  imports: [
    NgIcon,
    ButtonComponent,
    CardComponent,
    DatePickerComponent,
    InputDirective,
    InputGroupComponent,
    TextareaComponent,
  ],
  template: `
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <h2 class="text-foreground text-lg font-semibold">Profil</h2>
          <p class="text-muted-foreground text-sm">
            Informations personnelles affichées en tête du CV.
          </p>
        </div>
        <button
          appButton
          [loading]="saving()"
          [buttonDisabled]="!canSubmit() || saving()"
          (click)="onSave()"
        >
          <ng-icon name="phosphorFloppyDisk" class="size-4" />
          Enregistrer
        </button>
      </div>

      <app-card>
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <app-input-group label="Prénom" [required]="true">
            <input
              app-input
              placeholder="Justin"
              [value]="firstname()"
              (input)="onFirstname($event)"
            />
          </app-input-group>

          <app-input-group label="Nom" [required]="true">
            <input
              app-input
              placeholder="Croyable"
              [value]="lastname()"
              (input)="onLastname($event)"
            />
          </app-input-group>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Date de naissance</label>
            <app-date-picker
              placeholder="Choisir une date"
              format="d MMMM yyyy"
              type="outline"
              [value]="dateOfBirth()"
              (valueChange)="dateOfBirth.set($event)"
            />
          </div>

          <app-input-group label="Permis de conduire" hint="Par exemple « B ».">
            <input
              app-input
              placeholder="B"
              [value]="driverLicence()"
              (input)="onDriverLicence($event)"
            />
          </app-input-group>

          <app-input-group label="Email" [hint]="emailHint()">
            <input
              app-input
              type="email"
              placeholder="justin@example.com"
              [status]="emailStatus()"
              [value]="email()"
              (input)="onEmail($event)"
            />
          </app-input-group>

          <app-input-group label="Téléphone">
            <input
              app-input
              type="tel"
              placeholder="+33 6 12 34 56 78"
              [value]="phoneNumber()"
              (input)="onPhoneNumber($event)"
            />
          </app-input-group>

          <app-input-group label="Site web" [hint]="websiteHint()">
            <input
              app-input
              type="url"
              placeholder="https://justin.dev"
              [status]="websiteStatus()"
              [value]="website()"
              (input)="onWebsite($event)"
            />
          </app-input-group>

          <app-input-group label="LinkedIn" [hint]="linkedinHint()">
            <input
              app-input
              type="url"
              placeholder="https://linkedin.com/in/justin"
              [status]="linkedinStatus()"
              [value]="linkedin()"
              (input)="onLinkedin($event)"
            />
          </app-input-group>

          <app-input-group label="Adresse">
            <input
              app-input
              placeholder="12 rue des Lilas"
              [value]="streetName()"
              (input)="onStreetName($event)"
            />
          </app-input-group>

          <app-input-group label="Ville">
            <input app-input placeholder="Nantes" [value]="city()" (input)="onCity($event)" />
          </app-input-group>

          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="text-sm font-medium">Description</label>
            <textarea
              app-textarea
              rows="5"
              placeholder="Quelques lignes de présentation…"
              [value]="description()"
              (input)="onDescription($event)"
            ></textarea>
          </div>
        </div>
      </app-card>

      <p class="text-muted-foreground text-xs">
        L'enregistrement remplace le profil entier : un champ vidé est effacé du CV.
      </p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  readonly #store = inject(ProfileStore);

  protected readonly saving = this.#store.saving;

  protected readonly firstname = signal('');
  protected readonly lastname = signal('');
  protected readonly dateOfBirth = signal<Date | null>(null);
  protected readonly description = signal('');
  protected readonly phoneNumber = signal('');
  protected readonly driverLicence = signal('');
  protected readonly email = signal('');
  protected readonly website = signal('');
  protected readonly linkedin = signal('');
  protected readonly streetName = signal('');
  protected readonly city = signal('');

  protected readonly emailInvalid = computed(() => !isValidOptional(this.email(), EMAIL_PATTERN));
  protected readonly websiteInvalid = computed(() => !isValidOptional(this.website(), URL_PATTERN));
  protected readonly linkedinInvalid = computed(
    () => !isValidOptional(this.linkedin(), URL_PATTERN),
  );

  protected readonly emailStatus = computed(() => statusOf(this.emailInvalid()));
  protected readonly websiteStatus = computed(() => statusOf(this.websiteInvalid()));
  protected readonly linkedinStatus = computed(() => statusOf(this.linkedinInvalid()));

  protected readonly emailHint = computed(() =>
    this.emailInvalid() ? INVALID_EMAIL_HINT : EMAIL_HINT,
  );
  protected readonly websiteHint = computed(() =>
    this.websiteInvalid() ? INVALID_URL_HINT : URL_HINT,
  );
  protected readonly linkedinHint = computed(() =>
    this.linkedinInvalid() ? INVALID_URL_HINT : URL_HINT,
  );

  protected readonly canSubmit = computed(
    () =>
      this.firstname().trim() !== '' &&
      this.lastname().trim() !== '' &&
      !this.emailInvalid() &&
      !this.websiteInvalid() &&
      !this.linkedinInvalid(),
  );

  constructor() {
    effect(() => {
      const profile = this.#store.profile();
      if (!profile) {
        return;
      }
      this.firstname.set(profile.firstname);
      this.lastname.set(profile.lastname);
      this.dateOfBirth.set(fromIsoDate(profile.dateOfBirth));
      this.description.set(profile.description ?? '');
      this.phoneNumber.set(profile.phoneNumber ?? '');
      this.driverLicence.set(profile.driverLicence ?? '');
      this.email.set(profile.email ?? '');
      this.website.set(profile.website ?? '');
      this.linkedin.set(profile.linkedin ?? '');
      this.streetName.set(profile.streetName ?? '');
      this.city.set(profile.city ?? '');
    });
  }

  protected onFirstname(event: Event): void {
    this.firstname.set((event.target as HTMLInputElement).value);
  }

  protected onLastname(event: Event): void {
    this.lastname.set((event.target as HTMLInputElement).value);
  }

  protected onDescription(event: Event): void {
    this.description.set((event.target as HTMLTextAreaElement).value);
  }

  protected onPhoneNumber(event: Event): void {
    this.phoneNumber.set((event.target as HTMLInputElement).value);
  }

  protected onDriverLicence(event: Event): void {
    this.driverLicence.set((event.target as HTMLInputElement).value);
  }

  protected onEmail(event: Event): void {
    this.email.set((event.target as HTMLInputElement).value);
  }

  protected onWebsite(event: Event): void {
    this.website.set((event.target as HTMLInputElement).value);
  }

  protected onLinkedin(event: Event): void {
    this.linkedin.set((event.target as HTMLInputElement).value);
  }

  protected onStreetName(event: Event): void {
    this.streetName.set((event.target as HTMLInputElement).value);
  }

  protected onCity(event: Event): void {
    this.city.set((event.target as HTMLInputElement).value);
  }

  protected onSave(): void {
    if (!this.canSubmit()) {
      return;
    }
    const payload: UpsertProfilePayload = {
      firstname: this.firstname().trim(),
      lastname: this.lastname().trim(),
      dateOfBirth: toIsoDate(this.dateOfBirth()),
      description: blankToNull(this.description()),
      phoneNumber: blankToNull(this.phoneNumber()),
      driverLicence: blankToNull(this.driverLicence()),
      email: blankToNull(this.email()),
      website: blankToNull(this.website()),
      linkedin: blankToNull(this.linkedin()),
      streetName: blankToNull(this.streetName()),
      city: blankToNull(this.city()),
    };
    void this.#store.save(payload);
  }
}
