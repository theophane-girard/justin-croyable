import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { sessionSchema } from './auth/session.schema';
import { deletedSchema, errorSchema, idParamSchema } from './crud';
import { cvSchema } from './cv/cv.schema';
import {
  createExperienceSchema,
  experienceQuerySchema,
  experienceSchema,
  updateExperienceSchema,
} from './experience/experience.schema';
import { profileSchema, upsertProfileSchema } from './profile/profile.schema';
import {
  createSkillSchema,
  skillQuerySchema,
  skillSchema,
  updateSkillSchema,
} from './skill/skill.schema';
import { createTagSchema, tagQuerySchema, tagSchema, updateTagSchema } from './tag/tag.schema';

const contract = initContract();

export const tagContract = contract.router({
  list: {
    method: 'GET',
    path: '/tags',
    query: tagQuerySchema,
    responses: { 200: z.array(tagSchema) },
  },
  get: {
    method: 'GET',
    path: '/tags/:id',
    pathParams: idParamSchema,
    responses: { 200: tagSchema, 404: errorSchema },
  },
  create: {
    method: 'POST',
    path: '/tags',
    body: createTagSchema,
    responses: { 201: tagSchema, 401: errorSchema, 403: errorSchema },
  },
  update: {
    method: 'PATCH',
    path: '/tags/:id',
    pathParams: idParamSchema,
    body: updateTagSchema,
    responses: { 200: tagSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
  },
  remove: {
    method: 'DELETE',
    path: '/tags/:id',
    pathParams: idParamSchema,
    responses: {
      200: deletedSchema,
      401: errorSchema,
      403: errorSchema,
      404: errorSchema,
      409: errorSchema,
    },
  },
});

export const experienceContract = contract.router({
  list: {
    method: 'GET',
    path: '/experiences',
    query: experienceQuerySchema,
    responses: { 200: z.array(experienceSchema) },
  },
  get: {
    method: 'GET',
    path: '/experiences/:id',
    pathParams: idParamSchema,
    responses: { 200: experienceSchema, 404: errorSchema },
  },
  create: {
    method: 'POST',
    path: '/experiences',
    body: createExperienceSchema,
    responses: { 201: experienceSchema, 400: errorSchema, 401: errorSchema, 403: errorSchema },
  },
  update: {
    method: 'PATCH',
    path: '/experiences/:id',
    pathParams: idParamSchema,
    body: updateExperienceSchema,
    responses: {
      200: experienceSchema,
      400: errorSchema,
      401: errorSchema,
      403: errorSchema,
      404: errorSchema,
    },
  },
  remove: {
    method: 'DELETE',
    path: '/experiences/:id',
    pathParams: idParamSchema,
    responses: { 200: deletedSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
  },
});

export const skillContract = contract.router({
  list: {
    method: 'GET',
    path: '/skills',
    query: skillQuerySchema,
    responses: { 200: z.array(skillSchema) },
  },
  create: {
    method: 'POST',
    path: '/skills',
    body: createSkillSchema,
    responses: { 201: skillSchema, 400: errorSchema, 401: errorSchema, 403: errorSchema },
  },
  update: {
    method: 'PATCH',
    path: '/skills/:id',
    pathParams: idParamSchema,
    body: updateSkillSchema,
    responses: {
      200: skillSchema,
      400: errorSchema,
      401: errorSchema,
      403: errorSchema,
      404: errorSchema,
    },
  },
  remove: {
    method: 'DELETE',
    path: '/skills/:id',
    pathParams: idParamSchema,
    responses: { 200: deletedSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
  },
});

export const profileContract = contract.router({
  get: {
    method: 'GET',
    path: '/profile',
    responses: { 200: profileSchema, 404: errorSchema },
  },
  upsert: {
    method: 'PUT',
    path: '/profile',
    body: upsertProfileSchema,
    responses: { 200: profileSchema, 401: errorSchema, 403: errorSchema },
  },
});

export const cvContract = contract.router({
  get: {
    method: 'GET',
    path: '/cv',
    responses: { 200: cvSchema },
  },
});

export const authContract = contract.router({
  me: {
    method: 'GET',
    path: '/auth/me',
    responses: { 200: sessionSchema, 401: errorSchema },
  },
});

export const apiContract = contract.router({
  auth: authContract,
  tags: tagContract,
  experiences: experienceContract,
  skills: skillContract,
  profile: profileContract,
  cv: cvContract,
});
