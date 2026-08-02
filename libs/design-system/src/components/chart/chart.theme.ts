import type { EChartsCoreOption } from 'echarts/core';

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

type OptionObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is OptionObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Fusion profonde ; l'objet de droite l'emporte, les tableaux sont remplacés. */
function mergeDeep(base: unknown, override: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override === undefined ? base : override;
  }
  const result: OptionObject = { ...base };
  for (const key of Object.keys(override)) {
    result[key] = mergeDeep(base[key], override[key]);
  }
  return result;
}

function baseOption(palette: ThemePalette): OptionObject {
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

/** Couleur d'une série : explicite si fournie, sinon la couleur de palette de son rang. */
function seriesColor(series: OptionObject, palette: ThemePalette, index: number): string {
  const itemStyle = series['itemStyle'];
  const lineStyle = series['lineStyle'];
  const fromItem = isPlainObject(itemStyle) ? itemStyle['color'] : undefined;
  const fromLine = isPlainObject(lineStyle) ? lineStyle['color'] : undefined;
  if (typeof fromItem === 'string') {
    return fromItem;
  }
  if (typeof fromLine === 'string') {
    return fromLine;
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
function areaGradient(color: string): OptionObject {
  return {
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
}

/** Injecte les partis pris du DS selon le type de série ; les valeurs de l'appelant priment. */
function themeForSeries(series: OptionObject, palette: ThemePalette, index: number): OptionObject {
  switch (series['type']) {
    case 'bar': {
      const itemStyle: OptionObject = { borderRadius: MARK_RADIUS };
      // Écart entre segments seulement quand les barres sont empilées.
      const stack = series['stack'];
      if (stack !== undefined && stack !== null && stack !== '') {
        itemStyle['borderColor'] = palette.background;
        itemStyle['borderWidth'] = SEGMENT_GAP;
      }
      return mergeDeep({ itemStyle }, series) as OptionObject;
    }
    case 'line': {
      const themed = mergeDeep({ smooth: true }, series) as OptionObject;
      // Dégradé d'aire uniquement là où une aire est demandée (sinon on en forcerait une).
      if (series['areaStyle'] !== undefined && series['areaStyle'] !== null) {
        return mergeDeep(themed, {
          areaStyle: { color: areaGradient(seriesColor(series, palette, index)) },
        }) as OptionObject;
      }
      return themed;
    }
    case 'pie':
      return mergeDeep(
        { itemStyle: { borderRadius: MARK_RADIUS, borderColor: palette.background, borderWidth: SEGMENT_GAP } },
        series,
      ) as OptionObject;
    case 'gauge':
      return mergeDeep(
        {
          pointer: { show: false },
          anchor: { show: false },
          progress: { show: true, roundCap: true },
          axisLine: { roundCap: true },
          // Valeur numérique recentrée ; le libellé passe sous le centre.
          detail: { offsetCenter: [0, 0], fontFamily: CHART_FONT_FAMILY },
          title: { offsetCenter: [0, '28%'], fontFamily: CHART_FONT_FAMILY },
        },
        series,
      ) as OptionObject;
    default:
      return series;
  }
}

/**
 * Applique le thème du DS à des options ECharts : socle global fusionné dessous,
 * puis réglages par type injectés dans chaque série.
 */
export function applyChartTheme(option: EChartsCoreOption, palette: ThemePalette): EChartsCoreOption {
  const merged = mergeDeep(baseOption(palette), option) as OptionObject;
  const series = merged['series'];

  if (Array.isArray(series)) {
    merged['series'] = series.map((item, index) =>
      isPlainObject(item) ? themeForSeries(item, palette, index) : item,
    );
  } else if (isPlainObject(series)) {
    merged['series'] = themeForSeries(series, palette, 0);
  }

  return merged as unknown as EChartsCoreOption;
}
