import * as yup from 'yup';
import bcrypt from 'bcrypt';
import { forgotPasswordPrefix } from '../constants';
import createForgotPasswordLink from '../utils/createForgotPasswordLink';
import forgotPasswordLockAccount from '../utils/forgotPasswordLockAccount';

export default {
  Mutation: {
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

      const passwordSchema = yup.object().shape({
        newPassword: yup
          .string()
          .min(8, 'password must be at least 8 characters')
          .max(255),
      });

      if (!userId) {
        return [
          {
            path: 'key',
            message: 'Key has expired',
          },
        ];
      }

      try {
        await passwordSchema.validate({ newPassword });
      } catch (err) {
        return [
          {
            path: err.path,
            message: err.message,
          },
        ];
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      const deleteKeyPromise = redis.del(redisKey);
      const updatePromise = models.User.update(
        { password: hashedPassword, locked: false },
        { where: { id: userId } }
      );

      await Promise.all([updatePromise, deleteKeyPromise]);
      return null;
    },
  },
};
