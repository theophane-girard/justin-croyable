import { ICON } from './resume.icons';
import type { Resume } from './resume.model';

export const RESUME: Resume = {
  fullName: 'Justin Croyable',
  title: 'Ingénieur logiciel — Front-end & Design System',
  initials: 'JC',
  summary:
    'Ingénieur front-end passionné par les interfaces accessibles et les systèmes de design. ' +
    "Je conçois des composants réutilisables, typés et testés, et j'aide les équipes à livrer " +
    'une expérience cohérente du prototype à la production.',
  contacts: [
    {
      label: 'Email',
      value: 'justin@croyable.dev',
      href: 'mailto:justin@croyable.dev',
      icon: ICON.email,
    },
    {
      label: 'Téléphone',
      value: '+33 6 00 00 00 00',
      href: 'tel:+33600000000',
      icon: ICON.phone,
    },
    {
      label: 'Localisation',
      value: 'Paris, France',
      href: 'https://maps.google.com/?q=Paris',
      icon: ICON.location,
    },
    {
      label: 'Site',
      value: 'croyable.dev',
      href: 'https://croyable.dev',
      icon: ICON.website,
    },
    {
      label: 'LinkedIn',
      value: 'in/justin-croyable',
      href: 'https://www.linkedin.com/in/justin-croyable',
      icon: ICON.linkedin,
    },
    {
      label: 'GitHub',
      value: 'justin-croyable',
      href: 'https://github.com/justin-croyable',
      icon: ICON.github,
    },
  ],
  experiences: [
    {
      role: 'Lead Front-end Engineer',
      company: 'Croyable Studio',
      period: '2022 — Présent',
      location: 'Paris',
      summary:
        "Direction technique du design-system et des applications web de l'entreprise.",
      highlights: [
        'Conception et maintenance du design-system Angular (composants, thèmes, i18n).',
        'Mise en place de la CI et du déploiement continu des Storybooks.',
        'Accompagnement de 4 équipes produit sur les bonnes pratiques front-end.',
      ],
    },
    {
      role: 'Front-end Engineer',
      company: 'Fiable SAS',
      period: '2019 — 2022',
      location: 'Lyon',
      summary:
        'Développement d’applications métiers riches en Angular et RxJS.',
      highlights: [
        'Refonte d’une application de gestion vers une architecture à base de signals.',
        'Amélioration des performances de rendu de tableaux de données volumineux.',
        'Introduction des tests de composants et de la couverture de non-régression.',
      ],
    },
    {
      role: 'Développeur web',
      company: 'Startup Confiance',
      period: '2017 — 2019',
      location: 'Nantes',
      summary:
        'Premières livraisons produit au sein d’une petite équipe polyvalente.',
      highlights: [
        'Développement d’interfaces responsive avec Angular et Tailwind.',
        'Intégration d’API REST et gestion d’état côté client.',
      ],
    },
  ],
  education: [
    {
      degree: 'Diplôme d’ingénieur — Informatique',
      school: 'École de l’Ingénierie Logicielle',
      period: '2014 — 2017',
    },
    {
      degree: 'Classes préparatoires — MPSI / MP',
      school: 'Lycée des Sciences',
      period: '2012 — 2014',
    },
  ],
  skillGroups: [
    {
      title: 'Langages',
      items: ['TypeScript', 'JavaScript', 'HTML', 'CSS'],
    },
    {
      title: 'Frameworks',
      items: ['Angular', 'RxJS', 'Signals', 'Storybook'],
    },
    {
      title: 'Outils',
      items: ['Nx', 'Vite', 'Tailwind CSS', 'Git', 'GitHub Actions'],
    },
  ],
  languages: [
    { name: 'Français', level: 'Langue maternelle' },
    { name: 'Anglais', level: 'Courant (C1)' },
    { name: 'Espagnol', level: 'Intermédiaire (B1)' },
  ],
};
