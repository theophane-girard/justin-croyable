import { type Stat, STAT } from './pokemon.model';

export interface MegaSupplement {
  readonly id: number;
  readonly speciesId: number;
  readonly variant: string;
  readonly stats: Readonly<Record<Stat, number>>;
}

// Méga-évolutions récentes (Pokémon Legends: Z-A) présentes dans les données
// source de PokéAPI mais pas encore servies par l'endpoint GraphQL live. Ce
// complément est fusionné avec la réponse de l'API et dédoublonné par id : dès
// que l'endpoint sera à jour, ces entrées deviendront des doublons ignorés.
export const MEGA_SUPPLEMENT: readonly MegaSupplement[] = [
  { id: 10278, speciesId: 36, variant: '', stats: { [STAT.hp]: 95, [STAT.attack]: 80, [STAT.defense]: 93, [STAT.specialAttack]: 135, [STAT.specialDefense]: 110, [STAT.speed]: 70 } },
  { id: 10279, speciesId: 71, variant: '', stats: { [STAT.hp]: 80, [STAT.attack]: 125, [STAT.defense]: 85, [STAT.specialAttack]: 135, [STAT.specialDefense]: 95, [STAT.speed]: 70 } },
  { id: 10280, speciesId: 121, variant: '', stats: { [STAT.hp]: 60, [STAT.attack]: 100, [STAT.defense]: 105, [STAT.specialAttack]: 130, [STAT.specialDefense]: 105, [STAT.speed]: 120 } },
  { id: 10281, speciesId: 149, variant: '', stats: { [STAT.hp]: 91, [STAT.attack]: 124, [STAT.defense]: 115, [STAT.specialAttack]: 145, [STAT.specialDefense]: 125, [STAT.speed]: 100 } },
  { id: 10282, speciesId: 154, variant: '', stats: { [STAT.hp]: 80, [STAT.attack]: 92, [STAT.defense]: 115, [STAT.specialAttack]: 143, [STAT.specialDefense]: 115, [STAT.speed]: 80 } },
  { id: 10283, speciesId: 160, variant: '', stats: { [STAT.hp]: 85, [STAT.attack]: 160, [STAT.defense]: 125, [STAT.specialAttack]: 89, [STAT.specialDefense]: 93, [STAT.speed]: 78 } },
  { id: 10284, speciesId: 227, variant: '', stats: { [STAT.hp]: 65, [STAT.attack]: 140, [STAT.defense]: 110, [STAT.specialAttack]: 40, [STAT.specialDefense]: 100, [STAT.speed]: 110 } },
  { id: 10285, speciesId: 478, variant: '', stats: { [STAT.hp]: 70, [STAT.attack]: 80, [STAT.defense]: 70, [STAT.specialAttack]: 140, [STAT.specialDefense]: 100, [STAT.speed]: 120 } },
  { id: 10286, speciesId: 500, variant: '', stats: { [STAT.hp]: 110, [STAT.attack]: 148, [STAT.defense]: 75, [STAT.specialAttack]: 110, [STAT.specialDefense]: 110, [STAT.speed]: 75 } },
  { id: 10287, speciesId: 530, variant: '', stats: { [STAT.hp]: 110, [STAT.attack]: 165, [STAT.defense]: 100, [STAT.specialAttack]: 65, [STAT.specialDefense]: 65, [STAT.speed]: 103 } },
  { id: 10288, speciesId: 545, variant: '', stats: { [STAT.hp]: 60, [STAT.attack]: 140, [STAT.defense]: 149, [STAT.specialAttack]: 75, [STAT.specialDefense]: 99, [STAT.speed]: 62 } },
  { id: 10289, speciesId: 560, variant: '', stats: { [STAT.hp]: 65, [STAT.attack]: 130, [STAT.defense]: 135, [STAT.specialAttack]: 55, [STAT.specialDefense]: 135, [STAT.speed]: 68 } },
  { id: 10290, speciesId: 604, variant: '', stats: { [STAT.hp]: 85, [STAT.attack]: 145, [STAT.defense]: 80, [STAT.specialAttack]: 135, [STAT.specialDefense]: 90, [STAT.speed]: 80 } },
  { id: 10291, speciesId: 609, variant: '', stats: { [STAT.hp]: 60, [STAT.attack]: 75, [STAT.defense]: 110, [STAT.specialAttack]: 175, [STAT.specialDefense]: 110, [STAT.speed]: 90 } },
  { id: 10292, speciesId: 652, variant: '', stats: { [STAT.hp]: 88, [STAT.attack]: 137, [STAT.defense]: 172, [STAT.specialAttack]: 74, [STAT.specialDefense]: 115, [STAT.speed]: 44 } },
  { id: 10293, speciesId: 655, variant: '', stats: { [STAT.hp]: 75, [STAT.attack]: 69, [STAT.defense]: 72, [STAT.specialAttack]: 159, [STAT.specialDefense]: 125, [STAT.speed]: 134 } },
  { id: 10294, speciesId: 658, variant: '', stats: { [STAT.hp]: 72, [STAT.attack]: 125, [STAT.defense]: 77, [STAT.specialAttack]: 133, [STAT.specialDefense]: 81, [STAT.speed]: 142 } },
  { id: 10295, speciesId: 668, variant: '', stats: { [STAT.hp]: 86, [STAT.attack]: 88, [STAT.defense]: 92, [STAT.specialAttack]: 129, [STAT.specialDefense]: 86, [STAT.speed]: 126 } },
  { id: 10296, speciesId: 670, variant: '', stats: { [STAT.hp]: 74, [STAT.attack]: 85, [STAT.defense]: 87, [STAT.specialAttack]: 155, [STAT.specialDefense]: 148, [STAT.speed]: 102 } },
  { id: 10297, speciesId: 687, variant: '', stats: { [STAT.hp]: 86, [STAT.attack]: 102, [STAT.defense]: 88, [STAT.specialAttack]: 98, [STAT.specialDefense]: 120, [STAT.speed]: 88 } },
  { id: 10298, speciesId: 689, variant: '', stats: { [STAT.hp]: 72, [STAT.attack]: 140, [STAT.defense]: 130, [STAT.specialAttack]: 64, [STAT.specialDefense]: 106, [STAT.speed]: 88 } },
  { id: 10299, speciesId: 691, variant: '', stats: { [STAT.hp]: 65, [STAT.attack]: 85, [STAT.defense]: 105, [STAT.specialAttack]: 132, [STAT.specialDefense]: 163, [STAT.speed]: 44 } },
  { id: 10300, speciesId: 701, variant: '', stats: { [STAT.hp]: 78, [STAT.attack]: 137, [STAT.defense]: 100, [STAT.specialAttack]: 74, [STAT.specialDefense]: 93, [STAT.speed]: 118 } },
  { id: 10301, speciesId: 718, variant: '', stats: { [STAT.hp]: 216, [STAT.attack]: 70, [STAT.defense]: 91, [STAT.specialAttack]: 216, [STAT.specialDefense]: 85, [STAT.speed]: 100 } },
  { id: 10302, speciesId: 780, variant: '', stats: { [STAT.hp]: 78, [STAT.attack]: 85, [STAT.defense]: 110, [STAT.specialAttack]: 160, [STAT.specialDefense]: 116, [STAT.speed]: 36 } },
  { id: 10303, speciesId: 870, variant: '', stats: { [STAT.hp]: 65, [STAT.attack]: 135, [STAT.defense]: 135, [STAT.specialAttack]: 70, [STAT.specialDefense]: 65, [STAT.speed]: 100 } },
  { id: 10304, speciesId: 26, variant: 'x', stats: { [STAT.hp]: 60, [STAT.attack]: 135, [STAT.defense]: 95, [STAT.specialAttack]: 90, [STAT.specialDefense]: 95, [STAT.speed]: 110 } },
  { id: 10305, speciesId: 26, variant: 'y', stats: { [STAT.hp]: 60, [STAT.attack]: 100, [STAT.defense]: 55, [STAT.specialAttack]: 160, [STAT.specialDefense]: 80, [STAT.speed]: 130 } },
  { id: 10306, speciesId: 358, variant: '', stats: { [STAT.hp]: 75, [STAT.attack]: 50, [STAT.defense]: 110, [STAT.specialAttack]: 135, [STAT.specialDefense]: 120, [STAT.speed]: 65 } },
  { id: 10307, speciesId: 359, variant: 'z', stats: { [STAT.hp]: 65, [STAT.attack]: 154, [STAT.defense]: 60, [STAT.specialAttack]: 75, [STAT.specialDefense]: 60, [STAT.speed]: 151 } },
  { id: 10308, speciesId: 398, variant: '', stats: { [STAT.hp]: 85, [STAT.attack]: 140, [STAT.defense]: 100, [STAT.specialAttack]: 60, [STAT.specialDefense]: 90, [STAT.speed]: 110 } },
  { id: 10309, speciesId: 445, variant: 'z', stats: { [STAT.hp]: 108, [STAT.attack]: 130, [STAT.defense]: 85, [STAT.specialAttack]: 141, [STAT.specialDefense]: 85, [STAT.speed]: 151 } },
  { id: 10310, speciesId: 448, variant: 'z', stats: { [STAT.hp]: 70, [STAT.attack]: 100, [STAT.defense]: 70, [STAT.specialAttack]: 164, [STAT.specialDefense]: 70, [STAT.speed]: 151 } },
  { id: 10311, speciesId: 485, variant: '', stats: { [STAT.hp]: 91, [STAT.attack]: 120, [STAT.defense]: 106, [STAT.specialAttack]: 175, [STAT.specialDefense]: 141, [STAT.speed]: 67 } },
  { id: 10312, speciesId: 491, variant: '', stats: { [STAT.hp]: 70, [STAT.attack]: 120, [STAT.defense]: 130, [STAT.specialAttack]: 165, [STAT.specialDefense]: 130, [STAT.speed]: 85 } },
  { id: 10313, speciesId: 623, variant: '', stats: { [STAT.hp]: 89, [STAT.attack]: 159, [STAT.defense]: 105, [STAT.specialAttack]: 70, [STAT.specialDefense]: 105, [STAT.speed]: 55 } },
  { id: 10314, speciesId: 678, variant: '', stats: { [STAT.hp]: 74, [STAT.attack]: 48, [STAT.defense]: 76, [STAT.specialAttack]: 143, [STAT.specialDefense]: 101, [STAT.speed]: 124 } },
  { id: 10315, speciesId: 740, variant: '', stats: { [STAT.hp]: 97, [STAT.attack]: 157, [STAT.defense]: 122, [STAT.specialAttack]: 62, [STAT.specialDefense]: 107, [STAT.speed]: 33 } },
  { id: 10316, speciesId: 768, variant: '', stats: { [STAT.hp]: 75, [STAT.attack]: 150, [STAT.defense]: 175, [STAT.specialAttack]: 70, [STAT.specialDefense]: 120, [STAT.speed]: 40 } },
  { id: 10317, speciesId: 801, variant: '', stats: { [STAT.hp]: 80, [STAT.attack]: 125, [STAT.defense]: 115, [STAT.specialAttack]: 170, [STAT.specialDefense]: 115, [STAT.speed]: 95 } },
  { id: 10319, speciesId: 807, variant: '', stats: { [STAT.hp]: 88, [STAT.attack]: 157, [STAT.defense]: 75, [STAT.specialAttack]: 147, [STAT.specialDefense]: 80, [STAT.speed]: 153 } },
  { id: 10320, speciesId: 952, variant: '', stats: { [STAT.hp]: 65, [STAT.attack]: 138, [STAT.defense]: 85, [STAT.specialAttack]: 138, [STAT.specialDefense]: 85, [STAT.speed]: 75 } },
  { id: 10321, speciesId: 970, variant: '', stats: { [STAT.hp]: 83, [STAT.attack]: 90, [STAT.defense]: 105, [STAT.specialAttack]: 150, [STAT.specialDefense]: 96, [STAT.speed]: 101 } },
  { id: 10322, speciesId: 978, variant: '', stats: { [STAT.hp]: 68, [STAT.attack]: 65, [STAT.defense]: 90, [STAT.specialAttack]: 135, [STAT.specialDefense]: 125, [STAT.speed]: 92 } },
  { id: 10325, speciesId: 998, variant: '', stats: { [STAT.hp]: 115, [STAT.attack]: 175, [STAT.defense]: 117, [STAT.specialAttack]: 105, [STAT.specialDefense]: 101, [STAT.speed]: 87 } },
];
