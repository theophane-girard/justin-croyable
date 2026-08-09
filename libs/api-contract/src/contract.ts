import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { deletedSchema, errorSchema, idParamSchema } from './crud';
import { createExpenseSchema, expenseSchema, updateExpenseSchema } from './expense/expense.schema';
import { createHarvestSchema, harvestSchema, updateHarvestSchema } from './harvest/harvest.schema';
import { createPlantSchema, plantSchema, updatePlantSchema } from './plant/plant.schema';
import { userContract } from './user/user.contract';

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

export const apiContract = contract.router({
  users: userContract,
  harvests: harvestContract,
  plants: plantContract,
  expenses: expenseContract,
});
