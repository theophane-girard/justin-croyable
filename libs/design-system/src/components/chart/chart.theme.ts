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
 *  - un socle global (couleurs, police, axes, tooltip…) fusionné sous les options
 *    de l'appelant ;
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
 * Épaisseur du liseré, couleur de fond, qui sépare les segments adjacents.
 * Volontairement partagée par les barres empilées et les secteurs : à épaisseur
 * égale, l'écart *visible* entre deux segments est le même dans les deux cas.
 */
const SEGMENT_GAP = 3;

/** Type de la couleur d'aire d'une série ligne (accepte une chaîne ou un dégradé). */
type AreaColor = NonNullable<NonNullable<LineSeriesOption['areaStyle']>['color']>;

/** Socle global appliqué à tous les graphiques. */
function baseOption(palette: ThemePalette): EChartsCoreOption {
  const axis = {
    axisLine: { lineStyle: { color: palette.border } },
    axisTick: { lineStyle: { color: palette.border } },
    axisLabel: { color: palette.mutedForeground },
    splitLine: { lineStyle: { color: palette.border, type: 'dashed' as const } },
  };

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
    xAxis: axis,
    yAxis: axis,
  };
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
          ...(stacked ? { borderColor: palette.background, borderWidth: SEGMENT_GAP } : {}),
          ...series.itemStyle,
        },
      };
    }
    case 'line': {
      const themed: LineSeriesOption = { smooth: true, ...series };
      // Dégradé d'aire uniquement là où une aire est demandée (sinon on en forcerait une).
      if (series.areaStyle) {
        return {
          ...themed,
          areaStyle: { ...series.areaStyle, color: areaGradient(seriesColor(series, palette, index)) },
        };
      }
      return themed;
    }
    case 'pie':
      return {
        ...series,
        itemStyle: {
          borderRadius: MARK_RADIUS,
          borderColor: palette.background,
          borderWidth: SEGMENT_GAP,
          ...series.itemStyle,
        },
      };
    case 'gauge':
      return {
        ...series,
        pointer: { show: false, ...series.pointer },
        anchor: { show: false, ...series.anchor },
        progress: { show: true, roundCap: true, ...series.progress },
        axisLine: { roundCap: true, ...series.axisLine },
        // Valeur numérique recentrée ; le libellé passe sous le centre.
        detail: { offsetCenter: [0, 0], fontFamily: CHART_FONT_FAMILY, ...series.detail },
        title: { offsetCenter: [0, '28%'], fontFamily: CHART_FONT_FAMILY, ...series.title },
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
  const raw = (option as { series?: SeriesOption | SeriesOption[] }).series;
  const series = Array.isArray(raw)
    ? raw.map((item, index) => themeForSeries(item, palette, index))
    : raw
      ? themeForSeries(raw, palette, 0)
      : undefined;

  const withSeries = series === undefined ? option : { ...option, series };
  return mergeDeep(baseOption(palette), withSeries) as EChartsCoreOption;
}
