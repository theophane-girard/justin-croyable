import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type Tag } from '@justin-croyable/cv-contract';

import {
  ButtonComponent,
  DialogService,
  EmptyComponent,
  TableComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type { ColDef, GridOptions, RowSelectedEvent } from 'ag-grid-community';

import { TagStore } from '../../core/tag-store';
import { TAG_ADD_LINK, TAGS_LINK } from '../../app.routes';

const TAG_COLUMNS: ColDef<Tag>[] = [
  { field: 'label', headerName: 'Libellé', minWidth: 180, flex: 1 },
  { field: 'type', headerName: 'Type', minWidth: 140 },
  { field: 'icon', headerName: 'Icône', minWidth: 160 },
  { field: 'img', headerName: 'Image', minWidth: 200, flex: 1 },
];

const TAG_GRID_OPTIONS: GridOptions<Tag> = {
  rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
  pagination: true,
  paginationPageSize: 20,
  paginationPageSizeSelector: [20, 50, 100],
};

@Component({
  selector: 'app-tags',
  imports: [RouterLink, NgIcon, ButtonComponent, EmptyComponent, TableComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <h2 class="text-foreground text-lg font-semibold">Tags</h2>
          <p class="text-muted-foreground text-sm">
            Étiquettes réutilisées par les expériences et les compétences.
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
          icon="phosphorTag"
          title="Aucun tag"
          description="Crée un premier tag pour classer tes expériences et compétences."
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagsComponent {
  readonly #store = inject(TagStore);
  readonly #dialog = inject(DialogService);

  protected readonly columns = TAG_COLUMNS;
  protected readonly gridOptions = TAG_GRID_OPTIONS;
  protected readonly addLink = TAG_ADD_LINK;

  protected readonly rows = computed(() => [...this.#store.entries()]);
  protected readonly selectedId = signal<string>('');
  protected readonly editLink = computed(() => `${TAGS_LINK}/${this.selectedId()}`);

  protected onRowSelected(event: RowSelectedEvent<Tag>): void {
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
      subject: 'ce tag',
      desc: 'Il sera détaché des expériences concernées. Un tag utilisé par une compétence ne peut pas être supprimé.',
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
