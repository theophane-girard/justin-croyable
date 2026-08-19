import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EXPERIENCE_TYPE } from '@justin-croyable/cv-contract';

import {
  ButtonComponent,
  DialogService,
  EmptyComponent,
  TableComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type { ColDef, GridOptions, RowSelectedEvent } from 'ag-grid-community';

import { ExperienceStore } from '../../core/experience-store';
import { EXPERIENCE_ADD_LINK, EXPERIENCES_LINK } from '../../app.routes';

type ExperienceRow = {
  readonly id: string;
  readonly title: string;
  readonly typeLabel: string;
  readonly period: string;
  readonly tags: string;
};

const TYPE_LABEL: Readonly<Record<string, string>> = {
  [EXPERIENCE_TYPE.job]: 'Professionnelle',
  [EXPERIENCE_TYPE.extra]: 'Extra',
};

const ONGOING_LABEL = 'en cours';

const EXPERIENCE_COLUMNS: ColDef<ExperienceRow>[] = [
  { field: 'title', headerName: 'Titre', minWidth: 220, flex: 1 },
  { field: 'typeLabel', headerName: 'Type', minWidth: 150 },
  { field: 'period', headerName: 'Période', minWidth: 200 },
  { field: 'tags', headerName: 'Tags', minWidth: 220, flex: 1 },
];

const EXPERIENCE_GRID_OPTIONS: GridOptions<ExperienceRow> = {
  rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
  pagination: true,
  paginationPageSize: 20,
  paginationPageSizeSelector: [20, 50, 100],
};

@Component({
  selector: 'app-experiences',
  imports: [RouterLink, NgIcon, ButtonComponent, EmptyComponent, TableComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <h2 class="text-foreground text-lg font-semibold">Expériences</h2>
          <p class="text-muted-foreground text-sm">
            Parcours professionnel et activités extra, triés du plus récent au plus ancien.
          </p>
        </div>
        <div class="flex items-center gap-2">
          @if (selectedId()) {
            <a appButton variant="outline" size="sm" [routerLink]="editLink()">
              <ng-icon name="phosphorPencilSimple" class="size-4" />
              Modifier
            </a>
            <button appButton variant="outline" size="sm" (click)="onDelete()">
              <ng-icon name="phosphorTrash" class="size-4" />
              Supprimer
            </button>
          }
          <a appButton size="sm" [routerLink]="addLink">
            <ng-icon name="phosphorPlus" class="size-4" />
            Ajouter
          </a>
        </div>
      </div>

      @if (rows().length > 0) {
        <app-table
          height="32rem"
          [rowData]="rows()"
          [columnDefs]="columns"
          [gridOptions]="gridOptions"
          (rowSelected)="onRowSelected($event)"
        />
      } @else {
        <app-empty
          icon="phosphorBriefcase"
          title="Aucune expérience"
          description="Ajoute ta première expérience pour alimenter le CV."
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperiencesComponent {
  readonly #store = inject(ExperienceStore);
  readonly #dialog = inject(DialogService);

  protected readonly columns = EXPERIENCE_COLUMNS;
  protected readonly gridOptions = EXPERIENCE_GRID_OPTIONS;
  protected readonly addLink = EXPERIENCE_ADD_LINK;

  protected readonly rows = computed<readonly ExperienceRow[]>(() =>
    this.#store.entries().map(experience => ({
      id: experience.id,
      title: experience.title,
      typeLabel: TYPE_LABEL[experience.type] ?? experience.type,
      period: `${experience.startDate} → ${experience.endDate ?? ONGOING_LABEL}`,
      tags: experience.tags.map(tag => tag.label).join(', '),
    })),
  );

  protected readonly selectedId = signal<string>('');
  protected readonly editLink = computed(() => `${EXPERIENCES_LINK}/${this.selectedId()}`);

  protected onRowSelected(event: RowSelectedEvent<ExperienceRow>): void {
    if (!event.node.isSelected()) {
      return;
    }
    this.selectedId.set(event.data?.id ?? '');
  }

  protected onDelete(): void {
    const id = this.selectedId();
    if (!id) {
      return;
    }
    this.#dialog.confirm({
      action: 'supprimer',
      subject: 'cette expérience',
      onOk: () => {
        void this.#store.remove(id).then(removed => {
          if (removed) {
            this.selectedId.set('');
          }
        });
      },
    });
  }
}
