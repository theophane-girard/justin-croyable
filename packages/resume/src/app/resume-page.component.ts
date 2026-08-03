import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import {
  AvatarComponent,
  BadgeComponent,
  ButtonComponent,
  CardComponent,
  SeparatorComponent,
  ThemeService,
} from '@justin-croyable/design-system';

import { ICON } from './resume.icons';
import { RESUME } from './resume.data';

@Component({
  selector: 'app-resume-page',
  imports: [
    NgIcon,
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    SeparatorComponent,
  ],
  template: `
    <div class="min-h-screen">
      <div class="mx-auto flex max-w-4xl justify-end px-4 pt-6 sm:px-6 lg:px-8">
        <button
          appButton
          type="button"
          variant="ghost"
          size="icon-sm"
          [attr.aria-label]="themeLabel()"
          (click)="themeService.toggle()"
        >
          <ng-icon [name]="themeIcon()" />
        </button>
      </div>

      <main class="mx-auto max-w-4xl space-y-6 px-4 pt-4 pb-16 sm:px-6 lg:px-8">
        <app-card>
          <div class="flex flex-col gap-6 sm:flex-row sm:items-start">
            <app-avatar
              size="lg"
              class="shrink-0"
              [fallback]="resume.initials"
            />
            <div class="space-y-4">
              <div class="space-y-1">
                <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {{ resume.fullName }}
                </h1>
                <p class="text-muted-foreground text-base">
                  {{ resume.title }}
                </p>
              </div>
              <p
                class="text-muted-foreground max-w-2xl text-sm leading-relaxed"
              >
                {{ resume.summary }}
              </p>
              <ul class="flex flex-wrap gap-2">
                @for (contact of resume.contacts; track contact.label) {
                  <li>
                    <a
                      appButton
                      variant="ghost"
                      size="sm"
                      [href]="contact.href"
                      [attr.aria-label]="contact.label"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ng-icon [name]="contact.icon" />
                      <span>{{ contact.value }}</span>
                    </a>
                  </li>
                }
              </ul>
            </div>
          </div>
        </app-card>

        <div class="grid gap-6 lg:grid-cols-3">
          <div class="space-y-6 lg:col-span-2">
            <app-card [title]="sectionTitles.experience">
              <div class="space-y-5">
                @for (
                  experience of resume.experiences;
                  track experience.role;
                  let last = $last
                ) {
                  <div class="space-y-2">
                    <div
                      class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"
                    >
                      <h3 class="font-medium">{{ experience.role }}</h3>
                      <span class="text-muted-foreground text-sm">{{
                        experience.period
                      }}</span>
                    </div>
                    <p class="text-muted-foreground text-sm">
                      {{ experience.company }} · {{ experience.location }}
                    </p>
                    <p class="text-sm leading-relaxed">
                      {{ experience.summary }}
                    </p>
                    <ul
                      class="text-muted-foreground list-disc space-y-1 pl-5 text-sm"
                    >
                      @for (
                        highlight of experience.highlights;
                        track highlight
                      ) {
                        <li>{{ highlight }}</li>
                      }
                    </ul>
                  </div>
                  @if (!last) {
                    <app-separator />
                  }
                }
              </div>
            </app-card>

            <app-card [title]="sectionTitles.education">
              <div class="space-y-4">
                @for (
                  item of resume.education;
                  track item.degree;
                  let last = $last
                ) {
                  <div class="space-y-1">
                    <div
                      class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"
                    >
                      <h3 class="font-medium">{{ item.degree }}</h3>
                      <span class="text-muted-foreground text-sm">{{
                        item.period
                      }}</span>
                    </div>
                    <p class="text-muted-foreground text-sm">
                      {{ item.school }}
                    </p>
                  </div>
                  @if (!last) {
                    <app-separator />
                  }
                }
              </div>
            </app-card>
          </div>

          <div class="space-y-6">
            <app-card [title]="sectionTitles.skills">
              <div class="space-y-4">
                @for (group of resume.skillGroups; track group.title) {
                  <div class="space-y-2">
                    <h3 class="text-sm font-medium">{{ group.title }}</h3>
                    <ul class="flex flex-wrap gap-1.5">
                      @for (skill of group.items; track skill) {
                        <li>
                          <app-badge type="secondary">{{ skill }}</app-badge>
                        </li>
                      }
                    </ul>
                  </div>
                }
              </div>
            </app-card>

            <app-card [title]="sectionTitles.languages">
              <ul class="space-y-3">
                @for (
                  language of resume.languages;
                  track language.name;
                  let last = $last
                ) {
                  <li class="space-y-3">
                    <div class="flex items-center justify-between gap-3">
                      <span class="text-sm font-medium">{{
                        language.name
                      }}</span>
                      <span class="text-muted-foreground text-sm">{{
                        language.level
                      }}</span>
                    </div>
                    @if (!last) {
                      <app-separator />
                    }
                  </li>
                }
              </ul>
            </app-card>
          </div>
        </div>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumePageComponent {
  protected readonly resume = RESUME;
  protected readonly themeService = inject(ThemeService);

  protected readonly sectionTitles = {
    experience: 'Expérience',
    education: 'Formation',
    skills: 'Compétences',
    languages: 'Langues',
  };

  protected readonly themeIcon = computed(() =>
    this.themeService.isDark() ? ICON.sun : ICON.moon,
  );

  protected readonly themeLabel = computed(() =>
    this.themeService.isDark() ? this.#labelLightMode : this.#labelDarkMode,
  );

  readonly #labelDarkMode = 'Activer le thème sombre';
  readonly #labelLightMode = 'Activer le thème clair';
}
