import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  colorSchemeDark,
  colorSchemeLight,
  themeQuartz,
  type ColDef,
  type GridOptions,
  type GridReadyEvent,
  type RowSelectedEvent,
} from 'ag-grid-community';
import type { ClassValue } from 'clsx';

import { ThemeService } from '../../core/services/theme.service';
import { TABLE_DEFAULTS } from '../../providers/tokens';
import { mergeClasses } from '../../utils/merge-classes';

import { buildLazyLoadDatasource, type LazyLoadConfig } from './lazy-load';

@Component({
  selector: 'app-table',
  imports: [AgGridAngular],
  template: `
    <ag-grid-angular
      class="size-full"
      [theme]="theme()"
      [rowData]="effectiveRowData()"
      [columnDefs]="columnDefs()"
      [defaultColDef]="resolvedDefaultColDef()"
      [gridOptions]="resolvedGridOptions()"
      (gridReady)="gridReady.emit($event)"
      (rowSelected)="rowSelected.emit($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    '[style.height]': 'height()',
  },
  exportAs: 'appTable',
})
export class TableComponent<TRow = unknown> {
  private readonly themeService = inject(ThemeService);
  private readonly defaults = inject(TABLE_DEFAULTS);
  private readonly injector = inject(Injector);

  readonly rowData = input<TRow[]>([]);
  readonly columnDefs = input<ColDef<TRow>[]>([]);
  readonly defaultColDef = input<ColDef<TRow> | undefined>(undefined);
  readonly gridOptions = input<GridOptions<TRow> | undefined>(undefined);
  readonly lazyloadConfig = input<LazyLoadConfig<TRow> | undefined>(undefined);
  readonly height = input<string>('24rem');
  readonly class = input<ClassValue>('');

  readonly gridReady = output<GridReadyEvent<TRow>>();
  readonly rowSelected = output<RowSelectedEvent<TRow>>();

  protected readonly classes = computed(() => mergeClasses('block w-full', this.class()));

  private readonly lazyDatasource = buildLazyLoadDatasource<TRow>(this.lazyloadConfig, this.injector);

  protected readonly effectiveRowData = computed(() => (this.lazyloadConfig() ? undefined : this.rowData()));

  /**
   * AG Grid est du DOM, pas un canvas : ses paramètres de thème acceptent donc
   * les variables CSS du DS et suivent le thème sans intervention. Seule la
   * partie de schéma light / dark doit être permutée, car elle porte ses propres
   * valeurs par défaut.
   */
  protected readonly theme = computed(() =>
    themeQuartz
      .withPart(this.themeService.isDark() ? colorSchemeDark : colorSchemeLight)
      .withParams({
        accentColor: 'var(--primary)',
        backgroundColor: 'var(--background)',
        foregroundColor: 'var(--foreground)',
        borderColor: 'var(--border)',
        chromeBackgroundColor: 'var(--muted)',
        headerTextColor: 'var(--muted-foreground)',
        rowHoverColor: 'var(--accent)',
        selectedRowBackgroundColor: 'var(--accent)',
        borderRadius: 'var(--radius-md)',
        wrapperBorderRadius: 'var(--radius-lg)',
        fontFamily: 'inherit',
      }),
  );

  protected readonly resolvedDefaultColDef = computed<ColDef<TRow>>(() => ({
    sortable: true,
    resizable: true,
    flex: 1,
    minWidth: 120,
    ...this.defaultColDef(),
  }));

  protected readonly resolvedGridOptions = computed<GridOptions<TRow>>(() => {
    const base: GridOptions<TRow> = {
      rowHeight: this.defaults.rowHeight,
      headerHeight: this.defaults.headerHeight,
      pagination: this.defaults.pagination,
      paginationPageSize: this.defaults.paginationPageSize,
    };

    const lazy = this.lazyloadConfig();
    if (lazy) {
      return {
        ...base,
        rowModelType: 'infinite',
        datasource: this.lazyDatasource.datasource,
        cacheBlockSize: lazy.blockSize ?? this.defaults.paginationPageSize,
        maxConcurrentDatasourceRequests: lazy.maxConcurrentRequests ?? 1,
        infiniteInitialRowCount: lazy.initialRowCount ?? 1,
        maxBlocksInCache: lazy.maxBlocksInCache,
        ...this.gridOptions(),
      };
    }

    return { ...base, ...this.gridOptions() };
  });
}
