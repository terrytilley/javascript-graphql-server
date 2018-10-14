import { v4 } from 'uuid';
import { forgotPasswordPrefix } from '../constants';

export default async (url, userId, redis) => {
  const id = v4();
  const link = `${url}/reset-password/${id}`;

  await redis.set(`${forgotPasswordPrefix}${id}`, userId, 'ex', 60 * 20);

  console.log('Reset Password Link:', link);
  return link;
};
