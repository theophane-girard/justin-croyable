import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { deletedSchema, errorSchema, idParamSchema } from './crud';
import { createExpenseSchema, expenseSchema, updateExpenseSchema } from './expense/expense.schema';
import {
  gardenMemberParamsSchema,
  gardenMemberSchema,
  gardenSchema,
  inviteMemberSchema,
  updateMemberSchema,
} from './garden/garden.schema';
import { createHarvestSchema, harvestSchema, updateHarvestSchema } from './harvest/harvest.schema';
import { createPlantSchema, plantSchema, updatePlantSchema } from './plant/plant.schema';
import {
  createVarietySchema,
  updateVarietyPricingSchema,
  varietySchema,
} from './variety/variety.schema';
import { userContract } from './user/user.contract';
import {
  createVarietyPriceSchema,
  updateVarietyPriceSchema,
  varietyPriceSchema,
} from './variety-price/variety-price.schema';

const contract = initContract();

export const harvestContract = contract.router({
  list: {
    method: 'GET',
    path: '/harvests',
    responses: { 200: z.array(harvestSchema), 401: errorSchema },
  },
  create: {
    method: 'POST',
    path: '/harvests',
    body: createHarvestSchema,
    responses: { 201: harvestSchema, 401: errorSchema },
  },
  update: {
    method: 'PATCH',
    path: '/harvests/:id',
    pathParams: idParamSchema,
    body: updateHarvestSchema,
    responses: { 200: harvestSchema, 401: errorSchema, 404: errorSchema },
  },
  remove: {
    method: 'DELETE',
    path: '/harvests/:id',
    pathParams: idParamSchema,
    responses: { 200: deletedSchema, 401: errorSchema, 404: errorSchema },
  },
});

export const plantContract = contract.router({
  list: {
    method: 'GET',
    path: '/plants',
    responses: { 200: z.array(plantSchema), 401: errorSchema },
  },
  create: {
    method: 'POST',
    path: '/plants',
    body: createPlantSchema,
    responses: { 201: plantSchema, 401: errorSchema },
  },
  update: {
    method: 'PATCH',
    path: '/plants/:id',
    pathParams: idParamSchema,
    body: updatePlantSchema,
    responses: { 200: plantSchema, 401: errorSchema, 404: errorSchema },
  },
  remove: {
    method: 'DELETE',
    path: '/plants/:id',
    pathParams: idParamSchema,
    responses: { 200: deletedSchema, 401: errorSchema, 404: errorSchema },
  },
});

export const expenseContract = contract.router({
  list: {
    method: 'GET',
    path: '/expenses',
    responses: { 200: z.array(expenseSchema), 401: errorSchema },
  },
  create: {
    method: 'POST',
    path: '/expenses',
    body: createExpenseSchema,
    responses: { 201: expenseSchema, 401: errorSchema },
  },
  update: {
    method: 'PATCH',
    path: '/expenses/:id',
    pathParams: idParamSchema,
    body: updateExpenseSchema,
    responses: { 200: expenseSchema, 401: errorSchema, 404: errorSchema },
  },
  remove: {
    method: 'DELETE',
    path: '/expenses/:id',
    pathParams: idParamSchema,
    responses: { 200: deletedSchema, 401: errorSchema, 404: errorSchema },
  },
});

export const varietyPriceContract = contract.router({
  list: {
    method: 'GET',
    path: '/variety-prices',
    responses: { 200: z.array(varietyPriceSchema), 401: errorSchema },
  },
  create: {
    method: 'POST',
    path: '/variety-prices',
    body: createVarietyPriceSchema,
    responses: { 201: varietyPriceSchema, 401: errorSchema, 403: errorSchema },
  },
  update: {
    method: 'PATCH',
    path: '/variety-prices/:id',
    pathParams: idParamSchema,
    body: updateVarietyPriceSchema,
    responses: { 200: varietyPriceSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
  },
  remove: {
    method: 'DELETE',
    path: '/variety-prices/:id',
    pathParams: idParamSchema,
    responses: { 200: deletedSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
  },
});

export const gardenContract = contract.router({
  current: {
    method: 'GET',
    path: '/gardens/current',
    responses: { 200: gardenSchema, 401: errorSchema },
  },
  list: {
    method: 'GET',
    path: '/gardens',
    responses: { 200: z.array(gardenSchema), 401: errorSchema },
  },
  members: {
    method: 'GET',
    path: '/gardens/:id/members',
    pathParams: idParamSchema,
    responses: {
      200: z.array(gardenMemberSchema),
      401: errorSchema,
      403: errorSchema,
      404: errorSchema,
    },
  },
  invite: {
    method: 'POST',
    path: '/gardens/:id/members',
    pathParams: idParamSchema,
    body: inviteMemberSchema,
    responses: {
      201: gardenMemberSchema,
      400: errorSchema,
      401: errorSchema,
      403: errorSchema,
      404: errorSchema,
    },
  },
  updateMember: {
    method: 'PATCH',
    path: '/gardens/:id/members/:memberId',
    pathParams: gardenMemberParamsSchema,
    body: updateMemberSchema,
    responses: {
      200: gardenMemberSchema,
      400: errorSchema,
      401: errorSchema,
      403: errorSchema,
      404: errorSchema,
    },
  },
  removeMember: {
    method: 'DELETE',
    path: '/gardens/:id/members/:memberId',
    pathParams: gardenMemberParamsSchema,
    responses: { 200: deletedSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
  },
});

export const varietyContract = contract.router({
  list: {
    method: 'GET',
    path: '/varieties',
    responses: { 200: z.array(varietySchema), 401: errorSchema },
  },
  create: {
    method: 'POST',
    path: '/varieties',
    body: createVarietySchema,
    responses: { 201: varietySchema, 400: errorSchema, 401: errorSchema, 403: errorSchema },
  },
  updatePricing: {
    method: 'PATCH',
    path: '/varieties/:id/pricing',
    pathParams: idParamSchema,
    body: updateVarietyPricingSchema,
    responses: {
      200: varietySchema,
      400: errorSchema,
      401: errorSchema,
      403: errorSchema,
      404: errorSchema,
    },
  },
  remove: {
    method: 'DELETE',
    path: '/varieties/:id',
    pathParams: idParamSchema,
    responses: { 200: deletedSchema, 401: errorSchema, 403: errorSchema, 404: errorSchema },
  },
});

export const apiContract = contract.router({
  users: userContract,
  harvests: harvestContract,
  plants: plantContract,
  expenses: expenseContract,
  varietyPrices: varietyPriceContract,
  gardens: gardenContract,
  varieties: varietyContract,
});
