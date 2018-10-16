import { v4 } from 'uuid';

export default async (url, prefix, userId, redis) => {
  const id = v4();
  const link = `${url}/${id}`;

  await redis.set(`${prefix}${id}`, userId, 'ex', 60 * 20);

  console.log(prefix, link);
  return link;
};
