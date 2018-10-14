import models from '../models';
import removeAllUserSessions from './removeAllUserSessions';

export default async (userId, redis) => {
  await models.User.update({ locked: true }, { where: { id: userId } });
  await removeAllUserSessions(userId, redis);
};
