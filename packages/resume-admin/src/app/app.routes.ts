import { type Route } from '@angular/router';

import { SKELETON_KIND } from '@justin-croyable/design-system';

export const APP_PATHS = {
  profile: '',
  experiences: 'experiences',
  skills: 'competences',
  tags: 'tags',
  add: 'ajouter',
  edit: ':id',
} as const;

export type AppPath = (typeof APP_PATHS)[keyof typeof APP_PATHS];

export const PROFILE_LINK = '/';
export const EXPERIENCES_LINK = `/${APP_PATHS.experiences}`;
export const EXPERIENCE_ADD_LINK = `/${APP_PATHS.experiences}/${APP_PATHS.add}`;
export const SKILLS_LINK = `/${APP_PATHS.skills}`;
export const SKILL_ADD_LINK = `/${APP_PATHS.skills}/${APP_PATHS.add}`;
export const TAGS_LINK = `/${APP_PATHS.tags}`;
export const TAG_ADD_LINK = `/${APP_PATHS.tags}/${APP_PATHS.add}`;

export const APP_ROUTES: Route[] = [
  {
    path: APP_PATHS.profile,
    loadComponent: () =>
      import('./features/profile/profile.component').then(m => m.ProfileComponent),
    title: 'Profil — Administration du CV',
    data: { skeleton: SKELETON_KIND.form },
  },
  {
    path: APP_PATHS.experiences,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/experiences/experiences.component').then(m => m.ExperiencesComponent),
        title: 'Expériences — Administration du CV',
        data: { skeleton: SKELETON_KIND.list },
      },
      {
        path: APP_PATHS.add,
        loadComponent: () =>
          import('./features/experiences/experience-form.component').then(
            m => m.ExperienceFormComponent,
          ),
        title: 'Nouvelle expérience — Administration du CV',
        data: { skeleton: SKELETON_KIND.form },
      },
      {
        path: APP_PATHS.edit,
        loadComponent: () =>
          import('./features/experiences/experience-form.component').then(
            m => m.ExperienceFormComponent,
          ),
        title: 'Modifier une expérience — Administration du CV',
        data: { skeleton: SKELETON_KIND.form },
      },
    ],
  },
  {
    path: APP_PATHS.skills,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/skills/skills.component').then(m => m.SkillsComponent),
        title: 'Compétences — Administration du CV',
        data: { skeleton: SKELETON_KIND.list },
      },
      {
        path: APP_PATHS.add,
        loadComponent: () =>
          import('./features/skills/skill-form.component').then(m => m.SkillFormComponent),
        title: 'Nouvelle compétence — Administration du CV',
        data: { skeleton: SKELETON_KIND.form },
      },
      {
        path: APP_PATHS.edit,
        loadComponent: () =>
          import('./features/skills/skill-form.component').then(m => m.SkillFormComponent),
        title: 'Modifier une compétence — Administration du CV',
        data: { skeleton: SKELETON_KIND.form },
      },
    ],
  },
  {
    path: APP_PATHS.tags,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/tags/tags.component').then(m => m.TagsComponent),
        title: 'Tags — Administration du CV',
        data: { skeleton: SKELETON_KIND.list },
      },
      {
        path: APP_PATHS.add,
        loadComponent: () =>
          import('./features/tags/tag-form.component').then(m => m.TagFormComponent),
        title: 'Nouveau tag — Administration du CV',
        data: { skeleton: SKELETON_KIND.form },
      },
      {
        path: APP_PATHS.edit,
        loadComponent: () =>
          import('./features/tags/tag-form.component').then(m => m.TagFormComponent),
        title: 'Modifier un tag — Administration du CV',
        data: { skeleton: SKELETON_KIND.form },
      },
    ],
  },
  {
    path: '**',
    redirectTo: APP_PATHS.profile,
  },
];
