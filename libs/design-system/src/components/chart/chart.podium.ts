const FIRST_RANK = 0;

/**
 * Marques de podium à préfixer aux libellés d'un classement une fois la course
 * terminée. Des emoji plutôt que des icônes : un graphique se dessine sur un
 * canevas, où le libellé d'axe n'accepte que du texte.
 */
export const PODIUM_MARKS = ['👑', '🥈', '🥉'] as const;

/** Renvoie le libellé tel quel hors du podium ; `rank` part de zéro. */
export function podiumLabel(label: string, rank: number): string {
  if (rank < FIRST_RANK) {
    return label;
  }
  const mark = PODIUM_MARKS.at(rank);
  return mark === undefined ? label : `${mark} ${label}`;
}
