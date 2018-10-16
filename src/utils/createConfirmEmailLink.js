import { v4 } from 'uuid';
import { confirmEmailPrefix } from '../constants';

export default async (url, userId, redis) => {
  const id = v4();
  const link = `${url}/confirm-email/${id}`;

  await redis.set(`${confirmEmailPrefix}${id}`, userId, 'ex', 60 * 20);

  console.log('Confirm Email Link:', link);
  return link;
};
