import type { EChartsCoreOption } from 'echarts/core';
import type { LineSeriesOption, SeriesOption } from 'echarts';

import type { ThemePalette } from '../../core/services/theme-palette.service';

/**
 * Thème ECharts du Design System.
 *
 * ECharts dessine dans un canvas : il ne résout pas les `var(--…)`. Le thème est
 * donc construit à partir de la palette déjà résolue en valeurs concrètes, et
 * recalculé à chaque bascule de thème (la palette est un signal).
 *
 * Deux niveaux :
 *  - un socle global (couleurs, police, tooltip…) fusionné sous les options de
 *    l'appelant, l'habillage des axes n'étant appliqué qu'aux axes réellement
 *    fournis (les graphiques radiaux n'en reçoivent pas) ;
 *  - des réglages par type de série (barres, courbes, secteurs, jauges) injectés
 *    dans chaque série pour porter les partis pris visuels du DS (arrondis, écarts
 *    entre segments, dégradé d'aire, jauge sans aiguille…).
 */

/**
 * Pile de polices des graphiques. Inter en tête, replis système ensuite. La
 * police doit être disponible au moment du rendu (chargée par l'app), sinon le
 * repli s'applique.
 */
export const CHART_FONT_FAMILY =
  "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Arrondi des marques (barres, secteurs). Aligné sur `--radius-sm` du DS (6px). */
const MARK_RADIUS = 6;

/**
 * Écart *visible* cible, couleur de fond, entre segments adjacents.
 *
 * Le liseré est rendu différemment selon la marque : sur les barres empilées il
 * est compté deux fois (un par segment, ils s'ajoutent), sur les secteurs une
 * seule fois (les liserés se superposent sur l'arête commune). Les barres
 * utilisent donc la moitié de cette valeur, les secteurs sa pleine valeur, pour
 * un écart perçu identique.
 */
const SEGMENT_GAP = 3;

/**
 * Débord du secteur survolé, vers l'extérieur uniquement : ECharts n'applique
 * `scaleSize` qu'au rayon externe, le rayon interne d'un anneau ne bouge pas.
 * Volontairement plus discret que les 5px par défaut d'ECharts.
 */
const PIE_EMPHASIS_SCALE_SIZE = 4;

/** Type de la couleur d'aire d'une série ligne (accepte une chaîne ou un dégradé). */
type AreaColor = NonNullable<NonNullable<LineSeriesOption['areaStyle']>['color']>;

/** Socle global appliqué à tous les graphiques (hors axes, propres aux repères cartésiens). */
function baseOption(palette: ThemePalette): EChartsCoreOption {
  return {
    color: palette.series,
    backgroundColor: 'transparent',
    textStyle: { fontFamily: CHART_FONT_FAMILY, color: palette.foreground },
    title: { textStyle: { fontFamily: CHART_FONT_FAMILY, color: palette.foreground } },
    legend: { textStyle: { fontFamily: CHART_FONT_FAMILY, color: palette.mutedForeground } },
    tooltip: {
      backgroundColor: palette.popover,
      borderColor: palette.border,
      textStyle: { fontFamily: CHART_FONT_FAMILY, color: palette.popoverForeground },
    },
  };
}

/**
 * Habillage des axes cartésiens. Appliqué uniquement aux axes fournis par
 * l'appelant : les graphiques sans repère (secteurs, jauges) n'en reçoivent donc
 * pas — sinon ECharts dessinerait des axes en fond.
 */
function axisStyle(palette: ThemePalette) {
  return {
    axisLine: { lineStyle: { color: palette.border } },
    axisTick: { lineStyle: { color: palette.border } },
    axisLabel: { color: palette.mutedForeground },
    splitLine: { lineStyle: { color: palette.border, type: 'dashed' as const } },
  };
}

/** Fusionne l'habillage sous un axe (ou une liste d'axes) fourni par l'appelant. */
function styleAxis(axis: unknown, style: ReturnType<typeof axisStyle>): unknown {
  return Array.isArray(axis) ? axis.map(item => mergeDeep(style, item)) : mergeDeep(style, axis);
}

/** Couleur d'une série ligne : explicite si fournie, sinon la couleur de palette de son rang. */
function seriesColor(series: LineSeriesOption, palette: ThemePalette, index: number): string {
  const itemColor = series.itemStyle?.color;
  const lineColor = series.lineStyle?.color;
  if (typeof itemColor === 'string') {
    return itemColor;
  }
  if (typeof lineColor === 'string') {
    return lineColor;
  }
  return palette.series[index % palette.series.length];
}

/**
 * Ajoute une composante alpha à une couleur `oklch(...)` de la palette. Toute
 * autre notation est renvoyée telle quelle (repli sans transparence).
 */
function withAlpha(color: string, alpha: number): string {
  const match = color.trim().match(/^oklch\(([^)/]+)\)$/i);
  return match ? `oklch(${match[1].trim()} / ${alpha})` : color;
}

/** Dégradé vertical d'opacité sur la couleur de l'aire, du haut (opaque) vers le bas (transparent). */
function areaGradient(color: string): AreaColor {
  const gradient: AreaColor = {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: withAlpha(color, 0.35) },
      { offset: 1, color: withAlpha(color, 0) },
    ],
  };
  return gradient;
}

/**
 * Injecte les partis pris du DS selon le type de série. Les valeurs de l'appelant
 * priment : ses réglages sont fusionnés par-dessus les défauts.
 */
function themeForSeries(series: SeriesOption, palette: ThemePalette, index: number): SeriesOption {
  switch (series.type) {
    case 'bar': {
      const stacked = series.stack !== undefined && series.stack !== '';
      return {
        ...series,
        itemStyle: {
          borderRadius: MARK_RADIUS,
          // Moitié de l'écart : le liseré est compté deux fois entre deux segments empilés.
          ...(stacked ? { borderColor: palette.background, borderWidth: SEGMENT_GAP / 2 } : {}),
          ...series.itemStyle,
        },
        emphasis: {
          ...series.emphasis,
          itemStyle: { color: 'inherit', borderColor: 'inherit', ...series.emphasis?.itemStyle },
        },
      };
    }
    case 'line': {
      const emphasis = {
        ...series.emphasis,
        lineStyle: { color: 'inherit', ...series.emphasis?.lineStyle },
        itemStyle: { color: 'inherit', ...series.emphasis?.itemStyle },
        areaStyle: { color: 'inherit', ...series.emphasis?.areaStyle },
      };
      const themed: LineSeriesOption = { smooth: true, ...series, emphasis };
      // Dégradé d'aire uniquement là où une aire est demandée (sinon on en forcerait une).
      if (series.areaStyle) {
        return {
          ...themed,
          areaStyle: { ...series.areaStyle, color: areaGradient(seriesColor(series, palette, index)) },
        };
      }
      return themed;
    }
    case 'pie': {
      const itemStyle = {
        borderRadius: MARK_RADIUS,
        borderColor: palette.background,
        borderWidth: SEGMENT_GAP,
        ...series.itemStyle,
      };
      return {
        ...series,
        itemStyle,
        // Les libellés rattachés à un secteur échappent au `textStyle` global :
        // ECharts leur choisit une couleur sombre et un halo déduit de la couleur
        // de fond du canvas — transparente ici, donc supposée blanche. Couleur du
        // thème et halo supprimé, pour rester lisible en clair comme en sombre.
        label: { color: palette.foreground, textBorderWidth: 0, ...series.label },
        emphasis: {
          scale: true,
          scaleSize: PIE_EMPHASIS_SCALE_SIZE,
          ...series.emphasis,
          // Habillage identique au repos : le secteur survolé déborde vers l'extérieur
          // sans récupérer l'écart qui le sépare de ses voisins ni perdre ses arrondis.
          itemStyle: { ...itemStyle, color: 'inherit', ...series.emphasis?.itemStyle },
        },
      };
    }
    case 'gauge':
      return {
        ...series,
        pointer: { show: false, ...series.pointer },
        anchor: { show: false, ...series.anchor },
        progress: { show: true, roundCap: true, ...series.progress },
        axisLine: {
          roundCap: true,
          ...series.axisLine,
          // Piste non remplie : couleur du thème (s'adapte clair/sombre) au lieu du gris clair par défaut d'ECharts.
          lineStyle: { color: [[1, palette.border]], ...series.axisLine?.lineStyle },
        },
        // Graduations masquées (ticks, séparateurs et libellés numériques de l'échelle).
        axisTick: { show: false, ...series.axisTick },
        splitLine: { show: false, ...series.splitLine },
        axisLabel: { show: false, ...series.axisLabel },
        // Valeur numérique recentrée, libellé juste en dessous ; couleurs du thème (adaptées clair/sombre).
        detail: { offsetCenter: [0, 0], fontFamily: CHART_FONT_FAMILY, color: palette.foreground, ...series.detail },
        title: {
          offsetCenter: [0, '28%'],
          fontFamily: CHART_FONT_FAMILY,
          color: palette.mutedForeground,
          ...series.title,
        },
      };
    default:
      return series;
  }
}

type OptionRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is OptionRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Fusion profonde générique ; l'objet de droite l'emporte, les tableaux sont remplacés. */
function mergeDeep(base: unknown, override: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override === undefined ? base : override;
  }
  const result: OptionRecord = { ...base };
  for (const key of Object.keys(override)) {
    result[key] = mergeDeep(base[key], override[key]);
  }
  return result;
}

/**
 * Applique le thème du DS à des options ECharts : réglages par type injectés dans
 * chaque série, puis socle global fusionné dessous (l'appelant gardant la main).
 */
export function applyChartTheme(option: EChartsCoreOption, palette: ThemePalette): EChartsCoreOption {
  const opt = option as {
    xAxis?: unknown;
    yAxis?: unknown;
    series?: SeriesOption | SeriesOption[];
  };

  const raw = opt.series;
  const series = Array.isArray(raw)
    ? raw.map((item, index) => themeForSeries(item, palette, index))
    : raw
      ? themeForSeries(raw, palette, 0)
      : undefined;

  const axis = axisStyle(palette);
  const overrides = {
    ...option,
    ...(series !== undefined ? { series } : {}),
    ...(opt.xAxis !== undefined ? { xAxis: styleAxis(opt.xAxis, axis) } : {}),
    ...(opt.yAxis !== undefined ? { yAxis: styleAxis(opt.yAxis, axis) } : {}),
  };

  return mergeDeep(baseOption(palette), overrides) as EChartsCoreOption;
}
