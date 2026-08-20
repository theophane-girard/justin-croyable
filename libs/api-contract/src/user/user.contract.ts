import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { setDefaultGardenSchema, updateProfileSchema, userProfileSchema } from './user.schema';

const contract = initContract();

const unauthorizedSchema = z.object({ message: z.string() });

export const userContract = contract.router(
  {
    me: {
      method: 'GET',
      path: '/me',
      responses: {
        200: userProfileSchema,
        401: unauthorizedSchema,
      },
      summary: "Profil de l'utilisateur authentifié",
    },
    updateProfile: {
      method: 'PATCH',
      path: '/me',
      body: updateProfileSchema,
      responses: {
        200: userProfileSchema,
        401: unauthorizedSchema,
      },
      summary: "Met à jour le profil de l'utilisateur authentifié",
    },
    setDefaultGarden: {
      method: 'PATCH',
      path: '/me/default-garden',
      body: setDefaultGardenSchema,
      responses: {
        200: userProfileSchema,
        400: unauthorizedSchema,
        401: unauthorizedSchema,
      },
      summary: "Définit le jardin par défaut de l'utilisateur",
    },
  },
  { pathPrefix: '/users' },
);
