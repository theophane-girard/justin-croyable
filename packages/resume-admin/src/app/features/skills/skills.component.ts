import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ButtonComponent,
  DialogService,
  EmptyComponent,
  TableComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type { ColDef, GridOptions, RowSelectedEvent } from 'ag-grid-community';

import { SkillStore } from '../../core/skill-store';
import { SKILL_ADD_LINK, SKILLS_LINK } from '../../app.routes';

type SkillRow = {
  readonly id: string;
  readonly label: string;
  readonly tagLabel: string;
  readonly tagType: string;
};

const SKILL_COLUMNS: ColDef<SkillRow>[] = [
  { field: 'label', headerName: 'Compétence', minWidth: 200, flex: 1 },
  { field: 'tagLabel', headerName: 'Tag', minWidth: 180 },
  { field: 'tagType', headerName: 'Type de tag', minWidth: 160 },
];

const SKILL_GRID_OPTIONS: GridOptions<SkillRow> = {
  rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
  pagination: true,
  paginationPageSize: 20,
  paginationPageSizeSelector: [20, 50, 100],
};

@Component({
  selector: 'app-skills',
  imports: [RouterLink, NgIcon, ButtonComponent, EmptyComponent, TableComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <h2 class="text-foreground text-lg font-semibold">Compétences</h2>
          <p class="text-muted-foreground text-sm">Chaque compétence est rattachée à un tag.</p>
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
          icon="phosphorSparkle"
          title="Aucune compétence"
          description="Ajoute une compétence et rattache-la à un tag existant."
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsComponent {
  readonly #store = inject(SkillStore);
  readonly #dialog = inject(DialogService);

  protected readonly columns = SKILL_COLUMNS;
  protected readonly gridOptions = SKILL_GRID_OPTIONS;
  protected readonly addLink = SKILL_ADD_LINK;

  protected readonly rows = computed<readonly SkillRow[]>(() =>
    this.#store.entries().map(skill => ({
      id: skill.id,
      label: skill.label,
      tagLabel: skill.tag.label,
      tagType: skill.tag.type,
    })),
  );

  protected readonly selectedId = signal<string>('');
  protected readonly editLink = computed(() => `${SKILLS_LINK}/${this.selectedId()}`);

  protected onRowSelected(event: RowSelectedEvent<SkillRow>): void {
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
      subject: 'cette compétence',
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
