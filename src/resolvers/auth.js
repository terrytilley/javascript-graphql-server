import bcrypt from 'bcrypt';
import { AuthenticationError } from 'apollo-server-express';
import userValidation, { passwordValidation } from '../validation/user';
import createForgotPasswordLink from '../utils/createForgotPasswordLink';
import forgotPasswordLockAccount from '../utils/forgotPasswordLockAccount';
import removeAllUserSessions from '../utils/removeAllUserSessions';
import { forgotPasswordPrefix } from '../constants';

export default {
  Mutation: {
    async register(_, { email, password }, { models }) {
      try {
        await userValidation.validate({ email, password });
        return await models.User.create({ email, password });
      } catch (err) {
        return err;
      }
    },
    async login(_, { email, password }, { req, models }) {
      const errorMessage = 'Wrong email or password';

      try {
        await userValidation.validate({ email, password });

        const user = await models.User.findOne({ where: { email } });
        if (!user) throw new AuthenticationError(errorMessage);

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) throw new AuthenticationError(errorMessage);

        req.session.userId = user.id;
        return user;
      } catch (err) {
        return err;
      }
    },
    async logout(_, __, { req, redis }) {
      const { userId } = req.session;

      if (userId) {
        removeAllUserSessions(userId, redis);

        req.session.destroy(err => {
          if (err) {
            console.error(err);
          }
        });

        return true;
      }

      return false;
    },
    forgotPassword: async (_, { email }, { models, redis }) => {
      const user = await models.User.findOne({ where: { email } });
      if (!user) return false;

      await forgotPasswordLockAccount(user.id, redis);
      await createForgotPasswordLink('', user.id, redis);
      // @todo: Send email with url

      return true;
    },
    resetPassword: async (_, { newPassword, key }, { models, redis }) => {
      const redisKey = `${forgotPasswordPrefix}${key}`;
      const userId = await redis.get(redisKey);

      if (!userId) throw new Error('Key has expired');

      try {
        await passwordValidation.validate({ password: newPassword });
      } catch (err) {
        return err;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      const deleteKeyPromise = redis.del(redisKey);
      const updatePromise = models.User.update(
        { password: hashedPassword, locked: false },
        { where: { id: userId } }
      );

      await Promise.all([updatePromise, deleteKeyPromise]);
      return true;
    },
  },
};
