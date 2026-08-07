import { initContract } from '@ts-rest/core';

import { userContract } from './user/user.contract';

const contract = initContract();

export const apiContract = contract.router({
  users: userContract,
});
