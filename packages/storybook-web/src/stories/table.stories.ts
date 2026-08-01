import { type LazyLoadConfig, TableComponent } from '@justin-croyable/design-system';
import type { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { delay, type Observable, of } from 'rxjs';
import { expect, waitFor } from 'storybook/test';

type Membre = {
  nom: string;
  role: string;
  equipe: string;
  contributions: number;
  actif: boolean;
};

type TableArgs = {
  rowData: Membre[];
  columnDefs: ColDef<Membre>[];
  height: string;
};

const membres: Membre[] = [
  { nom: 'Théophane Girard', role: 'Propriétaire', equipe: 'Plateforme', contributions: 412, actif: true },
  { nom: 'Maëlle Dupont', role: 'Éditrice', equipe: 'Design', contributions: 287, actif: true },
  { nom: 'Jean Rousseau', role: 'Utilisateur', equipe: 'Support', contributions: 96, actif: false },
  { nom: 'Amina Cherif', role: 'Éditrice', equipe: 'Plateforme', contributions: 341, actif: true },
  { nom: 'Luc Bernard', role: 'Utilisateur', equipe: 'Ventes', contributions: 54, actif: false },
];

const colonnes: ColDef<Membre>[] = [
  { field: 'nom', headerName: 'Nom', minWidth: 200 },
  { field: 'role', headerName: 'Rôle' },
  { field: 'equipe', headerName: 'Équipe' },
  { field: 'contributions', headerName: 'Contributions', type: 'numericColumn' },
  {
    field: 'actif',
    headerName: 'Actif',
    valueFormatter: params => (params.value ? 'Oui' : 'Non'),
  },
];

const meta: Meta<TableArgs> = {
  title: 'Composants/Table',
  component: TableComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Enveloppe `ag-grid-angular` (édition community). Le thème est construit avec l'API de thème d'AG Grid en pointant les variables CSS du DS : le tableau étant du DOM et non un canvas, il suit le thème sans JavaScript. Seule la partie de schéma clair / sombre est permutée au changement de thème. Nécessite `withTables()` dans les providers de l'application, qui enregistre les modules community.",
      },
    },
  },
  argTypes: {
    rowData: { control: 'object' },
    columnDefs: { control: false },
    height: { control: 'text' },
  },
  args: { rowData: membres, columnDefs: colonnes, height: '24rem' },
  render: args => ({
    props: args,
    template: `<app-table [rowData]="rowData" [columnDefs]="columnDefs" [height]="height" />`,
  }),
};

export default meta;
type Story = StoryObj<TableArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.ag-root-wrapper')).toBeTruthy();
    });

    // Une grille montée mais vide passerait un simple test de présence.
    await waitFor(() => {
      expect(canvasElement.querySelectorAll('.ag-row').length).toBe(membres.length);
    });

    const entetes = [...canvasElement.querySelectorAll('.ag-header-cell-text')].map(cell =>
      cell.textContent?.trim(),
    );
    expect(entetes).toContain('Contributions');
  },
};

export const Paginated: Story = {
  render: args => ({
    props: {
      ...args,
      rowData: Array.from({ length: 60 }, (_, index) => ({
        ...membres[index % membres.length],
        nom: `${membres[index % membres.length].nom} ${index + 1}`,
        contributions: 40 + index * 7,
      })),
      // La taille de page doit figurer dans le sélecteur, sinon AG Grid la
      // refuse et retombe sur sa valeur par défaut.
      gridOptions: {
        pagination: true,
        paginationPageSize: 10,
        paginationPageSizeSelector: [10, 20, 50],
      },
    },
    template: `
      <app-table
        [rowData]="rowData"
        [columnDefs]="columnDefs"
        [gridOptions]="gridOptions"
        height="28rem"
      />
    `,
  }),
};

export const MultipleSelection: Story = {
  render: args => ({
    props: {
      ...args,
      gridOptions: { rowSelection: { mode: 'multiRow' } },
    },
    template: `
      <app-table [rowData]="rowData" [columnDefs]="columnDefs" [gridOptions]="gridOptions" />
    `,
  }),
};

export const Empty: Story = {
  args: { rowData: [] },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.ag-root-wrapper')).toBeTruthy();
    });
    expect(canvasElement.querySelectorAll('.ag-row').length).toBe(0);
  },
};

// Jeu de données « serveur » : 500 lignes générées à la volée, jamais chargées
// d'un bloc. Le fetcher n'en matérialise que la fenêtre réclamée.
const TOTAL_LIGNES = 500;

function ligneServeur(index: number): Membre {
  const modele = membres[index % membres.length];
  return {
    ...modele,
    nom: `Membre ${index + 1}`,
    contributions: 40 + index * 3,
    actif: index % 3 !== 0,
  };
}

// Builder de datasource AG Grid : chaque bloc est un `Observable`. Un délai
// simule la latence réseau et donne à voir l'annulation — un scroll rapide
// remplace la requête en vol avant qu'elle ne réponde.
const lazyloadConfig: LazyLoadConfig<Membre> = {
  blockSize: 25,
  fetchRows: (request): Observable<{ rows: Membre[]; lastRow: number }> => {
    const rows: Membre[] = [];
    for (let index = request.startRow; index < Math.min(request.endRow, TOTAL_LIGNES); index++) {
      rows.push(ligneServeur(index));
    }
    return of({ rows, lastRow: TOTAL_LIGNES }).pipe(delay(50));
  },
};

// Partagé entre `render` (qui capte l'API sur `gridReady`) et `play` : les props
// retournées par `render` ne transitent pas par les `args` de la story.
let apiLazyLoading: GridApi<Membre> | undefined;

export const LazyLoading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Rendu paresseux en infinite scroll via `lazyloadConfig`. Les lignes ne sont pas passées à `rowData` : le tableau bascule sur le row model `infinite` d'AG Grid et réclame chaque bloc au `fetchRows` de la config, qui retourne un `Observable`. Le builder pilote un `rxResource` : dès qu'un nouveau bloc est réclamé, le flux précédent encore en vol est annulé (désabonnement + `AbortSignal`), ce qui évite qu'une réponse tardive n'écrase le bloc réellement affiché lors d'un scroll rapide.",
      },
    },
  },
  render: () => {
    apiLazyLoading = undefined;
    return {
      props: {
        columnDefs: colonnes,
        lazyloadConfig,
        onReady: (event: GridReadyEvent<Membre>) => {
          apiLazyLoading = event.api;
        },
      },
      template: `
        <app-table
          [columnDefs]="columnDefs"
          [lazyloadConfig]="lazyloadConfig"
          (gridReady)="onReady($event)"
          height="28rem"
        />
      `,
    };
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.ag-root-wrapper')).toBeTruthy();
      expect(apiLazyLoading).toBeTruthy();
    });

    // Premier bloc réclamé et rendu : la ligne 1 est du serveur, pas d'un
    // `rowData` statique.
    await waitFor(
      () => {
        const cellules = [...canvasElement.querySelectorAll('.ag-cell')].map(cell => cell.textContent?.trim());
        expect(cellules).toContain('Membre 1');
      },
      { timeout: 5000 },
    );

    // Le row model infinite virtualise le DOM : la ligne 500 n'existe pas encore.
    const cellulesInitiales = [...canvasElement.querySelectorAll('.ag-cell')].map(cell => cell.textContent?.trim());
    expect(cellulesInitiales).not.toContain(`Membre ${TOTAL_LIGNES}`);

    // Le total étant connu (`lastRow`), on saute à la dernière ligne : AG Grid
    // en déduit le bloc final et le réclame à la demande.
    if (!apiLazyLoading) {
      throw new Error('API AG Grid absente après gridReady');
    }
    apiLazyLoading.ensureIndexVisible(TOTAL_LIGNES - 1, 'bottom');

    // Ce bloc lointain a bien été chargé paresseusement.
    await waitFor(
      () => {
        const cellules = [...canvasElement.querySelectorAll('.ag-cell')].map(cell => cell.textContent?.trim());
        expect(cellules).toContain(`Membre ${TOTAL_LIGNES}`);
      },
      { timeout: 5000 },
    );
  },
};

// Colonnes filtrables : le tri et le filtre sont délégués au « serveur » (le
// row model infinite ne filtre/trie jamais côté client, il transmet
// `sortModel`/`filterModel` au `fetchRows`).
const colonnesServeur: ColDef<Membre>[] = [
  { field: 'nom', headerName: 'Nom', minWidth: 220, filter: 'agTextColumnFilter' },
  { field: 'equipe', headerName: 'Équipe', filter: 'agTextColumnFilter' },
  { field: 'contributions', headerName: 'Contributions', type: 'numericColumn', filter: 'agNumberColumnFilter' },
];

function comparer(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a).localeCompare(String(b), 'fr');
}

// Backend simulé : applique filtre puis tri sur les 500 lignes, avant de
// découper le bloc réclamé. Tout l'intérêt est dans la lecture *typée* de
// `filterModel` / `sortModel` — clés = champs de `Membre`, narrowing sur
// `filterType`, zéro magic string, zéro cast.
const lazyloadServeur: LazyLoadConfig<Membre> = {
  blockSize: 25,
  fetchRows: ({ startRow, endRow, sortModel, filterModel }) => {
    let lignes = Array.from({ length: TOTAL_LIGNES }, (_, index) => ligneServeur(index));

    const filtreNom = filterModel.nom;
    if (filtreNom?.filterType === 'text' && 'filter' in filtreNom && typeof filtreNom.filter === 'string') {
      const terme = filtreNom.filter.toLowerCase();
      lignes = lignes.filter(ligne => ligne.nom.toLowerCase().includes(terme));
    }

    const filtreContrib = filterModel.contributions;
    if (filtreContrib?.filterType === 'number' && 'filter' in filtreContrib && typeof filtreContrib.filter === 'number') {
      const seuil = filtreContrib.filter;
      lignes = lignes.filter(ligne =>
        filtreContrib.type === 'lessThan' ? ligne.contributions < seuil : ligne.contributions > seuil,
      );
    }

    for (const tri of [...sortModel].reverse()) {
      const sens = tri.sort === 'asc' ? 1 : -1;
      lignes = [...lignes].sort((a, b) => sens * comparer(a[tri.colId], b[tri.colId]));
    }

    return of({ rows: lignes.slice(startRow, endRow), lastRow: lignes.length }).pipe(delay(30));
  },
};

let apiServeur: GridApi<Membre> | undefined;

export const TriEtFiltreServeur: Story = {
  name: 'Lazy loading — tri & filtre serveur',
  parameters: {
    docs: {
      description: {
        story:
          "Même mode paresseux, mais le `fetchRows` applique le tri et le filtre côté « serveur » à partir du `sortModel` / `filterModel` typés sur `Membre`. Ouvre le menu d'une colonne (filtre texte sur Nom/Équipe, filtre nombre sur Contributions) ou clique un en-tête pour trier : chaque changement purge le cache infinite et relance une requête, dont la précédente est annulée si elle est encore en vol.",
      },
    },
  },
  render: () => {
    apiServeur = undefined;
    return {
      props: {
        columnDefs: colonnesServeur,
        lazyloadConfig: lazyloadServeur,
        onReady: (event: GridReadyEvent<Membre>) => {
          apiServeur = event.api;
        },
      },
      template: `
        <app-table
          [columnDefs]="columnDefs"
          [lazyloadConfig]="lazyloadConfig"
          (gridReady)="onReady($event)"
          height="30rem"
        />
      `,
    };
  },
  play: async ({ canvasElement }) => {
    const nomLigne0 = () =>
      canvasElement.querySelector('.ag-row[row-index="0"] [col-id="nom"]')?.textContent?.trim();

    await waitFor(() => {
      expect(canvasElement.querySelector('.ag-root-wrapper')).toBeTruthy();
      expect(apiServeur).toBeTruthy();
    });
    if (!apiServeur) {
      throw new Error('API AG Grid absente après gridReady');
    }

    // Départ : jeu complet, ordre naturel, la première ligne est Membre 1.
    await waitFor(() => expect(nomLigne0()).toBe('Membre 1'), { timeout: 5000 });

    // Filtre serveur — contributions > 1500. ligneServeur(i) = 40 + i*3, donc
    // seuls i >= 487 passent, la première ligne devient Membre 488.
    apiServeur.setFilterModel({ contributions: { filterType: 'number', type: 'greaterThan', filter: 1500 } });
    await waitFor(
      () => {
        expect(nomLigne0()).toBe('Membre 488');
        const noms = [...canvasElement.querySelectorAll('.ag-row [col-id="nom"]')].map(cell =>
          cell.textContent?.trim(),
        );
        expect(noms).not.toContain('Membre 1');
      },
      { timeout: 5000 },
    );

    // Tri serveur — contributions décroissantes : la plus haute (Membre 500)
    // remonte en tête, sans quitter le filtre actif.
    apiServeur.applyColumnState({ state: [{ colId: 'contributions', sort: 'desc' }], defaultState: { sort: null } });
    await waitFor(() => expect(nomLigne0()).toBe(`Membre ${TOTAL_LIGNES}`), { timeout: 5000 });
  },
};
