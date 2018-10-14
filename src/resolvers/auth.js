import bcrypt from 'bcrypt';
import { AuthenticationError } from 'apollo-server-express';
import removeAllUserSessions from '../utils/removeAllUserSessions';

export default {
  Mutation: {
    async register(_, { email, password }, { models }) {
      try {
        return await models.User.create({ email, password });
      } catch (err) {
        return err;
      }
    },
    async login(_, { email, password }, { req, models }) {
      const errorMessage = 'Wrong email or password';

      try {
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
  },
};
