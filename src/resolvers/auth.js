import bcrypt from 'bcrypt';
import { AuthenticationError } from 'apollo-server-express';

import sendEmail from '../utils/sendEmail';
import createEmailLink from '../utils/createEmailLink';
import removeAllUserSessions from '../utils/removeAllUserSessions';
import forgotPasswordLockAccount from '../utils/forgotPasswordLockAccount';
import userValidation, { passwordValidation } from '../validation/user';
import {
  confirmEmailPrefix,
  forgotPasswordPrefix,
  userSessionIdPrefix,
} from '../constants';

export default {
  Mutation: {
    async register(_, { email, password }, { models, redis }) {
      try {
        await userValidation.validate({ email, password });

        const user = await models.User.create({ email, password });
        const link = await createEmailLink(
          '/confirm-email',
          confirmEmailPrefix,
          user.id,
          redis
        );

        sendEmail({
          from: process.env.EMAIL_ADDRESS,
          to: email,
          subject: 'Confirm Email',
          html: `<p>${link}</p>`,
        });

        return user;
      } catch (err) {
        return err;
      }
    },
    async login(_, { email, password }, { req, models, session, redis }) {
      const errorMessage = 'Wrong email or password';

      try {
        await userValidation.validate({ email, password });

        const user = await models.User.findOne({ where: { email } });
        if (!user) throw new AuthenticationError(errorMessage);

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) throw new AuthenticationError(errorMessage);

        if (!user.confirmed) {
          throw new AuthenticationError('Confirm your email');
        }

        if (user.locked) {
          throw new AuthenticationError('Account locked');
        }

        session.userId = user.id;

        if (req.sessionID) {
          await redis.lpush(`${userSessionIdPrefix}${user.id}`, req.sessionID);
        }

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
    async confirmEmail(_, { key }, { models, redis }) {
      const redisKey = `${confirmEmailPrefix}${key}`;
      const userId = await redis.get(redisKey);

      if (!userId) throw new Error('Key has expired');

      try {
        await models.User.update(
          { confirmed: true },
          { where: { id: userId } }
        );

        const user = await models.User.findById(userId);
        if (user && user.confirmed) return true;

        return false;
      } catch (err) {
        return err;
      }
    },
    async forgotPassword(_, { email }, { models, redis }) {
      const user = await models.User.findOne({ where: { email } });
      if (!user) return false;

      await forgotPasswordLockAccount(user.id, redis);

      const link = await createEmailLink(
        '/reset-password',
        forgotPasswordPrefix,
        user.id,
        redis
      );

      sendEmail({
        from: process.env.EMAIL_ADDRESS,
        to: email,
        subject: 'Reset Password',
        html: `<p>${link}</p>`,
      });

      return true;
    },
    async resetPassword(_, { newPassword, key }, { models, redis }) {
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
